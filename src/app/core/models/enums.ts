// 2 is intentionally skipped — it was WP_Media before WhatsApp text and media were
// unified into WP. Media is now implied by a job carrying a mediaUrl. Voice stays 3 so
// existing integrations keep working; do not renumber to close the gap.
export enum ChannelType   { SMS = 0, WP = 1, Voice = 3 }
// Fallback: every primary delivery failed but a retry got through, so the message did
// arrive — just not by the route the sender asked for. Appended at 4; 0-3 shipped in 1.0.0.
export enum MessageStatus { Pending = 0, PartialSuccess = 1, Success = 2, Failed = 3, Fallback = 4 }
export enum JobStatus     { Pending = 0, Sent = 1, Failed = 2 }
export enum AdminRole     { SuperAdmin = 0, Admin = 1 }
export enum MessageSource { XSoft = 0, AdminPanel = 1 }
export enum MediaStatus   { Active = 0, Deleted = 1 }

// Which vendor serves a channel. Part of the sender-resolution key since Release 3 — a
// channel type no longer implies one provider (backend ADR 0008). Numeric like every
// other enum here: the API has no string-enum converter, so these cross the wire as
// integers. Never renumber a shipped member.
export enum Provider {
  Reve = 0, WaTrend = 1, NetZeroVoice = 2, GenNet = 3,
  // NetZero Inbox exposes two unrelated WhatsApp APIs on one host: the structured v1
  // endpoint and the QR-linked device endpoint. They differ in verb, scheme, credentials
  // and recipient format, so they are separate providers rather than a mode.
  NetZeroInbox = 4, Chithi = 5, NetZeroInboxQr = 6,
}
// Per-recipient delivery outcome, synced back from the provider after a send. Distinct
// from JobStatus: a Sent job can hold a mix of Delivered and Failed recipients.
export enum DeliveryStatus { Pending = 0, Delivered = 1, Failed = 2, Unknown = 3 }
