// Instrument cache for fast search with IndexedDB persistence
import api from '../services/api';

export interface Instrument {
    tradingSymbol: string;
    name: string;
    instrumentToken: number;
    exchange: string;
    segment: string;
    instrumentType: string;
    strike: number;
    expiry: string;
    optionType: 'CE' | 'PE' | null;
    searchText: string;
}

class InstrumentCache {
    private instruments: Instrument[] = [];
    private isLoaded: boolean = false;
    private isLoading: boolean = false;
    private dbName = 'InstrumentCacheDB';
    private storeName = 'instruments';
    private cacheVersion = 1;

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.cacheVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    private async getCachedInstruments(): Promise<{ instruments: Instrument[], timestamp: number } | null> {
        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get('cachedData');

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result || null);
            });
        } catch (error) {
            console.error('Failed to get cached instruments:', error);
            return null;
        }
    }

    private async setCachedInstruments(instruments: Instrument[]): Promise<void> {
        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put({
                    instruments,
                    timestamp: Date.now()
                }, 'cachedData');

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } catch (error) {
            console.error('Failed to cache instruments:', error);
        }
    }

    async loadInstruments(): Promise<void> {
        if (this.isLoaded || this.isLoading) return;

        this.isLoading = true;
        console.log('📥 Loading instruments...');

        try {
            const cached = await this.getCachedInstruments();
            const cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (cached && (Date.now() - cached.timestamp) < cacheMaxAge) {
                console.log(`✅ Loaded ${cached.instruments.length} instruments from cache`);
                this.instruments = cached.instruments;
                this.isLoaded = true;
                this.isLoading = false;

                const niftyCount = this.instruments.filter(i => i.name.toUpperCase() === 'NIFTY').length;
                const bankniftyCount = this.instruments.filter(i => i.name.toUpperCase() === 'BANKNIFTY').length;
                console.log(`📊 NIFTY: ${niftyCount}, BANKNIFTY: ${bankniftyCount} (cached)`);

                this.refreshCacheInBackground();
                return;
            }

            console.log('🌐 Fetching from backend...');
            const response = await api.get('/api/candles/instruments?exchange=NFO');
            const data = response.data;

            if (!data.instruments) {
                throw new Error('No instruments data received');
            }

            this.instruments = data.instruments
                .filter((inst: any) => {
                    if (inst.instrument_type !== 'CE' && inst.instrument_type !== 'PE') {
                        return false;
                    }
                    const name = inst.name?.toUpperCase() || '';
                    return name === 'NIFTY' || name === 'BANKNIFTY';
                })
                .map((inst: any) => ({
                    tradingSymbol: inst.tradingsymbol || '',
                    name: inst.name || '',
                    instrumentToken: inst.instrument_token || 0,
                    exchange: inst.exchange || 'NFO',
                    segment: inst.segment || 'NFO-OPT',
                    instrumentType: inst.instrument_type || '',
                    strike: inst.strike || 0,
                    expiry: inst.expiry || '',
                    optionType: inst.instrument_type === 'CE' ? 'CE' : inst.instrument_type === 'PE' ? 'PE' : null,
                    searchText: `${inst.name || ''} ${inst.strike || ''} ${inst.expiry || ''} ${inst.instrument_type || ''} ${inst.tradingsymbol || ''}`.toLowerCase()
                }));

            this.isLoaded = true;
            console.log(`✅ Loaded ${this.instruments.length} instruments`);

            const niftyCount = this.instruments.filter(i => i.name.toUpperCase() === 'NIFTY').length;
            const bankniftyCount = this.instruments.filter(i => i.name.toUpperCase() === 'BANKNIFTY').length;
            console.log(`📊 NIFTY: ${niftyCount}, BANKNIFTY: ${bankniftyCount}`);

            await this.setCachedInstruments(this.instruments);
            console.log('💾 Cached to IndexedDB');
        } catch (error) {
            console.error('❌ Failed to load instruments:', error);
            this.instruments = [];
        } finally {
            this.isLoading = false;
        }
    }

    private async refreshCacheInBackground(): Promise<void> {
        try {
            console.log('🔄 Refreshing cache...');
            const response = await api.get('/api/candles/instruments?exchange=NFO');
            const data = response.data;

            if (data.instruments) {
                const freshInstruments = data.instruments
                    .filter((inst: any) => {
                        if (inst.instrument_type !== 'CE' && inst.instrument_type !== 'PE') return false;
                        const name = inst.name?.toUpperCase() || '';
                        return name === 'NIFTY' || name === 'BANKNIFTY';
                    })
                    .map((inst: any) => ({
                        tradingSymbol: inst.tradingsymbol || '',
                        name: inst.name || '',
                        instrumentToken: inst.instrument_token || 0,
                        exchange: inst.exchange || 'NFO',
                        segment: inst.segment || 'NFO-OPT',
                        instrumentType: inst.instrument_type || '',
                        strike: inst.strike || 0,
                        expiry: inst.expiry || '',
                        optionType: inst.instrument_type === 'CE' ? 'CE' : inst.instrument_type === 'PE' ? 'PE' : null,
                        searchText: `${inst.name || ''} ${inst.strike || ''} ${inst.expiry || ''} ${inst.instrument_type || ''} ${inst.tradingsymbol || ''}`.toLowerCase()
                    }));

                await this.setCachedInstruments(freshInstruments);
                console.log('✅ Cache refreshed');
            }
        } catch (error) {
            console.error('❌ Refresh failed:', error);
        }
    }

    search(query: string, limit: number = 50): Instrument[] {
        if (!this.isLoaded) return [];
        if (!query || query.trim().length === 0) return [];

        const searchTerm = query.toLowerCase().trim();
        const results: Instrument[] = [];

        for (let i = 0; i < this.instruments.length && results.length < limit; i++) {
            const inst = this.instruments[i];
            if (inst.searchText.includes(searchTerm)) {
                results.push(inst);
            }
        }

        return results;
    }

    getByIndexAndStrike(index: string, strike: number, limit: number = 50): Instrument[] {
        if (!this.isLoaded) return [];

        const normalizedIndex = index.toUpperCase();
        const results: Instrument[] = [];

        for (let i = 0; i < this.instruments.length && results.length < limit; i++) {
            const inst = this.instruments[i];
            if (inst.name.toUpperCase() === normalizedIndex && inst.strike === strike) {
                results.push(inst);
            }
        }

        results.sort((a, b) => {
            const dateA = new Date(a.expiry).getTime();
            const dateB = new Date(b.expiry).getTime();
            if (dateA !== dateB) return dateA - dateB;

            if (a.optionType === 'CE' && b.optionType === 'PE') return -1;
            if (a.optionType === 'PE' && b.optionType === 'CE') return 1;
            return 0;
        });

        return results;
    }

    getATMStrikes(index: string, spotPrice: number, limit: number = 20): Instrument[] {
        if (!this.isLoaded) return [];

        const normalizedIndex = index.toUpperCase();

        const allStrikes = new Set<number>();
        for (const inst of this.instruments) {
            if (inst.name.toUpperCase() === normalizedIndex) {
                allStrikes.add(inst.strike);
            }
        }

        const sortedStrikes = Array.from(allStrikes).sort((a, b) => a - b);

        let atmIndex = 0;
        let minDist = Infinity;
        for (let i = 0; i < sortedStrikes.length; i++) {
            const dist = Math.abs(sortedStrikes[i] - spotPrice);
            if (dist < minDist) {
                minDist = dist;
                atmIndex = i;
            }
        }

        const orderedStrikes: number[] = [sortedStrikes[atmIndex]];
        let offset = 1;

        while (orderedStrikes.length < 10) {
            if (atmIndex + offset < sortedStrikes.length) {
                orderedStrikes.push(sortedStrikes[atmIndex + offset]);
            }
            if (atmIndex - offset >= 0) {
                orderedStrikes.push(sortedStrikes[atmIndex - offset]);
            }
            offset++;

            if (atmIndex + offset >= sortedStrikes.length && atmIndex - offset < 0) {
                break;
            }
        }

        const results: Instrument[] = [];

        for (const strike of orderedStrikes) {
            const strikeInstruments = this.getByIndexAndStrike(index, strike, 100);

            if (strikeInstruments.length > 0) {
                const nearestExpiry = strikeInstruments[0].expiry;
                const nearestExpiryInstruments = strikeInstruments.filter(
                    inst => inst.expiry === nearestExpiry
                );

                nearestExpiryInstruments.sort((a, b) => {
                    if (a.optionType === 'CE' && b.optionType === 'PE') return -1;
                    if (a.optionType === 'PE' && b.optionType === 'CE') return 1;
                    return 0;
                });

                results.push(...nearestExpiryInstruments);
            }

            if (results.length >= limit) break;
        }

        return results.slice(0, limit);
    }

    isReady(): boolean {
        return this.isLoaded;
    }

    getCount(): number {
        return this.instruments.length;
    }
}

export const instrumentCache = new InstrumentCache();

// Auto-load on import
if (typeof window !== 'undefined') {
    instrumentCache.loadInstruments();
}
