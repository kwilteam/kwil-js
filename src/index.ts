import {NodeKwil} from './client/node/nodeKwil'
import {WebKwil} from './client/web/webKwil'
import { generateDBID } from './utils/dbid'
import { TxReceipt as _TxReceipt } from './core/tx'
import { Funder as _Funder } from './funder/funding'
import { ActionBuilder as _ActionBuilder } from './core/builders'
import { ActionInput as _ActionInput} from './core/actionInput'

namespace Types {
    export type TxReceipt = _TxReceipt
    export type Funder = _Funder
    export type ActionBuilder = _ActionBuilder
    export type ActionInput = _ActionInput
}

const ActionInput = _ActionInput

const Utils = {
    ActionInput,
    generateDBID
}

export { NodeKwil, WebKwil, Types, Utils }