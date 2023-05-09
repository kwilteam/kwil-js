import NodeKwil from './node/nodeKwil';
import WebKwil from './web/webKwil';
import { generateDBID } from './utils/dbid';
import { TxReceipt as _TxReceipt } from './common/interfaces/tx';
import { Funder as _Funder } from './common/funder/funding';
import { Action as _Action } from './common/action/action';
import { DBBuilder as _DBBuilder } from './common/builder/builder';
declare namespace Types {
    type TxReceipt = _TxReceipt;
    type Funder = _Funder;
    type Action = _Action;
    type DBBuilder = _DBBuilder;
}
declare const Utils: {
    generateDBID: typeof generateDBID;
};
export { NodeKwil, WebKwil, Types, Utils };
