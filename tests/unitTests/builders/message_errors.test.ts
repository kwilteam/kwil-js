import { getMock, postMock } from "../api_client/api-utils";
import { Message } from "../../../src/core/message";
import { Kwil } from "../../../src/client/kwil";
import { ActionBuilder } from "../../../src/core/builders";
import { ActionBuilderImpl } from "../../../src/builders/action_builder";
import { Wallet } from "ethers";

class TestKwil extends Kwil {
    public constructor() {
        super({ kwilProvider: 'doesnt matter' });
    }
}

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
                dataset: {
                    name: 'testName',
                    dbid: 'testDbid',
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
            .signer(wallet)
            .buildMsg();

        expect(msg).toBeDefined();
        expect(msg.payload.length).toBeGreaterThan(1);
        expect(msg.sender).toBe(wallet.address)
        expect(msg.signature).toStrictEqual({
            signature_type: 2,
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
                dataset: {
                    name: 'testName',
                    dbid: 'testDbid',
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
            .signer(wallet)
            .buildMsg()).rejects.toThrow();
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
                dataset: {
                    name: 'testName',
                    dbid: 'testDbid',
                    tables: "someTables",
                    actions: [{
                        name: 'testactionname',
                        public: true,
                        mutability: 'update',
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
            .buildMsg()).rejects.toThrow();
    });
});