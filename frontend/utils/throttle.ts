/**
 * Throttle utility for high-frequency updates
 * Similar to TradingView's approach for handling tick data
 */

/**
 * Throttle function execution to at most once per specified interval
 * Uses requestAnimationFrame for smooth updates
 * 
 * @param func - Function to throttle
 * @param delay - Minimum delay between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;

    return function throttled(...args: Parameters<T>) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        // Clear any pending timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        // If enough time has passed, execute immediately
        if (timeSinceLastCall >= delay) {
            lastCall = now;
            func(...args);
        } else {
            // Otherwise, schedule execution after remaining delay
            lastArgs = args;
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                if (lastArgs) {
                    func(...lastArgs);
                }
                timeoutId = null;
                lastArgs = null;
            }, delay - timeSinceLastCall);
        }
    };
}

/**
 * Request animation frame throttle - executes at most once per frame (~16ms)
 * Best for visual updates that need to stay in sync with browser rendering
 * 
 * @param func - Function to throttle
 * @returns Throttled function
 */
export function throttleRAF<T extends (...args: any[]) => void>(
    func: T
): (...args: Parameters<T>) => void {
    let rafId: number | null = null;
    let lastArgs: Parameters<T> | null = null;

    return function throttled(...args: Parameters<T>) {
        lastArgs = args;

        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                if (lastArgs) {
                    func(...lastArgs);
                }
                rafId = null;
                lastArgs = null;
            });
        }
    };
}

/**
 * Batch multiple updates and execute once
 * Useful for batching multiple symbol updates
 * 
 * @param func - Function to execute with batched data
 * @param delay - Batching window in milliseconds
 * @returns Batched function
 */
export function batchUpdates<T>(
    func: (batch: T[]) => void,
    delay: number = 50
): (item: T) => void {
    let batch: T[] = [];
    let timeoutId: NodeJS.Timeout | null = null;

    return function batched(item: T) {
        batch.push(item);

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            if (batch.length > 0) {
                func([...batch]);
                batch = [];
            }
            timeoutId = null;
        }, delay);
    };
}

/**
 * Debounce function - executes only after specified delay of inactivity
 * Good for search inputs and resize handlers
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return function debounced(...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, delay);
    };
}
