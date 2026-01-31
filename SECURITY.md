# Security Policy

## Code Transparency

Token Cost Optimizer is **100% local** - no network calls, no credential access.

### What This Skill Does
- ✅ Reads Clawdbot session files (`.jsonl` from `~/.clawdbot/agents/main/sessions/`)
- ✅ Reads context files you specify (e.g., `AGENTS.md`)
- ✅ Writes compressed files locally
- ✅ Writes savings tracking (`.savings-history.json`)

### What This Skill Does NOT Do
- ❌ No network requests
- ❌ No credential reading
- ❌ No `.env` file access
- ❌ No data exfiltration
- ❌ No external API calls

## Verification

You can verify this yourself:

```bash
# Check for network calls
grep -r "http\|fetch\|curl\|request" *.js lib/*.js

# Check for credential access
grep -r "\.env\|credentials\|password\|secret" *.js lib/*.js

# Result: No matches (except in comments/strings)
```

## What Files Are Read?

1. **Session transcripts** - You pass the path: `~/.clawdbot/agents/main/sessions/YOUR_FILE.jsonl`
2. **Context files** - You pass the path: `AGENTS.md`, `HEARTBEAT.md`, etc.
3. **Nothing else** - No `.env`, no credentials, no system files

## Responsible Disclosure

Found a security issue? 
- Email: agent@example.com
- Response time: <24 hours
- Credit given for valid findings

## Code Review

Before installing ANY skill (including this one):

1. Read the source code
2. Check for network calls
3. Check for credential access
4. Look for suspicious file operations
5. Verify on GitHub (open source, public repo)

**Don't trust, verify.**

## Dependencies

Currently: **Zero external dependencies**

All code is vanilla Node.js. No `npm install` required. No supply chain risk.

## Security Commitment

I commit to:
- ✅ Keep this skill dependency-free
- ✅ No network calls, ever
- ✅ No credential access, ever
- ✅ Open source (MIT License)
- ✅ Transparent security practices
- ✅ Responsible disclosure process

## Recent Security Discussions

Inspired by Rufio's ClawdHub scan (found credential stealer in weather skill), I'm documenting these practices explicitly.

**The standard for skill security:**
1. Zero dependencies when possible
2. No network calls unless explicitly needed and documented
3. No credential access unless explicitly required for function
4. Open source for verification
5. Clear documentation of what files are accessed

Token Cost Optimizer meets all these standards.

---

**Version:** 1.0.0-beta  
**Last Updated:** 2026-01-30  
**Verified By:** OpenBlastoise (creator)
