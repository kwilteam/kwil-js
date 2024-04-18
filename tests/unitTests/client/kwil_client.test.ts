import { getMock, postMock } from "../api_client/api-utils";
import { Msg } from "../../../src/core/message";
import { stringToBytes, stringToHex } from "../../../src/utils/serial";
import { bytesToBase64 } from "../../../src/utils/base64";
import { Wallet } from "ethers";
import { KwilSigner } from "../../../src";
import { ActionBody, ActionInput } from "../../../src/core/action";
import { DeployBody } from "../../../src/core/database";
import compiledKF from '../../test_schema2.json'
import { DropBody } from "../../../src/core/database";
import { NodeKwil } from "../../../src";

class TestKwil extends NodeKwil {
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

    const address = '0xAfFDC06cF34aFD7D5801A13d48C92AD39609901D'

    describe('getDBID', () => {
        it('should return the dbid', () => {
            const dbid = kwil.getDBID(address, 'mydb');
            expect(dbid).toBe('x52197631a5de74a1e293681181c2a63418d7ae710a3f0370d91a99bd');
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
                identifier: bytesToBase64(stringToBytes(address)),
                balance: 'mockBalance',
                nonce: 'mockNonce'
            }

            getMock.mockResolvedValue({
                status: 200,
                data: { account: mockAccount }
            });

            const result = await kwil.getAccount(address);
            expect(result.status).toBe(200);
            expect(result.data?.identifier).toBeInstanceOf(Uint8Array);
            expect(result.data?.balance).toBe(mockAccount.balance);
            expect(result.data?.nonce).toBe(mockAccount.nonce);
        })
    })

    describe('DB Operations: .execute(), .call(), .deploy(), .drop()', () => {
        let kSigner: KwilSigner;

        beforeAll(async () => {
            const wallet = Wallet.createRandom();
            kSigner = new KwilSigner(wallet, wallet.address);
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
                        identifier: bytesToBase64(stringToBytes(address)),
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
                        identifier: bytesToBase64(stringToBytes(address)),
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
                        msg.sender = 'mocksender';
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
                        identifier: bytesToBase64(stringToBytes(address)),
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
                        identifier: bytesToBase64(stringToBytes(address)),
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
                data: { databases: [
                    {
                        name: 'db1',
                        owner: bytesToBase64(stringToBytes(address)),
                        dbid: 'dbid1'
                    },
                    {
                        name: 'db2',
                        owner: bytesToBase64(stringToBytes(address)),
                        dbid: 'dbid2'
                    }
                ] }
            });
            const result = await kwil.listDatabases(address);
            expect(result.status).toBe(200);
            expect(result.data).toEqual([
                {
                    name: 'db1',
                    owner: expect.any(Uint8Array),
                    dbid: 'dbid1'
                },
                {
                    name: 'db2',
                    owner: expect.any(Uint8Array),
                    dbid: 'dbid2'
                }
            ]);
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
        const consoleSpy = jest.spyOn(console, 'warn');

        afterEach(() => {
            consoleSpy.mockRestore();
        })
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

        it('should not log a warning if disableWarning is true', async () => {
            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    chain_id: 'different chain id',
                    height: '1',
                    hash: 'doesnt matter',
                }
            });

            const result = await kwil.chainInfo({ disableWarning: true });
            expect(result.status).toBe(200);
            expect(result.data?.chain_id).toBe('different chain id');
            expect(result.data?.height).toBe('1');
            expect(result.data?.hash).toBe('doesnt matter');
            expect(consoleSpy).not.toHaveBeenCalled()
        })
    })
});