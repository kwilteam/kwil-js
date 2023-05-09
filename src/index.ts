import NodeKwil from './node/nodeKwil'
import WebKwil from './web/webKwil'
import { generateDBID } from './utils/dbid'
import { TxReceipt as _TxReceipt } from './common/interfaces/tx'
import { Funder as _Funder } from './common/funder/funding'
import { Action as _Action } from './common/action/action'
import { DBBuilder as _DBBuilder } from './common/builder/builder'

namespace Types {
    export type TxReceipt = _TxReceipt
    export type Funder = _Funder
    export type Action = _Action
    export type DBBuilder = _DBBuilder
}

const Utils = {
    generateDBID
}

export { NodeKwil, WebKwil, Types, Utils }