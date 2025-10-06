# Evaluation Framework

## Architecture

The evaluation framework uses the **Adapter Pattern** for LLM integration, allowing easy swapping between different LLM providers.

```
┌─────────────────────────────────────────────┐
│           CodeEvaluator                     │
│  (Orchestrates deterministic + LLM checks)  │
└─────────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ Deterministic    │  │    LLMJudge      │
│   Checker        │  │  (Multi-pass)    │
└──────────────────┘  └──────────────────┘
                              │
                      ┌───────┴───────┐
                      │  ILLMAdapter  │ (Interface)
                      └───────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
      ┌──────────────────────┐  ┌──────────────────────┐
      │ ClaudeCodeCLIAdapter │  │ AnthropicSDKAdapter  │
      │    (Default)         │  │  (Optional)          │
      └──────────────────────┘  └──────────────────────┘
```

## Available Adapters

### 1. ClaudeCodeCLIAdapter (Default)

Uses the `claude-code` CLI tool as the LLM backend.

**Pros**:
- ✅ No API key needed (uses your Claude Code authentication)
- ✅ Zero additional setup
- ✅ Works immediately

**Cons**:
- ⚠️ Slower (process spawn overhead)
- ⚠️ Requires `claude-code` in PATH

**Usage**:
```typescript
import { ClaudeCodeCLIAdapter } from './llm-judge/adapters'

const adapter = new ClaudeCodeCLIAdapter()
// or with custom CLI path:
const adapter = new ClaudeCodeCLIAdapter('/custom/path/to/claude-code')
```

### 2. AnthropicSDKAdapter (Optional)

Direct API calls using `@anthropic-ai/sdk`.

**Pros**:
- ✅ Faster (no process spawn)
- ✅ Better control over model/temperature
- ✅ Parallel requests

**Cons**:
- ⚠️ Requires API key
- ⚠️ Requires installing `@anthropic-ai/sdk`

**Setup**:
```bash
npm install @anthropic-ai/sdk
# Uncomment implementation in AnthropicSDKAdapter.ts
```

**Usage**:
```typescript
import { AnthropicSDKAdapter } from './llm-judge/adapters'

const adapter = new AnthropicSDKAdapter(process.env.ANTHROPIC_API_KEY)
```

## Usage Examples

### Basic Evaluation (Default CLI Adapter)

```typescript
import { evaluateCode, loadPattern } from './src/index'

const pattern = loadPattern('domain', 'ddd-aggregates', 'v1')

const result = await evaluateCode({
  code: yourCode,
  patterns: [pattern],
  checkLLMJudge: true
})

console.log(`Score: ${result.overall_score}/5`)
```

### Custom Adapter

```typescript
import { evaluateCode, loadPattern } from './src/index'
import { ClaudeCodeCLIAdapter } from './src/llm-judge/adapters'

const adapter = new ClaudeCodeCLIAdapter()
const pattern = loadPattern('domain', 'ddd-aggregates', 'v1')

const result = await evaluateCode({
  code: yourCode,
  patterns: [pattern],
  checkLLMJudge: true,
  llmAdapter: adapter  // Optional: override default
})
```

### Multiple Passes for Consistency

```typescript
const result = await evaluateCode({
  code: yourCode,
  patterns: [pattern],
  checkLLMJudge: true,
  multiPassCount: 5  // Run 5 times, use median score
})
```

## Testing

```bash
# Install dependencies
npm install

# Build
npm run build

# Run test evaluation
cd ..
node evaluation/dist/test-evaluation.js
```

Or use the TypeScript test directly:

```bash
npm install -g ts-node
ts-node examples/test-evaluation.ts
```

## Creating Custom Adapters

Implement the `ILLMAdapter` interface:

```typescript
import { ILLMAdapter, LLMRequest, LLMResponse } from './ILLMAdapter'

export class MyCustomAdapter implements ILLMAdapter {
  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Your implementation
    return {
      content: '...',
      model: request.model || 'my-model',
      usage: { inputTokens: 0, outputTokens: 0 }
    }
  }

  getName(): string {
    return 'MyCustomAdapter'
  }
}
```

Then use it:

```typescript
const adapter = new MyCustomAdapter()
const judge = new LLMJudge(adapter)
```

## Multi-Pass Consistency

The framework runs multiple evaluation passes and aggregates results:

- **Tactic scores**: Uses **median** (reduces variance)
- **Constraint checks**: Uses **majority vote** (most common result)

This improves consistency when LLM responses vary slightly.

## Output Format

```typescript
{
  task_id: "eval_1234567890_abc123",
  timestamp: "2025-10-03T12:00:00.000Z",
  code_path: "./path/to/code.ts",
  patterns_used: {
    "DDD Aggregates and Entities": "v1"
  },
  deterministic: {
    tests_passing: true,
    linter_score: 95,
    type_check_passing: true,
    security_issues: [],
    constraint_violations: []
  },
  llm_judge: [{
    pattern_name: "DDD Aggregates and Entities",
    pattern_version: "v1",
    tactic_scores: [
      {
        tactic_name: "Extend AggregateRoot...",
        priority: "critical",
        score: 5,
        reasoning: "..."
      }
    ],
    constraint_checks: [
      {
        constraint_rule: "Aggregate root MUST be...",
        status: "PASS",
        reasoning: "..."
      }
    ],
    tactics_score: 4.5,
    constraints_passed: true,
    overall_pattern_score: 4.4
  }],
  overall_score: 4.4,
  recommendations: [
    "✅ Code meets all pattern requirements"
  ]
}
```

## Next Steps

1. **Test the CLI adapter**: Run `ts-node examples/test-evaluation.ts`
2. **Adjust scoring rubrics**: If scores seem too harsh/lenient
3. **Add calibration examples**: Anchor LLM judge consistency
4. **Implement SDK adapter**: For production CI/CD pipelines
5. **Add deterministic checks**: AST analysis, linting, tests
