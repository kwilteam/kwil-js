import {NodeKwil} from './client/node/nodeKwil'
import {WebKwil} from './client/web/webKwil'
import { generateDBID } from './utils/dbid'
import { TxReceipt as _TxReceipt } from './core/tx'
import { Funder as _Funder } from './funder/funding'
import { ActionBuilder as _ActionBuilder } from './core/builders'
import { ActionInput } from './core/action'

namespace Types {
    export type TxReceipt = _TxReceipt
    export type Funder = _Funder
    export type ActionBuilder = _ActionBuilder
}

const Utils = {
    ActionInput,
    generateDBID
}

export { NodeKwil, WebKwil, Types, Utils }