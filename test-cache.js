#!/usr/bin/env node
/**
 * Test file caching functionality
 */

const { FileCache } = require('./lib/file-cache.js');
const fs = require('fs');

console.log('🧪 Testing File Cache\n');

// Create cache instance
const cache = new FileCache({ ttl: 5000 }); // 5 second TTL for testing

// Test 1: Basic caching
console.log('Test 1: Basic caching');
const file = __dirname + '/package.json';

console.log('  First read (cache miss)...');
const content1 = cache.read(file, 'utf-8');
console.log(`  Stats: ${JSON.stringify(cache.stats())}`);

console.log('  Second read (cache hit)...');
const content2 = cache.read(file, 'utf-8');
console.log(`  Stats: ${JSON.stringify(cache.stats())}`);

console.log('  Third read (cache hit)...');
const content3 = cache.read(file, 'utf-8');
console.log(`  Stats: ${JSON.stringify(cache.stats())}`);

// Test 2: Different files
console.log('\nTest 2: Multiple files');
cache.read(__dirname + '/analyze.js', 'utf-8');
cache.read(__dirname + '/compress.js', 'utf-8');
console.log(`  Stats: ${JSON.stringify(cache.stats())}`);

// Test 3: Cache invalidation
console.log('\nTest 3: Cache invalidation');
cache.invalidate(file);
cache.read(file, 'utf-8');
console.log(`  Stats after invalidation: ${JSON.stringify(cache.stats())}`);

// Test 4: Savings estimate
console.log('\nTest 4: Savings estimate');
const savings = cache.estimateSavings();
console.log(`  Reads saved: ${savings.reads}`);
console.log(`  Tokens saved: ${savings.tokensSaved.toLocaleString()}`);
console.log(`  Cost saved: ${savings.formatted}`);

// Test 5: Hit rate
console.log('\nTest 5: Simulate session with repeated reads');
const testCache = new FileCache();
const testFile = __dirname + '/SKILL.md';

// Simulate 100 reads of frequently-accessed files
for (let i = 0; i < 100; i++) {
  testCache.read(testFile, 'utf-8');
}

const finalStats = testCache.stats();
const finalSavings = testCache.estimateSavings();

console.log(`  Total reads: 100`);
console.log(`  Cache hits: ${finalStats.hits}`);
console.log(`  Cache misses: ${finalStats.misses}`);
console.log(`  Hit rate: ${finalStats.hitRate}`);
console.log(`  Tokens saved: ${finalSavings.tokensSaved.toLocaleString()}`);
console.log(`  Cost saved: ${finalSavings.formatted}`);

console.log('\n✅ All tests complete');
