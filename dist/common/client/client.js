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
exports.ConfigClient = exports.TxClient = exports.AccountClient = void 0;
const base64_1 = require("../../utils/base64");
const bytes_1 = require("../../utils/bytes");
const api_1 = require("./api");
class Client {
    constructor(opts) {
        this.Tx = new TxClient(opts);
        this.Accounts = new AccountClient(opts);
        this.Config = new ConfigClient(opts);
    }
}
exports.default = Client;
function checkRes(res) {
    if (res.status != 200 || !res.data) {
        throw new Error(JSON.stringify(res.data) || 'An unknown error has occurred.  Please check your network connection.');
    }
}
class AccountClient {
    constructor(opts) {
        this.api = new api_1.Api(opts.kwilProvider, opts);
    }
    getSchema(dbid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.api.get(`/api/v1/databases/${dbid}/schema`);
            checkRes(res);
            return {
                status: res.status,
                data: res.data.dataset
            };
        });
    }
    getAccount(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.api.get(`/api/v1/accounts/${owner}`);
            checkRes(res);
            return {
                status: res.status,
                data: res.data.account
            };
        });
    }
    listDatabases(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.api.get(`/api/v1/${owner}/databases`);
            checkRes(res);
            return {
                status: res.status,
                data: res.data.databases
            };
        });
    }
}
exports.AccountClient = AccountClient;
class TxClient {
    constructor(opts) {
        this.api = new api_1.Api(opts.kwilProvider, opts);
    }
    estimateCost(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = {
                tx: tx
            };
            const res = yield this.api.post(`/api/v1/estimate_price`, req);
            checkRes(res);
            return {
                status: res.status,
                data: res.data.price
            };
        });
    }
    broadcast(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = {
                tx: tx
            };
            const res = yield this.api.post(`/api/v1/broadcast`, req);
            checkRes(res);
            let body;
            if (res.data.receipt.body) {
                const uint8 = new Uint8Array((0, base64_1.base64ToBytes)(res.data.receipt.body));
                const decoder = new TextDecoder('utf-8');
                const jsonString = decoder.decode(uint8);
                body = JSON.parse(jsonString);
            }
            function isContentBody(body) {
                for (const item of body) {
                    if (item.length > 0) {
                        return true;
                    }
                }
                return false;
            }
            const cleanReceipt = !isContentBody(body) ? {
                txHash: (0, bytes_1.Uint8ArrayToHex)((0, base64_1.base64ToBytes)(res.data.receipt.txHash)),
                fee: res.data.receipt.fee,
            } : {
                txHash: (0, bytes_1.Uint8ArrayToHex)((0, base64_1.base64ToBytes)(res.data.receipt.txHash)),
                fee: res.data.receipt.fee,
                body: body
            };
            return {
                status: res.status,
                data: cleanReceipt
            };
        });
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.api.get(`/api/v1/ping`);
            checkRes(res);
            return {
                status: res.status,
                data: res.data.message
            };
        });
    }
    selectQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.api.post(`/api/v1/query`, query);
            checkRes(res);
            return {
                status: res.status,
                data: res.data.result
            };
        });
    }
}
exports.TxClient = TxClient;
class ConfigClient {
    constructor(opts) {
        this.api = new api_1.Api(opts.kwilProvider, opts);
    }
    getFundingConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.api.get(`/api/v1/config`);
            checkRes(res);
            return {
                status: res.status,
                data: res.data
            };
        });
    }
}
exports.ConfigClient = ConfigClient;
