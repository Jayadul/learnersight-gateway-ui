import { ChannelType, Provider } from './enums';

/** One channel's cached provider balance. Shape is provider-agnostic by design. */
export interface ChannelBalanceDto {
  readonly channelConfigId: string;
  readonly label: string;
  readonly channelType: ChannelType;
  readonly provider: Provider;
  readonly providerName: string;
  readonly isActive: boolean;
  /** Remaining balance; null when it has never been read successfully. */
  readonly available: number | null;
  /**
   * Credit limit where the provider reports one. Null means the provider has no
   * such concept — render blank, never as zero.
   */
  readonly creditLimit: number | null;
  /** When the figure was last read successfully. */
  readonly checkedAt: string | null;
  /** Why the last refresh failed, or null if it succeeded. */
  readonly error: string | null;
  /** A figure is showing but the last refresh failed, so it is last-known-good. */
  readonly isStale: boolean;
}
