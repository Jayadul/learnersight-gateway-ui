import { ChannelType } from './enums';

export interface ManualSendRequest {
  readonly channelType: ChannelType;
  readonly toNumbers: string;
  readonly message: string;
  readonly mediaUrl?: string;
  readonly campaignId?: string;
  readonly callerID?: string;
}
export interface ManualSendResponse {
  readonly messageRequestId: string;
  readonly status: string;
  readonly totalNumbers: number;
}
