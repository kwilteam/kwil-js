import { Kwil } from '../client/kwil';
import {
  BroadcastSyncType,
  BytesEncodingStatus,
  EnvironmentType,
  PayloadType,
} from '../core/enums';
import { KwilSigner } from '../core/kwilSigner';
import { TransferPayload } from '../core/payload';
import { GenericResponse } from '../core/resreq';
import { Transaction, TxReceipt } from '../core/tx';
import { hexToBytes } from '../utils/serial';
import { TransferBody } from './funding_types';
import { PayloadTx } from '../transaction/payloadTx';

interface FunderClient {
  broadcastClient(
    tx: Transaction,
    broadcastSync?: BroadcastSyncType
  ): Promise<GenericResponse<TxReceipt>>;
}

export class Funder<T extends EnvironmentType> {
  private kwil: Kwil<T>;
  private funderClient: FunderClient;
  private chainId: string;

  constructor(kwil: Kwil<T>, funderClient: FunderClient, chainId: string) {
    this.kwil = kwil;
    this.funderClient = funderClient;
    this.chainId = chainId;
  }

  public async transfer(
    payload: TransferBody,
    signer: KwilSigner,
    synchronous?: boolean
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

    const transaction = await PayloadTx.createTx(this.kwil, {
      chainId: this.chainId,
      description: payload.description!,
      payload: txPayload,
      payloadType: PayloadType.TRANSFER,
      identifier: signer.identifier,
      signer: signer.signer,
      signatureType: signer.signatureType,
    }).buildTx();

    return await this.funderClient.broadcastClient(
      transaction,
      synchronous ? BroadcastSyncType.COMMIT : undefined
    );
  }
}
