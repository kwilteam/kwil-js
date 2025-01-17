import { parse } from 'uuid';
import { booleanToBytes, numberToBytes } from '../utils/serial';
import { bytesToBase64 } from '../utils/base64';
import { base64ToBytes } from '../utils/base64';
import { hexToBytes, stringToBytes } from '../utils/serial';


function test() {
  // handling numbers
  const numBytes = numberToBytes(42)
  console.log(bytesToBase64(numBytes))

  // handling uuids
  // for martin - how should we handle when a user passes a UUID to kwil-js?
  // I see two options (if there are others though, feel free to propose):
  //  - Option 1: We check each string that is passed to see if it conforms to a uuid string. If yes, we assume the variable is of uuid type and pass accordingly.
  //  - Option 2: We create a class (e.g., UUID), that users must use each time they want to query. Example:
  //    await kwil.selectQuery('SELECT * FROM my_table WHERE id = $my_uuid, {$my_uuid: new UUID("123e4567-e89b-12d3-a456-426614174000")})
  const uuidBytes = parse('123e4567-e89b-12d3-a456-426614174000')
  console.log(bytesToBase64(uuidBytes))

  // handling boolean
  const boolBytes = booleanToBytes(false)
  console.log(bytesToBase64(boolBytes))

  // handling blob
  // for martin - similar to uuids, how should we handle user passing blobs?
  // Two ideas:
  //    1. We require all blobs to be passed as a Uint8Array. Seems simple.
  //    2. We require blobs to use a special `Blob` class. This allows the user to use different blob encodings. E.g.,
  //        - new Blob([0, 1, 2, 3, ...]) // Passing as uint8array
  //        - new Blob('Ej5FZ+ibEtOkVkJmFBdAAA==', 'base64') // passing as b64 string
  //        - new Blob('123e4567e89b12d3a456426614174000', 'hex') // passing as a hex string

  // if we use approach 1
  const uint8arrayblob = new Uint8Array();
  console.log(bytesToBase64(uint8arrayblob));

  // if we use approach 2
  //    base64 case
  const base64Blob = base64ToBytes('AAAAAAAAAAE=');
  console.log(bytesToBase64(base64Blob))

  //    hex case
  const hexBlob = hexToBytes('0000000000000001');
  console.log(bytesToBase64(hexBlob))

  // handling decimals
  const decimalBytes = stringToBytes("12.3456")
  console.log(bytesToBase64(decimalBytes))
}

test();