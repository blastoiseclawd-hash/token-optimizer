# Token Optimizer - Quick Reference Card

## 🔥 Context Pruning (60% Savings)

### CLI Usage
```bash
# Basic pruning
node prune.js conversation.json

# Preview first (recommended)
node prune.js conversation.json --dry-run

# Aggressive pruning
node prune.js conversation.json --max-tokens 2000

# Keep more context
node prune.js conversation.json --keep-recent 6
```

### Code Usage
```javascript
const ContextWindowPruner = require('./prune.js');

const pruner = new ContextWindowPruner({
  maxTokens: 4000,    // Token budget
  keepRecent: 4,      // Always keep N recent
  summarizeOld: true  // Add summary
});

const { pruned, stats } = pruner.pruneWithSummary(messages);
// pruned = optimized messages (60% smaller)
// stats = { original, pruned, dropped }
```

### 5-Minute Integration
```javascript
// Before
const response = await client.messages.create({
  model: 'claude-sonnet-4',
  messages: messages  // Full history
});

// After (saves 60%)
const pruner = new ContextWindowPruner();
const { pruned } = pruner.pruneWithSummary(messages);

const response = await client.messages.create({
  model: 'claude-sonnet-4',
  messages: pruned  // Optimized!
});
```

---

## 📊 Session Analysis

### CLI Usage
```bash
# Analyze session
node optimize.js session session.jsonl

# Analyze most recent
SESSION=$(ls -t ~/.clawdbot/agents/main/sessions/*.jsonl | head -1)
node optimize.js session "$SESSION"
```

### Output
```
🔴 HIGH PRIORITY
   Issue: Tool calls repeated with same arguments
   Fix: Cache tool results or deduplicate
   Impact: 254,400 tokens saved ($0.27)
```

---

## 🗜️ Compression

### CLI Usage
```bash
# Compress file
node compress.js AGENTS.md --dry-run

# Apply compression
node compress.js AGENTS.md
```

### Code Usage
```javascript
const ContextCompressor = require('./compress.js');

const compressor = new ContextCompressor();
const result = await compressor.compress('file.md');
// result.savings.tokens = tokens saved
```

---

## 💰 Savings Tracking

### CLI Usage
```bash
# Record saving
node track.js record --tokens 5000 --cost 0.015 --desc "Pruned conversation"

# View report
node track.js report

# Reset tracking
node track.js reset
```

### Output
```
💰 Token Savings Report (Last 7 Days)

Before optimization: 850,000 tokens (~$10.20)
After optimization:  520,000 tokens (~$6.24)
Savings: 330,000 tokens ($3.96 - 39%)
```

---

## 📂 File Caching

### Code Usage
```javascript
const { readFileSync } = require('./lib/file-cache');

// Drop-in replacement for fs.readFileSync
const content = readFileSync('file.txt', 'utf-8');
// Second read = instant (cached)
```

---

## 🎯 Priority Levels (Pruning)

| Priority | Type | Examples | Action |
|----------|------|----------|--------|
| 100 | CRITICAL | System msgs, security | Always keep |
| 75 | HIGH | Errors, decisions | Keep if space |
| 50 | MEDIUM | Tool results, file reads | Keep if space |
| 25 | LOW | Routine responses | Maybe |
| 0 | NOISE | "ok", "HEARTBEAT_OK" | Always drop |

---

## ⚙️ Configuration Presets

### Conservative (safest)
```javascript
new ContextWindowPruner({
  maxTokens: 6000,
  keepRecent: 6
})
```

### Balanced (recommended)
```javascript
new ContextWindowPruner({
  maxTokens: 4000,
  keepRecent: 4
})
```

### Aggressive (max savings)
```javascript
new ContextWindowPruner({
  maxTokens: 2000,
  keepRecent: 3
})
```

---

## 📈 Expected Savings

| Conversation Length | Without Pruning | With Pruning | Savings |
|---------------------|----------------|--------------|---------|
| 10 turns | 5,000 tokens | 3,000 tokens | 40% |
| 25 turns | 12,000 tokens | 4,000 tokens | 67% |
| 50 turns | 25,000 tokens | 5,000 tokens | 80% |
| 100 turns | 50,000 tokens | 6,000 tokens | 88% |

---

## 🐛 Troubleshooting

### "Quality degraded"
```bash
# Increase token budget
node prune.js file.json --max-tokens 6000 --keep-recent 6
```

### "Not saving enough"
```bash
# Decrease token budget
node prune.js file.json --max-tokens 2000
```

### "Important messages dropped"
Mark them as important:
```javascript
{ role: 'user', content: '[IMPORTANT] Critical decision...' }
```

---

## 🚀 Workflow

### For Agents
1. Add pruning before every API call
2. Use `maxTokens: 4000` to start
3. Monitor quality for 1 week
4. Adjust if needed

### For Analysis
1. Run session analysis weekly
2. Implement top 2 recommendations
3. Track savings with `node track.js`
4. Iterate

### For Files
1. Compress context files monthly
2. Use `--dry-run` first
3. Review changes before applying

---

## 💡 Pro Tips

1. **Always prune** - Even short conversations benefit
2. **Keep system messages** - They're automatically prioritized
3. **Use summaries** - Helps LLM understand dropped context
4. **Monitor savings** - Use `track.js report` weekly
5. **Combine strategies** - Pruning + caching + streaming = 80%+ savings

---

## 📚 Full Documentation

- `PRUNING-GUIDE.md` - Complete pruning guide
- `INTEGRATION-GUIDE.md` - Integration patterns
- `POC-SUMMARY.md` - Technical details
- `README.md` - Overview
- `SKILL.md` - Full reference

---

## 🎯 One-Liner

**Context pruning:** Remove 60% of conversation tokens by keeping important messages and dropping noise.

---

## ⚡ Quick Commands Cheat Sheet

```bash
# 🔥 Most impactful
node prune.js conversation.json --dry-run

# Analyze bloat
node optimize.js session session.jsonl

# Compress files
node compress.js file.md --dry-run

# Track savings
node track.js report

# All-in-one
node optimize.js prune conversation.json
```

---

**Start here:** `node prune.js demo-conversation.json --dry-run` 🚀
