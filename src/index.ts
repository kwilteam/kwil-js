import NodeKwil from './node/nodeKwil'
import WebKwil from './web/webKwil'
import { PayloadType } from './common/interfaces/tx'
import { DataType, AttributeType, IndexType } from './common/interfaces/enums'
import { generateDBID } from './utils/dbid'

const Types = {
    PayloadType,
    DataType,
    AttributeType,
    IndexType
}

const Utils = {
    generateDBID
}

export { NodeKwil, WebKwil, Types, Utils }