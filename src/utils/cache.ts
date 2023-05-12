import {Nillable} from "./types";

export namespace Cache {
    export function active<T>(ttlSeconds: number = 10 * 60, cleanupIntervalSeconds: number = 60): Cache<T> {
        return new TtlCache<T>(ttlSeconds, cleanupIntervalSeconds);
    }

    export function passive<T>(ttlSeconds: number = 10 * 60): Cache<T> {
        return new TtlCache<T>(ttlSeconds, -1);
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
    private readonly cleanupIntervalSeconds: number
    private readonly cleanupQueue: {d: number, k: string}[] = [];
    private cleanupTimerId: any;

    constructor(ttlSeconds: number, cleanupIntervalSeconds: number) {
        this.cache = new Map<string, any>();
        this.ttl =  ttlSeconds * 1000;
        this.cleanupIntervalSeconds = cleanupIntervalSeconds;

        console.log(`Cache TTL set to ${this.ttl} milliseconds.`)
        if (!this.isPassiveMode() ) {
            console.log(`Cache cleanup interval set to ${cleanupIntervalSeconds} seconds.`)
        } else {
            console.log(`Cache cleanup running in passive mode.`)
        }
    }

    public set(k: string, v: T): void {
        this.ensureCleanRunning();
        const d = Date.now() + this.ttl;
        this.cache.set(k, {d, v});
        if (!this.isPassiveMode()) {
            this.cleanupQueue.push({d, k});
        }
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
        if (this.cleanupTimerId) {
            clearInterval(this.cleanupTimerId);
        }
    }

    private ensureCleanRunning(): void {
        if (this.isPassiveMode()) {
            return;
        }

        if (!this.cleanupTimerId) {
            this.cleanupTimerId =
                setInterval(
                    this.cleanup.bind(this),
                    this.cleanupIntervalSeconds * 1000);

            console.log(`Background cache cleanup started. Interval of ${this.cleanupIntervalSeconds} seconds between cleaup.`)
        }
    }

    private isPassiveMode(): boolean {
        return this.cleanupIntervalSeconds <= 0;
    }

    private cleanup(): void {
        let removed = 0;
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

        console.log(`Running background cache cleanup. Removed ${removed} entries.`)
    }
}