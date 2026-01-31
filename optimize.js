#!/usr/bin/env node
/**
 * Token Cost Optimizer - Main Orchestrator
 * Analyzes, compresses, and tracks savings in one workflow
 */

const SessionAnalyzer = require('./analyze.js');
const ContextCompressor = require('./compress.js');
const ContextWindowPruner = require('./prune.js');
const SavingsTracker = require('./track.js');
const fs = require('fs');
const path = require('path');

class TokenOptimizer {
  constructor(options = {}) {
    this.options = {
      analyze: options.analyze !== false,
      compress: options.compress !== false,
      prune: options.prune !== false,
      track: options.track !== false,
      dryRun: options.dryRun || false,
      verbose: options.verbose || false
    };
    
    this.tracker = new SavingsTracker();
    this.compressor = new ContextCompressor({
      verbose: this.options.verbose,
      dryRun: this.options.dryRun
    });
    this.pruner = new ContextWindowPruner({
      maxTokens: options.maxTokens || 4000,
      keepRecent: options.keepRecent || 4,
      verbose: this.options.verbose,
      dryRun: this.options.dryRun
    });
  }

  async optimizeSession(sessionFile) {
    console.log('🚀 Token Cost Optimizer\n');
    console.log(`Processing: ${path.basename(sessionFile)}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results = {
      analysis: null,
      compression: null,
      savings: null
    };

    // Step 1: Analyze session
    if (this.options.analyze) {
      console.log('📊 STEP 1: Analyzing session for token bloat\n');
      const analyzer = new SessionAnalyzer(sessionFile);
      await analyzer.analyze();
      results.analysis = analyzer.stats;
      console.log();
    }

    // Step 2: Generate recommendations
    if (results.analysis) {
      console.log('💡 RECOMMENDATIONS\n');
      this.generateRecommendations(results.analysis);
      console.log();
    }

    // Track savings if not dry run
    if (!this.options.dryRun && results.analysis) {
      const totalBloat = results.analysis.bloatSources.reduce((sum, s) => sum + s.tokens, 0);
      const bloatPercentage = totalBloat / results.analysis.totalTokens;
      const costSaved = bloatPercentage * results.analysis.totalCost;

      if (totalBloat > 0) {
        this.tracker.recordSaving({
          tokensSaved: totalBloat,
          costSaved: costSaved,
          type: 'session-analysis',
          description: `Analyzed session ${path.basename(sessionFile)}`,
          details: {
            sessionFile: path.basename(sessionFile),
            totalTokens: results.analysis.totalTokens,
            bloatSources: results.analysis.bloatSources.length
          }
        });
      }
    }

    return results;
  }

  async optimizeContext(contextFile, outputFile = null) {
    console.log('🚀 Token Cost Optimizer - Context Compression\n');
    console.log(`Processing: ${path.basename(contextFile)}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const result = await this.compressor.compress(contextFile, outputFile);

    // Track savings if not dry run
    if (!this.options.dryRun && result.savings.tokens > 0) {
      const avgTokenCost = 0.000003; // $3 per 1M input tokens
      const costSaved = result.savings.tokens * avgTokenCost;

      this.tracker.recordSaving({
        tokensSaved: result.savings.tokens,
        costSaved: costSaved,
        type: 'context-compression',
        description: `Compressed ${path.basename(contextFile)}`,
        details: {
          file: path.basename(contextFile),
          operations: result.operations.length,
          percentage: result.savings.percentage
        }
      });
    }

    return result;
  }

  generateRecommendations(stats) {
    const recommendations = [];

    for (const source of stats.bloatSources.slice(0, 3)) {
      switch (source.pattern) {
        case 'repeatedFileReads':
          recommendations.push({
            priority: 'HIGH',
            issue: 'Files are being read multiple times',
            solution: 'Use prompt caching or store file contents in variables',
            impact: `${source.tokens.toLocaleString()} tokens saved`
          });
          break;

        case 'longOutputs':
          recommendations.push({
            priority: 'MEDIUM',
            issue: 'Assistant responses exceed 2,000 tokens',
            solution: 'Request concise responses or break into multiple turns',
            impact: `${source.tokens.toLocaleString()} tokens saved`
          });
          break;

        case 'verboseErrors':
          recommendations.push({
            priority: 'LOW',
            issue: 'Error messages are verbose',
            solution: 'Implement error summarization or truncation',
            impact: `${source.tokens.toLocaleString()} tokens saved`
          });
          break;

        case 'unnecessaryRepeats':
          recommendations.push({
            priority: 'HIGH',
            issue: 'Tool calls are being repeated with same arguments',
            solution: 'Cache tool results or deduplicate calls',
            impact: `${source.tokens.toLocaleString()} tokens saved`
          });
          break;
      }
    }

    if (recommendations.length === 0) {
      console.log('✅ No major optimizations needed! Session looks good.\n');
      return;
    }

    for (const rec of recommendations) {
      const emoji = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${emoji} ${rec.priority} PRIORITY`);
      console.log(`   Issue: ${rec.issue}`);
      console.log(`   Fix: ${rec.solution}`);
      console.log(`   Impact: ${rec.impact}\n`);
    }
  }

  async pruneConversation(conversationFile, outputFile = null) {
    console.log('🚀 Token Cost Optimizer - Context Window Pruning\n');
    console.log(`Processing: ${path.basename(conversationFile)}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const result = await this.pruner.processFile(conversationFile, outputFile);

    // Track savings if not dry run
    if (!this.options.dryRun && result.stats.dropped.tokens > 0) {
      const avgTokenCost = 0.000003; // $3 per 1M input tokens
      const costSaved = result.stats.dropped.tokens * avgTokenCost;

      this.tracker.recordSaving({
        tokensSaved: result.stats.dropped.tokens,
        costSaved: costSaved,
        type: 'context-pruning',
        description: `Pruned ${path.basename(conversationFile)}`,
        details: {
          file: path.basename(conversationFile),
          originalMessages: result.stats.original.count,
          prunedMessages: result.stats.pruned.count,
          percentage: ((result.stats.dropped.tokens / result.stats.original.tokens) * 100).toFixed(1)
        }
      });
    }

    return result;
  }

  async showSavings() {
    this.tracker.showReport();
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    analyze: !args.includes('--no-analyze'),
    compress: !args.includes('--no-compress'),
    prune: !args.includes('--no-prune'),
    track: !args.includes('--no-track'),
    maxTokens: 4000,
    keepRecent: 4
  };

  // Parse pruning options
  const maxTokensIdx = args.findIndex(a => a === '--max-tokens');
  if (maxTokensIdx >= 0 && args[maxTokensIdx + 1]) {
    options.maxTokens = parseInt(args[maxTokensIdx + 1], 10);
  }

  const keepRecentIdx = args.findIndex(a => a === '--keep-recent');
  if (keepRecentIdx >= 0 && args[keepRecentIdx + 1]) {
    options.keepRecent = parseInt(args[keepRecentIdx + 1], 10);
  }

  const command = args[0];
  
  // Filter out option flags, their values, and the command itself
  const skipNext = new Set();
  const files = args.filter((a, idx) => {
    if (skipNext.has(idx)) return false;
    if (a === command) return false;
    if (a.startsWith('--') || a.startsWith('-')) {
      // Check if this option takes a value
      if (a === '--max-tokens' || a === '--keep-recent') {
        skipNext.add(idx + 1); // Skip the next arg (the value)
      }
      return false;
    }
    return true;
  });

  const optimizer = new TokenOptimizer(options);

  (async () => {
    switch (command) {
      case 'session':
        if (files.length === 0) {
          console.error('Error: No session file specified');
          console.log('Usage: node optimize.js session <session.jsonl> [options]');
          process.exit(1);
        }
        for (const file of files) {
          await optimizer.optimizeSession(file);
        }
        break;

      case 'context':
        if (files.length === 0) {
          console.error('Error: No context file specified');
          console.log('Usage: node optimize.js context <file.md> [options]');
          process.exit(1);
        }
        for (const file of files) {
          await optimizer.optimizeContext(file);
        }
        break;

      case 'prune':
      case 'conversation':
        if (files.length === 0) {
          console.error('Error: No conversation file specified');
          console.log('Usage: node optimize.js prune <conversation.json> [options]');
          process.exit(1);
        }
        for (const file of files) {
          await optimizer.pruneConversation(file);
        }
        break;

      case 'savings':
      case 'report':
        await optimizer.showSavings();
        break;

      default:
        console.log('Token Cost Optimizer - Main Tool\n');
        console.log('Usage:');
        console.log('  node optimize.js session <session.jsonl>       Analyze session for bloat');
        console.log('  node optimize.js context <file.md>             Compress context file');
        console.log('  node optimize.js prune <conversation.json>     Prune conversation (60% savings!)');
        console.log('  node optimize.js savings                       Show cumulative savings\n');
        console.log('Options:');
        console.log('  --dry-run, -d           Analyze without saving or modifying files');
        console.log('  --verbose, -v           Show detailed output');
        console.log('  --no-analyze            Skip analysis step');
        console.log('  --no-compress           Skip compression step');
        console.log('  --no-prune              Skip pruning step');
        console.log('  --no-track              Skip savings tracking');
        console.log('  --max-tokens <n>        Max tokens for pruning (default: 4000)');
        console.log('  --keep-recent <n>       Keep N recent messages (default: 4)\n');
        console.log('Examples:');
        console.log('  node optimize.js session ~/.clawdbot/agents/main/sessions/abc123.jsonl');
        console.log('  node optimize.js context AGENTS.md --dry-run');
        console.log('  node optimize.js prune conversation.json --max-tokens 2000');
        console.log('  node optimize.js savings\n');
        process.exit(command ? 1 : 0);
    }
  })().catch(err => {
    console.error('Error:', err.message);
    if (options.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  });
}

module.exports = TokenOptimizer;
