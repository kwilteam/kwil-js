"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = exports.Kwil = void 0;
const kwil_1 = require("./common/kwil");
Object.defineProperty(exports, "Kwil", { enumerable: true, get: function () { return kwil_1.Kwil; } });
const tx_1 = require("./common/interfaces/tx");
const Types = {
    PayloadType: tx_1.PayloadType
};
exports.Types = Types;
