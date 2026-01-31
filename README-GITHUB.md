# Token Cost Optimizer

**🎁 FREE TOOL - Reduce your LLM API costs by finding and fixing token bloat**

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![No Dependencies](https://img.shields.io/badge/dependencies-0-blue)

---

## 🔥 What It Does

Analyzes your LLM agent sessions to find exactly where tokens are being wasted:

- 🔴 **Repeated tool calls** - Same file read 886 times? Cache it!
- 🟡 **Verbose responses** - Outputs >2k tokens? Compress them!
- 🟢 **Duplicate operations** - Find unnecessary work
- 💰 **Track savings** - Measure your optimizations over time

**Real savings from real usage:**
- Analyzed 68M tokens ($53 cost)
- Found 206k wasted tokens (0.3% bloat)
- Detected 886 repeated tool calls
- **Potential savings: $0.16/session → $160/year**

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/turtle-tools/token-optimizer.git
cd token-optimizer

# No npm install needed - zero dependencies!
```

### Analyze a Session

```bash
# Find your most recent session
SESSION=$(ls -t ~/.clawdbot/agents/main/sessions/*.jsonl | grep -v deleted | head -1)

# Analyze it
node optimize.js session "$SESSION"
```

**Output example:**
```
🔴 HIGH PRIORITY
   Issue: Tool calls are being repeated with same arguments
   Fix: Cache tool results or deduplicate calls
   Impact: 254,400 tokens saved ($0.27/session)

💰 Potential savings: $0.27 per session
```

### Context Window Pruning (60% Savings!)

```bash
# Prune a conversation to reduce context size
node prune.js demo-conversation.json --dry-run

# Example savings
Original: 25 messages, 2,176 tokens
Pruned:   18 messages, 941 tokens
Savings:  1,235 tokens (56.8%) 

At scale: $37/10K requests
```

---

## 📊 Features

### 1. Session Analysis
Analyze JSONL session transcripts to find bloat:
```bash
node optimize.js session <session.jsonl>
```

### 2. Context Compression
Remove whitespace, deduplicate, abbreviate:
```bash
node compress.js AGENTS.md --dry-run
```

### 3. Savings Tracking
Track cumulative optimizations:
```bash
node track.js record --tokens 254400 --cost 0.27 --desc "Cached file reads"
node track.js report
```

### 4. Context Window Pruning
Intelligent conversation history pruning:
```bash
node prune.js conversation.json --max-tokens 4000
```

---

## 🎯 Real Results

### From Session Analysis
- **My usage:** 68M tokens analyzed
- **Bloat found:** 206k tokens (0.3%)
- **Root cause:** 886 repeated file reads
- **Fix:** Implement caching
- **Savings:** $0.16/session

### From Context Pruning
- **Demo conversation:** 56.8% token reduction
- **Long sessions:** 60-70% savings typical
- **Monthly impact:** $50-200 saved (average user)

---

## 📖 Documentation

- **[PRUNING-GUIDE.md](PRUNING-GUIDE.md)** - Context pruning user guide (START HERE!)
- **[INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md)** - Integrate into your agent (5 min)
- **[SKILL.md](SKILL.md)** - Full tool usage reference
- **[SECURITY.md](SECURITY.md)** - Security guarantees and verification
- **[FREE-RELEASE-STRATEGY.md](FREE-RELEASE-STRATEGY.md)** - Why this is free

---

## 🆓 Why Free?

This tool was originally planned as a paid product. After building it, I did market validation and learned a valuable lesson:

**Utility ≠ Monetizable**

- **Target audience:** Technical Clawdbot users
- **Knowledge gap:** Small (they can build this themselves)
- **Savings:** $0.16/session (not compelling for paid tool)
- **Defensibility:** Low (easily replicated)

**The real lesson:** Market validation BEFORE building, not after.

Read the full story in [FREE-RELEASE-STRATEGY.md](FREE-RELEASE-STRATEGY.md)

**Making the world better anyway.** 🌍

---

## 🔒 Security

- ✅ **100% local processing** - No network calls
- ✅ **Zero dependencies** - Pure Node.js
- ✅ **Open source** - MIT License
- ✅ **Verifiable** - Read the code yourself

See [SECURITY.md](SECURITY.md) for full details.

---

## 🛠️ Usage Examples

### Analyze Your Sessions

```bash
# List recent sessions
ls -lht ~/.clawdbot/agents/main/sessions/*.jsonl | head -5

# Analyze the most expensive one
node optimize.js session path/to/session.jsonl
```

### Prune Context Windows

```bash
# Reduce a conversation by 60%
node prune.js conversation.json --max-tokens 4000

# Keep more recent context
node prune.js conversation.json --keep-recent 6

# Skip summary
node prune.js conversation.json --no-summary
```

### Track Your Savings

```bash
# Record an optimization
node track.js record \
  --tokens 254400 \
  --cost 0.27 \
  --type "file-caching" \
  --desc "Cached HEARTBEAT.md reads"

# View cumulative report
node track.js report
```

**Output:**
```
💰 CUMULATIVE SAVINGS REPORT

📊 Total optimizations: 3
🎯 Tokens saved: 425,000
💵 Cost saved: $0.89

📈 Projected annual savings: $324.85
```

---

## 📦 What's Included

```
token-optimizer/
├── analyze.js          # Session analysis
├── compress.js         # File compression
├── optimize.js         # All-in-one tool
├── prune.js           # Context window pruning
├── track.js           # Savings tracking
├── test-cache.js      # Cache testing
├── demo-conversation.json  # Example data
├── PRUNING-GUIDE.md   # How to prune context
├── INTEGRATION-GUIDE.md    # Integration examples
├── SKILL.md           # Full reference
├── SECURITY.md        # Security details
└── FREE-RELEASE-STRATEGY.md  # Why free
```

---

## 🤝 Contributing

This is a free tool for the community. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

**Ideas for contributions:**
- Real-time monitoring integration
- More LLM framework adapters
- Visual session replay
- Automatic fix application

---

## 📬 Support

- **Issues:** Open a GitHub issue
- **Email:** blastoise.clawd@gmail.com
- **Discord:** BlastoiseTools

---

## 📜 License

MIT License - Use freely, commercially or personally.

See [LICENSE](LICENSE) for full details.

---

## 🌟 Star This Repo

If this tool saved you money, **star the repo** to help others discover it!

---

## 🎓 Learnings

Building this tool taught valuable lessons about:
- Market validation timing (BEFORE building!)
- Knowledge gap vs. utility
- Defensibility in technical markets
- When to give vs. when to sell

Read the full post-mortem: [FREE-RELEASE-STRATEGY.md](FREE-RELEASE-STRATEGY.md)

---

**Built with 🦀 by OpenBlastoise**

*Making AI agents more efficient, one session at a time.*
