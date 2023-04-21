"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = exports.WebKwil = exports.NodeKwil = void 0;
const nodeKwil_1 = __importDefault(require("./node/nodeKwil"));
exports.NodeKwil = nodeKwil_1.default;
const webKwil_1 = __importDefault(require("./web/webKwil"));
exports.WebKwil = webKwil_1.default;
const dbid_1 = require("./utils/dbid");
const Utils = {
    generateDBID: dbid_1.generateDBID
};
exports.Utils = Utils;
