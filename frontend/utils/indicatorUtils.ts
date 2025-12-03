/**
 * Indicator Utilities for KlineCharts
 * Contains indicator configurations and helper functions
 */

export interface IndicatorConfig {
    paneId: string;
    isOverlay: boolean;
    calcParams: number[];
}

/**
 * Get indicator configuration by name
 */
export function getIndicatorConfig(indicatorName: string): IndicatorConfig {
    let paneId = 'candle_pane';
    let isOverlay = true;
    let calcParams: number[] = [];

    switch (indicatorName) {
        // Trend Indicators
        case 'MA':
            calcParams = [5, 10, 20, 60];
            isOverlay = true;
            break;
        case 'EMA':
            calcParams = [6, 12, 26];
            isOverlay = true;
            break;
        case 'SMA':
            calcParams = [12, 26];
            isOverlay = true;
            break;
        case 'WMA':
            calcParams = [12, 26];
            isOverlay = true;
            break;
        case 'BBI':
            calcParams = [3, 6, 12, 24];
            isOverlay = true;
            break;
        case 'BOLL':
            calcParams = [20, 2];
            isOverlay = true;
            break;
        case 'SAR':
            calcParams = [2, 2, 20];
            isOverlay = true;
            break;
        case 'ICHIMOKU':
            calcParams = [26, 9, 52];
            isOverlay = true;
            break;

        // Momentum Indicators
        case 'MACD':
            calcParams = [12, 26, 9];
            isOverlay = false;
            paneId = 'macd_pane';
            break;
        case 'KDJ':
            calcParams = [9, 3, 3];
            isOverlay = false;
            paneId = 'kdj_pane';
            break;
        case 'RSI':
            calcParams = [6, 12, 24];
            isOverlay = false;
            paneId = 'rsi_pane';
            break;
        case 'WR':
            calcParams = [6, 10, 14];
            isOverlay = false;
            paneId = 'wr_pane';
            break;
        case 'ROC':
            calcParams = [12, 6];
            isOverlay = false;
            paneId = 'roc_pane';
            break;
        case 'CCI':
            calcParams = [13];
            isOverlay = false;
            paneId = 'cci_pane';
            break;
        case 'TRIX':
            calcParams = [12, 9];
            isOverlay = false;
            paneId = 'trix_pane';
            break;

        // Volume Indicators
        case 'VOL':
            calcParams = [5, 10, 20];
            isOverlay = false;
            paneId = 'volume_pane';
            break;
        case 'OBV':
            calcParams = [30];
            isOverlay = false;
            paneId = 'obv_pane';
            break;

        // Volatility Indicators
        case 'ATR':
            calcParams = [14];
            isOverlay = false;
            paneId = 'atr_pane';
            break;
        case 'BIAS':
            calcParams = [6, 12, 24];
            isOverlay = false;
            paneId = 'bias_pane';
            break;

        // Market Strength Indicators
        case 'BRAR':
            calcParams = [26];
            isOverlay = false;
            paneId = 'brar_pane';
            break;
        case 'VR':
            calcParams = [26, 6];
            isOverlay = false;
            paneId = 'vr_pane';
            break;
        case 'PSY':
            calcParams = [12, 6];
            isOverlay = false;
            paneId = 'psy_pane';
            break;
    }

    return { paneId, isOverlay, calcParams };
}

/**
 * Custom ATR indicator definition
 */
export const customATRIndicator = {
    name: 'ATR',
    shortName: 'ATR',
    calcParams: [14],
    figures: [{ key: 'atr', title: 'ATR: ', type: 'line' }],
    calc: (dataList: any[], indicator: any) => {
        const params = indicator.calcParams;
        const period = params[0];
        const result: any[] = [];
        const trList: number[] = [];

        dataList.forEach((kLineData, i) => {
            const prevClose = i > 0 ? dataList[i - 1].close : kLineData.open;
            const high = kLineData.high;
            const low = kLineData.low;

            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );
            trList.push(tr);

            let atr;
            if (i >= period - 1) {
                if (i === period - 1) {
                    let sum = 0;
                    for (let j = 0; j < period; j++) {
                        sum += trList[j];
                    }
                    atr = sum / period;
                } else {
                    const prevAtr = result[i - 1].atr;
                    atr = (prevAtr * (period - 1) + tr) / period;
                }
            }

            result.push({ atr });
        });
        return result;
    },
};

/**
 * Toggle indicator on/off in the chart
 */
export function toggleIndicator(
    chartInstance: any,
    indicatorName: string,
    activeIndicators: string[],
    setActiveIndicators: (indicators: string[]) => void,
    setShowIndicatorMenu: (show: boolean) => void
) {
    if (!chartInstance) return;

    const { paneId, isOverlay, calcParams } = getIndicatorConfig(indicatorName);

    if (activeIndicators.includes(indicatorName)) {
        // Remove indicator
        chartInstance.removeIndicator(paneId, indicatorName);
        setActiveIndicators(
            activeIndicators.filter((ind) => ind !== indicatorName)
        );
    } else {
        // Add indicator
        chartInstance.createIndicator(indicatorName, isOverlay, {
            id: paneId,
            calcParams,
        });
        setActiveIndicators([...activeIndicators, indicatorName]);
    }

    setShowIndicatorMenu(false);
}
