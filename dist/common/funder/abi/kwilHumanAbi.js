"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kwilHumanAbi = [
    'constructor(address _escrowToken)',
    'event Deposit(address caller, address indexed target, uint256 amount)',
    'event Withdrawal(address receiver, address indexed caller, uint256 amount, uint256 fee, string nonce)',
    'function balance(address wallet, address validator) view returns (uint256)',
    'function deposit(address validator, uint256 amt) payable',
    'function escrowToken() view returns (address)',
    'function pools(address, address) view returns (uint256)',
    'function returnDeposit(address recipient, uint256 amt, uint256 fee, string nonce)'
];
exports.default = kwilHumanAbi;
