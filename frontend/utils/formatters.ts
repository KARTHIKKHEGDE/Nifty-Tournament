// Number formatting utilities
export const formatCurrency = (value: number | undefined | null, currency: string = '₹'): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return `${currency}0.00`;
    }
    return `${currency}${value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export const formatNumber = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '0';
    }
    return value.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

export const formatPercentage = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '0.00%';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
};

export const formatLargeNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '0';
    }
    if (value >= 10000000) {
        return `${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
        return `${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toString();
};

// Date formatting utilities
export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatDateTime = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatTime = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

export const getRelativeTime = (date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(date);
};

// Market utilities
export const isMarketOpen = (): boolean => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Market is closed on weekends (Saturday = 6, Sunday = 0)
    if (day === 0 || day === 6) return false;

    // Market hours: 9:15 AM to 3:30 PM IST
    const currentTime = hours * 60 + minutes;
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM

    return currentTime >= marketOpen && currentTime <= marketClose;
};

export const getMarketStatus = (): { status: string; message: string } => {
    if (isMarketOpen()) {
        return { status: 'open', message: 'Market is Open' };
    }

    const now = new Date();
    const day = now.getDay();

    if (day === 0 || day === 6) {
        return { status: 'closed', message: 'Market Closed (Weekend)' };
    }

    return { status: 'closed', message: 'Market Closed' };
};

// Price utilities
export const calculatePnL = (
    quantity: number,
    avgPrice: number,
    currentPrice: number,
    side: 'BUY' | 'SELL'
): number => {
    if (side === 'BUY') {
        return (currentPrice - avgPrice) * quantity;
    } else {
        return (avgPrice - currentPrice) * quantity;
    }
};

export const calculateROI = (pnl: number, investment: number): number => {
    if (investment === 0) return 0;
    return (pnl / investment) * 100;
};

export const getPriceColor = (value: number): string => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-400';
};

export const getPriceBgColor = (value: number): string => {
    if (value > 0) return 'bg-green-500/10';
    if (value < 0) return 'bg-red-500/10';
    return 'bg-gray-500/10';
};

// Options utilities
export const isITM = (strikePrice: number, spotPrice: number, optionType: 'CE' | 'PE'): boolean => {
    if (optionType === 'CE') {
        return spotPrice > strikePrice;
    } else {
        return spotPrice < strikePrice;
    }
};

export const isATM = (strikePrice: number, spotPrice: number, threshold: number = 50): boolean => {
    return Math.abs(strikePrice - spotPrice) <= threshold;
};

export const getMoneyness = (strikePrice: number, spotPrice: number, optionType: 'CE' | 'PE'): string => {
    if (isATM(strikePrice, spotPrice)) return 'ATM';
    if (isITM(strikePrice, spotPrice, optionType)) return 'ITM';
    return 'OTM';
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password);
};

// Local storage utilities
export const setLocalStorage = (key: string, value: any): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
};

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
};

export const removeLocalStorage = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

// Generate random ID
export const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
