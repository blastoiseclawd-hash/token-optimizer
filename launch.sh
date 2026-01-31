#!/bin/bash
# Token Cost Optimizer - One-Command Launch Script
# Run this after authenticating GitHub (gh auth login)

set -e  # Exit on error

echo "🚀 Token Cost Optimizer - Launch Script"
echo "========================================"
echo ""

# Check if gh is authenticated
echo "Checking GitHub authentication..."
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ ERROR: GitHub CLI not authenticated"
    echo ""
    echo "Please run one of:"
    echo "  gh auth login              (recommended)"
    echo "  export GITHUB_TOKEN=...    (with personal access token)"
    echo ""
    exit 1
fi

echo "✅ GitHub authenticated"
echo ""

# Confirm repo details
REPO_ORG="turtle-tools"
REPO_NAME="token-optimizer"
REPO_FULL="${REPO_ORG}/${REPO_NAME}"

echo "Repository: ${REPO_FULL}"
echo "Description: Reduce LLM costs by 60-80% through intelligent context pruning"
echo ""
read -p "Proceed with creation? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Create and push repository
echo ""
echo "Creating GitHub repository..."
gh repo create "${REPO_FULL}" \
    --public \
    --source=. \
    --description="Reduce LLM costs by 60-80% through intelligent context pruning" \
    --remote=origin \
    --push

echo ""
echo "✅ Repository created and code pushed!"
echo ""

# Add topics
echo "Adding repository topics..."
gh repo edit "${REPO_FULL}" \
    --add-topic clawdbot \
    --add-topic token-optimization \
    --add-topic cost-reduction \
    --add-topic ai-agents \
    --add-topic llm \
    --add-topic prompt-caching

echo "✅ Topics added!"
echo ""

# Create release
echo "Creating v1.0.0-beta release..."
gh release create v1.0.0-beta \
    --repo "${REPO_FULL}" \
    --title "v1.0.0-beta - Free Beta Launch" \
    --notes "🚀 First public beta release!

## What's New
- **Context Window Pruning:** Reduce conversation tokens by 60%
- **Session Analysis:** Find token bloat and get prioritized fixes
- **Savings Tracking:** Monitor cumulative cost reduction
- **File Caching:** Prevent repeated file reads

## Free Beta Access
1. ⭐ Star this repo
2. 📊 Use on 2+ sessions
3. 💬 Share your savings (testimonial)

**Get lifetime access** as an early adopter.

Beta ends Feb 28, 2026. Paid version launches March 1.

## Quick Start
\`\`\`bash
cd ~/clawd/skills/token-optimizer
node prune.js demo-conversation.json --dry-run
\`\`\`

See README.md for full documentation."

echo "✅ Release created!"
echo ""

# Star the repo
echo "Starring the repository..."
gh repo view "${REPO_FULL}" --web >/dev/null 2>&1 || true
gh api "user/starred/${REPO_FULL}" -X PUT >/dev/null 2>&1 || echo "  (manual star needed)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 LAUNCH COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Repository: https://github.com/${REPO_FULL}"
echo ""
echo "Next steps:"
echo "1. ✅ Repo created and pushed"
echo "2. ✅ Topics added"
echo "3. ✅ Release v1.0.0-beta created"
echo "4. 📢 Post launch announcements (see launch-posts.md)"
echo "5. 👥 Collect beta signups"
echo "6. 💬 Gather testimonials"
echo ""
echo "Launch posts ready in: launch-posts.md"
echo "Copy/paste to: Discord, Moltbook, Reddit"
echo ""
echo "🚀 GO GET 'EM!"
