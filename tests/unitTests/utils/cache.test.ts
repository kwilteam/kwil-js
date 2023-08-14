import { Cache } from '../../../src/utils/cache';

describe('Cache', () => {
    describe('when set to active', () => {
        let activeCache: Cache<string> = Cache.active();
        
        beforeEach(() => {
            jest.useFakeTimers();
            activeCache = Cache.active(100, 1);
        })

        afterEach(() => {
            activeCache?.shutdown();
            jest.clearAllTimers();
        })

        it('should set a value with a time', () => {
            activeCache.set('key', 'hello world')
            const cachedTime = Date.now();

            expect((activeCache as any).cache.get('key').v).toEqual('hello world');
            expect((activeCache as any).cache.get('key').d).toBeGreaterThan(cachedTime);
        })

        it('should get a value', () => {
            activeCache.set('key', 'hello world');
            const res = activeCache.get('key');
            expect(res).toEqual('hello world');
        })

        it('should remove an item from the cache after it is stale', () => {
            const mockSetInterval = jest.fn(() => 12345) as unknown as jest.MockedFunction<typeof setInterval>;
            (mockSetInterval.__promisify__ as unknown) = jest.fn();

            global.setInterval = mockSetInterval;
            activeCache.set('key', 'hello world');
            const res1 = activeCache.get('key');
            expect(res1).toEqual('hello world');

            jest.advanceTimersByTime(101 * 1000);

            const res2 = activeCache.get('key');
            expect(setInterval).toHaveBeenCalledTimes(1);
            expect(res2).toBe(null);
        })

        it('should shutdown the cache cleanup', () => {
            const mockSetInterval = jest.fn(() => 12345) as unknown as jest.MockedFunction<typeof setInterval>;
            (mockSetInterval.__promisify__ as unknown) = jest.fn();

            global.setInterval = mockSetInterval;
            global.clearInterval = jest.fn();


            activeCache.set('key', 'hello world');

            // advance timers
            jest.advanceTimersByTime(2 * 1000);

            // At this point, the cleanup interval should be running
            expect(setInterval).toHaveBeenCalledTimes(1);

            activeCache.shutdown();
        
            // Ensure that clearInterval was called to clear the cleanup interval
            expect(clearInterval).toHaveBeenCalledTimes(1);
        });  
    });

    describe('when set to passive', () => {
        let passiveCache: Cache<string> = Cache.passive();
        
        beforeEach(() => {
            jest.useFakeTimers();
            passiveCache = Cache.passive(100);
        })

        afterEach(() => {
            jest.clearAllTimers();
        })

        it('should set a value with a time', () => {
            passiveCache.set('key', 'hello world')
            const cachedTime = Date.now();

            expect((passiveCache as any).cache.get('key').v).toEqual('hello world');
            expect((passiveCache as any).cache.get('key').d).toBeGreaterThan(cachedTime);
        })

        it('should get a value', () => {
            passiveCache.set('key', 'hello world');
            const res = passiveCache.get('key');
            expect(res).toEqual('hello world');
        });

        it('should remove an item from the cache after it is stale', () => {
            const mockSetInterval = jest.fn(() => 12345) as unknown as jest.MockedFunction<typeof setInterval>;
            (mockSetInterval.__promisify__ as unknown) = jest.fn();

            global.setInterval = mockSetInterval;
            passiveCache.set('key', 'hello world');
            const res1 = passiveCache.get('key');
            expect(res1).toEqual('hello world');

            jest.advanceTimersByTime(101 * 1000);

            const res2 = passiveCache.get('key');
            expect(res2).toBe(null);
            expect(setInterval).toHaveBeenCalledTimes(0);
        });

        it('should shutdown the cache cleanup', () => {
            const mockSetInterval = jest.fn(() => 12345) as unknown as jest.MockedFunction<typeof setInterval>;
            (mockSetInterval.__promisify__ as unknown) = jest.fn();

            global.setInterval = mockSetInterval;
            global.clearInterval = jest.fn();


            passiveCache.set('key', 'hello world');

            // advance timers
            jest.advanceTimersByTime(2 * 1000);

            // In passive, setInterval does not run
            expect(setInterval).toHaveBeenCalledTimes(0);

            passiveCache.shutdown();
        
            // clearInterval also does not run
            expect(clearInterval).toHaveBeenCalledTimes(0);
        });
    })
})