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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = exports.sha224StringToString = exports.sha384StringToBytes = exports.sha384BytesToBytes = exports.sha384BytesToString = exports.sha384StringToString = void 0;
const jssha_1 = __importDefault(require("jssha"));
const signature_1 = require("../interfaces/signature");
const bytes_1 = require("../../utils/bytes");
const base64_1 = require("../../utils/base64");
function sha384StringToString(message) {
    const shaObj = new jssha_1.default('SHA-384', 'TEXT');
    shaObj.update(message);
    return shaObj.getHash('HEX');
}
exports.sha384StringToString = sha384StringToString;
function sha384BytesToString(message) {
    const shaObj = new jssha_1.default('SHA-384', 'UINT8ARRAY');
    shaObj.update(message);
    return shaObj.getHash('HEX');
}
exports.sha384BytesToString = sha384BytesToString;
function sha384BytesToBytes(message) {
    const shaObj = new jssha_1.default('SHA-384', 'UINT8ARRAY');
    shaObj.update(message);
    return shaObj.getHash('UINT8ARRAY');
}
exports.sha384BytesToBytes = sha384BytesToBytes;
function sha384StringToBytes(message) {
    const shaObj = new jssha_1.default('SHA-384', 'TEXT');
    shaObj.update(message);
    return shaObj.getHash('UINT8ARRAY');
}
exports.sha384StringToBytes = sha384StringToBytes;
function sha224StringToString(message) {
    const shaObj = new jssha_1.default('SHA-224', 'TEXT');
    shaObj.update(message);
    return shaObj.getHash('HEX');
}
exports.sha224StringToString = sha224StringToString;
function sign(message, txType, fee, nonce, signer) {
    return __awaiter(this, void 0, void 0, function* () {
        const signatureMessage = `You are signing a transaction for the Kwil network.
Transaction details:
Hash: ${message}
Type: ${txType}
Fee: ${fee}
Nonce: ${nonce}
    
Click "Sign" to continue.`;
        const sig = yield signer.signMessage(signatureMessage);
        const encodedSignature = (0, base64_1.bytesToBase64)((0, bytes_1.HexToUint8Array)(sig));
        return {
            signature_bytes: encodedSignature,
            signature_type: signature_1.SignatureType.ACCOUNT_SECP256K1_UNCOMPRESSED,
        };
    });
}
exports.sign = sign;
