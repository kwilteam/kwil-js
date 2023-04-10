"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadType = void 0;
var PayloadType;
(function (PayloadType) {
    PayloadType[PayloadType["INVALID_PAYLOAD_TYPE"] = 100] = "INVALID_PAYLOAD_TYPE";
    PayloadType[PayloadType["DEPLOY_DATABASE"] = 101] = "DEPLOY_DATABASE";
    PayloadType[PayloadType["MODIFY_DATABASE"] = 102] = "MODIFY_DATABASE";
    PayloadType[PayloadType["DROP_DATABASE"] = 103] = "DROP_DATABASE";
    PayloadType[PayloadType["EXECUTE_ACTION"] = 104] = "EXECUTE_ACTION";
})(PayloadType = exports.PayloadType || (exports.PayloadType = {}));
