export interface FundingConfig {
    get chain_code(): number;
    get provider_address(): string;
    get pool_address(): string;
}