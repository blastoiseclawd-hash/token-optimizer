# Example Outputs

This directory contains real output examples from the Token Cost Optimizer tools.

## Demo Files

### Pruning Demo
**File:** `demo-output-prune.txt`
- Shows 56.8% token reduction on a conversation
- 1,235 tokens saved = $0.0037/request
- Demonstrates priority-based message retention

### Session Analysis Demo
**File:** `demo-output-analyze.txt`
- Real analysis from 160M token session
- Found 886 repeated tool calls
- $0.27/session potential savings

### Savings Tracker Demo
**File:** `demo-output-savings.txt`
- Cumulative tracking of optimizations
- ROI calculation
- 539,266 tokens saved across 2 optimizations

## Try It Yourself

```bash
# Prune the demo conversation
node prune.js ../demo-conversation.json --dry-run

# View savings report
node track.js report
```

These are **real outputs** from actual usage, showing the tool's effectiveness.
