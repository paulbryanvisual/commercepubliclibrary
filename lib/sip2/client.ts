/**
 * SIP2 Client — communicates with Atriuum ILS over TCP
 *
 * Each request opens a fresh TCP connection, authenticates (93),
 * sends the message, reads the response, and closes.
 * This stateless approach works well in serverless (Vercel).
 */

import net from "net";
import type {
  SIP2Config,
  PatronStatus,
  PatronInfo,
  ItemInfo,
  HoldResponse,
  RenewResponse,
} from "./types";
import { CIRC_STATUS } from "./types";

/* ── Configuration ── */

function getConfig(): SIP2Config {
  const host = process.env.SIP2_HOST;
  const port = process.env.SIP2_PORT;
  const username = process.env.SIP2_USERNAME;
  const password = process.env.SIP2_PASSWORD;
  const location = process.env.SIP2_LOCATION;

  if (!host || !port || !username || !password || !location) {
    throw new Error("SIP2 environment variables not configured");
  }

  return {
    host,
    port: parseInt(port, 10),
    username,
    password,
    location,
    timeout: 10000,
  };
}

/* ── Low-level TCP transport ── */

function timestamp(): string {
  const d = new Date();
  return d.toISOString().replace(/[-T:Z]/g, "").slice(0, 18);
}

/** Send a raw SIP2 message and receive the response */
async function sendRaw(msg: string, config: SIP2Config): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = "";
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("SIP2 connection timed out"));
    }, config.timeout || 10000);

    socket.connect(config.port, config.host, () => {
      socket.write(msg + "\r");
    });

    socket.on("data", (chunk) => {
      data += chunk.toString();
      // SIP2 messages end with \r
      if (data.includes("\r")) {
        clearTimeout(timer);
        socket.end();
        resolve(data.trim());
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    socket.on("close", () => {
      clearTimeout(timer);
      if (!data) reject(new Error("SIP2 connection closed without response"));
    });
  });
}

/** Open connection, login (93), send message, return response, close */
async function sendMessage(msg: string): Promise<string> {
  const config = getConfig();

  // Step 1: Login (message 93)
  const loginMsg = `9300CN${config.username}|CO${config.password}|CP${config.location}|`;
  const loginResp = await sendRaw(loginMsg, config);

  if (!loginResp.startsWith("941")) {
    throw new Error(`SIP2 login failed: ${loginResp}`);
  }

  // Step 2: Send the actual message on a fresh connection
  const response = await sendRaw(msg, config);
  return response;
}

/* ── Variable field parser ── */

function parseFields(raw: string): Record<string, string> {
  const fields: Record<string, string> = {};
  // Split by | and parse 2-char field identifiers
  const parts = raw.split("|");
  for (const part of parts) {
    if (part.length >= 2) {
      const id = part.slice(0, 2);
      const value = part.slice(2);
      // Some fields can appear multiple times; append with newline
      if (fields[id]) {
        fields[id] += "\n" + value;
      } else {
        fields[id] = value;
      }
    }
  }
  return fields;
}

function parseCount(s: string | undefined): number {
  if (!s) return 0;
  return parseInt(s, 10) || 0;
}

/* ── Public API ── */

/**
 * 63: Patron Status Request → 64: Patron Status Response
 * Quick check if patron credentials are valid.
 */
export async function patronStatus(
  patronId: string,
  patronPassword: string
): Promise<PatronStatus> {
  const config = getConfig();
  // 63 + language(3) + transactionDate(18) + institutionId + patronId + patronPassword
  const msg =
    `63001${timestamp()}AO${config.location}|AA${patronId}|AC|AD${patronPassword}|`;

  const resp = await sendMessage(msg);
  // Response: 64 + fixed fields (14 patron status + 3 language + 18 date) + variable fields
  const fixed = resp.slice(2, 16); // 14-character patron status
  const variableStart = resp.indexOf("|");
  const fields = variableStart >= 0 ? parseFields(resp.slice(variableStart)) : {};

  const valid = fields["BL"] === "Y";
  const authenticated = fields["CQ"] === "Y";

  return {
    valid,
    authenticated,
    name: fields["AE"] || "",
    email: fields["BE"],
    phone: fields["BF"],
    homeAddress: fields["BD"],
    patronId: fields["AA"] || patronId,
    institutionId: fields["AO"] || config.location,
    chargePrivilegesDenied: fixed[0] === "Y",
    renewalPrivilegesDenied: fixed[1] === "Y",
    recallPrivilegesDenied: fixed[2] === "Y",
    holdPrivilegesDenied: fixed[3] === "Y",
    cardReportedLost: fixed[4] === "Y",
    tooManyItemsCharged: fixed[5] === "Y",
    tooManyItemsOverdue: fixed[6] === "Y",
    tooManyRenewals: fixed[7] === "Y",
    tooManyClaimsReturned: fixed[8] === "Y",
    tooManyItemsLost: fixed[9] === "Y",
    excessiveOutstandingFines: fixed[10] === "Y",
    excessiveOutstandingFees: fixed[11] === "Y",
    recallOverdue: fixed[12] === "Y",
    tooManyItemsBilled: fixed[13] === "Y",
    holdItemsCount: parseCount(resp.slice(37, 41)),
    overdueItemsCount: parseCount(resp.slice(41, 45)),
    chargedItemsCount: parseCount(resp.slice(45, 49)),
    fineItemsCount: parseCount(resp.slice(49, 53)),
    feeAmount: fields["BV"],
    screenMessage: fields["AF"],
    printLine: fields["AG"],
  };
}

