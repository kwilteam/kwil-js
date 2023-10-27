import { getMock, postMock } from "../api_client/api-utils";
import { Kwil } from "../../../src/client/kwil";
import { ActionBuilderImpl } from "../../../src/builders/action_builder";
import { DBBuilderImpl } from "../../../src/builders/db_builder";
import { Transaction } from "../../../src/core/tx";
import { Message, Msg } from "../../../src/core/message";
import { BytesEncodingStatus, PayloadType, SerializationType } from "../../../src/core/enums";
import { SignatureType } from "../../../src/core/signature";
import { bytesToString, stringToBytes, stringToHex } from "../../../src/utils/serial";
import { base64ToBytes, bytesToBase64 } from "../../../src/utils/base64";
import { Wallet } from "ethers";
import { recoverSecp256k1PubKey } from "../../../src/utils/keys";
import { KwilSigner } from "../../../src";
import { ActionBody, ActionInput } from "../../../src/core/action";
import { DeployBody } from "../../../src/core/database";
import compiledKF from '../../test_schema2.json'
import { DropBody } from "../../../src/core/database";
import { BaseTransaction, Txn } from "../../../src/core/tx";
import { BaseMessage } from "../../../dist/core/message";

class TestKwil extends Kwil {
    constructor() {
        super({kwilProvider: 'doesnt matter', chainId: 'doesnt matter'});
    }
}

