#!/usr/bin/env node
/**
 * Token Cost Optimizer - Session Analysis
 * Analyzes Clawdbot session transcripts to identify token bloat
 */

const fs = require('fs');
const path = require('path');

class SessionAnalyzer {
  constructor(sessionFile) {
    this.sessionFile = sessionFile;
    this.messages = [];
    this.stats = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalCost: 0,
      bloatSources: []
    };
  }

  async analyze() {
    console.log('🔍 Analyzing session for token bloat...\n');
    
    // Read session transcript (JSONL format)
    const lines = fs.readFileSync(this.sessionFile, 'utf-8').split('\n').filter(l => l.trim());
    this.messages = lines.map(line => {
      try {
        const event = JSON.parse(line);
        // Clawdbot sessions have nested .message objects
        return event.message || event;
      } catch (e) {
        return null;
      }
    }).filter(m => m !== null);

    console.log(`📊 Session: ${path.basename(this.sessionFile)}`);
    console.log(`📝 Messages: ${this.messages.length}\n`);

    // Analyze token usage
    this.analyzeTokenUsage();
    
    // Detect bloat patterns
    this.detectBloat();
    
    // Generate report
    this.generateReport();
  }

  analyzeTokenUsage() {
    for (const msg of this.messages) {
      if (msg.usage) {
        this.stats.inputTokens += msg.usage.input || 0;
        this.stats.outputTokens += msg.usage.output || 0;
        this.stats.cacheRead += msg.usage.cacheRead || 0;
        this.stats.cacheWrite += msg.usage.cacheWrite || 0;
        
        if (msg.usage.cost) {
          this.stats.totalCost += msg.usage.cost.total || 0;
        }
      }
    }
    
    this.stats.totalTokens = this.stats.inputTokens + this.stats.outputTokens + 
                             this.stats.cacheRead + this.stats.cacheWrite;
  }

  detectBloat() {
    const bloatPatterns = {
      repeatedFileReads: this.findRepeatedFileReads(),
      longOutputs: this.findLongOutputs(),
      verboseErrors: this.findVerboseErrors(),
      unnecessaryRepeats: this.findUnnecessaryRepeats()
    };

    for (const [pattern, data] of Object.entries(bloatPatterns)) {
      if (data.count > 0) {
        this.stats.bloatSources.push({
          pattern: pattern,
          count: data.count,
          tokens: data.tokens,
          percentage: ((data.tokens / this.stats.totalTokens) * 100).toFixed(1)
        });
      }
    }

    // Sort by token impact
    this.stats.bloatSources.sort((a, b) => b.tokens - a.tokens);
  }

  findRepeatedFileReads() {
    const fileReads = {};
    let totalBloat = 0;
    
    for (const msg of this.messages) {
      if (msg.content && Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'toolCall' && block.name === 'Read') {
            const args = JSON.parse(block.arguments || '{}');
            const file = args.path || args.file_path;
            if (file) {
              fileReads[file] = (fileReads[file] || 0) + 1;
            }
          }
        }
      }
    }

    // Count files read more than once
    let bloatCount = 0;
    for (const [file, count] of Object.entries(fileReads)) {
      if (count > 1) {
        bloatCount += count - 1;
        totalBloat += (count - 1) * 500; // Estimate 500 tokens per duplicate read
      }
    }

    return { count: bloatCount, tokens: totalBloat };
  }

  findLongOutputs() {
    let count = 0;
    let totalBloat = 0;

    for (const msg of this.messages) {
      if (msg.role === 'assistant' && msg.usage) {
        if (msg.usage.output > 2000) {
          count++;
          totalBloat += msg.usage.output - 2000; // Bloat is anything over 2k tokens
        }
      }
    }

    return { count, tokens: totalBloat };
  }

  findVerboseErrors() {
    let count = 0;
    let totalBloat = 0;

    for (const msg of this.messages) {
      if (msg.content && typeof msg.content === 'string') {
        if (msg.content.includes('error') && msg.content.length > 500) {
          count++;
          totalBloat += Math.floor((msg.content.length - 500) / 4); // Rough token estimate
        }
      }
    }

    return { count, tokens: totalBloat };
  }

  findUnnecessaryRepeats() {
    // Detect repeated tool calls with same arguments
    const toolCalls = new Map();
    let count = 0;
    let totalBloat = 0;

    for (const msg of this.messages) {
      if (msg.content && Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'toolCall') {
            const signature = `${block.name}:${block.arguments}`;
            const previous = toolCalls.get(signature);
            
            if (previous && previous.recent) {
              count++;
              totalBloat += 200; // Estimate
            }
            
            toolCalls.set(signature, { recent: true });
          }
        }
      }
    }

    return { count, tokens: totalBloat };
  }

  generateReport() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TOKEN ANALYSIS REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Total tokens: ${this.stats.totalTokens.toLocaleString()}`);
    console.log(`  Input: ${this.stats.inputTokens.toLocaleString()}`);
    console.log(`  Output: ${this.stats.outputTokens.toLocaleString()}`);
    console.log(`  Cache read: ${this.stats.cacheRead.toLocaleString()}`);
    console.log(`  Cache write: ${this.stats.cacheWrite.toLocaleString()}`);
    console.log(`\nEstimated cost: $${this.stats.totalCost.toFixed(4)}\n`);

    const totalBloat = this.stats.bloatSources.reduce((sum, s) => sum + s.tokens, 0);
    const bloatPercentage = ((totalBloat / this.stats.totalTokens) * 100).toFixed(1);

    console.log(`🔴 Bloat detected: ${totalBloat.toLocaleString()} tokens (${bloatPercentage}%)\n`);

    if (this.stats.bloatSources.length > 0) {
      console.log('Top offenders:');
      for (const source of this.stats.bloatSources.slice(0, 5)) {
        console.log(`  • ${source.pattern}: ${source.count} occurrences, ${source.tokens.toLocaleString()} tokens (${source.percentage}%)`);
      }
    }

    const potentialSavings = (totalBloat / this.stats.totalTokens) * this.stats.totalCost;
    console.log(`\n💰 Potential savings: $${potentialSavings.toFixed(4)} per session\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node analyze.js <session-transcript.jsonl>');
    console.log('Example: node analyze.js ~/.clawdbot/agents/main/sessions/abc123.jsonl');
    process.exit(1);
  }

  const analyzer = new SessionAnalyzer(args[0]);
  analyzer.analyze().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = SessionAnalyzer;
