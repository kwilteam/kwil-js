// ~~UTILITY FUNCTIONS~~

import { concatBytes } from "../src/utils/bytes";

// prefixBytesLength prefixes a Uint8array with the bytes length (uint32)
export function prefixBytesLength(bytes: Uint8Array): Uint8Array {
    const lengthBytes = numberToUint32LittleEndian(bytes.length)
    
   return concatBytes(
        lengthBytes,
        bytes
    )
}

export function numberToUint16LittleEndian(number: number): Uint8Array {
    if (number < 0 || number > 0xFFFF || !Number.isInteger(number)) {
        throw new RangeError("The number must be an integer between 0 and 65535.");
    }

    const buffer = new ArrayBuffer(2); // Create a buffer of 2 bytes
    const view = new DataView(buffer);

    view.setUint16(0, number, true); // Set the number at byte offset 0 in little-endian

    return new Uint8Array(buffer); // Convert to Uint8Array for easier use
}

export function numberToUint32LittleEndian(number) {
    if (number < 0 || number > 0xFFFFFFFF || !Number.isInteger(number)) {
        throw new RangeError("The number must be an integer between 0 and 4294967295.");
    }

    const buffer = new ArrayBuffer(4); // Create a buffer of 4 bytes
    const view = new DataView(buffer);

    view.setUint32(0, number, true); // Write the number at byte offset 0 in little-endian

    return new Uint8Array(buffer); // Convert to Uint8Array for easier use
}

export function numberToUint32BigEndian(number) {
    if (number < 0 || number > 0xFFFFFFFF || !Number.isInteger(number)) {
      throw new RangeError("The number must be an integer between 0 and 4294967295.");
    }
  
    const buffer = new ArrayBuffer(4); // Create a buffer of 4 bytes
    const view = new DataView(buffer);
  
    view.setUint32(0, number, false); // Write the number in big-endian format (false)
  
    return new Uint8Array(buffer); // Convert to Uint8Array for easier use
  }