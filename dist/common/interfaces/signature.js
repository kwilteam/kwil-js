"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureType = void 0;
var SignatureType;
(function (SignatureType) {
    SignatureType[SignatureType["SIGNATURE_TYPE_INVALID"] = 0] = "SIGNATURE_TYPE_INVALID";
    SignatureType[SignatureType["PK_SECP256K1_UNCOMPRESSED"] = 1] = "PK_SECP256K1_UNCOMPRESSED";
    SignatureType[SignatureType["ACCOUNT_SECP256K1_UNCOMPRESSED"] = 2] = "ACCOUNT_SECP256K1_UNCOMPRESSED";
})(SignatureType = exports.SignatureType || (exports.SignatureType = {}));
