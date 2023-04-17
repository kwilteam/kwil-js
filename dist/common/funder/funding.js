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
exports.Funder = void 0;
const escrow_1 = require("./escrow");
const token_1 = require("./token");
const erc20_json_1 = __importDefault(require("./abi/erc20.json"));
const kwil_json_1 = __importDefault(require("./abi/kwil.json"));
class Funder {
    constructor(signer, config) {
        this.poolAddress = config.pool_address;
        this.signer = signer;
        this.providerAddress = config.provider_address;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.escrowContract = new escrow_1.Escrow(this.providerAddress, this.poolAddress, kwil_json_1.default, this.signer);
            let tokenAddress = yield this.escrowContract.getTokenAddress();
            this.erc20Contract = new token_1.Token(tokenAddress, erc20_json_1.default, this.signer);
        });
    }
    getAllowance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.erc20Contract) {
                throw new Error("Funder not initialized");
            }
            const res = yield this.erc20Contract.getAllowance(address, this.poolAddress);
            const num = BigInt(res);
            return {
                allowance_balance: num.toString(),
            };
        });
    }
    getBalance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.erc20Contract) {
                throw new Error("Funder not initialized");
            }
            const res = yield this.erc20Contract.getBalance(address);
            const num = BigInt(res);
            return {
                balance: num.toString(),
            };
        });
    }
    approve(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.erc20Contract) {
                throw new Error("Funder not initialized");
            }
            return yield this.erc20Contract.approve(this.poolAddress, amount);
        });
    }
    deposit(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.escrowContract) {
                throw new Error("Funder not initialized");
            }
            return yield this.escrowContract.deposit(amount);
        });
    }
    getDepositedBalance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.escrowContract) {
                throw new Error("Funder not initialized");
            }
            const res = yield this.escrowContract.getDepositedBalance(address);
            const num = BigInt(res);
            return {
                deposited_balance: num.toString(),
            };
        });
    }
    getTokenAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.escrowContract) {
                throw new Error("Funder not initialized");
            }
            const res = yield this.escrowContract.getTokenAddress();
            return {
                token_address: res,
            };
        });
    }
}
exports.Funder = Funder;
