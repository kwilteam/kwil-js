import NodeKwil from './node/nodeKwil'
import WebKwil from './web/webKwil'
import { PayloadType } from './common/interfaces/tx'
import { DataType, AttributeType, IndexType } from './common/interfaces/enums'

const Types = {
    PayloadType,
    DataType,
    AttributeType,
    IndexType
}

export { NodeKwil, WebKwil, Types }