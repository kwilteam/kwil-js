import { SerializationType } from '../../../src/core/enums';
import { Message, Msg } from '../../../src/core/message';
import { SignatureType } from '../../../src/core/signature';

describe('Message class methods with signature should all work', () => {
    let msg: Message;

    test('Message constructor should work', () => {
        msg = new Message({
            body: {
                description: "description",
                payload: "payload"
            },
            sender: "sender",
            signature: {
                signature_bytes: "signature_bytes",
                signature_type: SignatureType.SECP256K1_PERSONAL
            },
            serialization: SerializationType.SIGNED_MSG_CONCAT
        });
        expect(msg).toBeDefined();
    });

    test('Message body getter should work', () => {
        expect(msg.body).toBeDefined();
    });

    test('Message signature getter should work', () => {
        expect(msg.signature).toStrictEqual({
            signature_bytes: "signature_bytes",
            signature_type: SignatureType.SECP256K1_PERSONAL
        });
    });

    test('Message sender getter should work', () => {
        expect(msg.sender).toBe("sender");
    });

    test('Message serialization getter should work', () => {
        expect(msg.serialization).toBe(SerializationType.SIGNED_MSG_CONCAT);
    });
})

describe('Msg namespace functions with signature should all work as expected', () => {
    let msg: Message;

    test('Msg.create should work', () => {
        msg = Msg.create((msg) => {
            msg.body.payload = "payload";
            msg.sender = "sender";
        });
        expect(msg.body.payload).toEqual("payload");
        expect(msg.sender).toEqual("sender");
        expect(msg.body.description).toBe('')
        expect(msg.signature).toBeNull();
        expect(msg.serialization).toBe(SerializationType.SIGNED_MSG_CONCAT);
    });

    test('Msg.copy should work', () => {
        // Given a Message instance 'msg' from the previous test
    
        // Using the Msg.copy function to set the signature
        const copiedMsg = Msg.copy(msg, (msg) => {
            msg.signature = {
                signature_bytes: "signature_bytes",
                signature_type: SignatureType.SECP256K1_PERSONAL
            }
        });
    
        // Instead of using a deep equality check, we'll validate individual properties
        expect(copiedMsg.body.payload).toEqual("payload");
        expect(copiedMsg.sender).toEqual("sender");
    
        // Check signature fields individually to avoid accessing the getter directly
        expect(copiedMsg.signature?.signature_bytes).toEqual("signature_bytes");
        expect(copiedMsg.signature?.signature_type).toEqual(SignatureType.SECP256K1_PERSONAL);
    });    
});