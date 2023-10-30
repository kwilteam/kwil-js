import { getMock, postMock } from "../api_client/api-utils";
import { DBBuilderImpl } from "../../../src/builders/db_builder";
import { DBBuilder } from "../../../src/core/builders";
import { Kwil } from "../../../src/client/kwil";
import { Wallet } from "ethers";
import { Transaction } from "../../../src/core/tx";
import { PayloadType } from "../../../src/core/enums";
import { hexToBase64 } from "../../../src/utils/serial";
import { CompiledKuneiform } from "../../../src/core/payload";
import { kwilEncode } from "../../../src/utils/rlp";
import { bytesToBase64 } from "../../../src/utils/base64";

class TestKwil extends Kwil {
    public constructor() {
        super({ kwilProvider: 'doesnt matter', chainId: 'doesnt matter'})
    }
}

const pubKey = '0x048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75'

describe('DbBuilder', () => {
    let dbBuilder: DBBuilder<PayloadType.DEPLOY_DATABASE>;
    const mockKwil = new TestKwil();

    beforeEach(() => {
        dbBuilder = DBBuilderImpl.of(mockKwil, PayloadType.DEPLOY_DATABASE);
        getMock.mockReset();
        postMock.mockReset();
    });

    describe('of', () => {
        it('should return a DBBuilderImpl', () => {
            const result = DBBuilderImpl.of(mockKwil, PayloadType.DEPLOY_DATABASE);
            expect(result).toBeInstanceOf(DBBuilderImpl);
        });
    })

    describe('signer', () => {
        it('should set the _signer field and return a dbBuilder', () => {
            const sig = Wallet.createRandom();
            const result = dbBuilder.signer(sig);
            expect(result).toBe(dbBuilder);
            expect((dbBuilder as any)._signer).toBe(sig);
        })
    })

    describe('publicKey', () => {
        it('should set the _publicKey field and return a dbBuilder', () => {
            const result = dbBuilder.publicKey(pubKey);
            expect(result).toBe(dbBuilder);
            expect((dbBuilder as any)._publicKey).toBe(pubKey);
        });
    })

    describe('description', () => {
        it('should set the _description field and return a dbBuilder', () => {
            const result = dbBuilder.description('test');
            expect(result).toBe(dbBuilder);
            expect((dbBuilder as any)._description).toBe('test');
        })
    });

    describe('chainId', () => {
        it('should set the _chainId field and return a dbBuilder', () => {
            const result = dbBuilder.chainId('test');
            expect(result).toBe(dbBuilder);
            expect((dbBuilder as any)._chainId).toBe('test');
        })
    });

    describe('payload', () => {
        it('should set the _payload field and return a dbBuilder', () => {
            const payload: CompiledKuneiform = { name: 'test', owner: 'test' };
            const result = dbBuilder.payload(payload);
            expect(result).toBe(dbBuilder);
            expect((dbBuilder as any)._payload).toBe;
        })
    })

    describe('buildTx', () => {
        it('should build a transaction', async () => {
            const wallet = Wallet.createRandom()

            const mockedAccount = {
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

            const result: Transaction = await dbBuilder
                .signer(wallet)
                .publicKey(pubKey)
                .payload({ name: 'test', owner: 'test' })
                .description('test')
                .chainId('doesnt matter')
                .buildTx();

            const makePayloadEncodable = (input: any) => (DBBuilderImpl.of(mockKwil, PayloadType.DEPLOY_DATABASE) as any).makePayloadEncodable(() => input);

            expect(result.body.fee).toBe('100000');
            expect(result.body.payload_type).toBe('deploy_schema');
            expect(result.body.description).toBe('test');
            expect(result.body.nonce).toBe(Number(mockedAccount.nonce) + 1);
            expect(result.body.payload).toBe(bytesToBase64(kwilEncode((makePayloadEncodable({ name: 'test', owner: 'test' })))));
            expect(result.sender).toBe('BIdnMQVEWS4zsvtVVVJ/ScCQLPD0cvTIfmUySrt156XhwDW8HvUCbzY8eViFJsNBrzQaaPw3KZGDORaZ7hhkzHU=');
            expect(typeof result.signature.signature_bytes).toBe('string');
            expect(result.signature.signature_type).toBe('secp256k1_ep');
            expect(result.body.chain_id).toBe('doesnt matter');
        })
    })
})