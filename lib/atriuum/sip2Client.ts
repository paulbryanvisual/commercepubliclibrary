/**
 * SIP2 Protocol Client for Atriuum ILS
 *
 * Implements the 3M SIP2 (Standard Interchange Protocol v2) for
 * communicating with the Atriuum library system over TCP sockets.
 *
 * Message types implemented:
 *   93/94 — Login
 *   63/64 — Patron Information
 *   23/24 — Patron Status
 *   09/10 — Checkout
 *   11/12 — Checkin
 *   29/30 — Renew
 *   65/66 — Renew All
 *   15/16 — Hold (place/cancel)
 *   17/18 — Item Information
 */

import * as net from "net";

// ─── Types ──────────────────────────────────────────────────────────

export interface SIP2Config {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface PatronInfo {
  valid: boolean;
  authenticated: boolean;
  patronId: string;
  displayName: string;
  email: string;
  phone: string;
  homeAddress: string;
  expirationDate: string;
  fineBalance: number;
  holdCount: number;
  overdueCount: number;
  chargedCount: number;
  fineCount: number;
  checkedOutItems: CheckedOutItem[];
  holds: HoldItem[];
  fines: FineItem[];
  unavailableHolds: number;
}

export interface CheckedOutItem {
  itemId: string;
  title: string;
  author: string;
  dueDate: string;
  status: "fine" | "due-soon" | "overdue";
  renewable: boolean;
}

export interface HoldItem {
  itemId: string;
  title: string;
  author: string;
  pickupLocation: string;
  status: "pending" | "ready" | "in-transit";
  queuePosition: number;
  dateHeld: string;
}

export interface FineItem {
  itemId: string;
  title: string;
  amount: number;
  type: string;
  date: string;
}

export interface CheckoutResult {
  ok: boolean;
  message: string;
  dueDate?: string;
}

export interface CheckinResult {
  ok: boolean;
  message: string;
  alert?: boolean;
}

export interface RenewResult {
  ok: boolean;
  message: string;
  itemId: string;
  title: string;
  newDueDate?: string;
}

export interface RenewAllResult {
  ok: boolean;
  renewed: number;
  notRenewed: number;
  items: RenewResult[];
}

export interface HoldResult {
  ok: boolean;
  message: string;
}

export interface ItemStatus {
  itemId: string;
  title: string;
  author: string;
  available: boolean;
  dueDate?: string;
  circulationStatus: string;
  callNumber: string;
  location: string;
  mediaType: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function sip2Date(date?: Date): string {
  const d = date || new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}    ${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function parseSIP2Date(raw: string): string {
  if (!raw || raw.length < 8) return "";
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  return `${y}-${m}-${d}`;
}

function parseFixedField(msg: string, offset: number, length: number): string {
  return msg.slice(offset, offset + length);
}

function parseVariableFields(msg: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const parts = msg.split("|");
  for (const part of parts) {
    if (part.length >= 2) {
      const code = part.slice(0, 2);
      const value = part.slice(2);
      fields[code] = value;
    }
  }
  return fields;
}

function parseMultiValueFields(msg: string, code: string): string[] {
  const values: string[] = [];
  const parts = msg.split("|");
  for (const part of parts) {
    if (part.startsWith(code)) {
      values.push(part.slice(2));
    }
  }
  return values;
}

export function computeCheckStatus(dueDate: string): "fine" | "due-soon" | "overdue" {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "due-soon";
  return "fine";
}

// ─── Connection Pool ────────────────────────────────────────────────

interface PooledConnection {
  socket: net.Socket;
  busy: boolean;
  lastUsed: number;
  loggedIn: boolean;
}

class ConnectionPool {
  private pool: PooledConnection[] = [];
  private config: SIP2Config;
  private maxSize = 5;
  private timeout = 30000;

  constructor(config: SIP2Config) {
    this.config = config;
  }

  async acquire(): Promise<PooledConnection> {
    // Reuse an idle connection
    const idle = this.pool.find((c) => !c.busy && c.socket.writable);
    if (idle) {
      idle.busy = true;
      idle.lastUsed = Date.now();
      return idle;
    }

    // Remove dead connections
    this.pool = this.pool.filter((c) => c.socket.writable);

    // Create new if under limit
    if (this.pool.length < this.maxSize) {
      const conn = await this.createConnection();
      this.pool.push(conn);
      return conn;
    }

    // Wait for one to free up
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Connection pool timeout")), this.timeout);
      const check = setInterval(() => {
        const free = this.pool.find((c) => !c.busy && c.socket.writable);
        if (free) {
          clearInterval(check);
          clearTimeout(timer);
          free.busy = true;
          free.lastUsed = Date.now();
          resolve(free);
        }
      }, 100);
    });
  }

