import { wrapEstimate, unwrapEstimate, wrapConfig, unwrapConfig } from "../../../src/client/intern";
import { Kwil } from "../../../src/client/kwil";
import Client from "../../../src/api_client/client";
import { Config } from "../../../src/api_client/config";

class TestKwil extends Kwil {
    constructor() {
        super({ kwilProvider: 'doesnt matter', chainId: 'doesnt matter' })
    }
}

describe("client/intern - estimates", () => {

    const testClient = new Client({ kwilProvider: 'doesnt matter' });

    it('wrap should wrap Kwil client', () => {
        const kwil = new TestKwil();
        const wrapped = wrapEstimate(kwil, testClient.estimateCost);
        expect(wrapped).toBe(undefined);
    })

    it('unwrap should unwrap Kwil client etimate cost method', () => {
        const kwil = new TestKwil();
        const unwrapped = unwrapEstimate(kwil);
        expect(typeof unwrapped).toBe('function');
    });
});

describe("client/intern - config", () => {
    const config: Config = { kwilProvider: 'doesnt matter', chainId: 'doesnt matter' };

    it('wrap should wrap Kwil client to store configs', () => {
        const kwil = new TestKwil();
        const wrapped = wrapConfig(kwil, config);
        expect(wrapped).toBe(undefined);
    })

    it('unwrap should unwrap Kwil client to expose configs', () => {
        const kwil = new TestKwil();
        const unwrapped = unwrapConfig(kwil);
        expect(unwrapped).toStrictEqual(config);
    });
});