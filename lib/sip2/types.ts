/**
 * SIP2 Protocol Types
 *
 * SIP2 (Standard Interchange Protocol v2) is the standard for
 * communication between library automation systems and self-service devices.
 */

export interface SIP2Config {
  host: string;
  port: number;
  username: string;
  password: string;
  location: string;
  timeout?: number; // ms, default 10000
}

export interface PatronStatus {
  valid: boolean;
  authenticated: boolean;
  name: string;
  email?: string;
  phone?: string;
  homeAddress?: string;
  patronId: string;
  institutionId: string;
  // Status flags (14-character fixed field)
  chargePrivilegesDenied: boolean;
  renewalPrivilegesDenied: boolean;
  recallPrivilegesDenied: boolean;
  holdPrivilegesDenied: boolean;
  cardReportedLost: boolean;
  tooManyItemsCharged: boolean;
  tooManyItemsOverdue: boolean;
  tooManyRenewals: boolean;
  tooManyClaimsReturned: boolean;
  tooManyItemsLost: boolean;
  excessiveOutstandingFines: boolean;
  excessiveOutstandingFees: boolean;
  recallOverdue: boolean;
  tooManyItemsBilled: boolean;
  // Counts
  holdItemsCount: number;
  overdueItemsCount: number;
  chargedItemsCount: number;
  fineItemsCount: number;
  feeAmount?: string;
  // Messages
  screenMessage?: string;
  printLine?: string;
}

export interface PatronInfo {
  valid: boolean;
  authenticated: boolean;
  name: string;
  email?: string;
  phone?: string;
  homeAddress?: string;
  patronId: string;
  institutionId: string;
  feeAmount?: string;
  holdItemsCount: number;
  overdueItemsCount: number;
  chargedItemsCount: number;
  fineItemsCount: number;
  unavailableHoldsCount: number;
  // Item lists (depending on what was requested)
  holdItems: string[];
  overdueItems: string[];
  chargedItems: string[];
  fineItems: string[];
  screenMessage?: string;
}

export interface ItemInfo {
  available: boolean;
  circulationStatus: string;
  title: string;
  author?: string;
  isbn?: string;
  callNumber?: string;
  itemId: string;
  mediaType?: string;
  currentLocation?: string;
  permanentLocation?: string;
  dueDate?: string;
  holdQueueLength?: number;
  screenMessage?: string;
}

export interface HoldResponse {
  ok: boolean;
  available: boolean;
  transactionDate: string;
  expirationDate?: string;
  queuePosition?: number;
  itemId: string;
  titleId?: string;
  patronId: string;
  screenMessage?: string;
}

export interface RenewResponse {
  ok: boolean;
  renewalOk: boolean;
  transactionDate: string;
  dueDate?: string;
  itemId: string;
  titleId?: string;
  patronId: string;
  mediaType?: string;
  screenMessage?: string;
}

/** Circulation status codes from SIP2 spec */
export const CIRC_STATUS: Record<string, string> = {
  "00": "Unknown",
  "01": "Other",
  "02": "On order",
  "03": "Available",
  "04": "Charged (checked out)",
  "05": "Charged, not to be recalled",
  "06": "In process",
  "07": "Recalled",
  "08": "Waiting on hold shelf",
  "09": "Waiting to be reshelved",
  "10": "In transit",
  "11": "Claimed returned",
  "12": "Lost",
  "13": "Missing",
};
