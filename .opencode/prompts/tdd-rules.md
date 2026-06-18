# TDD Rules for Restoloop

## The Three Phases

### 1. RED - Write a Failing Test
- Write the smallest test that captures the requirement
- Run it and watch it FAIL
- If it passes, you're testing the wrong thing or the feature already exists
- Show the failure output as evidence

### 2. GREEN - Make It Pass
- Write the minimum code to make the test pass
- Don't write extra code "just in case"
- Don't refactor yet - just make it green
- Show the passing output as evidence

### 3. REFACTOR - Clean Up
- Remove duplication
- Improve naming
- Simplify logic
- Run tests after each change to stay green

## Test File Conventions

- Test files go in `__tests__/` directory
- Name pattern: `*.test.ts` or `*.test.tsx`
- Mirror the source structure: `lib/coupons.ts` → `__tests__/lib/coupons.test.ts`

## Writing Good Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('functionName', () => {
  it('should handle normal case', () => {
    // Arrange
    const input = setupTestData()
    
    // Act
    const result = functionUnderTest(input)
    
    // Assert
    expect(result).toEqual(expectedOutput)
  })

  it('should handle edge case', () => {
    // Test boundaries, empty inputs, nulls, etc.
  })

  it('should throw on invalid input', () => {
    expect(() => functionUnderTest(badInput)).toThrow('expected error message')
  })
})
```

## Rules

1. Never write implementation code before a test
2. Never skip the Red phase
3. One test, one assertion (when possible)
4. Test behavior, not implementation
5. Use descriptive test names that explain the expected behavior
6. Clean up test data after each test
7. Mock external dependencies (Supabase, WhatsApp API, etc.)
