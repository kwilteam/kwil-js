export interface AllowanceRes {
    get allowance_balance(): string;
}

export interface BalanceRes {
    get balance(): string;
}

export interface DepositRes {
    get deposited_balance(): string;
}

export interface TokenRes {
    get token_address(): string;
}