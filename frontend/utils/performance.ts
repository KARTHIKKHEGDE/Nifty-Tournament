/**
 * Performance monitoring utilities
 * Track tick processing rates and rendering performance
 */

class PerformanceMonitor {
    private tickCounts: Map<string, number> = new Map();
    private lastLogTime: number = Date.now();
    private renderCounts: Map<string, number> = new Map();
    private logInterval: number = 10000; // Log every 10 seconds

    /**
     * Record a tick received for a symbol
     */
    recordTick(symbol: string) {
        const count = this.tickCounts.get(symbol) || 0;
        this.tickCounts.set(symbol, count + 1);
        this.maybeLogStats();
    }

    /**
     * Record a component render
     */
    recordRender(component: string) {
        const count = this.renderCounts.get(component) || 0;
        this.renderCounts.set(component, count + 1);
    }

    /**
     * Get current tick rate for a symbol
     */
    getTickRate(symbol: string): number {
        const elapsed = (Date.now() - this.lastLogTime) / 1000;
        const count = this.tickCounts.get(symbol) || 0;
        return elapsed > 0 ? count / elapsed : 0;
    }

    /**
     * Get total ticks across all symbols
     */
    getTotalTicks(): number {
        return Array.from(this.tickCounts.values()).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Get render count for a component
     */
    getRenderCount(component: string): number {
        return this.renderCounts.get(component) || 0;
    }

    /**
     * Log statistics periodically
     */
    private maybeLogStats() {
        const now = Date.now();
        const elapsed = now - this.lastLogTime;

        if (elapsed >= this.logInterval) {
            const elapsedSeconds = elapsed / 1000;
            const totalTicks = this.getTotalTicks();
            const ticksPerSecond = totalTicks / elapsedSeconds;

            console.log('📊 [Performance Monitor] ─────────────────────────');
            console.log(`⏱️  Interval: ${elapsedSeconds.toFixed(1)}s`);
            console.log(`📈 Total Ticks: ${totalTicks} (${ticksPerSecond.toFixed(1)}/sec)`);
            
            // Top symbols by tick rate
            const symbolRates = Array.from(this.tickCounts.entries())
                .map(([symbol, count]) => ({
                    symbol,
                    rate: count / elapsedSeconds
                }))
                .sort((a, b) => b.rate - a.rate)
                .slice(0, 5);

            if (symbolRates.length > 0) {
                console.log('🔥 Top Symbols:');
                symbolRates.forEach(({ symbol, rate }) => {
                    console.log(`   ${symbol}: ${rate.toFixed(1)} ticks/sec`);
                });
            }

            // Render counts
            if (this.renderCounts.size > 0) {
                console.log('🎨 Component Renders:');
                Array.from(this.renderCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([component, count]) => {
                        const rendersPerSecond = count / elapsedSeconds;
                        console.log(`   ${component}: ${count} (${rendersPerSecond.toFixed(1)}/sec)`);
                    });
            }

            console.log('─────────────────────────────────────────────────');

            // Reset counters
            this.reset();
        }
    }

    /**
     * Reset all counters
     */
    reset() {
        this.tickCounts.clear();
        this.renderCounts.clear();
        this.lastLogTime = Date.now();
    }

    /**
     * Get statistics summary
     */
    getStats() {
        const elapsed = (Date.now() - this.lastLogTime) / 1000;
        return {
            totalTicks: this.getTotalTicks(),
            ticksPerSecond: elapsed > 0 ? this.getTotalTicks() / elapsed : 0,
            symbolCounts: Object.fromEntries(this.tickCounts),
            renderCounts: Object.fromEntries(this.renderCounts),
            elapsedSeconds: elapsed
        };
    }

    /**
     * Enable/disable monitoring
     */
    enabled: boolean = false;

    enable() {
        this.enabled = true;
        console.log('✅ Performance monitoring enabled');
    }

    disable() {
        this.enabled = false;
        console.log('⏸️  Performance monitoring disabled');
    }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
    (window as any).perfMonitor = perfMonitor;
}

/**
 * React hook to track component renders
 */
export function useRenderCounter(componentName: string) {
    if (perfMonitor.enabled) {
        perfMonitor.recordRender(componentName);
    }
}

/**
 * Measure function execution time
 */
export function measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (duration > 16) { // Warn if slower than 1 frame (60fps)
        console.warn(`⚠️ [Performance] ${name} took ${duration.toFixed(2)}ms (> 16ms frame budget)`);
    }
    
    return result;
}

/**
 * Async version of measureTime
 */
export async function measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`⏱️  [Performance] ${name} took ${duration.toFixed(2)}ms`);
    
    return result;
}
