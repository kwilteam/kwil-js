import { KwilSigner } from "../dist"
import { ActionBody } from "../dist/core/action";
import { objects } from "../dist/utils/objects"
import { kwil, wallet } from "./testingUtils"

const pk = "0x048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75"
let dbid: string = 'xd924382720df474c6bb62d26da9aeb10add2ad2835c0b7e4a6336ad8';

const kSigner = new KwilSigner(wallet, pk);

describe("Testing authentication with KGW", () => {
    let cookie: string;

    it('should try to execute a mustsign action and fail', async() => {
        const body: ActionBody = {
            dbid,
            name: "view_must_sign",
        }

        await expect(kwil.call(body, kSigner)).rejects.toThrowError()
    });
    
    it.skip("should return a cookie", async() => {
        const res = await kwil.auth.authenticate(kSigner);
        
        expect(res.status).toBe(200);
        expect(res.data?.cookie).toBeDefined();
        expect(res.data?.result).toBeDefined();
        cookie = objects.requireNonNil(res.data?.cookie);
    })

    // it("should set the cookie in the request headers", () => {
    //     kwil.auth.setCookie(cookie);
    //     // @ts-ignore
    //     expect(kwil.client.cookie).toBe(cookie);
    // })

    it.skip("should execute a mustsign action and succeed", async() => {
        const body: ActionBody = {
            dbid,
            name: "view_must_sign",
        }

        const res = await kwil.call(body, kSigner);
        expect(res.status).toBe(200);
        expect(res.data?.result).toBeDefined();
    });
})