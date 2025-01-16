export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function convertUuidToBytes(uuid: string): Uint8Array {
  // Removes dashes from the UUID string
  uuid = uuid.replace(/-/g, '');

  // Converts the UUID string to bytes
  const bytes = new Uint8Array(uuid.length / 2);
  for (let i = 0; i < uuid.length; i += 2) {
    bytes[i / 2] = parseInt(uuid.slice(i, i + 2), 16);
  }

  return bytes;
}
