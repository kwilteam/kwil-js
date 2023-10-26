import { getMock, postMock } from '../api_client/api-utils';
import { ActionBuilderImpl } from '../../../src/builders/action_builder';
import { ActionBuilder } from '../../../src/core/builders';
import { Kwil } from '../../../src/client/kwil';
import { Wallet } from 'ethers';
import { Transaction } from '../../../src/core/tx';
import { Message } from '../../../src/core/message';
import { ActionInput } from '../../../src/core/action';
import { Account } from '../../../src/core/account';
import { bytesToBase64 } from '../../../src/utils/base64';
import { hexToBase64, stringToBytes } from '../../../src/utils/serial';
import nacl from 'tweetnacl';
import { SignatureType } from '../../../src/core/signature';

class TestKwil extends Kwil {
    public constructor() {
        super({ kwilProvider: 'doesnt matter' });
    }
}

const pubKey = '048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75'

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
        it('should accept a custom signer and signature type and return the actionBuilder', () => {
            const customSignature = async (msg: Uint8Array) => {
                return await nacl.sign.detached(msg, stringToBytes('test'));
            }

            const result = actionBuilder.signer(customSignature, SignatureType.ED25519);
        
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._signer).toBe(customSignature);
            expect((actionBuilder as any)._signatureType).toBe(SignatureType.ED25519);
        })

        it('should accept an etherjs signer and infer the signature type, return actionBuilder', () => {
            const sig = Wallet.createRandom()
            const result = actionBuilder.signer(sig);
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._signer).toBe(sig);
            expect((actionBuilder as any)._signatureType).toBe(SignatureType.SECP256K1_PERSONAL);
        });
    });

    describe('publicKey', () => {
        it('should set the _publicKey field and return actionBuilder', () => {
            const result = actionBuilder.publicKey(pubKey);
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._publicKey).toBe(pubKey);
        });
    });

    describe('description', () => {
        it('should set the _description field and return actionBuilder', () => {
            const result = actionBuilder.description('testDescription');
            expect(result).toBe(actionBuilder);
            expect((actionBuilder as any)._description).toBe('testDescription');
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
                    schema: {
                        name: 'testName',
                        owner: bytesToBase64(stringToBytes('mockOwner')),
                        tables: "someTables",
                        actions: [{
                            name: 'testactionname',
                            public: true,
                            mutability: 'update',
                            auxiliaries: [],
                            inputs: ['test'],
                            statements: ['test']
                        }]
                    }
                }
            });

            const wallet = Wallet.createRandom()

            const mockedAccount: Account = {
                public_key: hexToBase64(pubKey),
                balance: "10000000000000000",
                nonce: '1'
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
                .description('test')
                .publicKey(pubKey)
                .buildTx();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(Transaction);
            expect(result.body.fee).toBe('100000');
            expect(result.body.description).toBe('test');
            expect(typeof result.signature.signature_bytes).toBe('string');
            expect(result.signature.signature_type).toBe('secp256k1_ep');
            expect(result.body.payload).toBe('AAHfiHRlc3REYmlkjnRlc3RhY3Rpb25uYW1lxsWEdGVzdA==')
            expect(result.sender).toBe(hexToBase64(pubKey));
            expect(result.body.payload_type).toBe('execute_action');
            expect(result.body.nonce).toBe(Number(mockedAccount.nonce) + 1);
            expect(result.serialization).toBe('concat')
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
                    .publicKey(pubKey)
                    .description('test')
                    .concat(actionInput)
                    .buildTx()
            ).rejects.toThrow();
        });

        it("Should throw error when the provided action name does not exist on a schema", async () => {
            const actionInput = new ActionInput().put('test', 'test');

            getMock.mockResolvedValueOnce({
                status: 200,
                data: {
                    schema: {
                        name: 'testName',
                        owner: bytesToBase64(stringToBytes('mockOwner')),
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
});

describe('buildMsg', () => {
    let actionBuilder: ActionBuilder;
    
    beforeEach(() => {
        actionBuilder = ActionBuilderImpl.of(new TestKwil());
    })

    it('should build a message without a signature', async () => {
        const actionInput = new ActionInput().put('test', 'test');

        getMock.mockResolvedValueOnce({
            status: 200,
            data: {
                schema: {
                    ame: 'testName',
                    owner: bytesToBase64(stringToBytes('mockOwner')),
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
        expect(msg.body.payload).toBe("AAHeiHRlc3REYmlkjnRlc3RhY3Rpb25uYW1lxYR0ZXN0");
        expect(msg.sender).toBe("")
        expect(msg.signature).toBeNull();
    });

    it('should build a message with a signature', async () => {
        const actionInput = ActionInput.of().put('test', 'test');

        console.log(actionInput)
        getMock.mockResolvedValueOnce({
            status: 200,
            data: {
                schema: {
                    name: 'testName',
                    owner: bytesToBase64(stringToBytes('mockOwner')),
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
            .description('test')
            .concat(actionInput)
            .publicKey(pubKey)
            .signer(wallet)
            .buildMsg();
            
        expect(msg).toBeDefined();
        expect(msg.body.description).toBe('test')
        expect(msg.body.payload).toBe("AAHeiHRlc3REYmlkjnRlc3RhY3Rpb25uYW1lxYR0ZXN0");
        expect(msg.sender).toBe(hexToBase64(pubKey))
        expect(msg.signature).toStrictEqual({
            signature_type: 'secp256k1_ep',
            signature_bytes: expect.any(String)
        })
    });

    it('should throw an error when the action requires inputs but none are provided', async () => {
        getMock.mockResolvedValueOnce({
            status: 200,
            data: {
                schema: {
                    ame: 'testName',
                    owner: bytesToBase64(stringToBytes('mockOwner')),
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
                schema: {
                    ame: 'testName',
                    owner: bytesToBase64(stringToBytes('mockOwner')),
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