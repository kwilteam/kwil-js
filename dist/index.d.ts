import NodeKwil from './node/nodeKwil';
import WebKwil from './web/webKwil';
import { PayloadType } from './common/interfaces/tx';
import { DataType, AttributeType, IndexType } from './common/interfaces/enums';
declare const Types: {
    PayloadType: typeof PayloadType;
    DataType: typeof DataType;
    AttributeType: typeof AttributeType;
    IndexType: typeof IndexType;
};
export { NodeKwil, WebKwil, Types };
