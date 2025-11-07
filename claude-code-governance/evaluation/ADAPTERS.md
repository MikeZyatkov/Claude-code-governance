# LLM Adapter Configuration

The evaluation framework supports multiple LLM adapters for running benchmarks and evaluations.

## Quick Start

### Using Anthropic SDK (Default)

This is the recommended and default adapter. It's faster and more reliable than the CLI adapter.

```bash
# Set your API key
export ANTHROPIC_API_KEY="your-api-key-here"

# Run benchmarks
npm test
```

### Using Claude CLI

If you prefer to use the Claude CLI (slower, not recommended):

```bash
# Set adapter type
export LLM_ADAPTER="claude-cli"

# Run benchmarks
npm test
```

## Configuration

### Environment Variables

- **`LLM_ADAPTER`**: Choose which adapter to use
  - `anthropic-sdk` (default) - Direct API calls using @anthropic-ai/sdk
  - `claude-cli` - Use the claude command-line tool

- **`ANTHROPIC_API_KEY`**: Required for `anthropic-sdk` adapter
  - Get your API key from https://console.anthropic.com/

- **`CLAUDE_CLI_PATH`**: Optional path to claude CLI (default: `claude`)
  - Only used when `LLM_ADAPTER=claude-cli`

## Adapter Comparison

### AnthropicSDKAdapter (Recommended)

**Pros:**
- ✅ Fast - Direct API calls with no process spawn overhead
- ✅ Reliable - Well-tested SDK
- ✅ Better error handling
- ✅ Supports parallel requests
- ✅ Accurate token counting

**Cons:**
- ⚠️ Requires API key
- ⚠️ API calls cost money (though evaluation is relatively cheap)

**When to use:**
- Running benchmarks in CI/CD
- Development and testing
- Any production use case

### ClaudeCodeCLIAdapter

**Pros:**
- ✅ No API key needed (uses Claude Code authentication)

**Cons:**
- ⚠️ Slow - Spawns a new process for each LLM call
- ⚠️ Not reliable in all environments
- ⚠️ The `claude --print` flag behavior varies by environment
- ⚠️ May hang indefinitely in some Claude Code environments

**When to use:**
- Only if you don't have access to an API key
- Note: Currently not working reliably in Claude Code web environment

## Programmatic Configuration

You can also configure adapters programmatically:

```typescript
import { AdapterFactory, AnthropicSDKAdapter } from './adapters'

// Create a specific adapter
const adapter = AdapterFactory.createAdapter('anthropic-sdk', 'your-api-key')

// Or get the default adapter (respects LLM_ADAPTER env var)
const defaultAdapter = AdapterFactory.getDefaultAdapter()

// Pass to evaluator
const judge = new LLMJudge(adapter)
```

## Troubleshooting

### "AnthropicSDKAdapter requires an API key"

You need to set the `ANTHROPIC_API_KEY` environment variable:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
npm test
```

### "Claude Code CLI exited with code 1"

The CLI adapter is not working in your environment. Switch to the SDK adapter:

```bash
export LLM_ADAPTER="anthropic-sdk"
export ANTHROPIC_API_KEY="your-key"
npm test
```

### Benchmarks hang/timeout

If using `claude-cli` adapter and tests timeout, the CLI is not responding. Switch to `anthropic-sdk`:

```bash
export LLM_ADAPTER="anthropic-sdk"
export ANTHROPIC_API_KEY="your-key"
npm test
```

## Cost Estimation

The AnthropicSDK adapter uses the Anthropic API which has costs:

- **DDD Aggregates Benchmark**: ~3 tests × 3 passes × ~2K tokens = ~$0.02-0.05 per run
- **Full Benchmark Suite**: Varies by number of fixtures, typically < $1.00 per run

Token costs are minimal for development and CI/CD usage.
