import NodeKwil from './node/nodeKwil';
import WebKwil from './web/webKwil';
import { generateDBID } from './utils/dbid';
import { TxReceipt as _TxReceipt } from './common/interfaces/tx';
declare namespace Types {
    type TxReceipt = _TxReceipt;
}
declare const Utils: {
    generateDBID: typeof generateDBID;
};
export { NodeKwil, WebKwil, Types, Utils };
