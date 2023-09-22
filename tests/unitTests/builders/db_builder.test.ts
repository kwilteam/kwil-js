import { getMock, postMock } from "../api_client/api-utils";
import { DBBuilderImpl } from "../../../src/builders/db_builder";
import { DBBuilder } from "../../../src/core/builders";
import { Kwil } from "../../../src/client/kwil";
import { Wallet } from "ethers";
import { Transaction } from "../../../src/core/tx";
import { PayloadType } from "../../../src/core/enums";

class TestKwil extends Kwil {
    public constructor() {
        super({ kwilProvider: 'doesnt matter'})
    }
}

describe('DbBuilder', () => {
    let dbBuilder: DBBuilder;
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

    describe('payload', () => {
        it('should set the _payload field and return a dbBuilder', () => {
            const payload = { test: 'test' };
            const result = dbBuilder.payload(payload);
            expect(result).toBe(dbBuilder);
            expect((dbBuilder as any)._payload).toBe;
        })
    })

    describe('buildTx', () => {
        it('should build a transaction', async () => {
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

            const result: Transaction = await dbBuilder
                .signer(wallet)
                .payload({ test: 'test' })
                .buildTx();

            expect(result).toBeInstanceOf(Transaction);
            expect(result.hash).toBe('042jEOCmIUkhIH7l/BZd6i6v4PNeu9WhAZvnD1cztaH8o7HJPCjsTppQ9Ov7Yt5X');
            expect(result.fee).toBe('100000');
            expect(result.nonce).toBe(mockedAccount.nonce + 1);
            expect(result.payload).toBe('eyJ0ZXN0IjoidGVzdCJ9');
            expect(result.sender).toBe(wallet.address);
            expect(typeof result.signature.signature_bytes).toBe('string');
            expect(result.signature.signature_type).toBe(2);
        })
    })
})