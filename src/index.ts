import {NodeKwil} from './client/node/nodeKwil'
import {WebKwil} from './client/web/webKwil'
import { generateDBID } from './utils/dbid'
import { TxReceipt as _TxReceipt } from './core/tx'
import { Funder as _Funder } from './funder/funding'
import { ActionBuilder as _ActionBuilder, DBBuilder as _DBBuilder } from './core/builders'
import { ActionInput as _ActionInput} from './core/actionInput'
import { Transaction as _Transaction } from './core/tx'
import { Database as _Database, Table as _Table, Column as _Column, Attribute as _Attribute, Index as _Index, ActionSchema as _ActionSchema, SelectQuery as _SelectQuery } from './core/database'
import { GenericResponse } from './core/resreq'

namespace Types {
    export type TxReceipt = _TxReceipt
    export type Funder = _Funder
    export type ActionBuilder = _ActionBuilder
    export type ActionInput = _ActionInput
    export type DBBuilder = _DBBuilder
    export type Transaction = _Transaction
    export type Database<T> = _Database<T>
    export type Table<T> = _Table<T>
    export type Column<T> = _Column<T>
    export type Attribute<T> = _Attribute<T>
    export type Index = _Index
    export type ActionSchema = _ActionSchema
    export type SelectQuery = _SelectQuery
    export type NetworkResponse<T> = GenericResponse<T>
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
    generateDBID
}

export { NodeKwil, WebKwil, Types, Utils }