import { Message, Msg } from '../../src/core/message';

describe('Message class methods with signature should all work', () => {
    let msg: Message;

    test('Message constructor should work', () => {
        msg = new Message({
            payload: "payload",
            sender: "sender",
            signature: {
                signature_bytes: "signature_bytes",
                signature_type: 1
            }
        });
        expect(msg).toBeDefined();
    });

    test('Message payload getter should work', () => {
        expect(msg.payload).toBe("payload");
    });

    test('Message signature getter should work', () => {
        expect(msg.signature).toStrictEqual({
            signature_bytes: "signature_bytes",
            signature_type: 1
        });
    });

    test('Message sender getter should work', () => {
        expect(msg.sender).toBe("sender");
    });
})

describe('Msg namespace functions with signature should all work as expected', () => {
    let msg: Message;

    test('Msg.create should work', () => {
        msg = Msg.create((msg) => {
            msg.payload = "payload";
            msg.sender = "sender";
        });
        expect(msg.payload).toEqual("payload");
        expect(msg.sender).toEqual("sender");
        expect(msg.signature).toEqual({
            signature_bytes: "",
            signature_type: 0
        });

    });

    test('Msg.copy should work', () => {
        // Given a Message instance 'msg' from the previous test
    
        // Using the Msg.copy function to set the signature
        const copiedMsg = Msg.copy(msg, (msg) => {
            msg.signature = {
                signature_bytes: "signature_bytes",
                signature_type: 1
            }
        });
    
        // Instead of using a deep equality check, we'll validate individual properties
        expect(copiedMsg.payload).toEqual("payload");
        expect(copiedMsg.sender).toEqual("sender");
    
        // Check signature fields individually to avoid accessing the getter directly
        expect(copiedMsg.signature.signature_bytes).toEqual("signature_bytes");
        expect(copiedMsg.signature.signature_type).toEqual(1);
    });    
});

describe('Msg namespace functions without signature should all work as expected', () => {
    let msg: Message;

    test('Msg.create should work', () => {
        msg = Msg.create((msg) => {
            msg.payload = "payload";
            msg.sender = "sender";
        });
        expect(msg.payload).toEqual("payload");
        expect(msg.sender).toEqual("sender");
        expect(msg.signature).toEqual({
            signature_bytes: "",
            signature_type: 0
        });
    });

    test('Msg.copy should work', () => {
        // Given a Message instance 'msg' from the previous test
    
        // Using the Msg.copy function to set the signature
        const copiedMsg = Msg.copy(msg, (msg) => {
            msg.signature = {
                signature_bytes: "",
                signature_type: 1
            }
        });
    
        // Instead of using a deep equality check, we'll validate individual properties
        expect(copiedMsg.payload).toEqual("payload");
        expect(copiedMsg.sender).toEqual("sender");
    
        // Check signature fields individually to avoid accessing the getter directly
        expect(copiedMsg.signature).toEqual({
            signature_bytes: "",
            signature_type: 1
        });
    });
});