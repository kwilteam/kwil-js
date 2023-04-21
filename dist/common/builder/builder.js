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
exports.DBBuilder = void 0;
const tx_1 = require("../interfaces/tx");
const transaction_1 = require("../transactions/transaction");
class DBBuilder {
    constructor(json, client) {
        this.json = json;
        this.client = client;
    }
    prepareJson(signer) {
        return __awaiter(this, void 0, void 0, function* () {
            const readyTx = {
                toObject: () => this.json,
                payloadType: tx_1.PayloadType.DEPLOY_DATABASE
            };
            const tx = new transaction_1.Transaction(readyTx);
            //sign tx
            tx.tx.sender = (yield signer.getAddress()).toLowerCase();
            const acct = yield this.client.Accounts.getAccount(tx.tx.sender);
            if (acct.status !== 200 || !acct.data) {
                throw new Error(`Could not retrieve account ${tx.tx.sender}. Please double check that you have the correct account address.`);
            }
            const cost = yield this.client.Tx.estimateCost(tx.tx);
            if (cost.status !== 200 || !cost.data) {
                throw new Error(`Could not retrieve cost for transaction. Please double check that you have the correct account address.`);
            }
            tx.tx.fee = cost.data;
            tx.tx.nonce = Number(acct.data.nonce) + 1;
            tx.generateHash();
            yield tx.sign(signer);
            return tx;
        });
    }
}
exports.DBBuilder = DBBuilder;
