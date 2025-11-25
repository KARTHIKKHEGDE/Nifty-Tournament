declare module 'klinecharts' {
    export interface Chart {
        applyNewData(data: any[]): void;
        createIndicator(name: string, isOverlay: boolean, options?: any): string | null;
        removeIndicator(name: string): void;
        updateData(data: any): void;
        setStyles(styles: any): void;
        resize(): void;
    }

    export function init(container: HTMLElement, options?: any): Chart;
    export function dispose(container: HTMLElement): void;
}
