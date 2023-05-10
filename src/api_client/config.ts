// config for api
export interface Config {
    kwilProvider: string;
    timeout?: number;
    apiKey?: string;
    logging?: boolean;
    logger?: Function;
    network?: string;
}