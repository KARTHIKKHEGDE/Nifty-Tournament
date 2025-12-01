// Smart search utilities using in-memory instrument cache
import { instrumentCache, Instrument } from './instrumentCache';

export interface OptionQuery {
    index: string;
    strike: number | null;
    expiry: string | null;
    optionType: 'CE' | 'PE' | null;
    tradingSymbol?: string;
    instrumentToken?: number;
}

export type SearchSuggestion = string | OptionQuery;

const VALID_INDEXES = ['NIFTY', 'BANKNIFTY', 'SENSEX'];

export function filterIndexes(query: string): string[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];
    return VALID_INDEXES.filter(index =>
        index.toLowerCase().startsWith(normalizedQuery)
    );
}

export function getIndexDisplayName(index: string): string {
    const displayNames: { [key: string]: string } = {
        'NIFTY': 'NIFTY 50',
        'BANKNIFTY': 'BANKNIFTY',
        'SENSEX': 'SENSEX',
    };
    return displayNames[index] || index;
}

function hasIndexAndStrike(query: string): boolean {
    const normalized = query.toLowerCase().trim();
    const hasNumber = /\d+/.test(normalized);
    const hasIndex = VALID_INDEXES.some(idx => normalized.includes(idx.toLowerCase()));
    return hasIndex && hasNumber;
}

function extractIndexAndStrike(query: string): { index: string; strike: number } | null {
    const normalized = query.toLowerCase().trim();

    let index: string | null = null;
    for (const idx of VALID_INDEXES) {
        if (normalized.includes(idx.toLowerCase())) {
            index = idx;
            break;
        }
    }

    if (!index) return null;
    const strikeMatch = normalized.match(/\d+/);
    if (!strikeMatch) return null;

    const strike = parseInt(strikeMatch[0]);
    return { index, strike };
}

function instrumentToOption(inst: Instrument): OptionQuery {
    return {
        index: inst.name,
        strike: inst.strike,
        expiry: inst.expiry,
        optionType: inst.optionType,
        tradingSymbol: inst.tradingSymbol,
        instrumentToken: inst.instrumentToken
    };
}

async function getSpotPrice(index: string): Promise<number> {
    console.log(`🔍 [getSpotPrice] Called for: ${index}`);

    if (typeof window !== 'undefined') {
        try {
            const { useSymbolStore } = require('../stores/symbolStore');
            const watchlist = useSymbolStore.getState().watchlist;

            const indexMap: { [key: string]: string } = {
                'NIFTY': 'NIFTY 50',
                'BANKNIFTY': 'BANKNIFTY',
                'SENSEX': 'SENSEX',
            };

            const displayName = indexMap[index] || index;
            console.log(`📋 [getSpotPrice] Looking for "${displayName}" in watchlist`);

            const indexInWatchlist = watchlist.find((item: any) =>
                item.symbol === displayName || item.displayName === displayName
            );

            if (indexInWatchlist) {
                console.log(`✅ [getSpotPrice] Found in watchlist, LTP: ${indexInWatchlist.ltp}`);
                if (indexInWatchlist.ltp > 0) {
                    return indexInWatchlist.ltp;
                }
            } else {
                console.log(`⚠️ [getSpotPrice] Not found in watchlist`);
            }

            console.log(`🌙 [getSpotPrice] Fetching close price from API...`);
            const api = require('../services/api').default;

            const instrumentTokens: { [key: string]: number } = {
                'NIFTY': 256265,
                'BANKNIFTY': 260105,
                'SENSEX': 265,
            };

            const instrumentToken = instrumentTokens[index];
            if (instrumentToken) {
                try {
                    const response = await api.get(`/api/candles/${instrumentToken}?interval=day&limit=1`);
                    if (response.data && response.data.candles && response.data.candles.length > 0) {
                        const closePrice = response.data.candles[0].close;
                        console.log(`✅ [getSpotPrice] Using close price: ${closePrice}`);
                        return closePrice;
                    }
                } catch (error) {
                    console.error(`❌ [getSpotPrice] API failed:`, error);
                }
            }
        } catch (error) {
            console.error('❌ [getSpotPrice] Error:', error);
        }
    }

    const fallbackPrices: { [key: string]: number } = {
        'NIFTY': 24500,
        'BANKNIFTY': 51200,
        'SENSEX': 81000,
    };

    console.log(`⚠️ [getSpotPrice] Using fallback: ${fallbackPrices[index]}`);
    return fallbackPrices[index] || 0;
}

export async function getSuggestions(query: string): Promise<SearchSuggestion[]> {
    const trimmedQuery = query.trim();
    console.log(`🔍 [getSuggestions] Query: "${trimmedQuery}"`);

    if (!trimmedQuery) return [];

    if (!instrumentCache.isReady()) {
        console.warn('⚠️ [getSuggestions] Instrument cache not ready');
        return [];
    }

    if (hasIndexAndStrike(trimmedQuery)) {
        const extracted = extractIndexAndStrike(trimmedQuery);
        if (extracted) {
            console.log(`📊 [getSuggestions] Index + Strike: ${extracted.index} ${extracted.strike}`);
            const instruments = instrumentCache.getByIndexAndStrike(extracted.index, extracted.strike, 50);
            return instruments.map(instrumentToOption);
        }
    }

    const matchedIndexes = filterIndexes(trimmedQuery);
    console.log(`📋 [getSuggestions] Matched indexes:`, matchedIndexes);

    if (matchedIndexes.length > 0) {
        const index = matchedIndexes[0];
        const spotPrice = await getSpotPrice(index);
        console.log(`💰 [getSuggestions] Spot price for ${index}: ${spotPrice}`);

        const instruments = instrumentCache.getATMStrikes(index, spotPrice, 50);
        console.log(`📦 [getSuggestions] Found ${instruments.length} instruments`);
        return instruments.map(instrumentToOption);
    }

    const instruments = instrumentCache.search(trimmedQuery, 50);
    if (instruments.length > 0) {
        return instruments.map(instrumentToOption);
    }

    return [];
}

export function formatSuggestion(suggestion: SearchSuggestion): string {
    if (typeof suggestion === 'string') {
        return getIndexDisplayName(suggestion);
    }

    const parts: string[] = [suggestion.index, suggestion.strike?.toString() || ''];

    if (suggestion.expiry) {
        const date = new Date(suggestion.expiry);
        const day = date.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        parts.push(`${day} ${monthNames[date.getMonth()]}`);
    }

    if (suggestion.optionType) {
        parts.push(suggestion.optionType);
    }

    return parts.join(' ');
}

export function isOptionSuggestion(suggestion: SearchSuggestion): suggestion is OptionQuery {
    return typeof suggestion !== 'string';
}

export function isValidIndex(query: string): boolean {
    const normalized = query.toUpperCase().trim();
    return VALID_INDEXES.includes(normalized);
}

export async function initializeInstrumentCache(): Promise<void> {
    await instrumentCache.loadInstruments();
}
