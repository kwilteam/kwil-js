import { Nillable } from './types';

export namespace Cache {
    /**
     * Create a new TTL cache that proactively checks for expired items at regular intervals (defined by cleanupIntervalSeconds).
        * @param ttlSeconds - Time to live for each cache entry in seconds. If none is specified, it defaults to 10 minutes.
        * @param cleanupIntervalSeconds - Interval in seconds between each cleanup run. If not set, it defaults to 60 seconds. If set to -1, the cache will run in passive mode and only check for expired items when get() is called.
        * @returns Cache<T>
    */
    export function active<T>(ttlSeconds: number = 10 * 60, cleanupIntervalSeconds: number = 60): Cache<T> {
        return new TtlCache<T>(ttlSeconds, cleanupIntervalSeconds);
    }

    /** 
     * Create a new TTL cache that only checks for expired items when get() is called.
     * @param ttlSeconds - Time to live for each cache entry in seconds. If none is specified, it defaults to 10 minutes.
     * @returns Cache<T>
    */
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
    private readonly cache: Map<string, { d: number, v: any }>;
    private readonly ttl: number;
    private readonly cleanupIntervalSeconds: number;
    private readonly cleanupQueue: { d: number, k: string }[];
    private cleanupTimerId: any;

    constructor(ttlSeconds: number, cleanupIntervalSeconds: number) {
        this.cache = new Map<string, { d: number, v: any }>();
        this.ttl = ttlSeconds * 1000;
        this.cleanupIntervalSeconds = cleanupIntervalSeconds;
        this.cleanupQueue = [];

        console.log(`Cache TTL set to ${this.ttl} milliseconds.`)
        if (!this.isPassiveMode()) {
            console.log(`Cache cleanup interval set to ${cleanupIntervalSeconds} seconds.`)
        } else {
            console.log(`Cache cleanup running in passive mode.`)
        }
    }

    /**
     * Set a value in the cache
     * @param k - Key for the cache entry.
     * @param v - Value to be stored.
     */
    public set(k: string, v: T): void {
        this.ensureCleanRunning();
        const d = Date.now() + this.ttl;
        this.cache.set(k, { d, v });
        if (!this.isPassiveMode()) {
            this.cleanupQueue.push({ d, k });
        }
    }

    /**
     * Get a value from the cache. If the value is not found or has expired, null is returned.
     * @param k - Key for the cache entry.
     * @param v - Value to be stored.
    */
    public get(k: string): Nillable<T> {
        const entry = this.cache.get(k);

        if (entry && entry.d < Date.now()) {
            this.cache.delete(k);
            return null;
        }

        return entry?.v || null;
    }

    /**
     * This will shutdown the cache cleanup timer.
     * @returns void
    */
    public shutdown(): void {
        if (this.cleanupTimerId) {
            clearInterval(this.cleanupTimerId);
        }
    }

    /**
     * Ensures that the background cleanup is running and the timer is set.
     * @returns void
     * @private
     */
    private ensureCleanRunning(): void {
        if (this.isPassiveMode()) {
            return;
        }

        if (!this.cleanupTimerId) {
            this.cleanupTimerId =
                setInterval(
                    this.cleanup.bind(this),
                    this.cleanupIntervalSeconds * 1000
                );

            console.log(`Background cache cleanup started. Interval of ${this.cleanupIntervalSeconds} seconds between cleaup.`)
        }
    }

    /**
     * Checks if the cache is running in passive mode.
     * @returns boolean
     * @private
     */
    private isPassiveMode(): boolean {
        return this.cleanupIntervalSeconds <= 0;
    }

    /**
     * Cleanup the cache. This will remove all expired entries from the cache.
     * @returns void
     * @private
    */
    private cleanup(): void {
        let removed = 0;
        while (this.cleanupQueue.length > 0) {
            const entry = this.cleanupQueue[0];
            if (entry.d > Date.now()) {
                break;
            }

            const cacheEntry = this.cache.get(entry.k);
            if (cacheEntry && cacheEntry.d < Date.now()) {
                this.cache.delete(entry.k);
                removed++;
            }

            this.cleanupQueue.shift();
        }

        console.log(`Running background cache cleanup. Removed ${removed} entries.`)
    }
}