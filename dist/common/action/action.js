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
exports.Action = void 0;
const tx_1 = require("../interfaces/tx");
const anyMap_1 = require("../../utils/anyMap");
const base64_1 = require("../../utils/base64");
const enums_1 = require("../interfaces/enums");
const marshal_1 = require("../marshal");
const transaction_1 = require("../transactions/transaction");
class Action {
    constructor(dbid, name, client) {
        this.dbid = dbid;
        this.name = name;
        this.client = client;
    }
    //init to get the action inputs
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const schema = yield this.client.Accounts.getSchema(this.dbid);
            if (!schema.data || !schema.data.actions) {
                throw new Error(`Could not retrieve actions for database ${this.dbid}. Please double check that you have the correct DBID.`);
            }
            for (const action of schema.data.actions) {
                if (action.name == this.name) {
                    this.inputs = action.inputs;
                    return;
                }
            }
            if (!this.inputs) {
                throw new Error(`Could not find action ${this.name} in database ${this.dbid}. Please double check that you have the correct DBID and action name.`);
            }
        });
    }
    newInstance() {
        var _a;
        const action = new anyMap_1.AnyMap();
        this.actions = [...((_a = this.actions) !== null && _a !== void 0 ? _a : []), action];
        return action;
    }
    bulk(bulkActions) {
        for (const action of bulkActions) {
            const newAction = this.newInstance();
            for (const key in action) {
                newAction.set(key, action[key]);
            }
        }
    }
    isComplete() {
        if (!this.actions) {
            throw new Error("No actions have been created. Please call newAction() before calling isComplete().");
        }
        for (const action of this.actions) {
            if (!this.inputs) {
                throw new Error("Action inputs have not been initialized. Please call init() before calling isComplete().");
            }
            for (const input of this.inputs) {
                if (!action.get(input)) {
                    return false;
                }
            }
        }
        return true;
    }
    prepareAction(signer) {
        return __awaiter(this, void 0, void 0, function* () {
            //serialize action values
            if (!this.actions && this.inputs) {
                throw new Error("No action inputs have been set. Please call newAction() or bulkAction() before calling prepareTx().");
            }
            let actions = [];
            if (this.actions) {
                for (const action of this.actions) {
                    const inputs = action.map;
                    for (const val in inputs) {
                        const dataType = (0, enums_1.inputToDataType)(inputs[val]);
                        const encodedValue = (0, base64_1.bytesToBase64)((0, marshal_1.marshal)(inputs[val], dataType));
                        inputs[val] = encodedValue;
                    }
                }
                actions = this.actions.map((action) => {
                    return action.map;
                });
            }
            const payload = {
                "action": this.name,
                "dbid": this.dbid,
                "params": actions
            };
            //create transaction
            const readyTx = {
                toObject: () => payload,
                payloadType: tx_1.PayloadType.EXECUTE_ACTION
            };
            const tx = new transaction_1.Transaction(readyTx);
            //sign transaction
            tx.tx.sender = (yield signer.getAddress()).toLowerCase();
            const acct = yield this.client.Accounts.getAccount(tx.tx.sender);
            if (acct.status != 200 || !acct.data) {
                throw new Error(`Could not retrieve account ${tx.tx.sender}. Please double check that you have the correct account address.`);
            }
            const cost = yield this.client.Tx.estimateCost(tx.tx);
            if (cost.status != 200 || !cost.data) {
                throw new Error(`Could not retrieve estimated cost for transaction. Please try again later.`);
            }
            tx.tx.fee = cost.data;
            tx.tx.nonce = Number(acct.data.nonce) + 1;
            tx.generateHash();
            yield tx.sign(signer);
            return tx;
        });
    }
}
exports.Action = Action;
