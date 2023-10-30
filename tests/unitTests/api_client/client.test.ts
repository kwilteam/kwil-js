import { getMock, postMock } from './api-utils';
import Client from "../../../src/api_client/client";
import { Txn } from "../../../src/core/tx";
import { BaseMessage } from '../../../src/core/message';
import { BytesEncodingStatus, PayloadType, SerializationType } from '../../../src/core/enums';
import { SignatureType } from '../../../src/core/signature';
import { bytesToHex, hexToBytes, stringToBytes } from '../../../dist/utils/serial';
import { base64ToBytes, bytesToBase64 } from '../../../src/utils/base64';
import { concatBytes } from '../../../src/utils/bytes';
import { encodeRlp } from 'ethers';
import { base64ToHex } from '../../../src/utils/serial';
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

    describe('getSchema', () => {
        it('should get schema if schema exists', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { schema: {
                    name: 'mockSchema',
                    owner: bytesToBase64(stringToBytes('mockOwner')),
                    tables: [],
                    actions: [],
                    extensions: []
                }}
            });
            const result = await client.getSchema('someDbId');
            expect(result.status).toBe(200);
            expect(result.data?.owner).toBeDefined();
            expect(result.data?.name).toBeDefined();
            expect(result.data?.tables).toBeDefined();
            expect(result.data?.actions).toBeDefined();
            expect(result.data?.extensions).toBeDefined();
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
                data: { account: {
                    public_key: 'bW9ja093bmVy',
                    nonce: '1',
                    balance: 'mockBalance'
                }}
            });
            const result = await client.getAccount(stringToBytes('someAddress'));
            expect(result.status).toBe(200);
            expect(result.data?.public_key).toBeDefined();
            expect(getMock).toHaveBeenCalledWith('/api/v1/accounts/c29tZUFkZHJlc3M=', undefined);
        });

        it('should throw error if account does not exist', async () => {
            const mockRes = {
                status: 400
            };

            getMock.mockResolvedValue(mockRes);

            await expect(client.getAccount(stringToBytes('someAddress'))).rejects.toThrow('An unknown error has occurred.  Please check your network connection.');
            expect(getMock).toHaveBeenCalledWith('/api/v1/accounts/c29tZUFkZHJlc3M=', undefined);
        });
    })

    describe('listDatabases', () => {
        it('should list databases if wallet exists', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { databases: ['mockDatabase1', 'mockDatabase2'] }
            });
            const result = await client.listDatabases(stringToBytes('someAddress'));
            expect(result.status).toBe(200);
            expect(result.data).toEqual(['mockDatabase1', 'mockDatabase2']);
            expect(getMock).toHaveBeenCalledWith('/api/v1/c29tZUFkZHJlc3M=/databases', undefined);
        });

        it('should throw error if databases do not exist', async () => {
            const mockRes = {
                status: 400,
                data: "No databases for wallet"
            };

            getMock.mockResolvedValue(mockRes);

            await expect(client.listDatabases(stringToBytes('someAddress'))).rejects.toThrow('No databases for wallet');
            expect(getMock).toHaveBeenCalledWith('/api/v1/c29tZUFkZHJlc3M=/databases', undefined);
        });
    });

    describe('estimateCost', () => {
        it('should estimate cost for a transaction', async () => {
            const tx = Txn.create<BytesEncodingStatus.BASE64_ENCODED>(() => {});
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
            const tx = Txn.create<BytesEncodingStatus.BASE64_ENCODED>(() => {});
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
            const tx = Txn.create<BytesEncodingStatus.BASE64_ENCODED>(() => {}); // Assuming this transaction is unsigned by default
            await expect(client.broadcast(tx)).rejects.toThrow('Tx must be signed before broadcasting.');
        });

        it('should broadcast a signed transaction', async () => {
            const tx = Txn.create<BytesEncodingStatus.BASE64_ENCODED>((tx) => {
                tx.signature.signature_bytes = 'mockSignatureBytes';
                tx.signature.signature_type = SignatureType.SECP256K1_PERSONAL;
                tx.body.payload = 'mockPayload';
                tx.body.payload_type = PayloadType.EXECUTE_ACTION;
                tx.body.fee = '0';
                tx.body.nonce = null;
                tx.body.chain_id = '';
                tx.body.description = '';
                tx.sender = 'mockSender';
                tx.serialization = SerializationType.SIGNED_MSG_CONCAT;
            });

            const hash = bytesToBase64(hexToBytes('mockTxHash'));

            postMock.mockResolvedValue({
                status: 200,
                data: { tx_hash: hash }
            });

            const result = await client.broadcast(tx);

            expect(result.status).toBe(200);
            expect(result.data).toEqual({
                tx_hash: base64ToHex(hash)
            });
            expect(postMock).toHaveBeenCalledWith('/api/v1/broadcast', { tx: tx.txData } , undefined);
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

    describe('chainInfo', () => {
        it('should return chain_id, height, and hash', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: {
                    chain_id: 'mockChainId',
                    height: '1',
                    hash: 'mockHash'
                }
            })

            const result = await client.chainInfo();
            expect(result.status).toBe(200);
            expect(result.data?.chain_id).toBeDefined();
            expect(result.data?.height).toBeDefined();
            expect(result.data?.hash).toBeDefined();
        })

        it('should throw error if chain info fails', async () => {
            const mockRes = {
                status: 400,
                data: "Error getting chain info"
            };

            getMock.mockResolvedValue(mockRes);

            await expect(client.chainInfo()).rejects.toThrow('Error getting chain info');
            expect(getMock).toHaveBeenCalledWith('/api/v1/chain_info', undefined);
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

    describe('txInfo', () => {
        it('should get tx info for a given tx hash', async() => {
            const txHash = 'mockTxHash';

            const rlpPayload = encodeRlp('0x' + bytesToHex(base64ToBytes('W10=')));
            const mockPayload = concatBytes(new Uint8Array([0, 1]), hexToBytes(rlpPayload))

            postMock.mockResolvedValue({
                status: 200,
                data: { 
                    hash: 'bW9ja0hhc2gNCg==',
                    height: 1, 
                    tx: {
                        body: {
                            payload: bytesToBase64(mockPayload),
                            payload_type: PayloadType.EXECUTE_ACTION,
                            fee: '1',
                            nonce: 1,
                            salt: bytesToBase64(new Uint8Array())
                        },
                        signature: {
                            signature_bytes: 'W10=',
                            signature_type: SignatureType.SECP256K1_PERSONAL
                        },
                        sender: 'bW9ja1NlbmRlcg=='
                    },
                    tx_result: 'mockTxResult'
                }
            });
            const result = await client.txInfo(txHash);
            expect(result.status).toBe(200);
            expect(result.data).toBeDefined();
            expect(result.data?.hash).toBeDefined();
            expect(result.data?.height).toBeDefined();
            expect(result.data?.tx).toBeDefined();
            expect(result.data?.tx_result).toBeDefined();
            expect(postMock).toHaveBeenCalledWith('/api/v1/tx_query', { tx_hash: 'AAwAAAA=' }, undefined);
        })

        it('should throw error if tx does not exist', async () => {
            const txHash = 'mockTxHash';
            const mockRes = {
                status: 400,
                data: "Error getting tx info"
            };

            postMock.mockResolvedValue(mockRes);

            await expect(client.txInfo(txHash)).rejects.toThrow('Error getting tx info');
            expect(postMock).toHaveBeenCalledWith('/api/v1/tx_query', { tx_hash: 'AAwAAAA=' }, undefined);
        })
    });

    describe('call', () => {
        it('should send a message to the call endpoint', async () => {
            const msg = new BaseMessage({
                body: {
                    payload: 'mockPayload',
                    description: ''
                },
                signature: null,
                sender: 'mocksender',
                serialization: SerializationType.SIGNED_MSG_CONCAT
            })
            postMock.mockResolvedValue({
                status: 200,
                data: { result: 'W10=' }
            });
            const result = await client.call(msg);
            expect(result.status).toBe(200);
            expect(result.data).toEqual({
                result: []
            });
            expect(postMock).toHaveBeenCalled();
        });

        it('should throw error if call fails', async () => {
            const msg = new BaseMessage({
                body: {
                    payload: 'mockPayload',
                    description: ''
                },
                signature: null,
                sender: 'mocksender',
                serialization: SerializationType.SIGNED_MSG_CONCAT
            })
            const mockRes = {
                status: 400,
                data: "Error calling"
            };

            postMock.mockResolvedValue(mockRes);

            await expect(client.call(msg)).rejects.toThrow('Error calling');
            expect(postMock).toHaveBeenCalled();
        });
    });
});