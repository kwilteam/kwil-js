import {Nillable} from "./types";

export namespace Cache {
    export function ttl<T>(ttlSeconds: number = 10 * 60, cleanupIntervalSeconds: number = 60): Cache<T> {
        return new TtlCache<T>(ttlSeconds, cleanupIntervalSeconds);
    }
}

export interface Cache<T> {
    get(k: string): Nillable<T>;
    set(k: string, v: T): void;
    shutdown(): void;
}

class TtlCache<T> {
    private readonly cache: Map<string, {d: number, v: any}>;
    private readonly ttl: number;
    private readonly cleanupTimerId: any;
    private readonly cleanupQueue: {d: number, k: string}[] = [];

    constructor(ttlSeconds: number = 10 * 60, cleanupIntervalSeconds: number = 60) {
        this.cache = new Map<string, any>();
        this.ttl = ttlSeconds * 1000;
        this.cleanupTimerId =
            setInterval(
                this.cleanup.bind(this),
                cleanupIntervalSeconds * 1000);
    }

    public set(k: string, v: T): void {
        const d = Date.now() + this.ttl;
        this.cache.set(k, {d, v});
        this.cleanupQueue.push({d, k});
    }

    public get(k: string): Nillable<T> {
        const entry = this.cache.get(k);
        if (entry && entry.d < Date.now()) {
            return entry.v;
        }

        if (entry) {
            this.cache.delete(k)
        }

        return null;
    }

    public shutdown(): void {
        clearTimeout(this.cleanupTimerId);
    }

    private cleanup(): void {
        while (this.cleanupQueue.length > 0) {
            const entry = this.cleanupQueue[0];
            if (entry.d > Date.now()) {
                break;
            }

            const cacheEntry = this.cache.get(entry.k);
            // Just in case it was updated later, we want to keep it in
            // the cache and remove the older cleanup queue entry
            if (cacheEntry && cacheEntry.d >= Date.now()) {
                this.cache.delete(entry.k);
            }

            this.cleanupQueue.shift();
        }
    }
}