# Repository Benchmark

Validates evaluation of repository pattern implementations.

**Pattern:** `patterns/domain/repository/v1.yaml`
**Calibration:** `calibration/domain/repository/v1-scoring.yaml`

## Key Principles
1. Interface-based
2. Data access only
3. Returns aggregates
4. No business logic
5. Simple CRUD operations

## Running Tests
```bash
npx jest benchmarks/repository/run.test.ts
```

See `baseline.json` for expected scores.