/**
 * 65: Patron Information Request → 66: Patron Information Response
 * Full patron details including item lists.
 */
export async function patronInfo(
  patronId: string,
  patronPassword: string,
  infoType: "hold" | "overdue" | "charged" | "fine" | "all" = "all"
): Promise<PatronInfo> {
  const config = getConfig();
  // Summary field: 10-char field, Y in position for what to retrieve
  // Position: hold=0, overdue=1, charged=2, fine=3, recall=4, unavailable=5
  let summary = "          "; // 10 spaces
  if (infoType === "hold" || infoType === "all") summary = "Y" + summary.slice(1);
  if (infoType === "overdue" || infoType === "all") summary = summary[0] + "Y" + summary.slice(2);
  if (infoType === "charged" || infoType === "all") summary = summary.slice(0, 2) + "Y" + summary.slice(3);
  if (infoType === "fine" || infoType === "all") summary = summary.slice(0, 3) + "Y" + summary.slice(4);

  const msg =
    `65001${timestamp()}${summary}AO${config.location}|AA${patronId}|AC|AD${patronPassword}|`;

  const resp = await sendMessage(msg);
  const fields = parseFields(resp);

  const holdItems = fields["AS"] ? fields["AS"].split("\n") : [];
  const overdueItems = fields["AT"] ? fields["AT"].split("\n") : [];
  const chargedItems = fields["AU"] ? fields["AU"].split("\n") : [];
  const fineItems = fields["AV"] ? fields["AV"].split("\n") : [];

  return {
    valid: fields["BL"] === "Y",
    authenticated: fields["CQ"] === "Y",
    name: fields["AE"] || "",
    email: fields["BE"],
    phone: fields["BF"],
    homeAddress: fields["BD"],
    patronId: fields["AA"] || patronId,
    institutionId: fields["AO"] || config.location,
    feeAmount: fields["BV"],
    holdItemsCount: parseCount(fields["BZ"]) || holdItems.length,
    overdueItemsCount: parseCount(fields["CA"]) || overdueItems.length,
    chargedItemsCount: parseCount(fields["CB"]) || chargedItems.length,
    fineItemsCount: parseCount(fields["CC"]) || fineItems.length,
    unavailableHoldsCount: parseCount(fields["CD"]),
    holdItems,
    overdueItems,
    chargedItems,
    fineItems,
    screenMessage: fields["AF"],
  };
}

/**
 * 17: Item Information Request → 18: Item Information Response
 */
export async function itemInfo(itemId: string): Promise<ItemInfo> {
  const config = getConfig();
  const msg = `17${timestamp()}AO${config.location}|AB${itemId}|AC|`;

  const resp = await sendMessage(msg);
  const circStatus = resp.slice(2, 4);
  const fields = parseFields(resp);

  return {
    available: circStatus === "03",
    circulationStatus: CIRC_STATUS[circStatus] || `Unknown (${circStatus})`,
    title: fields["AJ"] || "",
    author: fields["BG"],
    isbn: fields["AK"],
    callNumber: fields["CS"],
    itemId: fields["AB"] || itemId,
    mediaType: fields["CK"],
    currentLocation: fields["AP"],
    permanentLocation: fields["AQ"],
    dueDate: fields["AH"],
    holdQueueLength: fields["CF"] ? parseInt(fields["CF"], 10) : undefined,
    screenMessage: fields["AF"],
  };
}

/**
 * 15: Hold Request → 16: Hold Response
 */
export async function placeHold(
  patronId: string,
  patronPassword: string,
  itemId: string,
  pickupLocation?: string
): Promise<HoldResponse> {
  const config = getConfig();
  const pickup = pickupLocation || config.location;
  // +: add hold, -: remove hold
  const msg =
    `15+${timestamp()}|AO${config.location}|AA${patronId}|AD${patronPassword}|AB${itemId}|BS${pickup}|BY2|`;

  const resp = await sendMessage(msg);
  const ok = resp[2] === "1";
  const available = resp[3] === "Y";
  const fields = parseFields(resp);

  return {
    ok,
    available,
    transactionDate: resp.slice(4, 22),
    expirationDate: fields["BW"],
    queuePosition: fields["BR"] ? parseInt(fields["BR"], 10) : undefined,
    itemId: fields["AB"] || itemId,
    titleId: fields["AJ"],
    patronId: fields["AA"] || patronId,
    screenMessage: fields["AF"],
  };
}

/**
 * 29: Renew Request → 30: Renew Response
 */
export async function renewItem(
  patronId: string,
  patronPassword: string,
  itemId: string
): Promise<RenewResponse> {
  const config = getConfig();
  const msg =
    `29NN${timestamp()}${timestamp()}AO${config.location}|AA${patronId}|AD${patronPassword}|AB${itemId}|`;

  const resp = await sendMessage(msg);
  const renewOk = resp[2] === "1";
  const fields = parseFields(resp);

  return {
    ok: renewOk,
    renewalOk: renewOk,
    transactionDate: resp.slice(4, 22),
    dueDate: fields["AH"],
    itemId: fields["AB"] || itemId,
    titleId: fields["AJ"],
    patronId: fields["AA"] || patronId,
    mediaType: fields["CK"],
    screenMessage: fields["AF"],
  };
}
