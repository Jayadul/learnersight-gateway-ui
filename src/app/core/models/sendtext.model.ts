/**
 * Response of the public gateway endpoint POST /sendtext.
 * NOTE: this endpoint intentionally uses PascalCase/underscore keys
 * (REVE-SMS-compatible contract) — do not "fix" the casing.
 */
export interface SendTextGatewayResponse {
  readonly Status: string;      // "0" = accepted, "101" = rejected
  readonly Text: string;        // "ACCEPTD" | "REJECTD"
  readonly Message_ID?: string; // request id (GUID) when accepted
}

/**
 * Response of the public GET /balance?callerID= endpoint. Its own shape, not REVE's —
 * this endpoint isn't bound to that compatibility contract.
 */
export interface BalanceLookupResponse {
  readonly label: string;
  readonly balance: number | null;
  readonly creditLimit: number | null;
  readonly lastCheckedAt: string | null;
}

/** Error shape for GET /balance — unknown label, inactive channel, or unsupported provider. */
export interface BalanceLookupError {
  readonly status: string;
  readonly message: string;
}
