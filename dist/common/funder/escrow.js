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
exports.Escrow = void 0;
const ethers_1 = require("ethers");
const override_1 = require("./override");
class Escrow {
    constructor(validatorAddress, poolAddress, abi, provider) {
        this.contract = new ethers_1.ethers.Contract(poolAddress, abi, provider);
        this.provider = provider;
        this.validatorAddress = validatorAddress;
    }
    getTokenAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.tokenAddress) {
                return this.tokenAddress;
            }
            const addr = yield this.contract['escrowToken()']();
            this.tokenAddress = addr;
            return addr;
        });
    }
    getDepositedBalance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.contract['pools(address, address)'](this.validatorAddress, address);
        });
    }
    createOverride(method, args) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, override_1.createOverride)(this.provider, this.contract, method, args);
        });
    }
    deposit(amount, override) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!override) {
                override = this.createOverride('deposit', [this.validatorAddress, amount]);
            }
            return yield this.contract["deposit(address validator, uint256 amt)"](this.validatorAddress, amount, override);
        });
    }
}
exports.Escrow = Escrow;
