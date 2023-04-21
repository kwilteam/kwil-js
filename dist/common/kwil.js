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
exports.Kwil = void 0;
const dbid_1 = require("../utils/dbid");
const client_1 = __importDefault(require("./client/client"));
const funding_1 = require("./funder/funding");
const action_1 = require("./action/action");
const base64_1 = require("../utils/base64");
const builder_1 = require("./builder/builder");
class Kwil {
    constructor(opts) {
        const client = new client_1.default({
            kwilProvider: opts.kwilProvider,
            apiKey: opts.apiKey,
            network: opts.network,
            timeout: opts.timeout,
            logging: opts.logging,
            logger: opts.logger,
        });
        this.client = client;
    }
    getDBID(owner, name) {
        return (0, dbid_1.generateDBID)(name, owner);
    }
    getSchema(dbid) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.client.Accounts.getSchema(dbid);
            return res;
        });
    }
    estimateCost(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.Tx.estimateCost(tx);
        });
    }
    getAccount(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            owner = owner.toLowerCase();
            return yield this.client.Accounts.getAccount(owner);
        });
    }
    getAction(dbid, actionName) {
        return __awaiter(this, void 0, void 0, function* () {
            const action = new action_1.Action(dbid, actionName, this.client);
            yield action.init();
            return action;
        });
    }
    newDatabase(json) {
        return new builder_1.DBBuilder(json, this.client);
    }
    broadcast(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (tx.tx.signature.signature_bytes === "" || tx.tx.sender === "") {
                throw new Error('Tx must be sgined before broadcasting.');
            }
            return yield this.client.Tx.broadcast(tx.tx);
        });
    }
    listDatabases(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            owner = owner.toLowerCase();
            return yield this.client.Accounts.listDatabases(owner);
        });
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.Tx.ping();
        });
    }
    getFunder(signer) {
        return __awaiter(this, void 0, void 0, function* () {
            const fundingConfig = yield this.client.Config.getFundingConfig();
            if (fundingConfig.status != 200 || !fundingConfig.data) {
                throw new Error('Failed to get funding config.');
            }
            const funder = new funding_1.Funder(signer, fundingConfig.data);
            yield funder.init();
            return funder;
        });
    }
    selectQuery(dbid, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = {
                dbid: dbid,
                query: query,
            };
            let res = yield this.client.Tx.selectQuery(q);
            const uint8 = new Uint8Array((0, base64_1.base64ToBytes)(res.data));
            const decoder = new TextDecoder('utf-8');
            const jsonString = decoder.decode(uint8);
            return {
                status: res.status,
                data: JSON.parse(jsonString),
            };
        });
    }
}
exports.Kwil = Kwil;
