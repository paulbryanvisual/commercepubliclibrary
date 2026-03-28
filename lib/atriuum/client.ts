/**
 * Atriuum API Client — authenticates patrons via Atriuum's HTTP API
 *
 * SIP2 patron lookup is broken because SelfCheck isn't licensed on this
 * Atriuum instance. This client uses the same ProcessHttpReq API that
 * the OPAC uses, authenticating with a librarian worker account to
 * access patron data.
 *
 * Each request creates a fresh librarian session (no persistent state).
 * This is reliable on serverless platforms like Vercel.
 */

const ATRIUUM_BASE =
  process.env.ATRIUUM_BASE_URL ||
  "https://commercepubliclibrarytx.booksys.net/libs/cpltx";
const WORKER_USERNAME = process.env.ATRIUUM_WORKER_USERNAME || "staff";
const WORKER_PASSWORD = process.env.ATRIUUM_WORKER_PASSWORD || "library1210";
const LIBRARY_CODE = process.env.ATRIUUM_LIBRARY_CODE || "cpltx";

/* ── Core: login + execute in one flow ── */

async function withSession<T>(
  action: (cookieHeader: string) => Promise<T>
): Promise<T> {
  // 1. Login to get session cookie
  const loginParams = new URLSearchParams({
    login_username: WORKER_USERNAME,
    password: WORKER_PASSWORD,
    DisplayErrors: "true",
    librarySelector: LIBRARY_CODE,
    locationSelector: "1",
  });

  const loginResp = await fetch(`${ATRIUUM_BASE}/LibrarianLogOn`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginParams.toString(),
    redirect: "manual",
  });

  // Extract session cookies from response
  const setCookies = loginResp.headers.getSetCookie?.() || [];
  const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");

  if (!cookieHeader) {
    throw new Error("Failed to establish Atriuum session");
  }

  // 2. Execute the action with the session
  return action(cookieHeader);
}

async function apiRequest(xmlPayload: string): Promise<Record<string, unknown>> {
  return withSession(async (cookieHeader) => {
    const resp = await fetch(`${ATRIUUM_BASE}/ProcessHttpReq?asJSON=t`, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        Cookie: cookieHeader,
      },
      body: xmlPayload,
    });

    if (!resp.ok) {
      throw new Error(`Atriuum API error: ${resp.status}`);
    }

    const text = await resp.text();

    if (text.includes("Worker Log On") || text.includes("LibrarianLogOn")) {
      throw new Error("Atriuum session authentication failed");
    }

    return JSON.parse(text);
  });
}

/* ── Types ── */

export interface PatronLoginResult {
  success: boolean;
  patronId: string;
  barcode: string;
  name: string;
  error?: string;
}

export interface CheckedOutItem {
  title: string;
  barcode: string;
  callNumber: string;
  dueDate: string;
  checkoutDate: string;
  isOverdue: boolean;
  author: string;
  materialType: string;
  renewalCount: string;
  finesOwed: string;
}

export interface PatronAccount {
  name: string;
  barcode: string;
  patronId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  patronClass: string;
  cardExpires: string;
  cardExpired: boolean;
  isBlocked: boolean;
  canCheckOut: boolean;
  cantCheckOutReasons: string;
  totalFines: string;
  projectedLateFee: string;
  itemsOut: number;
  totalOverdue: number;
  materialsOut: CheckedOutItem[];
}

/* ── API Functions ── */

/**
 * Authenticate a patron with barcode + password
 */
export async function patronLogin(
  barcode: string,
  password: string
): Promise<PatronLoginResult> {
  const xml = `<actionmessagelist><action><type>patron_login</type><isOPAC>true</isOPAC><patronBarcode>${esc(barcode)}</patronBarcode><pin>${esc(password)}</pin></action></actionmessagelist>`;

  try {
    const data = await apiRequest(xml);
    const patron = getPatron(data);

    if (patron.successful === true) {
      return {
        success: true,
        patronId: String(patron.patronId || ""),
        barcode: String(patron.patronBarcode || barcode),
        name: String(patron.patronName || ""),
      };
    }

    return {
      success: false,
      patronId: "",
      barcode,
      name: "",
      error: String(patron.errors || "Authentication failed"),
    };
  } catch (err) {
    console.error("[Atriuum] Patron login error:", err);
    return {
      success: false,
      patronId: "",
      barcode,
      name: "",
      error: "Unable to connect to library system",
    };
  }
}

/**
 * Get full patron account details
 */
export async function getPatronAccount(
  barcode: string
): Promise<PatronAccount | null> {
  const xml = `<actionmessagelist><action><type>query_patron_by_barcode</type><origin>circdesk</origin><barcode>${esc(barcode)}</barcode><locID>1</locID></action></actionmessagelist>`;

  try {
    const data = await apiRequest(xml);
    const p = getPatron(data);

    if (!p || !p.id) return null;

    const materialsOut = (
      (p.materialsout as Record<string, unknown>[]) || []
    ).map((item) => ({
      title: String(item.title || ""),
      barcode: String(item.barcode || ""),
      callNumber: String(item.callnumber || ""),
      dueDate: String(item.duedate || ""),
      checkoutDate: String(item.checkoutDate || ""),
      isOverdue: item.isOverDue === "true",
      author: String(item.author || ""),
      materialType: String(item.materialtype || ""),
      renewalCount: String(item.renewalCount || "0"),
      finesOwed: String(item.finesOwed || "0.00"),
    }));

    return {
      name: String(p.name || ""),
      barcode: String(p.barcode || barcode),
      patronId: String(p.id || ""),
      email: String(p.emailaddress || ""),
      phone: String(p.otherphone || p.homephone || p.workphone || ""),
      address: String(p.address || ""),
      city: String(p.city || ""),
      state: String(p.state || ""),
      zip: String(p.zip || ""),
      patronClass: String(p.patronclass || ""),
      cardExpires: String(p.patroncardexpires || ""),
      cardExpired: p.cardexpired === "true",
      isBlocked: p.isBlocked === "true",
      canCheckOut: p.CanCheckOut !== "false",
      cantCheckOutReasons: String(p.CantCheckOutReasons || ""),
      totalFines: String(p.responsibleforfines || "$0.00"),
      projectedLateFee: String(p.projectedlatefee || "$0.00"),
      itemsOut: Number(p.numberItemsOut || 0),
      totalOverdue: Number(p.totalOverdue || 0),
      materialsOut,
    };
  } catch (err) {
    console.error("[Atriuum] Get patron account error:", err);
    return null;
  }
}

/* ── Helpers ── */

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPatron(data: Record<string, unknown>): Record<string, unknown> {
  const rml = data.responsemessagelist as Record<string, unknown>;
  const response = (rml?.response || {}) as Record<string, unknown>;
  return (response.patron || {}) as Record<string, unknown>;
}
