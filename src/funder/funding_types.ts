/**
 * `TransferBody` is the body of a transfer request.
 * 
 * @param to The address / identifier to transfer to. Can be a hex string or a Uint8Array.
 * @param amount The amount to transfer.
 */
export interface TransferBody {
    to: string | Uint8Array;
    amount: BigInt;
    description?: string;   
}