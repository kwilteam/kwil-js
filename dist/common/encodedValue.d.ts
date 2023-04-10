import { DataType } from "./interfaces/enums";
export declare class EncodedValue {
    private value;
    private type;
    private bytes;
    constructor(value: any, type: DataType);
    Value(): any;
    Type(): DataType;
    Bytes(): Uint8Array;
    Base64(): string;
}
export declare function EncodedValueFromBytes(bytes: Uint8Array): EncodedValue;
export declare function EncodedValueFromBase64(base64: string): EncodedValue;
