import React, { useState, useEffect } from 'react';
import { generateImageFromPrompt } from '../services/geminiService';
import { PhotoIcon } from './Icons';

const CACHE_KEY = 'fitpilotImageCache';
const CACHE_LIMIT_MB = 4.5; // Leave some space for other localStorage usage
const CACHE_LIMIT_BYTES = CACHE_LIMIT_MB * 1024 * 1024;

interface CacheEntry {
    url: string;
    timestamp: number;
    size: number; // size in bytes
}

// In-memory flag to prevent concurrent requests after a quota error.
// Initialized from sessionStorage to persist across component re-mounts within the same session.
let isApiLimitExceededThisSession = sessionStorage.getItem('isApiLimitExceeded') === 'true';


// --- Caching Utilities ---

const getCache = (): Map<string, CacheEntry> => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            // The stored format is an array of [key, value] pairs
            return new Map(JSON.parse(cachedData));
        }
    } catch (e) {
        console.error("Failed to read or parse image cache, starting fresh.", e);
        localStorage.removeItem(CACHE_KEY); // Clear potentially corrupted data
    }
    return new Map();
};

const setCache = (cache: Map<string, CacheEntry>) => {
    try {
        const stringifiedCache = JSON.stringify(Array.from(cache.entries()));
        localStorage.setItem(CACHE_KEY, stringifiedCache);
    } catch (e) {
        console.error("Failed to write to image cache.", e);
        // This might be a QuotaExceededError, which the eviction logic should prevent,
        // but we'll handle it defensively.
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
             console.warn('Image cache quota exceeded despite eviction logic. Clearing cache.');
             localStorage.removeItem(CACHE_KEY);
        }
    }
};

const getCachedImage = (prompt: string): string | null => {
    const cache = getCache();
    const entry = cache.get(prompt);
    if (entry) {
        // Update timestamp to mark as recently used (for LRU)
        entry.timestamp = Date.now();
        setCache(cache); // Re-save the cache with the updated timestamp
        return entry.url;
    }
    return null;
};

const setCachedImage = (prompt: string, url: string) => {
    const cache = getCache();

    // Estimate size of the new entry. Base64 is ~4/3 the size of original data.
    const newEntrySize = url.length * 0.75;

    // Don't cache if a single image is larger than our limit
    if (newEntrySize > CACHE_LIMIT_BYTES) {
        console.warn(`Image for prompt "${prompt}" is too large to cache.`);
        return;
    }

    // --- New, Safer Eviction Logic ---
    // 1. Calculate current size
    let currentSize = 0;
    for (const entry of cache.values()) {
        currentSize += entry.size;
    }

    // 2. Evict old entries until there's enough space for the new one
    while (currentSize + newEntrySize > CACHE_LIMIT_BYTES && cache.size > 0) {
        let oldestKey: string | null = null;
        let oldestTimestamp = Infinity;

        // Find the least recently used entry
        for (const [key, entry] of cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const evictedEntry = cache.get(oldestKey);
            if (evictedEntry) {
                currentSize -= evictedEntry.size;
                cache.delete(oldestKey);
                console.log(`Cache eviction: removed "${oldestKey}" to free up space.`);
            }
        } else {
            // Should not happen if cache size > 0
            break;
        }
    }

    // 3. Now that space is guaranteed, add the new item
    const newEntry: CacheEntry = {
        url,
        timestamp: Date.now(),
        size: newEntrySize,
    };
    cache.set(prompt, newEntry);

    // 4. Save the updated cache
    setCache(cache);
};


interface AIImageProps {
    prompt: string;
    alt: string;
    className: string;
}

const AIImage: React.FC<AIImageProps> = ({ prompt, alt, className }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const handleApiLimitReached = () => {
            if (isMounted) {
                setError('API limit reached. Images unavailable for this session.');
                setIsLoading(false);
            }
        };

        // Listen for a global event indicating API failure
        window.addEventListener('apiRateLimited', handleApiLimitReached);
        
        const initializeImage = async () => {
            setIsLoading(true);
            setError(null);

            // First, check the flag. If it's already set, don't do anything else.
            if (isApiLimitExceededThisSession) {
                handleApiLimitReached();
                return;
            }

            const cachedUrl = getCachedImage(prompt);
            if (cachedUrl) {
                if (isMounted) {
                    setImageUrl(cachedUrl);
                    setIsLoading(false);
                }
                return;
            }

            // Not in cache, so generate. This is the only place we call the API.
            try {
                const url = await generateImageFromPrompt(prompt);
                if (isMounted) {
                    setCachedImage(prompt, url);
                    setImageUrl(url);
                }
            } catch (err: any) {
                console.error(`Error generating image for prompt: "${prompt}"`, err.message);
                
                // Check for any kind of rate limit or quota-related error message.
                // This now includes our new pre-emptive error from the service.
                const isRateLimitError = err.message && (
                    err.message.includes('429') || 
                    /rate limit|quota|API limit reached/i.test(err.message)
                );

                if (isRateLimitError) {
                    // If it is, set the global flag and notify all other components.
                    if (!isApiLimitExceededThisSession) { // Only dispatch event once
                        sessionStorage.setItem('isApiLimitExceeded', 'true');
                        isApiLimitExceededThisSession = true;
                        window.dispatchEvent(new CustomEvent('apiRateLimited'));
                    }
                    handleApiLimitReached(); // Update this component's state
                } else {
                    // It's some other error (e.g., network). Show a generic message.
                    if (isMounted) {
                        setError('Image could not be loaded.');
                    }
                }
            } finally {
                if(isMounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeImage();

        return () => {
            isMounted = false;
            // Clean up the event listener
            window.removeEventListener('apiRateLimited', handleApiLimitReached);
        };
    }, [prompt]);


    if (error) {
        return (
            <div className={`${className} bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 text-center p-4 rounded-lg`}>
                <PhotoIcon className="w-10 h-10 mb-2 text-slate-400" />
                <span className="text-xs font-medium">{error}</span>
            </div>
        );
    }

    if (isLoading || !imageUrl) {
        // Skeleton loader
        return <div className={`${className} bg-gray-200 animate-pulse rounded-md`}></div>;
    }

    return <img src={imageUrl} alt={alt} className={className} />;
};

export default AIImage;