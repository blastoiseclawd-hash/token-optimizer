# Context Window Pruning Guide
**Reduce API costs by 60% with smart message pruning**

## What is Context Window Pruning?

Every time you send a request to an LLM API, you pay for ALL the tokens in the conversation history. As conversations grow, costs explode:

```
Turn 1:  1,000 tokens = $0.003
Turn 10: 10,000 tokens = $0.030
Turn 50: 50,000 tokens = $0.150  ⚠️ 50x more expensive!
```

**Context window pruning** intelligently removes redundant messages while keeping critical context, reducing costs by **60-80%** without hurting quality.

---

## Quick Start

### 1. Basic Usage

```bash
# Prune a conversation file
node prune.js conversation.json

# See what would be removed (dry run)
node prune.js conversation.json --dry-run

# Custom token budget
node prune.js conversation.json --max-tokens 8000
```

### 2. Input Format

Your conversation file should be JSON array of messages:

```json
[
  {"role": "system", "content": "You are a helpful assistant."},
  {"role": "user", "content": "What's the weather?"},
  {"role": "assistant", "content": "I don't have access to weather data."},
  {"role": "user", "content": "Can you help me code?"},
  {"role": "assistant", "content": "Yes! What would you like to build?"}
]
```

### 3. Output

The pruner creates a `.pruned.json` file with optimized messages:

```
✂️  CONTEXT PRUNING REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Original messages: 47
Original tokens: 12,450

Pruned messages: 18
Pruned tokens: 4,200

💰 Savings: 8,250 tokens (66.3%)

Dropped by priority:
  • Low: 20 messages
  • Noise: 9 messages

💵 Cost saved per request: $0.024750
💵 Cost saved per 100 requests: $2.4750
```

---

## How It Works

### Priority-Based Retention

The pruner analyzes each message and assigns a priority:

| Priority | What Gets This? | Keep? |
|----------|----------------|-------|
| **CRITICAL** (100) | System messages, security issues | ✅ Always |
| **HIGH** (75) | Errors, decisions, important state | ✅ If space |
| **MEDIUM** (50) | Tool results, file reads, code | ✅ If space |
| **LOW** (25) | Routine responses, acknowledgments | ⚠️ Maybe |
| **NOISE** (0) | "HEARTBEAT_OK", "ok", duplicates | ❌ Never |

### The Algorithm

1. **Always keep**: System messages (role: system)
2. **Always keep**: Last N messages (default: 4) for continuity
3. **Score remaining**: Assign priority to each old message
4. **Fill budget**: Add high-priority messages until token limit reached
5. **Add summary**: Include one-line summary of dropped context

### Smart Pattern Detection

The pruner recognizes important patterns:

**High Priority:**
- Errors: `"error"`, `"failed"`, `"exception"`, `"crash"`
- Decisions: `"decided to"`, `"strategy"`, `"plan:"`
- Security: `"security"`, `"warning"`, `"fatal"`

**Noise (always dropped):**
- Heartbeats: `"HEARTBEAT_OK"`
- Empty acknowledgments: `"ok"`, `"yes"`, `"got it"`
- Progress indicators: `"checking..."`, `"processing..."`

---

## Configuration Options

### Token Budget

```bash
# Conservative (default)
node prune.js conversation.json --max-tokens 4000

# Generous (for complex tasks)
node prune.js conversation.json --max-tokens 8000

# Aggressive (maximum savings)
node prune.js conversation.json --max-tokens 2000
```

**Recommendation:** Start with 4000, increase if the assistant loses context.

### Keep Recent

```bash
# Keep last 4 messages (default)
node prune.js conversation.json --keep-recent 4

# Keep more for multi-turn conversations
node prune.js conversation.json --keep-recent 8

# Minimal (risky)
node prune.js conversation.json --keep-recent 2
```

**Recommendation:** Keep at least 4 for context continuity.

### Summarization

```bash
# With summary (default)
node prune.js conversation.json

# Without summary
node prune.js conversation.json --no-summary
```

Summary adds a message like:
```
"[Pruned context: 12 important decisions/errors, 8 tool operations, 15 routine messages]"
```

This helps the LLM understand what was removed.

---

## Integration with Your Agent

### Option 1: Pre-Process Conversations

```javascript
const ContextWindowPruner = require('./prune.js');

const pruner = new ContextWindowPruner({
  maxTokens: 4000,
  keepRecent: 4,
  summarizeOld: true
});

// Before sending to API
const { pruned } = pruner.pruneWithSummary(messages);

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4',
  messages: pruned,  // ← Use pruned messages
  max_tokens: 1024
});
```

### Option 2: Automatic Pruning Middleware

