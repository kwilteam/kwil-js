import { getMock, postMock } from "../api_client/api-utils";
import { Kwil } from "../../../src/client/kwil";
import { ActionBuilderImpl } from "../../../src/builders/action_builder";
import { DBBuilderImpl } from "../../../src/builders/db_builder";
import { Transaction } from "../../../src/core/tx";
import { Message } from "../../../src/core/message";
import { PayloadType } from "../../../src/core/enums";

class TestKwil extends Kwil {
    constructor() {
        super({kwilProvider: 'doesnt matter'});
    }
}

describe('Kwil', () => {
    let kwil: TestKwil;

    beforeEach(() => {
        kwil = new TestKwil();
        getMock.mockReset();
        postMock.mockReset();
    });

    describe('getDBID', () => {
        it('should return the dbid', () => {
            const address = '0xc89D42189f0450C2b2c3c61f58Ec5d628176A1E7';
            const dbid = kwil.getDBID(address, 'mydb');
            expect(dbid).toBe('xcdd04ff7c5e4a939d5365ec9b54cc4aab8c610c415f5f9b33323ae77');
        });
    })

    describe('getSchema', () => {
        it('should return a schema for a given dbid', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { dataset: 'mockDataset' }
            });
    
            const result = await kwil.getSchema('somedbid')
            expect(result.status).toBe(200);
            expect(result.data).toBe('mockDataset');
        })

        it('should not have to make a second request if searching for the same dbid', async() => {
            getMock.mockResolvedValue({
                status: 200,
                data: { dataset: 'mockDataset' }
            });
    
            await kwil.getSchema('somedbid');
            const res = await kwil.getSchema('somedbid');
            expect(getMock).toHaveBeenCalledTimes(1);
            expect(res.data).toBe('mockDataset');
        })
    })

    describe('getAccount', () => {
        it('should return account info for a given wallet address', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { account: 'mockAccount' }
            });

            const result = await kwil.getAccount('someaddress');
            expect(result.status).toBe(200);
            expect(result.data).toBe('mockAccount');
        })
    })

    describe('actionBuilder', () => {
        it('should return an action builder', () => {
            const actionBuilder = kwil.actionBuilder();
            expect(actionBuilder).toBeDefined();
            expect(actionBuilder).toBeInstanceOf(ActionBuilderImpl)
        })
    });

    describe('dbBuilder', () => {
        it('should return a db builder', () => {
            const dbBuilder = kwil.dbBuilder();
            expect(dbBuilder).toBeDefined();
            expect(dbBuilder).toBeInstanceOf(DBBuilderImpl)
        });
    })

    describe('dropDbBuilder', () => {
        it('should return a db builder', () => {
            const dbBuilder = kwil.dropDbBuilder();
            expect(dbBuilder).toBeDefined();
            expect(dbBuilder).toBeInstanceOf(DBBuilderImpl)
        })
    })

    describe('broadcast', () => {
        it('should broadcast a transaction', async () => {
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

            const result = await kwil.broadcast(tx);

            expect(result.status).toBe(200);
            expect(result.status).toBe(200);
            expect(result.data).toEqual({
                txHash: '0xdc3fc49be86a999606fd997bf897ec6a0d01d618c3feddd9ff8dad936c6bbbc79c9820f5e1d638399eaad75a373ee10f',
                fee: 'mockFee',
                body: []
            });
        })
    })

    describe('call', () => {
        it('should send a message to a kwil node (read only operation)', async () => {
            const msg = new Message({
                payload: "mockPayload",
                sender: "mockSender",
                signature: {
                    signature_bytes: "mockSignatureBytes",
                    signature_type: 1
                }
            })
            postMock.mockResolvedValue({
                status: 200,
                data: { result: 'W10=' }
            });
            const result = await kwil.call(msg);
            expect(result.status).toBe(200);
            expect(result.data).toEqual({
                result: []
            });
        })
    })

    describe('listDatabase', () => {
        it('should return a list of databases for a given wallet address', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { databases: ['db1', 'db2'] }
            });
            const result = await kwil.listDatabases('someaddress');
            expect(result.status).toBe(200);
            expect(result.data).toEqual(['db1', 'db2']);
        });
    })

    describe('ping', () => {
        it('should ping the kwil server', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { message: 'pong' }
            });
            const result = await kwil.ping();
            expect(result.status).toBe(200);
            expect(result.data).toEqual('pong');
        })
    })

    // TODO: need to add mocks for smart contract calls
    // describe('getFunder', () => {
    //     it('should return the funder for a given signer', async () => {
    //         const provider = new JsonRpcProvider(process.env.ETH_PROVIDER)
    //         const sig = Wallet.createRandom(provider)

    //         getMock.mockResolvedValueOnce({
    //             status: 200,
    //             data: { 
    //                 "chain_code": "2",
    //                 "provider_address": "0x37Fc1953e4A26007E6Df52f06B5897a998F51f5D",
    //                 "pool_address": "0xb0a194286A901FeAEA39D2b765247BEd64aD4F41"
    //             }
    //         });
    //         const result = await kwil.getFunder(sig);
    //         expect(result).toBeInstanceOf(Funder);
    //     })
    // })

    describe('selectQuery', () => {
        it('should return data for a select query', async () => {
            postMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    result: "W10="
                }
            })

            const query = await kwil.selectQuery('dbid', 'query');
            console.log(query)
            expect(query).toBeDefined();
            expect(query.status).toBe(200)
            expect(query.data).toEqual([])
        })
    })
});