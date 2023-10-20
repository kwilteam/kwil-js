import { Wallet } from "ethers";
import { recoverSecp256k1PubKey } from "../../../src/utils/keys";
import { KwilSigner } from "../../../src/core/kwilSigner";
import nacl from "tweetnacl";
import { SignatureType } from "../../../src/core/signature";

describe('KwilSigner Unit Tests', () => {
    test('KwilSigner with constructor using EthSigner should return a KwilSigner class', async () => {
        const ethSigner = Wallet.createRandom();
        const publicKey = await recoverSecp256k1PubKey(ethSigner);

        const kSigner = new KwilSigner(ethSigner, publicKey);

        expect(kSigner).toBeDefined();
        expect(kSigner.publicKey).toBe(publicKey);
        expect(kSigner.signer).toBe(ethSigner);
        expect(kSigner.signatureType).toBe('secp256k1_ep');
        expect(kSigner).toBeInstanceOf(KwilSigner);
    });

    test('KwilSigner with constructor using CustomSigner should return a KwilSigner class', () => {
        const keyPair = nacl.sign.keyPair();
        const customSigner = async (message: Uint8Array) => nacl.sign.detached(message, keyPair.secretKey);
        
        const kSigner = new KwilSigner(customSigner, keyPair.publicKey, SignatureType.ED25519);

        expect(kSigner).toBeDefined();
        expect(kSigner.publicKey).toBe(keyPair.publicKey);
        expect(kSigner.signer).toBe(customSigner);
        expect(kSigner.signatureType).toBe('ed25519');
        expect(kSigner).toBeInstanceOf(KwilSigner);
    });

    test('KwilSigner with constructor using CustomSigner and no signature type should throw an error', () => {
        const keyPair = nacl.sign.keyPair();
        const customSigner = async (message: Uint8Array) => nacl.sign.detached(message, keyPair.secretKey);
        
        expect(() => {
            // @ts-ignore
            new KwilSigner(customSigner, keyPair.publicKey);
        }).toThrowError('Could not determine signature type from signer. Please pass a signature type to the KwilSigner constructor.');
    });
})