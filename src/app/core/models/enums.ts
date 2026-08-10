// 2 is intentionally skipped — it was WP_Media before WhatsApp text and media were
// unified into WP. Media is now implied by a job carrying a mediaUrl. Voice stays 3 so
// existing integrations keep working; do not renumber to close the gap.
export enum ChannelType   { SMS = 0, WP = 1, Voice = 3 }
export enum MessageStatus { Pending = 0, PartialSuccess = 1, Success = 2, Failed = 3 }
export enum JobStatus     { Pending = 0, Sent = 1, Failed = 2 }
export enum AdminRole     { SuperAdmin = 0, Admin = 1 }
export enum MessageSource { XSoft = 0, AdminPanel = 1 }
export enum MediaStatus   { Active = 0, Deleted = 1 }