```javascript
class PruningAgent {
  constructor() {
    this.pruner = new ContextWindowPruner({ maxTokens: 4000 });
    this.messages = [];
  }

  async chat(userMessage) {
    // Add user message
    this.messages.push({ role: 'user', content: userMessage });

    // Prune before API call
    const { pruned } = this.pruner.pruneWithSummary(this.messages);

    // Send pruned conversation
    const response = await this.callAPI(pruned);

    // Store full conversation (including assistant response)
    this.messages.push({ role: 'assistant', content: response });

    return response;
  }
}
```

### Option 3: On-Demand Pruning

```javascript
// Only prune when conversation gets large
if (messages.length > 20) {
  const { pruned } = pruner.prune(messages);
  messages = pruned;
}
```

---

## Real-World Impact

### Case Study: Long-Running Agent

**Before Pruning:**
- 50 turns, 15,000 tokens per request
- $0.045 per request
- 100 requests/day = **$4.50/day** ($135/month)

**After Pruning:**
- 50 turns, 4,500 tokens per request (70% reduction)
- $0.0135 per request
- 100 requests/day = **$1.35/day** ($40.50/month)

**Savings: $94.50/month (70%)**

### When to Use

✅ **Use pruning when:**
- Conversations exceed 10+ turns
- Building long-running agents
- Context includes repetitive tool calls
- Budget is tight

❌ **Skip pruning when:**
- Conversations are short (<5 turns)
- Every detail matters (legal, medical)
- Debugging issues (need full history)
- Budget is unlimited

---

## Advanced: Custom Priority Rules

You can extend the pruner with custom logic:

```javascript
const pruner = new ContextWindowPruner();

// Override priority analysis
const originalAnalyze = pruner.analyzePriority.bind(pruner);
pruner.analyzePriority = function(message) {
  // Custom rule: Keep all code blocks
  if (message.content.includes('```')) {
    return 100; // CRITICAL
  }
  
  // Custom rule: Drop status updates
  if (message.content.match(/^Status:/)) {
    return 0; // NOISE
  }
  
  // Fall back to default
  return originalAnalyze(message);
};
```

---

## Troubleshooting

### "Assistant lost context after pruning"

**Solution:** Increase token budget or keep more recent messages:
```bash
node prune.js conversation.json --max-tokens 6000 --keep-recent 6
```

### "Not saving enough tokens"

**Solution:** Decrease token budget or enable aggressive mode:
```bash
node prune.js conversation.json --max-tokens 2000
```

### "Important messages were dropped"

**Solution:** Check priority detection. Important messages should contain keywords like "error", "decided", "strategy". Add explicit markers:
```
User: "[IMPORTANT] Here's my decision..."
```

---

## Performance Tips

1. **Prune early**: Don't wait until you hit token limits
2. **Monitor savings**: Track how much you're saving with `--verbose`
3. **Tune for your use case**: Adjust `--max-tokens` based on task complexity
4. **Use summaries**: Enable `--summary` to help LLM understand dropped context
5. **Test before production**: Use `--dry-run` to preview changes

---

## API Reference

### Constructor Options

```javascript
new ContextWindowPruner({
  maxTokens: 4000,        // Maximum tokens to keep
  keepRecent: 4,          // Always keep N most recent messages
  summarizeOld: true,     // Add summary of dropped messages
  verbose: false,         // Detailed logging
  dryRun: false          // Don't modify files
})
```

### Methods

**`prune(messages)`**
- Returns: `{ pruned, stats }`
- Basic pruning without summarization

**`pruneWithSummary(messages)`**
- Returns: `{ pruned, stats, summary }`
- Pruning with automatic summarization

**`analyzePriority(message)`**
- Returns: Priority score (0-100)
- Determine message importance

**`processFile(inputFile, outputFile)`**
- Process a JSON file and save pruned version

---

## FAQ

**Q: Will pruning break my agent?**
A: No, if configured properly. Start with defaults (4000 tokens, keep 4 recent) and adjust as needed.

**Q: How much can I save?**
A: Typically 60-80% on long conversations. Short conversations see less benefit.

**Q: Can I undo pruning?**
A: Yes! Original files are never modified (unless you specify output file explicitly). Keep backups.

**Q: What about prompt caching?**
A: Pruning complements caching! Use both for maximum savings. Prune before sending, cache common prefixes.

**Q: Is this safe for production?**
A: Yes! Based on patterns from LangChain and Vercel AI SDK. Test with `--dry-run` first.

---

## Next Steps

1. **Test it**: Try `--dry-run` on your conversations
2. **Integrate it**: Add to your agent pipeline
3. **Measure impact**: Track savings over time
4. **Tune it**: Adjust settings for your use case
5. **Combine strategies**: Use with compression and caching

**Ready to save 60% on API costs?** Start with:
```bash
node prune.js your-conversation.json --dry-run
```

---

*Part of the Token Cost Optimizer toolkit*
