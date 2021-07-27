import rs from 'jsrsasign'
let jwk = {
  kty: 'RSA',
  n: 'h54X0a7mBjxBvu19PFcFWJocBIWyGi97n2LdQ0HIQGia9neY0pjixrnpG2oyJARNlXtZP8-dngHDoUiHisi4Ow',
  e: 'AQAB',
  d: 'URYspbnOXTIQGWmENNzPHH_geq-5osB7SPxi0YD2i9NfTZTUjbJfS-sHA8A7oQKw2_O-IhdRR1CfWTnjkiWFsQ',
  p: '0igF1WfipvKrHHgqEkfyjDoaWkqSrtBCdYmRXp31BBk',
  q: 'pTOGGZx89Tx2G5_dXhD8SCTX036HRvhvbvSGzZeLCXM',
  dp: 'DB_c_kvpCqKzdogEPVvDRY3QmWb2AXnoa6mNJn1Mdnk',
  dq: 'liUaADUGLS1iewD1BQWTBU7XCdW5xXsObF26FylgqJk',
  qi: 'gLV4Plkvsix7BhKP9tkc-CcuqcNg6NWbfDGy7iD0glI'
}

  //let privateKey = rs.KEYUTIL.getKey(jwk)

  export default jwk