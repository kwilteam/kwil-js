import {NodeKwil} from './client/node/nodeKwil'
import {WebKwil} from './client/web/webKwil'
import { generateDBID } from './utils/dbid'
import { TxReceipt as _TxReceipt } from './core/tx'
import { ActionBuilder as _ActionBuilder, DBBuilder as _DBBuilder } from './core/builders'
import { ActionInput as _ActionInput} from './core/action'
import { Transaction as _Transaction } from './core/tx'
import { Database as _Database, Table as _Table, Column as _Column, Attribute as _Attribute, Index as _Index, ActionSchema as _ActionSchema, SelectQuery as _SelectQuery, ForeignKey as _ForeignKey, ForeignKeyAction as _ForeignKeyAction, Extension as _Extension, ExtensionConfig as _ExtensionConfig } from './core/database'
import { GenericResponse as _GenericResponse } from './core/resreq'
import { TxResult as _TxResult, TxInfoReceipt as _TxInfoReceipt } from './core/txQuery'
import { Account as _Account } from './core/account'
import { MsgReceipt as _MsgReceipt } from './core/message'
import { recoverSecp256k1PubKey } from './utils/keys'
import { KwilSigner } from './core/kwilSigner'
import { PayloadType as _PayloadType } from './core/enums'

namespace Types {
    export type TxReceipt = _TxReceipt
    export type MsgReceipt = _MsgReceipt
    export type ActionBuilder = _ActionBuilder
    export type ActionInput = _ActionInput
    export type DBBuilder<T extends _PayloadType.DEPLOY_DATABASE | _PayloadType.DROP_DATABASE> = _DBBuilder<T>
    export type Transaction= _Transaction
    export type Database = _Database
    export type Table = _Table
    export type Column = _Column
    export type Attribute = _Attribute
    export type Index = _Index
    export type ForeignKey = _ForeignKey
    export type ForeignKeyAction = _ForeignKeyAction
    export type ActionSchema = _ActionSchema
    export type Extension = _Extension
    export type ExtensionConfig = _ExtensionConfig
    export type SelectQuery = _SelectQuery
    export type GenericResponse<T> = _GenericResponse<T>
    export type TxResult = _TxResult
    export type TxInfoReceipt = _TxInfoReceipt
    export type Account = _Account
    export type PayloadType = _PayloadType
}

const ActionInput = _ActionInput

const Utils = {
/**
 * `ActionInput` class is a utility class for creating action inputs.
 */
    ActionInput,
/**
 * Generates a unique database identifier (DBID) from the provided owner's Ethereum wallet address and a database name.
 */
    generateDBID,
/**
 * Recovers the public key from a signature and a message for Secp256k1 Public Keys (EVM Networks).
 * @param signer - The signer for the action. This must be a valid Ethereum signer from Ethers v5 or Ethers v6.
 */
    recoverSecp256k1PubKey
}

export { NodeKwil, WebKwil, KwilSigner, Types, Utils }