describe('Kwil', () => {
    let kwil: TestKwil;

    beforeEach(() => {
        kwil = new TestKwil();
        getMock.mockReset();
        postMock.mockReset();
    });

    const pubKey = '0x048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75';

    describe('getDBID', () => {
        it('should return the dbid', () => {
            const dbid = kwil.getDBID(pubKey, 'mydb');
            expect(dbid).toBe('xd924382720df474c6bb62d26da9aeb10add2ad2835c0b7e4a6336ad8');
        });
    })

    describe('getSchema', () => {
        const mockSchema = {
            name: 'mockSchema',
            owner: bytesToBase64(stringToBytes('mockOwner')),
            tables: [],
            actions: [],
            extensions: []
        }

        it('should return a schema for a given dbid', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { schema: mockSchema }
            });
    
            const result = await kwil.getSchema('somedbid')
            expect(result.status).toBe(200);
            expect(result.data?.name).toBe(mockSchema.name);
            expect(result.data?.owner).toBeInstanceOf(Uint8Array);
        })

        it('should not have to make a second request if searching for the same dbid', async() => {
            getMock.mockResolvedValue({
                status: 200,
                data: { schema: mockSchema }
            });
    
            await kwil.getSchema('somedbid');
            const result = await kwil.getSchema('somedbid');
            expect(getMock).toHaveBeenCalledTimes(1);
            expect(result.data?.name).toBe(mockSchema.name);
            expect(result.data?.owner).toBeInstanceOf(Uint8Array);
        })
    })

    describe('getAccount', () => {
        it('should return account info for a given wallet address', async () => {
            const mockAccount = {
                public_key: bytesToBase64(stringToBytes(pubKey)),
                balance: 'mockBalance',
                nonce: 'mockNonce'
            }

            getMock.mockResolvedValue({
                status: 200,
                data: { account: mockAccount }
            });

            const result = await kwil.getAccount(pubKey);
            expect(result.status).toBe(200);
            expect(result.data?.public_key).toBeInstanceOf(Uint8Array);
            expect(result.data?.balance).toBe(mockAccount.balance);
            expect(result.data?.nonce).toBe(mockAccount.nonce);
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
            const tx = Txn.create<BytesEncodingStatus.BASE64_ENCODED>(tx => {
                tx.signature.signature_bytes = bytesToBase64(stringToBytes('mockSignatureBytes'));
                tx.signature.signature_type = SignatureType.SECP256K1_PERSONAL;
                tx.body.payload = 'mockPayload';
                tx.body.payload_type = PayloadType.EXECUTE_ACTION;
                tx.body.fee = '0';
                tx.body.nonce = 1;
                tx.body.chain_id = 'test id';
                tx.sender = 'mockSender';
                tx.body.description = '';
                tx.sender = bytesToBase64(stringToBytes('mockSender'));
                tx.serialization = SerializationType.SIGNED_MSG_CONCAT;
            })

            postMock.mockResolvedValue({
                status: 200,
                data: { tx_hash: bytesToBase64(stringToBytes('some_hash')) }
            });

            const result = await kwil.broadcast(tx);

            expect(result.status).toBe(200);
            expect(result.status).toBe(200);
            expect(result.data).toEqual({
                tx_hash: stringToHex('some_hash')
            });
        })
    })

    describe('DB Operations: .execute(), .call(), .deploy(), .drop()', () => {
        let kSigner: KwilSigner;

        beforeAll(async () => {
            const wallet = Wallet.createRandom();
            const pubKey = await recoverSecp256k1PubKey(wallet);
            kSigner = new KwilSigner(wallet, pubKey);
        })

        describe('execute', () => {
            describe ('success cases', () => {
                let skipBefore: boolean = false

                beforeEach(() => {
                    if(skipBefore) {
                        return;
                    }
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            schema: {
                                name: 'testName',
                                owner: bytesToBase64(stringToBytes('mockOwner')),
                                tables: "someTables",
                                actions: [{
                                    name: 'mockaction',
                                    public: true,
                                    mutability: 'update',
                                    auxiliaries: [],
                                    inputs: ['$mockInput'],
                                    statements: ['test']
                                }]
                            }
                        }
                    });
    
                    const mockAccount = {
                        public_key: bytesToBase64(stringToBytes(pubKey)),
                        balance: 'mockBalance',
                        nonce: 'mockNonce'
                    }
        
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            account: mockAccount
                        }
                    })
    
                    postMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            price: "0"
                        }
                    });
    
                    postMock.mockResolvedValue({
                        status: 200,
                        data: { tx_hash: bytesToBase64(stringToBytes('some_hash')) }
                    });
                })
    
                it('should execute a transaction when inputs are provided as an array of objects', async () => {
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'mockAction',
                        inputs: [{ "$mockInput": "mockInput" }],
                        description: 'Sign me!'
                    }
    
                    const res = await kwil.execute(inputs, kSigner);
    
                    expect(res.status).toBe(200);
                    expect(res.data?.tx_hash).toBe(stringToHex('some_hash'));
                })
    
                it('should execute a transaction when inputs are provided as ActionInputs', async () => {
                    const actionInput = new ActionInput()
                        .put('$mockInput', 'mockInput');
                    
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'mockAction',
                        inputs: [ actionInput ],
                        description: 'Sign me!'
                    }
    
                    const res = await kwil.execute(inputs, kSigner);
    
                    expect(res.status).toBe(200);
                    expect(res.data?.tx_hash).toBe(stringToHex('some_hash'));
                    skipBefore = true;
                })

                it('should succeed if the action has no inputs and no inputs are provided', async() => {
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            schema: {
                                name: 'testName',
                                owner: bytesToBase64(stringToBytes('mockOwner')),
                                tables: "someTables",
                                actions: [{
                                    name: 'mockaction',
                                    public: true,
                                    mutability: 'update',
                                    auxiliaries: [],
                                    inputs: [],
                                    statements: ['test']
                                }]
                            }
                        }
                    });
    
                    const mockAccount = {
                        public_key: bytesToBase64(stringToBytes(pubKey)),
                        balance: 'mockBalance',
                        nonce: 'mockNonce'
                    }
        
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            account: mockAccount
                        }
                    })
    
                    postMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            price: "0"
                        }
                    });
    
                    postMock.mockResolvedValue({
                        status: 200,
                        data: { tx_hash: bytesToBase64(stringToBytes('some_hash')) }
                    });

                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'mockAction'
                    }

                    const res = await kwil.execute(inputs, kSigner);

                    expect(res.status).toBe(200);
                    expect(res.data?.tx_hash).toBe(stringToHex('some_hash'));
                    
                    skipBefore = false;
                });
            });

            describe('failure cases', () => {
                beforeEach(() => {
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            schema: {
                                name: 'testName',
                                owner: bytesToBase64(stringToBytes('mockOwner')),
                                tables: "someTables",
                                actions: [{
                                    name: 'mockaction',
                                    public: true,
                                    mutability: 'view',
                                    auxiliaries: [],
                                    inputs: ['$mockInput'],
                                    statements: ['test']
                                }]
                            }
                        }
                    });
                })

                it('should through an error if the dbid is not a update mutability', async () => {
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'mockAction',
                        inputs: [{ "$mockInput": "mockInput" }],
                        description: 'Sign me!'
                    }
    
                    await expect(kwil.execute(inputs, kSigner)).rejects.toThrowError(`Action mockaction is a 'view' action. Please use kwil.call().`);
                })

                it('should throw an error if the action name is not present in the schema', async () => {
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'should_not_exist',
                        inputs: [{ "$mockInput": "mockInput" }],
                        description: 'Sign me!'
                    }
    
                    await expect(kwil.execute(inputs, kSigner)).rejects.toThrowError(`Could not find action should_not_exist in database mockDbid. Please double check that you have the correct DBID and action name.`);
                })
            });
        })

        describe('call', () => {
            describe('with the output of actionBuilder()', () => {
                it('should send a message to a kwil node (read only operation)', async () => {
                    const msg = Msg.create(msg => {
                        msg.body.payload = bytesToBase64(stringToBytes('mockPayload'));
                        msg.body.description = '';
                        msg.sender = 'mocksender';
                        msg.serialization = SerializationType.SIGNED_MSG_CONCAT;
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
    
            describe('success cases', () => {
                let skipBefore: boolean = false
    
                beforeEach(() => {
                    if(skipBefore) {
                        return;
                    }
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            schema: {
                                name: 'testName',
                                owner: bytesToBase64(stringToBytes('mockOwner')),
                                tables: "someTables",
                                actions: [{
                                    name: 'mockaction',
                                    public: true,
                                    mutability: 'view',
                                    auxiliaries: [],
                                    inputs: ['$mockInput'],
                                    statements: ['test']
                                }]
                            }
                        }
                    });
    
                    postMock.mockResolvedValue({
                        status: 200,
                        data: { result: 'W10=' }
                    });
                });
    
                it('should return call data when inputs are provided as an array of objects', async () => {
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'mockAction',
                        inputs: [{ "$mockInput": "mockInput" }],
                        description: 'Sign me!'
                    }
    
                    const res = await kwil.call(inputs);
    
                    expect(res.status).toBe(200);
                    expect(res.data?.result).toEqual([]);
                })
    
                it('should return call data when inputs are provided as ActionInputs', async () => {
                    const actionInput = new ActionInput()
                        .put('$mockInput', 'mockInput');
                    
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'mockAction',
                        inputs: [ actionInput ],
                        description: 'Sign me!'
                    }
    
                    const res = await kwil.call(inputs);
    
                    expect(res.status).toBe(200);
                    expect(res.data?.result).toEqual([]);
    
                    skipBefore = true;
                });
    
                it('should succeed if the action has no inputs and no inputs are provided', async() => {
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            schema: {
                                name: 'testName',
                                owner: bytesToBase64(stringToBytes('mockOwner')),
                                tables: "someTables",
                                actions: [{
                                    name: 'mockaction',
                                    public: true,
                                    mutability: 'view',
                                    auxiliaries: [],
                                    inputs: [],
                                    statements: ['test']
                                }]
                            }
                        }
                    });
    
                    postMock.mockResolvedValue({
                        status: 200,
                        data: { result: 'W10=' }
                    });
    
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'mockAction'
                    }
    
                    const res = await kwil.call(inputs);
    
                    expect(res.status).toBe(200);
                    expect(res.data?.result).toEqual([]);
                    
                    skipBefore = false;
                });
            })
    
            describe('failure cases', () => { 
                beforeEach(() => {
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            schema: {
                                name: 'testName',
                                owner: bytesToBase64(stringToBytes('mockOwner')),
                                tables: "someTables",
                                actions: [{
                                    name: 'mockaction',
                                    public: true,
                                    mutability: 'update',
                                    auxiliaries: [],
                                    inputs: ['$mockInput'],
                                    statements: ['test']
                                }]
                            }
                        }
                    });
                });
    
                it('should through an error if the dbid is not a view mutability', async () => {
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'mockAction',
                        inputs: [{ "$mockInput": "mockInput" }],
                        description: 'Sign me!'
                    }
    
                    await expect(kwil.call(inputs)).rejects.toThrowError(`Action mockaction is not a view only action. Please use kwil.execute().`);
                });
    
                it('should throw an error if the action name is not present in the schema', async () => {
                    const inputs: ActionBody = {
                        dbid: 'mockDbid',
                        action: 'should_not_exist',
                        inputs: [{ "$mockInput": "mockInput" }],
                        description: 'Sign me!'
                    }
    
                    await expect(kwil.call(inputs)).rejects.toThrowError(`Could not find action should_not_exist in database mockDbid. Please double check that you have the correct DBID and action name.`);
                });
             });
        })

        describe('deploy', () => {
            describe('success cases', () => {
                beforeEach(() => {
                    const mockAccount = {
                        public_key: bytesToBase64(stringToBytes(pubKey)),
                        balance: 'mockBalance',
                        nonce: 'mockNonce'
                    }
        
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            account: mockAccount
                        }
                    })
    
                    postMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            price: "0"
                        }
                    });

                    postMock.mockResolvedValue({
                        status: 200,
                        data: { tx_hash: bytesToBase64(stringToBytes('some_hash')) }
                    });
                })

                it('should deploy a database', async () => {
                    const payload: DeployBody = {
                        schema: compiledKF,
                        description: 'Sign me!'
                    }

                    const res = await kwil.deploy(payload, kSigner);

                    expect(res.status).toBe(200);
                    expect(res.data?.tx_hash).toBe(stringToHex('some_hash'));
                });
            })
        })

        describe('drop', () => {
            describe('success cases', () => {
                beforeEach(() => {
                    const mockAccount = {
                        public_key: bytesToBase64(stringToBytes(pubKey)),
                        balance: 'mockBalance',
                        nonce: 'mockNonce'
                    }
        
                    getMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            account: mockAccount
                        }
                    })
    
                    postMock.mockResolvedValueOnce({
                        status: 200,
                        data: {
                            price: "0"
                        }
                    });

                    postMock.mockResolvedValue({
                        status: 200,
                        data: { tx_hash: bytesToBase64(stringToBytes('some_hash')) }
                    });
                })

                it('should drop a database', async () => {
                    const payload: DropBody = {
                        dbid: 'yo',
                        description: 'Sign me!'
                    }

                    const res = await kwil.drop(payload, kSigner);

                    expect(res.status).toBe(200);
                    expect(res.data?.tx_hash).toBe(stringToHex('some_hash'));
                });
            })
        })
    })

    describe('listDatabase', () => {
        it('should return a list of databases for a given wallet address', async () => {
            getMock.mockResolvedValue({
                status: 200,
                data: { databases: ['db1', 'db2'] }
            });
            const result = await kwil.listDatabases(pubKey);
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

    describe('chainInfo', () => {
        it('should return chain info', async () => {
            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    chain_id: 'doesnt matter',
                    height: '1',
                    hash: 'doesnt matter',
                }
            });

            const result = await kwil.chainInfo();
            expect(result.status).toBe(200);
            expect(result.data?.chain_id).toBe('doesnt matter');
            expect(result.data?.height).toBe('1');
            expect(result.data?.hash).toBe('doesnt matter');
        });

        it('should log a warning if the chain id is not the same as the one provided in the constructor', async () => {
            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    chain_id: 'different chain id',
                    height: '1',
                    hash: 'doesnt matter',
                }
            });

            const consoleSpy = jest.spyOn(console, 'warn');

            const result = await kwil.chainInfo();
            expect(result.status).toBe(200);
            expect(result.data?.chain_id).toBe('different chain id');
            expect(result.data?.height).toBe('1');
            expect(result.data?.hash).toBe('doesnt matter');
            expect(consoleSpy).toHaveBeenCalled()
        });
    })
});