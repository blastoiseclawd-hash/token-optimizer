# Token Optimizer - Integration Guide
**How to integrate context window pruning into your AI agent**

## Overview

Context window pruning is the **highest-impact optimization** in this toolkit, delivering 60-80% cost reduction on long conversations. This guide shows you how to integrate it into your agent.

---

## Quick Integration (5 minutes)

### For Anthropic Claude SDK

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const ContextWindowPruner = require('./prune.js');

const client = new Anthropic();
const pruner = new ContextWindowPruner({ 
  maxTokens: 4000,
  keepRecent: 4 
});

async function chat(messages, userMessage) {
  // Add user message
  messages.push({ role: 'user', content: userMessage });

  // 🔥 PRUNE BEFORE SENDING
  const { pruned } = pruner.pruneWithSummary(messages);

  // Send pruned conversation (saves 60%!)
  const response = await client.messages.create({
    model: 'claude-sonnet-4',
    max_tokens: 1024,
    messages: pruned  // ← Use pruned instead of full messages
  });

  // Store full conversation history (including response)
  messages.push({ 
    role: 'assistant', 
    content: response.content[0].text 
  });

  return response;
}
```

**That's it!** You're now saving 60% on API costs.

---

## Integration Patterns

### Pattern 1: Always-On Pruning

Best for: Long-running agents, chat applications

```javascript
class Agent {
  constructor() {
    this.messages = [];
    this.pruner = new ContextWindowPruner({ maxTokens: 4000 });
  }

  async chat(userMessage) {
    this.messages.push({ role: 'user', content: userMessage });

    // Always prune before API call
    const { pruned } = this.pruner.pruneWithSummary(this.messages);

    const response = await this.callAPI(pruned);
    
    this.messages.push({ role: 'assistant', content: response });
    
    return response;
  }
}
```

**Pros:** Maximum savings, simple implementation  
**Cons:** Might prune too aggressively on short conversations

---

### Pattern 2: Conditional Pruning

Best for: Mixed short/long conversations

```javascript
class SmartAgent {
  constructor() {
    this.messages = [];
    this.pruner = new ContextWindowPruner({ maxTokens: 4000 });
    this.pruneThreshold = 10; // Start pruning after 10 messages
  }

  async chat(userMessage) {
    this.messages.push({ role: 'user', content: userMessage });

    // Only prune when conversation gets long
    const messagesToSend = this.messages.length > this.pruneThreshold
      ? this.pruner.pruneWithSummary(this.messages).pruned
      : this.messages;

    const response = await this.callAPI(messagesToSend);
    
    this.messages.push({ role: 'assistant', content: response });
    
    return response;
  }
}
```

**Pros:** No unnecessary pruning on short chats  
**Cons:** Slightly more complex

---

### Pattern 3: Token-Budget Pruning

Best for: Budget-constrained applications

```javascript
class BudgetAgent {
  constructor(tokenBudget = 50000) { // Daily token budget
    this.messages = [];
    this.tokenBudget = tokenBudget;
    this.tokensUsed = 0;
    this.pruner = new ContextWindowPruner({ maxTokens: 2000 }); // Aggressive!
  }

  async chat(userMessage) {
    this.messages.push({ role: 'user', content: userMessage });

    // Check if we're close to budget
    const needsAggressive = this.tokensUsed > (this.tokenBudget * 0.8);
    
    const prunerSettings = needsAggressive 
      ? { maxTokens: 1500, keepRecent: 3 }  // Very aggressive
      : { maxTokens: 4000, keepRecent: 4 }; // Normal

    const pruner = new ContextWindowPruner(prunerSettings);
    const { pruned, stats } = pruner.pruneWithSummary(this.messages);

    const response = await this.callAPI(pruned);
    
    // Track token usage
    this.tokensUsed += stats.pruned.tokens + response.usage.output_tokens;
    
    this.messages.push({ role: 'assistant', content: response });
    
    return response;
  }
}
```

**Pros:** Stays within budget automatically  
**Cons:** Quality may degrade when budget constrained

---

### Pattern 4: Priority-Aware Pruning

Best for: Complex agents with important context

```javascript
class PriorityAgent {
  constructor() {
    this.messages = [];
    this.pruner = new ContextWindowPruner({ maxTokens: 4000 });
  }

