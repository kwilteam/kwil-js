"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDBID = void 0;
const crypto_1 = require("../common/crypto/crypto");
function generateDBID(name, owner) {
    return "x" + (0, crypto_1.sha224StringToString)(name.toLowerCase() + owner.toLowerCase());
}
exports.generateDBID = generateDBID;
