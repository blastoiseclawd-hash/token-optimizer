#!/usr/bin/env node
/**
 * Token Cost Optimizer - Context Compression
 * Compresses bloated context files to reduce token costs
 */

const fs = require('fs');
const path = require('path');

class ContextCompressor {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
  }

  async compress(file, outputFile) {
    console.log(`🗜️  Compressing: ${path.basename(file)}\n`);

    const content = fs.readFileSync(file, 'utf-8');
    const originalSize = content.length;
    const originalTokens = this.estimateTokens(content);

    let compressed = content;
    const operations = [];

    // Apply compression strategies
    compressed = this.removeEmptyLines(compressed, operations);
    compressed = this.deduplicateHeaders(compressed, operations);
    compressed = this.compressWhitespace(compressed, operations);
    compressed = this.removeDuplicateSections(compressed, operations);
    compressed = this.abbreviateCommonPhrases(compressed, operations);

    const compressedSize = compressed.length;
    const compressedTokens = this.estimateTokens(compressed);
    const savings = {
      bytes: originalSize - compressedSize,
      tokens: originalTokens - compressedTokens,
      percentage: ((1 - compressedTokens / originalTokens) * 100).toFixed(1)
    };

    this.printReport(file, originalTokens, compressedTokens, savings, operations);

    if (!this.dryRun) {
      const outPath = outputFile || file.replace(/\.md$/, '.compressed.md');
      fs.writeFileSync(outPath, compressed);
      console.log(`\n✅ Saved to: ${outPath}`);
    } else {
      console.log('\n🔍 Dry run - no files modified');
    }

    return { compressed, savings, operations };
  }

  estimateTokens(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  removeEmptyLines(content, operations) {
    const before = content.split('\n').length;
    const compressed = content.replace(/\n\n\n+/g, '\n\n');
    const after = compressed.split('\n').length;
    
    if (before !== after) {
      operations.push({
        name: 'Remove excessive empty lines',
        saved: this.estimateTokens(content) - this.estimateTokens(compressed)
      });
    }
    
    return compressed;
  }

  deduplicateHeaders(content, operations) {
    const lines = content.split('\n');
    const seen = new Set();
    const result = [];
    let savedTokens = 0;

    for (const line of lines) {
      if (line.match(/^#{1,6}\s+/)) {
        if (seen.has(line)) {
          savedTokens += this.estimateTokens(line);
          continue; // Skip duplicate header
        }
        seen.add(line);
      }
      result.push(line);
    }

    if (savedTokens > 0) {
      operations.push({
        name: 'Deduplicate headers',
        saved: savedTokens
      });
    }

    return result.join('\n');
  }

  compressWhitespace(content, operations) {
    const before = content.length;
    
    // Reduce multiple spaces to single space
    let compressed = content.replace(/  +/g, ' ');
    
    // Remove trailing whitespace
    compressed = compressed.replace(/[ \t]+$/gm, '');
    
    const after = compressed.length;
    const saved = this.estimateTokens(content) - this.estimateTokens(compressed);

    if (saved > 0) {
      operations.push({
        name: 'Compress whitespace',
        saved
      });
    }

    return compressed;
  }

  removeDuplicateSections(content, operations) {
    const sections = content.split(/\n(?=#{1,3}\s)/);
    const seen = new Map();
    const result = [];
    let savedTokens = 0;

    for (const section of sections) {
      const normalized = section.trim().slice(0, 200); // Compare first 200 chars
      
      if (seen.has(normalized)) {
        savedTokens += this.estimateTokens(section);
        continue;
      }
      
      seen.set(normalized, true);
      result.push(section);
    }

    if (savedTokens > 0) {
      operations.push({
        name: 'Remove duplicate sections',
        saved: savedTokens
      });
    }

    return result.join('\n');
  }

  abbreviateCommonPhrases(content, operations) {
    const abbreviations = {
      'For example': 'E.g.',
      'That is': 'I.e.',
      'and so on': 'etc.',
      'As previously mentioned': 'As noted',
      'It is important to note that': 'Note:',
      'In other words': 'IOW',
      'Please note that': 'Note:'
    };

    let compressed = content;
    let savedTokens = 0;

    for (const [phrase, abbrev] of Object.entries(abbreviations)) {
      const regex = new RegExp(phrase, 'gi');
      const matches = (compressed.match(regex) || []).length;
      
      if (matches > 0) {
        const savedPerMatch = this.estimateTokens(phrase) - this.estimateTokens(abbrev);
        savedTokens += savedPerMatch * matches;
        compressed = compressed.replace(regex, abbrev);
      }
    }

    if (savedTokens > 0) {
      operations.push({
        name: 'Abbreviate common phrases',
        saved: savedTokens
      });
    }

    return compressed;
  }

  printReport(file, originalTokens, compressedTokens, savings, operations) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗜️  COMPRESSION REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Original tokens: ${originalTokens.toLocaleString()}`);
    console.log(`Compressed tokens: ${compressedTokens.toLocaleString()}`);
    console.log(`Savings: ${savings.tokens.toLocaleString()} tokens (${savings.percentage}%)\n`);

    if (operations.length > 0) {
      console.log('Optimizations applied:');
      for (const op of operations.sort((a, b) => b.saved - a.saved)) {
        const pct = ((op.saved / originalTokens) * 100).toFixed(1);
        console.log(`  • ${op.name}: ${op.saved.toLocaleString()} tokens (${pct}%)`);
      }
    }

    const costSavings = (savings.tokens / 1000000) * 3; // $3 per 1M input tokens (rough avg)
    console.log(`\n💰 Estimated cost savings: $${costSavings.toFixed(4)} per use\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    dryRun: args.includes('--dry-run') || args.includes('-d')
  };
  
  const files = args.filter(a => !a.startsWith('--') && !a.startsWith('-'));
  
  if (files.length === 0) {
    console.log('Usage: node compress.js <file.md> [options]');
    console.log('\nOptions:');
    console.log('  --dry-run, -d    Show what would be compressed without modifying files');
    console.log('  --verbose, -v    Show detailed output');
    console.log('\nExample: node compress.js AGENTS.md --dry-run');
    process.exit(1);
  }

  const compressor = new ContextCompressor(options);
  
  (async () => {
    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        continue;
      }
      
      await compressor.compress(file);
      console.log();
    }
  })().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = ContextCompressor;