  async chat(userMessage, priority = 'medium') {
    // Tag messages with explicit priority
    this.messages.push({ 
      role: 'user', 
      content: userMessage,
      _priority: priority // Custom field
    });

    // Override priority analysis with your tags
    const originalAnalyze = this.pruner.analyzePriority.bind(this.pruner);
    this.pruner.analyzePriority = (msg) => {
      if (msg._priority === 'critical') return 100;
      if (msg._priority === 'high') return 75;
      if (msg._priority === 'low') return 25;
      return originalAnalyze(msg);
    };

    const { pruned } = this.pruner.pruneWithSummary(this.messages);

    const response = await this.callAPI(pruned);
    
    this.messages.push({ role: 'assistant', content: response });
    
    return response;
  }
}
```

**Pros:** Fine-grained control over what gets kept  
**Cons:** Requires manual priority tagging

---

## Advanced: Multi-Strategy Optimization

Combine pruning with other optimizations for maximum savings:

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const ContextWindowPruner = require('./prune.js');

class OptimizedAgent {
  constructor() {
    this.client = new Anthropic();
    this.pruner = new ContextWindowPruner({ maxTokens: 4000 });
    this.messages = [];
    
    // Prompt caching support (Anthropic)
    this.cacheConfig = {
      system: [
        {
          type: "text",
          text: "You are a helpful assistant...",
          cache_control: { type: "ephemeral" }
        }
      ]
    };
  }

  async chat(userMessage) {
    this.messages.push({ role: 'user', content: userMessage });

    // 1. Prune context (60% savings)
    const { pruned } = this.pruner.pruneWithSummary(this.messages);

    // 2. Use streaming (reduces memory)
    // 3. Enable prompt caching (90% savings on cached content)
    const stream = await this.client.messages.stream({
      model: 'claude-sonnet-4',
      max_tokens: 1024,
      system: this.cacheConfig.system,
      messages: pruned
    });

    let fullResponse = '';
    stream.on('text', (text) => {
      process.stdout.write(text);
      fullResponse += text;
    });

    await stream.finalMessage();

    this.messages.push({ role: 'assistant', content: fullResponse });

    return fullResponse;
  }
}
```

**Combined savings:**
- Pruning: 60% on message tokens
- Caching: 90% on cached system prompts
- Streaming: 80% memory reduction
- **Total cost reduction: ~70-85%** 🎉

---

## Framework-Specific Integration

### LangChain.js

```javascript
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
const ContextWindowPruner = require('./prune.js');

const model = new ChatAnthropic({ modelName: "claude-sonnet-4" });
const pruner = new ContextWindowPruner({ maxTokens: 4000 });

async function chat(messages, userInput) {
  messages.push(new HumanMessage(userInput));

  // Convert LangChain messages to pruner format
  const formattedMessages = messages.map(msg => ({
    role: msg._getType() === 'human' ? 'user' : 'assistant',
    content: msg.content
  }));

  // Prune
  const { pruned } = pruner.pruneWithSummary(formattedMessages);

  // Convert back to LangChain format
  const langchainMessages = pruned.map(msg => 
    msg.role === 'user' 
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );

  const response = await model.invoke(langchainMessages);
  messages.push(response);

  return response.content;
}
```

---

### Vercel AI SDK

```javascript
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
const ContextWindowPruner = require('./prune.js');

const anthropic = createAnthropic();
const pruner = new ContextWindowPruner({ maxTokens: 4000 });

async function chat(messages, userMessage) {
  messages.push({ role: 'user', content: userMessage });

  const { pruned } = pruner.pruneWithSummary(messages);

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4'),
    messages: pruned,
  });

  messages.push({ role: 'assistant', content: text });

  return text;
}
```

---

### OpenAI (GPT)

Works identically! Just swap the API client:

```javascript
const OpenAI = require('openai');
const ContextWindowPruner = require('./prune.js');

const client = new OpenAI();
const pruner = new ContextWindowPruner({ maxTokens: 4000 });

async function chat(messages, userMessage) {
  messages.push({ role: 'user', content: userMessage });

  const { pruned } = pruner.pruneWithSummary(messages);

  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: pruned
  });

  const assistantMessage = response.choices[0].message.content;
  messages.push({ role: 'assistant', content: assistantMessage });

  return assistantMessage;
}
```

---

## Configuration Tuning

### Finding the Right Token Budget

Start with defaults and adjust based on results:

```javascript
// Conservative (safest, good context retention)
maxTokens: 6000, keepRecent: 6

// Balanced (recommended starting point)
maxTokens: 4000, keepRecent: 4

// Aggressive (maximum savings, may lose context)
maxTokens: 2000, keepRecent: 3
```

**How to tune:**

1. Start with balanced settings
2. Run for 1 day
3. Check if assistant "forgets" important context
   - If yes: Increase `maxTokens` or `keepRecent`
   - If no: Try more aggressive settings
