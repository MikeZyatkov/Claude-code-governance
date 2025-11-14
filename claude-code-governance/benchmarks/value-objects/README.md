# Value Objects Benchmark

This benchmark validates the evaluation of Value Object pattern implementations.

## Pattern

Value Objects are immutable domain objects defined by their attributes rather than identity. They represent descriptive aspects of the domain.

**Pattern File:** `patterns/domain/value-objects/v1.yaml`
**Calibration:** `calibration/domain/value-objects/v1-scoring.yaml`

## Key Principles

1. **Immutability** - Once created, cannot be changed
2. **Private Constructor** - Use static factory methods
3. **Structural Equality** - Compare by value, not identity
4. **Validation** - Enforce invariants on creation
5. **No Identity** - Defined by attributes, not ID

## Fixtures

### Excellent (≥ 4.5)

**AccessCredential.vo.ts** - Perfect value object
- Readonly properties
- Private constructor
- Static factory with validation
- Structural equality (equals)
- Business rule validation

### Poor (< 4.0)

**MutableValueObject.ts** - Mutable value object
- No readonly properties
- Public setters allow mutation
- Missing equals() method
- Violates immutability

**ValueObjectWithPublicConstructor.ts** - Public constructor
- Public constructor allows invalid instances
- No validation enforcement
- Missing static factory

## Running Tests

```bash
# Run value objects benchmarks
npx jest benchmarks/value-objects/run.test.ts

# Watch mode
npx jest benchmarks/value-objects/run.test.ts --watch

# Verbose output
npx jest benchmarks/value-objects/run.test.ts --verbose
```

## Expected Results

- ✅ Excellent fixture scores > 4.5
- ✅ Mutable fixture scores ≤ 4.0
- ✅ Public constructor fixture scores ≤ 4.0
- ✅ N/A tactics handled correctly

## Anti-Patterns Detected

1. **Mutable Fields** - Not using readonly
2. **Public Setters** - Allowing mutation after creation
3. **Public Constructor** - No validation enforcement
4. **Missing Equality** - No equals() implementation
5. **No Validation** - Can create invalid instances

## References

- **DDD Book**: Eric Evans - "Domain-Driven Design" (Chapter 5: Value Objects)
- **Pattern**: Value Objects represent descriptive attributes with no identity
- **Code Samples**: Real production value objects from `code-samples-candidates/domain/model/*.vo.ts`

## Baseline

See `baseline.json` for expected scores and regression detection.
