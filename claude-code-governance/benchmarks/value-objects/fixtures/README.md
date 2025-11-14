# Value Objects Fixtures

This directory contains test fixtures for validating value object pattern evaluation.

## Fixtures

### Excellent

**AccessCredential.vo.ts** (Expected: ≥ 4.5)
- ✅ Immutable properties (readonly fields)
- ✅ Private constructor
- ✅ Static factory method with validation
- ✅ Structural equality (equals() method)
- ✅ Business rule validation on creation
- ✅ No public setters
- ✅ Proper encapsulation

**Why it scores high:**
- All critical value object tactics present
- Proper immutability guarantees
- Cannot create invalid instances
- Implements structural equality correctly

### Poor

**MutableValueObject.ts** (Expected: < 4.0)
- ❌ Mutable fields (no readonly)
- ❌ Public setters allow mutation after creation
- ❌ No equals() method (relies on identity)
- ❌ Violates value object immutability principle

**Violations:**
- `immutable-properties`: Fields can be changed after creation
- `structural-equality`: Missing equals() method
- `no-setters`: Public setters allow mutation

**Why it scores low:**
Value objects must be immutable. This fixture violates the fundamental principle of value objects by allowing mutation through public setters.

---

**ValueObjectWithPublicConstructor.ts** (Expected: < 4.0)
- ❌ Public constructor (should be private)
- ❌ No validation on construction
- ❌ Can create invalid instances directly
- ❌ No static factory method

**Violations:**
- `private-constructor`: Constructor is public
- `validate-on-construction`: No validation prevents invalid state
- `static-factory`: No factory method with validation

**Why it scores low:**
Value objects must enforce invariants. Public constructor allows creating invalid instances (empty strings, null values, violated business rules).

## Pattern Expectations

Value objects should:
1. Be immutable (readonly properties)
2. Use private constructor
3. Provide static factory methods with validation
4. Implement structural equality (equals)
5. Validate business rules on creation
6. Never have public setters
7. Be side-effect free

## Scoring Guidelines

- **5.0**: Perfect value object with all best practices
- **4.5-5.0**: Excellent implementation, minor optional improvements
- **4.0-4.5**: Good implementation with some issues
- **< 4.0**: Missing critical tactics or fundamental violations
