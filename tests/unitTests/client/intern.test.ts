import { wrap, unwrap } from "../../../src/client/intern";
import { Kwil } from "../../../src/client/kwil";
import Client from "../../../src/api_client/client";

class TestKwil extends Kwil {
    constructor() {
        super({ kwilProvider: 'doesnt matter', chainId: 'doesnt matter' })
    }
}

describe("client/intern", () => {

    const testClient = new Client({ kwilProvider: 'doesnt matter' });

    it('wrap should wrap Kwil client', () => {
        const kwil = new TestKwil();
        const wrapped = wrap(kwil, testClient.estimateCost);
        expect(wrapped).toBe(undefined);
    })

    it('unwrap should unwrap Kwil client etimate cost method', () => {
        const kwil = new TestKwil();
        const unwrapped = unwrap(kwil);
        expect(typeof unwrapped).toBe('function');
    });
});