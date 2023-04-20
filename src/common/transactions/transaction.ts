import { ethers, JsonRpcSigner } from "ethers";
import { base64ToBytes, bytesToBase64 } from "../../utils/base64";
import { ConcatBytes, MarshalB64, NumberToUint32LittleEndian, NumberToUint64LittleEndian, StringToUint8LittleEndian } from "../../utils/bytes";
import { sign, sha384BytesToBytes } from "../crypto/crypto";
import { SignatureType } from "../interfaces/signature";
import { ITx, PayloadType } from "../interfaces/tx";

interface Txifiable {
    toObject(): object;
    payloadType: PayloadType;
}

export class Transaction {
    public tx: ITx;
    constructor(tx: Txifiable) {
        this.tx = {
            hash: "",
            payload_type: tx.payloadType,
            payload: MarshalB64(tx.toObject()),
            fee: "0",
            nonce: -1,
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.ACCOUNT_SECP256K1_UNCOMPRESSED
            },
            sender: ""
        };
    }

    public async sign(signer: JsonRpcSigner | ethers.Wallet): Promise<void> {   
        this.tx.signature = await sign(this.tx.hash, signer);
        this.tx.sender = await signer.getAddress();
    }

    public generateHash(): void {
        const payloadType = NumberToUint32LittleEndian(this.tx.payload_type);
        const payloadHash = sha384BytesToBytes(base64ToBytes(this.tx.payload));
        const fee = StringToUint8LittleEndian(this.tx.fee);
        const nonce = NumberToUint64LittleEndian(this.tx.nonce);
        const hash = sha384BytesToBytes(ConcatBytes(payloadType, payloadHash, fee, nonce));
        this.tx.hash = bytesToBase64(hash);
    }
}