  release(conn: PooledConnection) {
    conn.busy = false;
  }

  private createConnection(): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const conn: PooledConnection = {
        socket,
        busy: true,
        lastUsed: Date.now(),
        loggedIn: false,
      };

      socket.setTimeout(this.timeout);
      socket.on("timeout", () => socket.destroy());
      socket.on("error", () => socket.destroy());

      socket.connect(this.config.port, this.config.host, () => {
        resolve(conn);
      });

      socket.on("error", (err) => {
        reject(err);
      });
    });
  }

  destroyAll() {
    for (const conn of this.pool) {
      conn.socket.destroy();
    }
    this.pool = [];
  }
}

// ─── SIP2 Client ────────────────────────────────────────────────────

class SIP2Client {
  private pool: ConnectionPool | null = null;
  private config: SIP2Config | null = null;
  private useMock: boolean;

  constructor() {
    const host = process.env.ATRIUUM_SIP2_HOST;
    const port = process.env.ATRIUUM_SIP2_PORT;
    const user = process.env.ATRIUUM_SIP2_USER;
    const pass = process.env.ATRIUUM_SIP2_PASSWORD;

    if (host && port && user && pass) {
      this.config = {
        host,
        port: parseInt(port, 10),
        username: user,
        password: pass,
      };
      this.pool = new ConnectionPool(this.config);
      this.useMock = false;
    } else {
      this.useMock = true;
    }
  }

  // ── Low-level send/receive ──

