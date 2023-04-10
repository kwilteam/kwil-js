"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyMap = void 0;
class AnyMap {
    constructor() {
        this.map = {};
    }
    set(key, value) {
        this.map[key] = value;
    }
    get(key) {
        return this.map[key];
    }
    delete(key) {
        delete this.map[key];
    }
    values() {
        return Object.values(this.map);
    }
    forEach(callback) {
        for (let key in this.map) {
            callback(this.map[key], key);
        }
    }
    modifyAll(callback) {
        for (let key in this.map) {
            this.map[key] = callback(this.map[key]);
        }
    }
}
exports.AnyMap = AnyMap;
