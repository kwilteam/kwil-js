
import { getMock, postMock } from './api-utils';
import Client from "../../../src/api_client/client";
import { PayloadType, Transaction } from "../../../src/core/tx";
require('dotenv').config();

describe('Client', () => {
    let client: Client;
    const mockConfig = {
        kwilProvider: 'https://shouldntmatter.com',
        timeout: 10000,
        apiKey: '',
        logging: false,
        logger: jest.fn(),
        network: ''
    };

    beforeEach(() => {
        client = new Client(mockConfig);
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    it('should get funding config', async () => {
        getMock.mockResolvedValue({ status: 200, data: 1 });

        const result = await client.getFundingConfig();
        expect(result.status).toBe(200);
        expect(result.data).toBe(1);

        expect(getMock).toHaveBeenCalledWith('/api/v1/config', undefined);
    });

    describe('getSchema', () => {
        it('should get schema if schema exists', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { dataset: 'mockDataset' }
            });
            const result = await client.getSchema('someDbId');
            expect(result.status).toBe(200);
            expect(result.data).toEqual('mockDataset');
            expect(getMock).toHaveBeenCalledWith('/api/v1/databases/someDbId/schema', undefined);
        });

        it('should throw error if schema does not exist', async () => {
            const mockRes = {
                status: 400
            };

            getMock.mockResolvedValue(mockRes);

            await expect(client.getSchema('someDbId')).rejects.toThrow('An unknown error has occurred.  Please check your network connection.');
            expect(getMock).toHaveBeenCalledWith('/api/v1/databases/someDbId/schema', undefined);
        });
    });

    describe('getAccount', () => {
        it('should get account if account exists', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { account: 'mockAccount' }
            });
            const result = await client.getAccount('someAddress');
            expect(result.status).toBe(200);
            expect(result.data).toEqual('mockAccount');
            expect(getMock).toHaveBeenCalledWith('/api/v1/accounts/someAddress', undefined);
        });

        it('should throw error if account does not exist', async () => {
            const mockRes = {
                status: 400
            };

            getMock.mockResolvedValue(mockRes);

            await expect(client.getAccount('someAddress')).rejects.toThrow('An unknown error has occurred.  Please check your network connection.');
            expect(getMock).toHaveBeenCalledWith('/api/v1/accounts/someAddress', undefined);
        });
    })

    describe('listDatabases', () => {
        it('should list databases if wallet exists', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { databases: ['mockDatabase1', 'mockDatabase2'] }
            });
            const result = await client.listDatabases("someAddress");
            expect(result.status).toBe(200);
            expect(result.data).toEqual(['mockDatabase1', 'mockDatabase2']);
            expect(getMock).toHaveBeenCalledWith('/api/v1/someAddress/databases', undefined);
        });

        it('should throw error if databases do not exist', async () => {
            const mockRes = {
                status: 400,
                data: "No databases for wallet"
            };

            getMock.mockResolvedValue(mockRes);

            await expect(client.listDatabases('someAddress')).rejects.toThrow('No databases for wallet');
            expect(getMock).toHaveBeenCalledWith('/api/v1/someAddress/databases', undefined);
        });
    });

    describe('estimateCost', () => {
        it('should estimate cost for a transaction', async () => {
            const tx = new Transaction();
            postMock.mockResolvedValue({
                status: 200,
                data: { price: 1 }
            });
            const result = await client.estimateCost(tx);
            expect(result.status).toBe(200);
            expect(result.data).toEqual(1);
            expect(postMock).toHaveBeenCalled();
        });

        it('should throw error if estimate cost fails', async () => {
            const tx = new Transaction();
            const mockRes = {
                status: 400,
                data: "Error estimating cost"
            };

            postMock.mockResolvedValue(mockRes);

            await expect(client.estimateCost(tx)).rejects.toThrow('Error estimating cost');
            expect(postMock).toHaveBeenCalled();
        });
    })

    describe('broadcast', () => {
        it('should throw an error when broadcasting an unsigned transaction', async () => {
            const tx = new Transaction(); // Assuming this transaction is unsigned by default
            await expect(client.broadcast(tx)).rejects.toThrow('Tx must be signed before broadcasting.');
        });

        it('should broadcast a signed transaction', async () => {
            const tx = new Transaction({
                hash: 'mockHash',
                payload_type: PayloadType.EXECUTE_ACTION,
                payload: 'mockPayload',
                fee: 'mockFee',
                nonce: 1,
                sender: 'mockSender',
                signature: {
                    signature_bytes: 'mockSignatureBytes',
                    signature_type: 1
                }
            })

            postMock.mockResolvedValue({
                status: 200,
                data: { receipt: { txHash: '3D/Em+hqmZYG/Zl7+Jfsag0B1hjD/t3Z/42tk2xru8ecmCD14dY4OZ6q11o3PuEP', fee: 'mockFee', body: 'W10=' } }
            });

            const result = await client.broadcast(tx);

            expect(result.status).toBe(200);
            expect(result.data).toEqual({
                txHash: '0xdc3fc49be86a999606fd997bf897ec6a0d01d618c3feddd9ff8dad936c6bbbc79c9820f5e1d638399eaad75a373ee10f',
                fee: 'mockFee',
                body: []
            });
            expect(postMock).toHaveBeenCalledWith('/api/v1/broadcast', { tx }, undefined);
        });
    });

    describe('ping', () => {
        it('should ping', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { message: 'pong' }
            });
            const result = await client.ping();
            expect(result.status).toBe(200);
            expect(result.data).toEqual('pong');
            expect(getMock).toHaveBeenCalledWith('/api/v1/ping', undefined);
        });

        it('should throw error if ping fails', async () => {
            const mockRes = {
                status: 400,
                data: "Error pinging"
            };

            getMock.mockResolvedValue(mockRes);

            await expect(client.ping()).rejects.toThrow('Error pinging');
            expect(getMock).toHaveBeenCalledWith('/api/v1/ping', undefined);
        });
    });

    describe('selectQuery', () => {
        it('should select query', async () => {
            const query = {
                dbid: 'mockDatabase',
                query: 'mockQuery'
            }
            postMock.mockResolvedValue({
                status: 200,
                data: { result: 'mockResult' }
            });
            const result = await client.selectQuery(query);
            expect(result.status).toBe(200);
            expect(result.data).toEqual('mockResult');
            expect(postMock).toHaveBeenCalledWith('/api/v1/query', query, undefined);
        });

        it('should throw error if select query fails', async () => {
            const query = {
                dbid: 'mockDatabase',
                query: 'mockQuery'
            }
            const mockRes = {
                status: 400,
                data: "Error selecting query"
            };

            postMock.mockResolvedValue(mockRes);

            await expect(client.selectQuery(query)).rejects.toThrow('Error selecting query');
            expect(postMock).toHaveBeenCalledWith('/api/v1/query', query, undefined);
        });
    });
});