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
