"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputToDataType = exports.DataTypeToString = exports.DataTypeEnumToInteger = exports.IndexType = exports.AttributeType = exports.DataType = void 0;
var DataType;
(function (DataType) {
    DataType[DataType["INVALID_TYPE"] = 100] = "INVALID_TYPE";
    DataType[DataType["NULL"] = 101] = "NULL";
    DataType[DataType["TEXT"] = 102] = "TEXT";
    DataType[DataType["INT"] = 103] = "INT";
})(DataType = exports.DataType || (exports.DataType = {}));
var AttributeType;
(function (AttributeType) {
    AttributeType[AttributeType["INVALID_ATTRIBUTE_TYPE"] = 100] = "INVALID_ATTRIBUTE_TYPE";
    AttributeType[AttributeType["PRIMARY_KEY"] = 101] = "PRIMARY_KEY";
    AttributeType[AttributeType["UNIQUE"] = 102] = "UNIQUE";
    AttributeType[AttributeType["NOT_NULL"] = 103] = "NOT_NULL";
    AttributeType[AttributeType["DEFAULT"] = 104] = "DEFAULT";
    AttributeType[AttributeType["MIN"] = 105] = "MIN";
    AttributeType[AttributeType["MAX"] = 106] = "MAX";
    AttributeType[AttributeType["MIN_LENGTH"] = 107] = "MIN_LENGTH";
    AttributeType[AttributeType["MAX_LENGTH"] = 108] = "MAX_LENGTH";
})(AttributeType = exports.AttributeType || (exports.AttributeType = {}));
var IndexType;
(function (IndexType) {
    IndexType[IndexType["INVALID_INDEX_TYPE"] = 100] = "INVALID_INDEX_TYPE";
    IndexType[IndexType["BTREE"] = 101] = "BTREE";
    IndexType[IndexType["UNIQUE_BTREE"] = 102] = "UNIQUE_BTREE";
})(IndexType = exports.IndexType || (exports.IndexType = {}));
function DataTypeEnumToInteger(enumValue) {
    /*
        Javascript passes enums as strings and this does not get caught by the compiler.
        This function will convert the enum to an integer even if it is a string.
    */
    if (typeof enumValue === "string") {
        switch (enumValue) {
            case "INVALID_TYPE":
                return 100;
            case "NULL":
                return 101;
            case "TEXT":
                return 102;
            case "INT":
                return 103;
            default:
                console.log("Invalid enum value: " + enumValue);
                return 0;
        }
    }
    switch (enumValue) {
        case DataType.INVALID_TYPE:
            return 100;
        case DataType.NULL:
            return 101;
        case DataType.TEXT:
            return 102;
        case DataType.INT:
            return 103;
        default:
            console.log("Invalid enum value: " + enumValue);
            return 0;
    }
}
exports.DataTypeEnumToInteger = DataTypeEnumToInteger;
function DataTypeToString(dataType) {
    switch (DataTypeEnumToInteger(dataType)) {
        case DataType.INVALID_TYPE:
            return "INVALID_TYPE";
        case DataType.NULL:
            return "NULL";
        case DataType.TEXT:
            return "TEXT";
        case DataType.INT:
            return "INT";
        default:
            throw new Error("cannot convert data type to string: unknown type: " + dataType);
    }
}
exports.DataTypeToString = DataTypeToString;
function inputToDataType(input) {
    if (input === null) {
        return DataType.NULL;
    }
    if (typeof input === "string") {
        return DataType.TEXT;
    }
    if (typeof input === "number") {
        return DataType.INT;
    }
    throw new Error("cannot convert input to data type: unknown type: " + typeof input);
}
exports.inputToDataType = inputToDataType;
