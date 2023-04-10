export declare function Marshal(msg: object): Uint8Array;
export declare function MarshalB64(msg: object): string;
export declare function NumberToUint32LittleEndian(num: number): Uint8Array;
export declare function StringToUint8LittleEndian(str: string): Uint8Array;
export declare function NumberToUint64LittleEndian(num: number): Uint8Array;
export declare function ConcatBytes(...arrays: Uint8Array[]): Uint8Array;
export declare function Uint8ArrayToHex(uint8Array: Uint8Array): string;
export declare function HexToUint8Array(hex: string): Uint8Array;
