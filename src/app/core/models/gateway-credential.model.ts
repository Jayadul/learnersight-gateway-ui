/**
 * The credentials third parties present to /sendtext. SuperAdmin reads them decrypted —
 * there is nowhere else to look the pair up, since the column is ciphertext.
 */
export interface GatewayCredentialDto {
  readonly id: string;
  readonly username: string;
  /** Decrypted. Empty when isReadable is false. */
  readonly apiKey: string;
  /** Decrypted. Empty when isReadable is false. */
  readonly secretKey: string;
  /** False when the stored ciphertext could not be decrypted — usually a changed key. */
  readonly isReadable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Every field is optional and an omitted field keeps its stored value, so a form that
 * changes one field must send only that field.
 */
export interface UpdateGatewayCredentialRequest {
  readonly username?: string;
  readonly apiKey?: string;
  readonly secretKey?: string;
}
