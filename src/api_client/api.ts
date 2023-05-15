import Axios, { AxiosResponse, AxiosRequestConfig, AxiosInstance } from "axios";
import {Config} from "./config";
/*
    Based off https://github.com/ArweaveTeam/arweave-js/blob/189beeba86eb58605be42cfe9d9bd53e35e3ea11/src/common/lib/api.ts#L3
    Since the Arweave SDK has a great typescript API, I've based this off of that.

    Copyright 2020 The Arweave Team Copyright 2020 Minimum Spanning Technologies Limited
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

export abstract class Api {
    //private readonly METHOD_GET = 'GET';
    //private readonly METHOD_POST = 'POST';
    private readonly host: string;

    public config!: Config;
    protected constructor(host: string, opts: Config) {
        this.config = this.mergeDefaults(opts);
        this.host = host;
    }

    private mergeDefaults(opts: Config): Config {
        return {
            kwilProvider: opts.kwilProvider || 'https://provider.kwil.com', // these aren't actually used here but are required by the interface
            timeout: opts.timeout || 10000,
            apiKey: opts.apiKey || '',
            logging: opts.logging || false,
            logger: opts.logger || console.log,
            network: opts.network
        };
    }

    protected async get<T = any>(
        endpoint: string,
        config?: AxiosRequestConfig
      ): Promise<AxiosResponse<T>> {
        try {
          return await this.request().get<T>(endpoint, config);
        } catch (error: any) {
          if (error.response && error.response.status) {
            return error.response;
          }
    
          throw error;
        }
      }

    protected async post<T = any>(
        endpoint: string,
        body: Buffer | string | object,
        config?: AxiosRequestConfig
      ): Promise<AxiosResponse<T>> {
        try {
          return await this.request().post(endpoint, body, config);
        } catch (error: any) {
          if (error.response && error.response.status) {
            return error.response;
          }
    
          throw error;
        }
      }
    
      /**
       * Get an AxiosInstance with the base configuration setup to fire off
       * a request to the network.
       */
      protected request(): AxiosInstance {
        const headers: any = {
          "X-Api-Key": this.config.apiKey
        };
        if (this.config.network) {
          headers["x-network"] = this.config.network;
        }
        let instance = Axios.create({
          baseURL: this.host,
          timeout: this.config.timeout,
          maxContentLength: 1024 * 1024 * 512,
          headers,
        });
    
        if (this.config.logging) {
          instance.interceptors.request.use((request) => {
            this.config.logger!(`Requesting: ${request.baseURL}${request.url}`);
            return request;
          });
    
          instance.interceptors.response.use((response) => {
            this.config.logger!(
              `Response:   ${response.config.url} - ${response.status}`
            );
            return response;
          });
        }
        return instance;
      }
}