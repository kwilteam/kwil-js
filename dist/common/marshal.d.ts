import { DataType } from './interfaces/enums';
export declare function marshal(value: any, type: DataType): Uint8Array;
export declare function unmarshal(bytes: Uint8Array): any;
