import { stringToHex } from "../../../dist/utils/serial";
import { AuthResponse, composeAuthMsg } from "../../../src/core/auth";
import { bytesToHex, bytesToString, stringToBytes } from "../../../src/utils/serial";

describe("composeAuthMsg", () => {
    it("should accept the params and return a string", () => {
        let params: AuthResponse = {
            nonce: "123456",
            statement: "eww",
            issue_at: "2023-11-05T22:57:46Z",
            expiration_time: "2023-11-05T22:58:16Z",
        }

        const msg = composeAuthMsg(params, "https://example.com", "0xc89D42189f0450C2b2c3c61f58Ec5d628176A1E7","1", "test-chain")

        expect(msg).toEqual("https://example.com wants you to sign in with your account:\n0xc89D42189f0450C2b2c3c61f58Ec5d628176A1E7\n\neww\n\nURI: https://example.com/auth\nVersion: 1\nChain ID: test-chain\nNonce: 123456\nIssue At: 2023-11-05T22:57:46Z\nExpiration Time: 2023-11-05T22:58:16Z\n")
        console.log(stringToHex(msg))
        expect(stringToHex(msg)).toEqual("68747470733a2f2f6578616d706c652e636f6d2077616e747320796f7520746f207369676e20696e207769746820796f7572206163636f756e743a0a3078633839443432313839663034353043326232633363363166353845633564363238313736413145370a0a6577770a0a5552493a2068747470733a2f2f6578616d706c652e636f6d2f617574680a56657273696f6e3a20310a436861696e2049443a20746573742d636861696e0a4e6f6e63653a203132333435360a49737375652041743a20323032332d31312d30355432323a35373a34365a0a45787069726174696f6e2054696d653a20323032332d31312d30355432323a35383a31365a0a")
    })
});

describe('stringToBytes', () => {
    const initString = "https://example.com wants you to sign in with your account:\n0xc89D42189f0450C2b2c3c61f58Ec5d628176A1E7\n\n\nURI: https://example.com/auth\nVersion: 1\nChain ID: test-chain\nNonce: 123456\nIssue At: 2023-11-05T22:57:46Z\nExpiration Time: 2023-11-05T22:58:16Z\n"

    console.log(initString)
    const bytes = stringToBytes(initString)
    const hex = bytesToHex(bytes)

    expect(hex).toEqual("68747470733a2f2f6578616d706c652e636f6d2077616e747320796f7520746f207369676e20696e207769746820796f7572206163636f756e743a0a3078633839443432313839663034353043326232633363363166353845633564363238313736413145370a0a6577770a0a5552493a2068747470733a2f2f6578616d706c652e636f6d2f617574680a56657273696f6e3a20310a436861696e2049443a20746573742d636861696e0a4e6f6e63653a203132333435360a49737375652041743a20323032332d31312d30355432323a35373a34365a0a45787069726174696f6e2054696d653a20323032332d31312d30355432323a35383a31365a0a")
})