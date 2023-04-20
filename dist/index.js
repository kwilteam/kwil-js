"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = exports.Types = exports.WebKwil = exports.NodeKwil = void 0;
const nodeKwil_1 = __importDefault(require("./node/nodeKwil"));
exports.NodeKwil = nodeKwil_1.default;
const webKwil_1 = __importDefault(require("./web/webKwil"));
exports.WebKwil = webKwil_1.default;
const tx_1 = require("./common/interfaces/tx");
const enums_1 = require("./common/interfaces/enums");
const dbid_1 = require("./utils/dbid");
const Types = {
    PayloadType: tx_1.PayloadType,
    DataType: enums_1.DataType,
    AttributeType: enums_1.AttributeType,
    IndexType: enums_1.IndexType
};
exports.Types = Types;
const Utils = {
    generateDBID: dbid_1.generateDBID
};
exports.Utils = Utils;
