export class AnyMap<T> {
    map: any;

    constructor() {
        this.map = {}
    }

    set(key: any, value: T) {
        this.map[key] = value
    }

    get(key: any): T {
        return this.map[key]
    }

    delete(key: any) {
        delete this.map[key]
    }

    values(): T[] {
        return Object.values(this.map)
    }

    forEach(callback: (value: T, key: any) => void) {
        for (let key in this.map) {
            callback(this.map[key], key)
        }
    }

    modifyAll(callback: (value: T) => T) {
        for (let key in this.map) {
            this.map[key] = callback(this.map[key])
        }
    }
}
