import { ethers, JsonRpcSigner } from 'ethers';
import { Signature } from '../interfaces/signature';
export declare function sha384StringToString(message: string): string;
export declare function sha384BytesToString(message: Uint8Array): string;
export declare function sha384BytesToBytes(message: Uint8Array): Uint8Array;
export declare function sha384StringToBytes(message: string): Uint8Array;
export declare function sha224StringToString(message: string): string;
export declare function sign(message: string, signer: JsonRpcSigner | ethers.Wallet): Promise<Signature>;
