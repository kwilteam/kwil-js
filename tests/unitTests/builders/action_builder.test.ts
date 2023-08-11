import { getMock, postMock } from '../api_client/api-utils';
import { ActionBuilderImpl } from '../../../src/builders/action_builder';
import { ActionBuilder } from '../../../src/core/builders';
import { Kwil } from '../../../src/client/kwil';
import { Wallet } from 'ethers';
import { ActionInput } from '../../../src/core/actionInput';
import { Transaction } from '../../../src/core/tx';
import { Message } from '../../../src/core/message';

class TestKwil extends Kwil {
    public constructor() {
        super({ kwilProvider: 'doesnt matter' });
    }
}

describe('ActionBuilder', () => {
    let actionBuilder: ActionBuilder;
    let mockKwil = new TestKwil();

    beforeEach(() => {
        actionBuilder = ActionBuilderImpl.of(mockKwil);
        getMock.mockReset();
        postMock.mockReset();
        getMock.mockClear();
        jest.clearAllMocks();
    });

    describe('of', () => {
        it('should return an ActionBuilderImpl', () => {
            const result = ActionBuilderImpl.of(mockKwil);
            expect(result).toBeInstanceOf(ActionBuilderImpl);
        });
    })

    describe('name', () => {
        it('should set the _name field and return actionBuilder', () => {
            const result = actionBuilder.name('testName');
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._name).toBe('testname');
        });
    })

    describe('dbid', () => {
        it('should set the _dbid field and return actionBuilder', () => {
            const result = actionBuilder.dbid('testDbid');
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._dbid).toBe('testDbid');
        });
    });

    describe('signer', () => {
        it('should set the _signer field and return actionBuilder', () => {
            const sig = Wallet.createRandom()
            const result = actionBuilder.signer(sig);
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._signer).toBeDefined();
            expect((actionBuilder as any)._signer).toBe(sig);
        });
    });

    describe('concat', () => {
        it('should take one ActionInput and add it to the _actions field', () => {
            const actionInput: ActionInput = new ActionInput()
                .put('test', 'test')
            ;
            const result = actionBuilder.concat(actionInput);
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._actions).toEqual([actionInput]);
        });

        it('should take an array of ActionInputs and add them to the _actions field', () => {
            const actionInput1: ActionInput = new ActionInput()
                .put('test', 'test')
            ;
            const actionInput2: ActionInput = new ActionInput()
                .put('test', 'test')
            ;
            const result = actionBuilder.concat([actionInput1, actionInput2]);
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._actions).toEqual([actionInput1, actionInput2]);
        });
    });

    describe('buildTx', () => {
        it('should build a transaction', async () => {
            const actionInput: ActionInput = new ActionInput()
                .put('test', 'test')

            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    dataset: {
                        name: 'testName',
                        dbid: 'testDbid',
                        tables: "someTables",
                        actions: [{
                            name: 'testactionname',
                            public: true,
                            mutability: 'view',
                            auxiliaries: [],
                            inputs: ['test'],
                            statements: ['test']
                        }]
                    }
                }
            });

            const wallet = Wallet.createRandom()

            const mockedAccount = {
                address: wallet.address,
                balance: "10000000000000000",
                nonce: 1
            }

            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    account: mockedAccount
                }
            })
            
            postMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    price: "100000"
                }
            });

            const result = await actionBuilder
                .name('testactionname')
                .dbid('testDbid')
                .signer(wallet)
                .concat(actionInput)
                .buildTx();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(Transaction);
            expect(result.fee).toBe('100000');
            expect(typeof result.signature.signature_bytes).toBe('string');
            expect(result.signature.signature_type).toBe(2);
            expect(result.payload).toBe('eyJhY3Rpb24iOiJ0ZXN0YWN0aW9ubmFtZSIsImRiaWQiOiJ0ZXN0RGJpZCIsInBhcmFtcyI6W3sidGVzdCI6InRlc3QifV19')
            expect(result.sender).toBe(wallet.address);
            expect(result.payload_type).toBe(104);
            expect(result.nonce).toBe(mockedAccount.nonce + 1);
            expect(result.hash).toBe('cNbUo4v85dSU0ZJDGJwiwXmw7l0UQEbblzGctbihq7UqhCta4ixAvOtfCZK3Bui9');
        });

        it('should throw error when the db has no actions', async () => {
            const actionInput: ActionInput = new ActionInput().put('test', 'test');
        
            getMock.mockResolvedValueOnce({
                status: 200,
                data: {}
            });
        
            const wallet = Wallet.createRandom();
        
            await expect(
                actionBuilder
                    .name('testactionname')
                    .dbid('test2')
                    .signer(wallet)
                    .concat(actionInput)
                    .buildTx()
            ).rejects.toThrow();
        });

        it("Should throw error when the provided action name does not exist on a schema", async () => {
            const actionInput = new ActionInput().put('test', 'test');

            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    dataset: {
                        name: 'testName',
                        dbid: 'testDbid',
                        tables: "someTables",
                        actions: [{
                            name: 'testactionname',
                            public: true,
                            mutability: 'view',
                            auxiliaries: [],
                            inputs: ['test'],
                            statements: ['test']
                        }]
                    }
                }
            });

            const wallet = Wallet.createRandom();

            await expect(
                actionBuilder
                    .name('testactionname2')
                    .dbid('testDbid')
                    .signer(wallet)
                    .concat(actionInput)
                    .buildTx()
            ).rejects.toThrow();
        })
    });

    describe('buildMsg', () => {
        it('should build a message without a signature', async () => {
            const actionInput = new ActionInput().put('test', 'test');

            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    dataset: {
                        name: 'testName',
                        dbid: 'testDbid',
                        tables: "someTables",
                        actions: [{
                            name: 'testactionname',
                            public: true,
                            mutability: 'view',
                            auxiliaries: [],
                            inputs: ['test'],
                            statements: ['test']
                        }]
                    }
                }
            });
   
            const msg: Message = await actionBuilder
                .name('testactionname')
                .dbid('testDbid')
                .concat(actionInput)
                .buildMsg();

            expect(msg).toBeDefined();
            expect(msg.payload).toBe("eyJkYmlkIjoidGVzdERiaWQiLCJhY3Rpb24iOiJ0ZXN0YWN0aW9ubmFtZSIsInBhcmFtcyI6eyJ0ZXN0IjoidGVzdCJ9fQ==");
            expect(msg.sender).toBe("")
            expect(msg.signature).toStrictEqual({
                signature_type: 0,
                signature_bytes: ""
            })
        });

        it('should build a message with a signature', async () => {
            const actionInput = new ActionInput().put('test', 'test');

            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    dataset: {
                        name: 'testName',
                        dbid: 'testDbid',
                        tables: "someTables",
                        actions: [{
                            name: 'testactionname',
                            public: true,
                            mutability: 'view',
                            auxiliaries: [],
                            inputs: ['test'],
                            statements: ['test']
                        }]
                    }
                }
            });
   
            const wallet = Wallet.createRandom();

            const msg: Message = await actionBuilder
                .name('testactionname')
                .dbid('testDbid')
                .concat(actionInput)
                .signer(wallet)
                .buildMsg();
                
            expect(msg).toBeDefined();
            expect(msg.payload).toBe("eyJkYmlkIjoidGVzdERiaWQiLCJhY3Rpb24iOiJ0ZXN0YWN0aW9ubmFtZSIsInBhcmFtcyI6eyJ0ZXN0IjoidGVzdCJ9fQ==");
            expect(msg.sender).toBe(wallet.address)
            expect(msg.signature).toStrictEqual({
                signature_type: 2,
                signature_bytes: expect.any(String)
            })
        });

        it('should throw an error when the action requires inputs but none are provided', async () => {
            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    dataset: {
                        name: 'testName',
                        dbid: 'testDbid',
                        tables: "someTables",
                        actions: [{
                            name: 'testactionname',
                            public: true,
                            mutability: 'view',
                            auxiliaries: [],
                            inputs: ['test'],
                            statements: ['test']
                        }]
                    }
                }
            });
   
            const wallet = Wallet.createRandom();

            await expect(
                actionBuilder
                    .name('testactionname')
                    .dbid('testDbid')
                    .signer(wallet)
                    .buildMsg()
            ).rejects.toThrow();
        });

        it('should throw an error when an array of of inputs are passed to the action', () => {
            const actionInput1 = new ActionInput().put('test', 'test');
            const actionInput2 = new ActionInput().put('test2', 'test2');

            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    dataset: {
                        name: 'testName',
                        dbid: 'testDbid',
                        tables: "someTables",
                        actions: [{
                            name: 'testactionname',
                            public: true,
                            mutability: 'view',
                            auxiliaries: [],
                            inputs: ['test'],
                            statements: ['test']
                        }]
                    }
                }
            });

            const wallet = Wallet.createRandom();

            expect(
                actionBuilder
                    .name('testactionname')
                    .dbid('testDbid')
                    .signer(wallet)
                    .concat([actionInput1, actionInput2])
                    .buildMsg()
            ).rejects.toThrow();
        })
    });
});