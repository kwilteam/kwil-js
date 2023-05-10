import {NodeKwil} from './client/node/nodeKwil'
import {WebKwil} from './client/web/webKwil'
import { generateDBID } from './utils/dbid'
import { TxReceipt as _TxReceipt } from './core/tx'
import { Funder as _Funder } from './funder/'

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
