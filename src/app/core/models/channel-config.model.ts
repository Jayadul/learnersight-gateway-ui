import { ChannelType } from './enums';

export interface ChannelConfigDto {
  readonly id: string;
  readonly channelType: ChannelType;
  readonly providerName: string;
  readonly label: string;
  readonly isActive: boolean;
  readonly configFields: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CreateChannelConfigRequest {
  readonly channelType: ChannelType;
  readonly providerName: string;
  readonly label: string;
  readonly configJson: string;
}
export interface UpdateChannelConfigRequest {
  readonly providerName: string;
  readonly label: string;
  readonly configJson: string;
}
