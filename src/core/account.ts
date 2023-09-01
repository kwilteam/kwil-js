export interface Account {
    get public_key(): string;
    get balance(): string;
    get nonce(): string;
}