#!/usr/bin/env node
/**
 * Token Cost Optimizer - Savings Tracker
 * Track cumulative token & cost savings over time
 */

const fs = require('fs');
const path = require('path');

const TRACKING_FILE = path.join(__dirname, '.savings-history.json');

class SavingsTracker {
  constructor() {
    this.history = this.loadHistory();
  }

  loadHistory() {
    if (fs.existsSync(TRACKING_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
      } catch (e) {
        console.warn('Warning: Could not load savings history, starting fresh');
        return this.createEmptyHistory();
      }
    }
    return this.createEmptyHistory();
  }

  createEmptyHistory() {
    return {
      totalTokensSaved: 0,
      totalCostSaved: 0,
      optimizations: [],
      startedAt: new Date().toISOString()
    };
  }

  saveHistory() {
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(this.history, null, 2));
  }

  recordSaving(optimization) {
    const record = {
      timestamp: new Date().toISOString(),
      type: optimization.type || 'manual',
      tokensSaved: optimization.tokensSaved || 0,
      costSaved: optimization.costSaved || 0,
      description: optimization.description || 'Optimization applied',
      details: optimization.details || {}
    };

    this.history.totalTokensSaved += record.tokensSaved;
    this.history.totalCostSaved += record.costSaved;
    this.history.optimizations.push(record);

    this.saveHistory();

    console.log(`✅ Recorded: ${record.description}`);
    console.log(`   Saved: ${record.tokensSaved.toLocaleString()} tokens ($${record.costSaved.toFixed(4)})\n`);

    return record;
  }

  showReport(options = {}) {
    const since = options.since || null;
    const type = options.type || null;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 CUMULATIVE SAVINGS REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const filteredOptimizations = this.history.optimizations.filter(opt => {
      if (since && new Date(opt.timestamp) < new Date(since)) return false;
      if (type && opt.type !== type) return false;
      return true;
    });

    const totalTokens = filteredOptimizations.reduce((sum, opt) => sum + opt.tokensSaved, 0);
    const totalCost = filteredOptimizations.reduce((sum, opt) => sum + opt.costSaved, 0);

    console.log(`📊 Total optimizations: ${filteredOptimizations.length}`);
    console.log(`🎯 Tokens saved: ${totalTokens.toLocaleString()}`);
    console.log(`💵 Cost saved: $${totalCost.toFixed(4)}\n`);

    if (filteredOptimizations.length === 0) {
      console.log('No optimizations recorded yet.\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    // Group by type
    const byType = {};
    for (const opt of filteredOptimizations) {
      if (!byType[opt.type]) {
        byType[opt.type] = { count: 0, tokens: 0, cost: 0 };
      }
      byType[opt.type].count++;
      byType[opt.type].tokens += opt.tokensSaved;
      byType[opt.type].cost += opt.costSaved;
    }

    console.log('By optimization type:');
    for (const [type, stats] of Object.entries(byType).sort((a, b) => b[1].tokens - a[1].tokens)) {
      console.log(`  • ${type}: ${stats.count}x, ${stats.tokens.toLocaleString()} tokens ($${stats.cost.toFixed(4)})`);
    }

    // Recent optimizations
    console.log('\nRecent optimizations (last 10):');
    const recent = filteredOptimizations.slice(-10).reverse();
    for (const opt of recent) {
      const date = new Date(opt.timestamp).toLocaleDateString();
      console.log(`  • ${date} - ${opt.description}: ${opt.tokensSaved.toLocaleString()} tokens`);
    }

    // Projected annual savings
    const daysSinceStart = (Date.now() - new Date(this.history.startedAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceStart > 1) {
      const dailyAvg = totalCost / daysSinceStart;
      const projectedAnnual = dailyAvg * 365;
      console.log(`\n📈 Projected annual savings: $${projectedAnnual.toFixed(2)}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  reset() {
    this.history = this.createEmptyHistory();
    this.saveHistory();
    console.log('✅ Savings history reset');
  }

  export(outputFile) {
    const data = {
      ...this.history,
      exportedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`✅ Exported savings history to: ${outputFile}`);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const tracker = new SavingsTracker();

  switch (command) {
    case 'record':
    case 'add':
      // Usage: node track.js record --tokens 1000 --cost 0.003 --type compression --desc "Compressed AGENTS.md"
      const tokens = parseInt(args[args.indexOf('--tokens') + 1] || '0');
      const cost = parseFloat(args[args.indexOf('--cost') + 1] || '0');
      const type = args[args.indexOf('--type') + 1] || 'manual';
      const descIndex = args.indexOf('--desc');
      const desc = descIndex >= 0 ? args.slice(descIndex + 1).join(' ') : 'Optimization applied';

      tracker.recordSaving({
        tokensSaved: tokens,
        costSaved: cost,
        type,
        description: desc
      });
      break;

    case 'report':
    case 'show':
      const sinceIndex = args.indexOf('--since');
      const typeIndex = args.indexOf('--type');
      
      tracker.showReport({
        since: sinceIndex >= 0 ? args[sinceIndex + 1] : null,
        type: typeIndex >= 0 ? args[typeIndex + 1] : null
      });
      break;

    case 'export':
      const outputFile = args[1] || 'savings-export.json';
      tracker.export(outputFile);
      break;

    case 'reset':
      tracker.reset();
      break;

    default:
      console.log('Token Cost Optimizer - Savings Tracker\n');
      console.log('Usage:');
      console.log('  node track.js report                   Show cumulative savings');
      console.log('  node track.js report --since 2026-01-01');
      console.log('  node track.js report --type compression');
      console.log('  node track.js record --tokens 1000 --cost 0.003 --type compression --desc "Description"');
      console.log('  node track.js export [file.json]       Export savings history');
      console.log('  node track.js reset                    Reset history (caution!)\n');
      process.exit(command ? 1 : 0);
  }
}

module.exports = SavingsTracker;
