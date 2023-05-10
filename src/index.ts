import {NodeKwil} from './client/node/nodeKwil'
import {WebKwil} from './client/web/webKwil'
import { generateDBID } from './utils/dbid'
import { TxReceipt as _TxReceipt } from './core/tx'

namespace Types {
    export type TxReceipt = _TxReceipt
}

const Utils = {
    generateDBID
}

export { NodeKwil, WebKwil, Types, Utils }
