import NodeKwil from './node/nodeKwil'
import WebKwil from './web/webKwil'
import { PayloadType } from './common/interfaces/tx'
import { DataType, AttributeType, IndexType } from './common/interfaces/enums'
import { generateDBID } from './utils/dbid'
import { TxReceipt as _TxReceipt } from './common/interfaces/tx'

namespace Types {
    export type TxReceipt = _TxReceipt
}

const Utils = {
    generateDBID
}

export { NodeKwil, WebKwil, Types, Utils }