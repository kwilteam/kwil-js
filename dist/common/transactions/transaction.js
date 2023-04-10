"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const base64_1 = require("../../utils/base64");
const bytes_1 = require("../../utils/bytes");
const crypto_1 = require("../crypto/crypto");
const signature_1 = require("../interfaces/signature");
class Transaction {
    constructor(tx) {
        this.tx = {
            hash: "",
            payload_type: tx.payloadType,
            payload: (0, bytes_1.MarshalB64)(tx.toObject()),
            fee: "0",
            nonce: -1,
            signature: {
                signature_bytes: "",
                signature_type: signature_1.SignatureType.ACCOUNT_SECP256K1_UNCOMPRESSED
            },
            sender: ""
        };
    }
    sign(signer) {
        return __awaiter(this, void 0, void 0, function* () {
            this.tx.signature = yield (0, crypto_1.sign)(this.tx.hash, signer);
            this.tx.sender = yield signer.getAddress();
        });
    }
    generateHash() {
        const payloadType = (0, bytes_1.NumberToUint32LittleEndian)(this.tx.payload_type);
        const payloadHash = (0, crypto_1.sha384BytesToBytes)((0, base64_1.base64ToBytes)(this.tx.payload));
        const fee = (0, bytes_1.StringToUint8LittleEndian)(this.tx.fee);
        const nonce = (0, bytes_1.NumberToUint64LittleEndian)(this.tx.nonce);
        const hash = (0, crypto_1.sha384BytesToBytes)((0, bytes_1.ConcatBytes)(payloadType, payloadHash, fee, nonce));
        this.tx.hash = (0, base64_1.bytesToBase64)(hash);
    }
}
exports.Transaction = Transaction;
