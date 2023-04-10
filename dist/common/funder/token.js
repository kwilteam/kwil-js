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
exports.Token = void 0;
const ethers_1 = require("ethers");
const override_1 = require("./override");
class Token {
    constructor(tokenAddress, abi, provider) {
        this.contract = new ethers_1.ethers.Contract(tokenAddress, abi, provider);
        this.provider = provider;
    }
    getName() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.name) {
                return this.name;
            }
            const name = yield this.contract.name();
            this.name = name;
            return name;
        });
    }
    getSymbol() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.symbol) {
                return this.symbol;
            }
            const symbol = yield this.contract.symbol();
            this.symbol = symbol;
            return symbol;
        });
    }
    getDecimals() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.decimals) {
                return this.decimals;
            }
            const decimals = yield this.contract.decimals();
            this.decimals = decimals;
            return decimals;
        });
    }
    getTotalSupply() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.totalSupply) {
                return this.totalSupply;
            }
            const totalSupply = yield this.contract.totalSupply();
            this.totalSupply = totalSupply;
            return totalSupply;
        });
    }
    getBalance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const balance = yield this.contract.balanceOf(address);
            return balance;
        });
    }
    getAllowance(owner, spender) {
        return __awaiter(this, void 0, void 0, function* () {
            const allowance = yield this.contract.allowance(owner, spender);
            return allowance;
        });
    }
    // createOverride is a function to calculate method gas costs
    createOverride(method, args) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, override_1.createOverride)(this.provider, this.contract, method, args);
        });
    }
    approve(spender, amount, override) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!override) {
                override = this.createOverride('approve', [spender, amount]);
            }
            return yield this.contract.approve(spender, amount, override);
        });
    }
}
exports.Token = Token;
