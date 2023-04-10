/// <reference types="node" />
import { AxiosResponse, AxiosRequestConfig, AxiosInstance } from "axios";
import Config from "./config";
export declare class Api {
    readonly METHOD_GET = "GET";
    readonly METHOD_POST = "POST";
    private host;
    config: Config;
    constructor(host: string, opts: Config);
    private mergeDefaults;
    get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = any>(endpoint: string, body: Buffer | string | object, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    /**
     * Get an AxiosInstance with the base configuration setup to fire off
     * a request to the network.
     */
    request(): AxiosInstance;
}