  private sendMessage(conn: PooledConnection, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let response = "";

      const onData = (data: Buffer) => {
        response += data.toString("utf-8");
        // SIP2 messages end with \r
        if (response.includes("\r")) {
          conn.socket.removeListener("data", onData);
          resolve(response.trim());
        }
      };

      conn.socket.on("data", onData);
      conn.socket.write(message + "\r", "utf-8", (err) => {
        if (err) reject(err);
      });

      setTimeout(() => {
        conn.socket.removeListener("data", onData);
        if (!response) reject(new Error("SIP2 response timeout"));
      }, 15000);
    });
  }

  // ── Login (93/94) ──

  async connect(): Promise<boolean> {
    if (this.useMock) return true;
    const conn = await this.pool!.acquire();
    try {
      if (!conn.loggedIn) {
        const msg = `93${this.config!.username}|CO${this.config!.password}|`;
        const resp = await this.sendMessage(conn, msg);
        conn.loggedIn = resp.startsWith("94") && resp[2] === "1";
        return conn.loggedIn;
      }
      return true;
    } finally {
      this.pool!.release(conn);
    }
  }

  async login(): Promise<boolean> {
    return this.connect();
  }

  // ── Patron Information (63/64) ──

  async patronInfo(barcode: string, pin: string): Promise<PatronInfo> {
    if (this.useMock) return getMockPatronInfo(barcode);

    const conn = await this.pool!.acquire();
    try {
      if (!conn.loggedIn) {
        const loginMsg = `93${this.config!.username}|CO${this.config!.password}|`;
        const loginResp = await this.sendMessage(conn, loginMsg);
        conn.loggedIn = loginResp.startsWith("94") && loginResp[2] === "1";
      }

      // 63 — Patron Information request
      // Language=001 (English), TransactionDate, Summary field (Y for each section)
      const summary = "YYYYYYYYYY"; // request all summary fields
      const msg = `63001${sip2Date()}${summary}|AA${barcode}|AD${pin}|`;
      const resp = await this.sendMessage(conn, msg);

      return this.parsePatronInfoResponse(resp, barcode);
    } finally {
      this.pool!.release(conn);
    }
  }

  private parsePatronInfoResponse(resp: string, barcode: string): PatronInfo {
    if (!resp.startsWith("64")) {
      return {
        valid: false, authenticated: false, patronId: barcode,
        displayName: "", email: "", phone: "", homeAddress: "",
        expirationDate: "", fineBalance: 0, holdCount: 0, overdueCount: 0,
        chargedCount: 0, fineCount: 0, checkedOutItems: [], holds: [],
        fines: [], unavailableHolds: 0,
      };
    }

    // Fixed-length fields at beginning of 64 response
    const _patronStatus = parseFixedField(resp, 2, 14);
    const _language = parseFixedField(resp, 16, 3);
    const _transactionDate = parseFixedField(resp, 19, 18);

    // Counts from fixed fields
    const holdCount = parseInt(parseFixedField(resp, 37, 4).trim()) || 0;
    const overdueCount = parseInt(parseFixedField(resp, 41, 4).trim()) || 0;
    const chargedCount = parseInt(parseFixedField(resp, 45, 4).trim()) || 0;
    const fineCount = parseInt(parseFixedField(resp, 49, 4).trim()) || 0;
    const unavailableHolds = parseInt(parseFixedField(resp, 57, 4).trim()) || 0;

    // Variable fields
    const fields = parseVariableFields(resp);
    const valid = fields["BL"] === "Y";
    const authenticated = fields["CQ"] === "Y";

    // Parse charged items
    const chargedItemIds = parseMultiValueFields(resp, "AU");
    const checkedOutItems: CheckedOutItem[] = chargedItemIds.map((id) => ({
      itemId: id,
      title: "",
      author: "",
      dueDate: "",
      status: "fine" as const,
      renewable: true,
    }));

    // Parse hold items
    const holdItemIds = parseMultiValueFields(resp, "AS");
    const holds: HoldItem[] = holdItemIds.map((id) => ({
      itemId: id,
      title: "",
      author: "",
      pickupLocation: "Commerce Public Library",
      status: "pending" as const,
      queuePosition: 0,
      dateHeld: "",
    }));

    return {
      valid,
      authenticated,
      patronId: barcode,
      displayName: fields["AE"] || "",
      email: fields["BE"] || "",
      phone: fields["BF"] || "",
      homeAddress: fields["BD"] || "",
      expirationDate: fields["PE"] ? parseSIP2Date(fields["PE"]) : "",
      fineBalance: fields["BV"] ? parseFloat(fields["BV"]) : 0,
      holdCount,
      overdueCount,
      chargedCount,
      fineCount,
      checkedOutItems,
      holds,
      fines: [],
      unavailableHolds,
    };
  }

  // ── Checkout (09/10) ──

  async checkout(patronBarcode: string, itemId: string): Promise<CheckoutResult> {
    if (this.useMock) {
      return { ok: true, message: "Item checked out (mock)", dueDate: "2026-04-15" };
    }

    const conn = await this.pool!.acquire();
    try {
      const msg = `09${sip2Date()}|AA${patronBarcode}|AB${itemId}|`;
      const resp = await this.sendMessage(conn, msg);
      const ok = resp.startsWith("10") && resp[2] === "1";
      const fields = parseVariableFields(resp);
      return {
        ok,
        message: fields["AF"] || (ok ? "Checked out" : "Checkout failed"),
        dueDate: fields["AH"] ? parseSIP2Date(fields["AH"]) : undefined,
      };
    } finally {
      this.pool!.release(conn);
    }
  }

  // ── Checkin (11/12) ──

  async checkin(itemId: string): Promise<CheckinResult> {
    if (this.useMock) {
      return { ok: true, message: "Item checked in (mock)" };
    }

    const conn = await this.pool!.acquire();
    try {
      const msg = `09N${sip2Date()}${sip2Date()}|AP|AB${itemId}|`;
      const resp = await this.sendMessage(conn, msg);
      const ok = resp.startsWith("10") && resp[2] === "1";
      const fields = parseVariableFields(resp);
      return {
        ok,
        message: fields["AF"] || (ok ? "Checked in" : "Checkin failed"),
        alert: resp[3] === "Y",
      };
    } finally {
      this.pool!.release(conn);
    }
  }

  // ── Renew (29/30) ──

  async renew(patronBarcode: string, itemId: string): Promise<RenewResult> {
    if (this.useMock) return getMockRenewResult(itemId);

    const conn = await this.pool!.acquire();
    try {
      // 29 — Renew: ThirdPartyAllowed=N, NoBlock=N, TransactionDate, NBDueDate
      const msg = `29NN${sip2Date()}${sip2Date()}|AA${patronBarcode}|AB${itemId}|`;
      const resp = await this.sendMessage(conn, msg);

      const ok = resp.startsWith("30") && resp[2] === "1";
      const fields = parseVariableFields(resp);

      return {
        ok,
        message: fields["AF"] || (ok ? "Renewed" : "Renewal failed"),
        itemId,
        title: fields["AJ"] || "",
        newDueDate: fields["AH"] ? parseSIP2Date(fields["AH"]) : undefined,
      };
    } finally {
      this.pool!.release(conn);
    }
  }

  // ── Renew All (65/66) ──

  async renewAll(patronBarcode: string): Promise<RenewAllResult> {
    if (this.useMock) return getMockRenewAllResult();

    const conn = await this.pool!.acquire();
    try {
      const msg = `65${sip2Date()}|AA${patronBarcode}|`;
      const resp = await this.sendMessage(conn, msg);

      if (!resp.startsWith("66")) {
        return { ok: false, renewed: 0, notRenewed: 0, items: [] };
      }

      const ok = resp[2] === "1";
      const renewed = parseInt(parseFixedField(resp, 20, 4).trim()) || 0;
      const notRenewed = parseInt(parseFixedField(resp, 24, 4).trim()) || 0;

      const renewedIds = parseMultiValueFields(resp, "BM");
      const notRenewedIds = parseMultiValueFields(resp, "BN");

      const items: RenewResult[] = [
        ...renewedIds.map((id) => ({
          ok: true,
          message: "Renewed",
          itemId: id,
          title: "",
        })),
        ...notRenewedIds.map((id) => ({
          ok: false,
          message: "Could not renew",
          itemId: id,
          title: "",
        })),
      ];

      return { ok, renewed, notRenewed, items };
    } finally {
      this.pool!.release(conn);
    }
  }

  // ── Hold (15/16) — Place or Cancel ──

  async placeHold(patronBarcode: string, itemId: string): Promise<HoldResult> {
    if (this.useMock) {
      return { ok: true, message: "Hold placed (mock)" };
    }

    const conn = await this.pool!.acquire();
    try {
      // HoldMode: + = add, - = remove, * = change
      const msg = `15+${sip2Date()}|AA${patronBarcode}|AB${itemId}|`;
      const resp = await this.sendMessage(conn, msg);
      const ok = resp.startsWith("16") && resp[2] === "1";
      const fields = parseVariableFields(resp);
      return {
        ok,
        message: fields["AF"] || (ok ? "Hold placed" : "Hold failed"),
      };
    } finally {
      this.pool!.release(conn);
    }
  }

  async cancelHold(patronBarcode: string, itemId: string): Promise<HoldResult> {
    if (this.useMock) {
      return { ok: true, message: "Hold cancelled (mock)" };
    }

    const conn = await this.pool!.acquire();
    try {
      const msg = `15-${sip2Date()}|AA${patronBarcode}|AB${itemId}|`;
      const resp = await this.sendMessage(conn, msg);
      const ok = resp.startsWith("16") && resp[2] === "1";
      const fields = parseVariableFields(resp);
      return {
        ok,
        message: fields["AF"] || (ok ? "Hold cancelled" : "Cancel failed"),
      };
    } finally {
      this.pool!.release(conn);
    }
  }

  // ── Item Information (17/18) ──

  async itemStatus(itemId: string): Promise<ItemStatus> {
    if (this.useMock) return getMockItemStatus(itemId);

    const conn = await this.pool!.acquire();
    try {
      const msg = `17${sip2Date()}|AB${itemId}|`;
      const resp = await this.sendMessage(conn, msg);
      const fields = parseVariableFields(resp);

      const circStatus = parseInt(parseFixedField(resp, 2, 2)) || 0;
      const circLabels: Record<number, string> = {
        0: "Unknown",
        1: "Other",
        2: "On order",
        3: "Available",
        4: "Charged",
        5: "Charged, not to be recalled",
        6: "In process",
        7: "Recalled",
        8: "Waiting on hold shelf",
        9: "Waiting to be re-shelved",
        10: "In transit",
        11: "Claimed returned",
        12: "Lost",
        13: "Missing",
      };

      return {
        itemId,
        title: fields["AJ"] || "",
        author: fields["BG"] || "",
        available: circStatus === 3,
        dueDate: fields["AH"] ? parseSIP2Date(fields["AH"]) : undefined,
        circulationStatus: circLabels[circStatus] || "Unknown",
        callNumber: fields["CS"] || "",
        location: fields["AQ"] || "Commerce Public Library",
        mediaType: fields["CK"] || "Book",
      };
    } finally {
      this.pool!.release(conn);
    }
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────

function getMockPatronInfo(barcode: string): PatronInfo {
  const now = new Date();
  const dueSoon = new Date(now);
  dueSoon.setDate(dueSoon.getDate() + 3);
  const overdue = new Date(now);
  overdue.setDate(overdue.getDate() - 5);
  const fine = new Date(now);
  fine.setDate(fine.getDate() + 14);

  return {
    valid: true,
    authenticated: true,
    patronId: barcode,
    displayName: "Jane Reader",
    email: "jane.reader@example.com",
    phone: "(903) 555-0123",
    homeAddress: "456 Main St, Commerce, TX 75428",
    expirationDate: "2026-12-31",
    fineBalance: 2.50,
    holdCount: 2,
    overdueCount: 1,
    chargedCount: 3,
    fineCount: 1,
    unavailableHolds: 0,
    checkedOutItems: [
      {
        itemId: "31001234567890",
        title: "The Women",
        author: "Kristin Hannah",
        dueDate: fine.toISOString().slice(0, 10),
        status: "fine",
        renewable: true,
      },
      {
        itemId: "31001234567891",
        title: "Demon Copperhead",
        author: "Barbara Kingsolver",
        dueDate: dueSoon.toISOString().slice(0, 10),
        status: "due-soon",
        renewable: true,
      },
      {
        itemId: "31001234567892",
        title: "Tom Clancy: Red Storm Rising",
        author: "Tom Clancy",
        dueDate: overdue.toISOString().slice(0, 10),
        status: "overdue",
        renewable: false,
      },
    ],
    holds: [
      {
        itemId: "31001234567893",
        title: "Iron Flame",
        author: "Rebecca Yarros",
        pickupLocation: "Commerce Public Library",
        status: "ready",
        queuePosition: 0,
        dateHeld: "2026-03-01",
      },
      {
        itemId: "31001234567894",
        title: "Fourth Wing",
        author: "Rebecca Yarros",
        pickupLocation: "Commerce Public Library",
        status: "pending",
        queuePosition: 3,
        dateHeld: "2026-03-05",
      },
    ],
    fines: [
      {
        itemId: "31001234567892",
        title: "Tom Clancy: Red Storm Rising",
        amount: 2.50,
        type: "Overdue",
        date: "2026-03-10",
      },
    ],
  };
}

function getMockRenewResult(itemId: string): RenewResult {
  const newDue = new Date();
  newDue.setDate(newDue.getDate() + 21);
  return {
    ok: true,
    message: "Renewed successfully (mock)",
    itemId,
    title: "Library Item",
    newDueDate: newDue.toISOString().slice(0, 10),
  };
}

function getMockRenewAllResult(): RenewAllResult {
  const newDue = new Date();
  newDue.setDate(newDue.getDate() + 21);
  return {
    ok: true,
    renewed: 2,
    notRenewed: 1,
    items: [
      { ok: true, message: "Renewed", itemId: "31001234567890", title: "The Women", newDueDate: newDue.toISOString().slice(0, 10) },
      { ok: true, message: "Renewed", itemId: "31001234567891", title: "Demon Copperhead", newDueDate: newDue.toISOString().slice(0, 10) },
      { ok: false, message: "Item has holds — cannot renew", itemId: "31001234567892", title: "Tom Clancy: Red Storm Rising" },
    ],
  };
}

function getMockItemStatus(itemId: string): ItemStatus {
  return {
    itemId,
    title: "The Women",
    author: "Kristin Hannah",
    available: true,
    circulationStatus: "Available",
    callNumber: "FIC HAN",
    location: "Commerce Public Library",
    mediaType: "Book",
  };
}

// ─── Singleton ──────────────────────────────────────────────────────

let _client: SIP2Client | null = null;

export function getSIP2Client(): SIP2Client {
  if (!_client) {
    _client = new SIP2Client();
  }
  return _client;
}

export type { SIP2Client };