4. Monitor cost savings vs quality trade-off

---

## Testing Your Integration

### Test 1: Short Conversation (Should Not Prune)

```javascript
const messages = [
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Hi' },
  { role: 'assistant', content: 'Hello!' }
];

const { pruned, stats } = pruner.prune(messages);
console.log(`Dropped: ${stats.dropped.count} messages`);
// Should be 0 (conversation is short)
```

### Test 2: Long Conversation (Should Prune)

```javascript
const messages = Array.from({ length: 50 }, (_, i) => ({
  role: i % 2 === 0 ? 'user' : 'assistant',
  content: `Message ${i}`
}));

const { pruned, stats } = pruner.prune(messages);
console.log(`Dropped: ${stats.dropped.count} messages`);
console.log(`Savings: ${stats.dropped.tokens} tokens`);
// Should show significant savings
```

### Test 3: Priority Retention

```javascript
const messages = [
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Error: System crashed!' }, // High priority
  { role: 'assistant', content: 'ok' }, // Noise - should drop
  { role: 'user', content: 'HEARTBEAT_OK' }, // Noise - should drop
  { role: 'user', content: 'What happened?' }
];

const { pruned } = pruner.prune(messages);
// Should keep error message, drop noise
console.log(pruned.map(m => m.content));
```

---

## Production Checklist

Before deploying to production:

- [ ] Tested with representative conversation lengths
- [ ] Verified important context is retained
- [ ] Monitored cost savings (aim for 50%+)
- [ ] Set up logging to track pruning stats
- [ ] Configured appropriate token budget for your use case
- [ ] Added fallback for edge cases (very long single messages)
- [ ] Tested with streaming (if using)
- [ ] Verified compatibility with your LLM provider

---

## Monitoring & Observability

Track pruning effectiveness in production:

```javascript
class MonitoredAgent {
  constructor() {
    this.pruner = new ContextWindowPruner({ maxTokens: 4000 });
    this.stats = {
      totalRequests: 0,
      tokensBeforePruning: 0,
      tokensAfterPruning: 0,
      costSaved: 0
    };
  }

  async chat(messages, userMessage) {
    messages.push({ role: 'user', content: userMessage });

    const { pruned, stats } = this.pruner.pruneWithSummary(messages);

    // Track metrics
    this.stats.totalRequests++;
    this.stats.tokensBeforePruning += stats.original.tokens;
    this.stats.tokensAfterPruning += stats.pruned.tokens;
    this.stats.costSaved += (stats.dropped.tokens * 0.000003);

    const response = await this.callAPI(pruned);
    messages.push({ role: 'assistant', content: response });

    // Log every 100 requests
    if (this.stats.totalRequests % 100 === 0) {
      console.log('📊 Pruning Stats (last 100 requests):');
      console.log(`  Tokens saved: ${this.stats.tokensBeforePruning - this.stats.tokensAfterPruning}`);
      console.log(`  Cost saved: $${this.stats.costSaved.toFixed(4)}`);
      console.log(`  Savings rate: ${((1 - this.stats.tokensAfterPruning / this.stats.tokensBeforePruning) * 100).toFixed(1)}%`);
    }

    return response;
  }
}
```

---

## Troubleshooting

### "Quality degraded after adding pruning"

**Diagnosis:** Too aggressive pruning settings  
**Solution:**
```javascript
// Increase token budget
new ContextWindowPruner({ maxTokens: 6000, keepRecent: 6 })
```

### "Not saving enough tokens"

**Diagnosis:** Conversations too short or budget too high  
**Solution:**
```javascript
// Lower token budget
new ContextWindowPruner({ maxTokens: 2000, keepRecent: 3 })
```

### "Important messages getting dropped"

**Diagnosis:** Priority detection not recognizing importance  
**Solution:** Add explicit markers or custom priority logic
```javascript
// Mark important messages
messages.push({ 
  role: 'user', 
  content: '[IMPORTANT] Critical decision here...' 
});
```

---

## Next Steps

1. **Start simple**: Add `pruner.pruneWithSummary()` before API calls
2. **Monitor results**: Track savings and quality for 1 week
3. **Tune settings**: Adjust `maxTokens` and `keepRecent` based on results
4. **Combine optimizations**: Add streaming and caching for maximum savings
5. **Share results**: Let us know your savings on Discord! 🎉

---

**Ready to save 60% on API costs?** Copy the Quick Integration example and start pruning! 🚀

*Questions? Open an issue or ping us on Discord.*
