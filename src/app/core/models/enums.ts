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
