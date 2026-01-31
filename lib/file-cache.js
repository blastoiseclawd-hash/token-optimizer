/**
 * File Cache - Reduce repeated file reads
 * Implements caching layer to prevent token bloat from repeated reads
 */

const fs = require('fs');
const path = require('path');

class FileCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.maxSize = options.maxSize || 100; // Max 100 cached files
    this.hits = 0;
    this.misses = 0;
    this.enabled = options.enabled !== false;
  }

  /**
   * Read file with caching
   * @param {string} filePath - Path to file
   * @param {object} options - Read options
   * @returns {string|Buffer} File contents
   */
  read(filePath, options = {}) {
    if (!this.enabled) {
      return fs.readFileSync(filePath, options);
    }

    const absolutePath = path.resolve(filePath);
    const cacheKey = `${absolutePath}:${JSON.stringify(options)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      this.hits++;
      return cached.content;
    }

    // Cache miss - read from disk
    this.misses++;
    const content = fs.readFileSync(absolutePath, options);
    
    // Store in cache
    this.set(cacheKey, content);
    
    return content;
  }

  /**
   * Store content in cache
   */
  set(key, content) {
    // Evict oldest if cache full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate cache entry
   * @param {string} filePath - Path to invalidate
   */
  invalidate(filePath) {
    const absolutePath = path.resolve(filePath);
    
    // Remove all entries for this file (different options)
    for (const key of this.cache.keys()) {
      if (key.startsWith(absolutePath + ':')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  stats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : 0;
    
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      enabled: this.enabled
    };
  }

  /**
   * Get savings estimate
   * Assumes average file read = 200 tokens
   */
  estimateSavings() {
    const tokensPerRead = 200;
    const tokensSaved = this.hits * tokensPerRead;
    const costPerMillion = 3; // $3 per 1M input tokens (rough avg)
    const costSaved = (tokensSaved / 1000000) * costPerMillion;
    
    return {
      reads: this.hits,
      tokensSaved,
      costSaved: parseFloat(costSaved.toFixed(4)),
      formatted: `$${costSaved.toFixed(4)}`
    };
  }
}

// Singleton instance
let globalCache = null;

/**
 * Get or create global cache instance
 */
function getCache(options = {}) {
  if (!globalCache) {
    globalCache = new FileCache(options);
  }
  return globalCache;
}

/**
 * Drop-in replacement for fs.readFileSync
 */
function readFileSync(filePath, options) {
  return getCache().read(filePath, options);
}

module.exports = {
  FileCache,
  getCache,
  readFileSync
};
