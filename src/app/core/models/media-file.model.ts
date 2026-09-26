import { MediaStatus } from './enums';

export interface MediaFileDto {
  readonly id: string;
  readonly originalFileName: string;
  readonly storedFileName: string;
  readonly publicUrl: string;
  readonly extension: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly uploadedAt: string;
  readonly expiresAt: string;
  readonly status: MediaStatus;
  readonly createdBy: string;
  readonly deletedAt: string | null;
  readonly deletedBy: string | null;
  /** Active and not expired, judged by the server's clock rather than the device's. */
  readonly isAvailable: boolean;
}
