import Client from '../api_client/client';
import { PayloadBuilderImpl } from '../builders/payload_builder';
import { Kwil } from '../client/kwil';
import { BroadcastSyncType, BytesEncodingStatus, EnvironmentType, PayloadType } from '../core/enums';
import { KwilSigner } from '../core/kwilSigner';
import { TransferPayload } from '../core/payload';
import { GenericResponse } from '../core/resreq';
import { TxReceipt } from '../core/tx';
import { hexToBytes } from '../utils/serial';
import { TransferBody } from './funding_types';

export class Funder<T extends EnvironmentType> {
  private kwil: Kwil<T>;
  private client: Client;
  private chainId: string;

  constructor(kwil: Kwil<T>, client: Client, chainId: string) {
    this.kwil = kwil;
    this.client = client;
    this.chainId = chainId;
  }

  public async transfer(
    payload: TransferBody,
    signer: KwilSigner,
    synchronous?: boolean,
  ): Promise<GenericResponse<TxReceipt>> {
    let to: Uint8Array;
    if (typeof payload.to === 'string') {
      to = hexToBytes(payload.to);
    } else {
      to = payload.to;
    }

    const txPayload: TransferPayload<BytesEncodingStatus.HEX_ENCODED> = {
      to,
      amount: payload.amount.toString(),
    };

    const tx = await PayloadBuilderImpl.of<T>(this.kwil)
      .chainId(this.chainId)
      .description(payload.description)
      .payload(txPayload)
      .payloadType(PayloadType.TRANSFER)
      .publicKey(signer.identifier)
      .signer(signer.signer, signer.signatureType)
      .buildTx();

    return await this.client.broadcast(tx, synchronous ? BroadcastSyncType.COMMIT : undefined);
  }
}
