import { NodeKwil } from './client/node/nodeKwil';
import { WebKwil } from './client/web/webKwil';
import { generateDBID } from './utils/dbid';
import { TxReceipt as _TxReceipt } from './core/tx';
import { Funder as _Funder } from './funder/funding';
import { ActionBuilder as _ActionBuilder } from './core/builders';
declare namespace Types {
    type TxReceipt = _TxReceipt;
    type Funder = _Funder;
    type ActionBuilder = _ActionBuilder;
}
declare const Utils: {
    generateDBID: typeof generateDBID;
};
export { NodeKwil, WebKwil, Types, Utils };
