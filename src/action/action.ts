import { Kwil } from '../client/kwil';
import { ActionInput } from '../core/action';
import { SignerSupplier } from '../core/builders';
import { BytesEncodingStatus, EnvironmentType } from '../core/enums';
import { EncodedValue } from '../core/payload';
import { AnySignatureType, Signature } from '../core/signature';
import { Transaction } from '../core/tx';
import { HexString } from '../utils/types';

export interface ActionOptions {
  signer?: SignerSupplier;
  identifier?: HexString | Uint8Array;
  actions?: ActionInput[];
  signatureType?: AnySignatureType;
  actionName?: string;
  dbid?: string;
  chainId?: string;
  description?: string;
  nonce?: number;
  challenge?: string;
  signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;
}

interface CheckSchema {
  dbid: string;
  actionName: string;
  modifiers?: ReadonlyArray<string>;
  preparedActions: EncodedValue[][];
}

interface ExecSchema {
  name: string;
  public: boolean;
  parameters?: ReadonlyArray<string>;
  modifiers?: ReadonlyArray<string>;
}

const TXN_BUILD_IN_PROGRESS: ActionInput[] = [];

export class Action<T extends EnvironmentType> {
  private kwil: Kwil<T>;
  private signer?: SignerSupplier;
  private identifier?: HexString | Uint8Array;
  private actions?: ActionInput[] = [];
  private signatureType?: AnySignatureType;
  private actionName?: string = '';
  private dbid?: string = '';
  private chainId?: string;
  private description?: string = '';
  private nonce?: number;
  private challenge?: string = '';
  private signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;

  /**
   * Initializes a new `Action` instance.
   *
   * @param {Kwil} kwil - The Kwil client, used to call higher-level methods on the Kwil class.
   */

  constructor(kwil: Kwil<T>, options: ActionOptions) {
    this.kwil = kwil;
    this.signer = options.signer;
    this.identifier = options.identifier;
    this.actions = options.actions;
    this.signatureType = options.signatureType;
    this.actionName = options.actionName;
    this.dbid = options.dbid;
    this.chainId = options.chainId;
    this.description = options.description;
    this.nonce = options.nonce;
    this.challenge = options.challenge;
    this.signature = options.signature;
  }

  /**
   * Static factory method to create a new Action instance.
   *
   * @param kwil - The Kwil client.
   * @param options - The options to configure the Action instance.
   */
  static create<T extends EnvironmentType>(kwil: Kwil<T>, options: ActionOptions): Action<T> {
    return new Action<T>(kwil, options);
  }

  /**
   * Build the action structure for a transaction.
   */
  //   async buildTx(): Promise<Transaction> {
  //     // cache the action
  //     const cached = this.actions;
  //   }
}

// TODO => find a way to refactor assertNotBuilding() to make sure the action cannot be modified while the transaction is being built
// TODO ==> continue refactor...
