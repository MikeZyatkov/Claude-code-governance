# Value Objects Benchmark Implementation Plan

## Pattern Overview

Value Objects are a core DDD tactical pattern representing descriptive aspects of the domain with no conceptual identity. They are defined by their attributes and must be immutable.

## Pattern Rules

### Critical Tactics

1. **Immutability**
   - All fields must be readonly
   - No public setters
   - Once created, cannot be modified
   - Changes require creating new instance

2. **Private Constructor + Static Factory**
   - Constructor must be private
   - Static factory methods (e.g., `create()`) for instantiation
   - Factory enforces validation rules
   - Prevents invalid instances from being created

3. **Structural Equality**
   - Implement `equals()` method
   - Compare by value, not identity
   - Two instances with same values should be equal

4. **Validation on Construction**
   - All invariants validated in factory
   - Business rules enforced
   - Throw domain errors for invalid state

5. **No Identity**
   - No ID field
   - Identity is the combination of all attributes
   - Interchangeable if values match

## Fixtures Strategy

### Excellent Fixture: AccessCredential.vo.ts

Real production code demonstrating all best practices:
- Immutable (readonly fields)
- Private constructor
- Static factory with validation
- Structural equality (equals method)
- Business rule validation (offline requires online)
- No public setters

### Poor Fixture 1: MutableValueObject.ts

Violations:
- Mutable fields (no readonly)
- Public setters allow mutation
- No equals() method
- Violates immutability principle

### Poor Fixture 2: ValueObjectWithPublicConstructor.ts

Violations:
- Public constructor
- No validation on construction
- Can create invalid instances
- No static factory method

## Expected Scores

- **Excellent (AccessCredential.vo.ts)**: ≥ 4.5
  - All critical tactics present
  - Proper encapsulation and immutability
  - Complete validation

- **Poor (MutableValueObject.ts)**: < 4.0
  - Fundamental immutability violation
  - Missing structural equality
  - Can mutate after creation

- **Poor (ValueObjectWithPublicConstructor.ts)**: < 4.0
  - Can create invalid instances
  - No validation enforcement
  - Public constructor anti-pattern

## Calibration Expectations

Pattern: `domain/value-objects/v1`
Calibration: `domain/value-objects/v1-scoring.yaml`

Key tactics to evaluate:
- `immutable-properties`: Fields must be readonly
- `private-constructor`: Constructor must be private
- `static-factory`: Static factory methods for creation
- `structural-equality`: Implement equals() method
- `validate-on-construction`: Validation in factory
- `no-setters`: No public setters

## Success Criteria

- ✅ Excellent fixture scores ≥ 4.5
- ✅ Mutable fixture scores < 4.0
- ✅ Public constructor fixture scores < 4.0
- ✅ Low-scoring tactics identified correctly
- ✅ Recommendations include immutability and validation fixes

## Anti-Patterns to Detect

1. **Mutable Value Objects**
   - Fields not readonly
   - Public setters
   - Can change after creation

2. **Public Constructors**
   - No validation enforcement
   - Can create invalid instances
   - Bypasses business rules

3. **Missing Structural Equality**
   - No equals() method
   - Relies on identity comparison
   - Cannot compare by value

4. **No Validation**
   - Missing factory validation
   - Invalid instances possible
   - Business rules not enforced

## References

- **Pattern File**: `patterns/domain/value-objects/v1.yaml`
- **Calibration File**: `calibration/domain/value-objects/v1-scoring.yaml`
- **Code Samples**: `code-samples-candidates/domain/model/*.vo.ts`
