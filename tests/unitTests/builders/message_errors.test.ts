import { getMock, postMock } from "../api_client/api-utils";
import { Message } from "../../../src/core/message";
import { Kwil } from "../../../src/client/kwil";
import { ActionBuilder } from "../../../src/core/builders";
import { ActionBuilderImpl } from "../../../src/builders/action_builder";
import { Wallet } from "ethers";
import { SignatureType } from "../../../src/core/signature";
import { bytesToBase64 } from "../../../src/utils/base64";
import { hexToBase64, stringToBytes } from "../../../src/utils/serial";

class TestKwil extends Kwil {
    public constructor() {
        super({ kwilProvider: 'doesnt matter', chainId: 'doesnt matter' });
    }
}

const pubKey = '0x048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75'

describe('buildMsg', () => {
    let actionBuilder: ActionBuilder;
    const mockKwil = new TestKwil();

    beforeEach(() => {
        actionBuilder = ActionBuilderImpl.of(mockKwil);
        getMock.mockReset();
        postMock.mockReset();
    });

    it('should build a msg when the action has no inputs', async () => {
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
                        inputs: [],
                        statements: ['test']
                    }]
                }
            }
        });
        

        const wallet = Wallet.createRandom();

        const msg: Message = await actionBuilder
            .name('testactionname')
            .dbid('testDbid')
            .publicKey(pubKey)
            .signer(wallet)
            .buildMsg();

        expect(msg).toBeDefined();
        // payload should be base64
        expect(typeof msg.body.payload === 'string').toBe(true);

        //sender should be b64 encoded public key
        expect(msg.sender).toBe(hexToBase64(pubKey));

        // signature should be defined
        expect(msg.signature).toStrictEqual({
            signature_type: SignatureType.SECP256K1_PERSONAL,
            signature_bytes: expect.any(String)
        })
    });
});

describe('buildMsg', () => {
    let actionBuilder: ActionBuilder;
    const mockKwil = new TestKwil();

    beforeEach(() => {
        actionBuilder = ActionBuilderImpl.of(mockKwil);
        getMock.mockReset();
        postMock.mockReset();
    });

    it('should throw error when mutaibility is update', async () => {
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
                        inputs: [],
                        statements: ['test']
                    }]
                }
            }
        });
        

        const wallet = Wallet.createRandom();

        await expect(actionBuilder
            .name('testactionname')
            .dbid('testDbid')
            .publicKey(pubKey)
            .signer(wallet)
            .buildMsg()).rejects.toThrowError('Action testactionname is not a view only action. Please use kwil.execute()');
    });
});

describe('buildMsg', () => {
    let actionBuilder: ActionBuilder;
    const mockKwil = new TestKwil();

    beforeEach(() => {
        actionBuilder = ActionBuilderImpl.of(mockKwil);
        getMock.mockReset();
        postMock.mockReset();
    });

    it('should throw error when when inputs are required but not provided', async () => {
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
                        inputs: ['1', '2'],
                        statements: ['test']
                    }]
                }
            }
        });
        

        const wallet = Wallet.createRandom();

        await expect(actionBuilder
            .name('testactionname')
            .dbid('testDbid')
            .signer(wallet)
            .buildMsg()).rejects.toThrowError('No action data has been added to the ActionBuilder.');
    });
});