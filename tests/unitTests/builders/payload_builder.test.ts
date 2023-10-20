import { getMock, postMock } from '../api_client/api-utils';
import { PayloadBuilderImpl } from '../../../src/builders/payload_builder';
import { PayloadBuilder } from '../../../src/core/builders';
import { Kwil } from '../../../src/client/kwil';
import { BaseTransaction } from '../../../src/core/tx';
import { BaseMessage, Message } from '../../../src/core/message';
import { Wallet } from 'ethers';
import { PayloadType, SerializationType } from '../../../src/core/enums';
import { SignatureType } from '../../../src/core/signature';
import { hexToBase64, stringToBytes, stringToHex } from '../../../src/utils/serial';

class TestKwil extends Kwil {
    constructor() {
        super({kwilProvider: 'doesnt matter' })
    }
}

const pubKey = '048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75'

describe('Transaction Builder', () => {
    let txBuilder: PayloadBuilder;
    let mockKwil = new TestKwil();

    beforeEach(() => {
        txBuilder = PayloadBuilderImpl.of(mockKwil);
        getMock.mockReset();
        postMock.mockReset();
    });

    describe('of', () => {
        it('should return a TxnBuilderImpl', () => {
            const result = PayloadBuilderImpl.of(mockKwil);
            expect(result).toBeInstanceOf(PayloadBuilderImpl);
        });
    })

    describe('payloadType', () => {
        it('should set the payloadType and return TxnBuilderImpl', () => {
            const result = txBuilder.payloadType(PayloadType.DEPLOY_DATABASE);
            expect(result).toBeInstanceOf(PayloadBuilderImpl);
            expect((result as any)._payloadType).toBe('deploy_schema');
        })
    })

    describe('signer', () => {
        it('should set the signer and return TxnBuilderImpl', () => {
            const sig = Wallet.createRandom();
            const result = txBuilder.signer(sig, SignatureType.SECP256K1_PERSONAL);
            expect(result).toBeInstanceOf(PayloadBuilderImpl);
            expect((result as any)._signer).toBe(sig);
        });
    });

    describe('payload', () => {
        it('should set the payload and return TxnBuilderImpl', () => {
            const result = txBuilder.payload({foo: 'bar'});
            expect(result).toBeInstanceOf(PayloadBuilderImpl);
            expect((result as any)._payload).toBeDefined();
        });
    })

    describe('publicKey', () => {
        it('should set the publicKey and return TxnBuilderImpl', () => {
            const result = txBuilder.publicKey(stringToHex('1234'));
            expect(result).toBeInstanceOf(PayloadBuilderImpl);
            expect((result as any)._publicKey).toStrictEqual(stringToBytes('1234'));
        });
    });

    describe('description', () => {
        it('should set the description and return TxnBuilderImpl', () => {
            const result = txBuilder.description('test');
            expect(result).toBeInstanceOf(PayloadBuilderImpl);
            expect((result as any)._description).toBe('test');
        });
    });

    describe('buildTx', () => {
        it('should build a transaction', async () => {
            const wallet = Wallet.createRandom()

            const mockedAccount = {
                public_key: hexToBase64(pubKey),
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

            const result = await txBuilder
                .payload({foo: 'bar'})
                .payloadType(PayloadType.EXECUTE_ACTION)
                .publicKey(pubKey)
                .description('test')
                .signer(wallet, SignatureType.SECP256K1_PERSONAL)
                .buildTx();

            expect(result).toBeInstanceOf(BaseTransaction);
            expect(result.body.payload_type).toBe('execute_action');
            expect(result.body.description).toBe('test');
            expect(result.body.fee).toBe('100000');
            expect(result.body.nonce).toBe(2);
            expect(typeof result.body.payload).toBe('string');
            expect(typeof result.body.salt).toBe('string');
            expect(result.isSigned()).toBe(true);
            expect(result.sender).toBe(hexToBase64(pubKey));
            expect(result.signature.signature_type).toBe('secp256k1_ep');
            expect(typeof result.signature.signature_bytes).toBe('string');
            expect(result.serialization).toBe(SerializationType.SIGNED_MSG_CONCAT);
        });

        it('should throw error if account does not exist', async() => {
            getMock.mockResolvedValueOnce({
                status: 400,
                data: {
                    error: "Account not found!"
                }
            })

            const wallet = Wallet.createRandom()

            await expect(
                txBuilder
                    .payload({foo: 'bar'})
                    .payloadType(PayloadType.DEPLOY_DATABASE)
                    .signer(wallet, SignatureType.SECP256K1_PERSONAL)
                    .publicKey(pubKey)
                    .buildTx()
            ).rejects.toThrowError('');
        })

        it('should throw error if it cannot estimate cost', async () => {
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
                status: 400,
                data: {
                    error: 'Cannot estimate cost'
                }
            });

            await expect(
                txBuilder
                    .payload({foo: 'bar'})
                    .payloadType(PayloadType.DEPLOY_DATABASE)
                    .publicKey(pubKey)
                    .signer(wallet, SignatureType.SECP256K1_PERSONAL)
                    .buildTx()
            ).rejects.toThrow();
        })
    });

    describe('buildMessage', () => {
        it('should build a message with a signature', async () => {
            const wallet = Wallet.createRandom()

            const msg: Message = await txBuilder
                .payload({foo: 'bar'})
                .publicKey(pubKey)
                .description('test')
                .signer(wallet, SignatureType.SECP256K1_PERSONAL)
                .buildMsg();

            expect(msg).toBeInstanceOf(BaseMessage);
            expect(typeof msg.body.payload).toBe('string');
            expect(msg.body.description).toBe('test');
            expect(msg.sender).toBe(hexToBase64(pubKey));
            expect(msg.serialization).toBe('concat')
            expect(msg.signature?.signature_type).toBe('secp256k1_ep');
            expect(typeof msg.signature?.signature_bytes).toBe('string');

        });

        it('should build a message without a signature', async () => {
            const msg: Message = await txBuilder
                .payload({foo: 'bar'})
                .buildMsg();

            expect(msg).toBeInstanceOf(BaseMessage);
            expect(typeof msg.body.payload).toBe('string');
            expect(msg.sender).toBe(null);
            expect(msg.serialization).toBe('concat')
            expect(msg.signature).toBeNull();
        });

        it('should through error without a payload', async () =>    {
            await expect(
                txBuilder
                    .buildMsg()
            ).rejects.toThrow();
        })
    });
})