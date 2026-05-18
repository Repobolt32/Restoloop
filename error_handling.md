---
name: error-handling-patterns
description: Master error handling patterns in TypeScript and Next.js including Result types, error propagation, and graceful degradation to build resilient applications. Use when implementing error handling, designing APIs, or improving application reliability.
---

# Error Handling Patterns

Build resilient applications with robust error handling strategies that gracefully handle failures and provide excellent debugging experiences.

## When to Use This Skill

- Implementing error handling in new features
- Designing error-resilient APIs
- Debugging production issues
- Improving application reliability
- Creating better error messages for users and developers
- Implementing retry and circuit breaker patterns
- Handling async/concurrent errors
- Building fault-tolerant distributed systems

## Core Concepts

### 1. Error Handling Philosophies

**Exceptions vs Result Types:**

- **Exceptions**: Traditional try-catch, disrupts control flow
- **Result Types**: Explicit success/failure, functional approach
- **Option/Maybe Types**: For nullable values

**When to Use Each:**

- Exceptions: Unexpected errors, exceptional conditions
- Result Types: Expected errors, validation failures
- Panics/Crashes: Unrecoverable errors, programming bugs

### 2. Error Categories

**Recoverable Errors:**

- Network timeouts
- Missing files
- Invalid user input
- API rate limits

**Unrecoverable Errors:**

- Out of memory
- Stack overflow
- Programming bugs (null pointer, etc.)

## Language-Specific Patterns

### TypeScript/JavaScript Error Handling

**Custom Error Classes:**

```typescript
// Custom error classes
class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} not found`, "NOT_FOUND", 404, { resource, id });
  }
}

// Usage
function getUser(id: string): User {
  const user = users.find((u) => u.id === id);
  if (!user) {
    throw new NotFoundError("User", id);
  }
  return user;
}
```

**Result Type Pattern:**

```typescript
// Result type for explicit error handling
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// Helper functions
function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage
function parseJSON<T>(json: string): Result<T, SyntaxError> {
  try {
    const value = JSON.parse(json) as T;
    return Ok(value);
  } catch (error) {
    return Err(error as SyntaxError);
  }
}

// Consuming Result
const result = parseJSON<User>(userJson);
if (result.ok) {
  console.log(result.value.name);
} else {
  console.error("Parse failed:", result.error.message);
}

// Chaining Results
function chain<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}
```

**Async Error Handling:**

```typescript
// Async/await with proper error handling
async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    const user = await getUser(userId);
    const orders = await getOrders(user.id);
    return orders;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return []; // Return empty array for not found
    }
    if (error instanceof NetworkError) {
      // Retry logic
      return retryFetchOrders(userId);
    }
    // Re-throw unexpected errors
    throw error;
  }
}

// Promise error handling
function fetchData(url: string): Promise<Data> {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Fetch failed:", error);
      throw error;
    });
}
```

## Universal Patterns

### Pattern 1: Error Aggregation

Collect multiple errors instead of failing on first error.

```typescript
class ErrorCollector {
  private errors: Error[] = [];

  add(error: Error): void {
    this.errors.push(error);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): Error[] {
    return [...this.errors];
  }

  throw(): never {
    if (this.errors.length === 1) {
      throw this.errors[0];
    }
    throw new AggregateError(
      this.errors,
      `${this.errors.length} errors occurred`,
    );
  }
}

// Usage: Validate multiple fields
function validateUser(data: any): User {
  const errors = new ErrorCollector();

  if (!data.email) {
    errors.add(new ValidationError("Email is required"));
  } else if (!isValidEmail(data.email)) {
    errors.add(new ValidationError("Email is invalid"));
  }

  if (!data.name || data.name.length < 2) {
    errors.add(new ValidationError("Name must be at least 2 characters"));
  }

  if (!data.age || data.age < 18) {
    errors.add(new ValidationError("Age must be 18 or older"));
  }

  if (errors.hasErrors()) {
    errors.throw();
  }

  return data as User;
}
```

## Best Practices

1. **Fail Fast**: Validate input early, fail quickly
2. **Preserve Context**: Include stack traces, metadata, timestamps
3. **Meaningful Messages**: Explain what happened and how to fix it
4. **Log Appropriately**: Error = log, expected failure = don't spam logs
5. **Handle at Right Level**: Catch where you can meaningfully handle
6. **Clean Up Resources**: Use try-finally, context managers, defer
7. **Don't Swallow Errors**: Log or re-throw, don't silently ignore
8. **Type-Safe Errors**: Use typed errors when possible

```typescript
// Good error handling example
async function processOrder(orderId: string): Promise<Order> {
  try {
    // Validate input
    if (!orderId) {
      throw new ValidationError("Order ID is required");
    }

    // Fetch order
    const order = await db.getOrder(orderId);
    if (!order) {
      throw new NotFoundError("Order", orderId);
    }

    // Process payment
    try {
      const paymentResult = await paymentService.charge(order.total);
      
      // Update order
      order.status = "completed";
      order.paymentId = paymentResult.id;
      await db.save(order);

      return order;
    } catch (e: any) {
      // Log and wrap external service error
      console.error(`Payment failed for order ${orderId}:`, e);
      throw new ApplicationError(
        "Payment processing failed",
        "PAYMENT_SERVICE_ERROR",
        502,
        { orderId: orderId, amount: order.total, originalError: e.message }
      );
    }

  } catch (e: any) {
    if (e instanceof ApplicationError) {
      // Re-raise known application errors
      throw e;
    }
    
    // Log unexpected errors
    console.error(`Unexpected error processing order ${orderId}:`, e);
    throw new ApplicationError(
      "Order processing failed",
      "INTERNAL_ERROR",
      500
    );
  }
}
```

## Common Pitfalls

- **Catching Too Broadly**: `catch (e)` without checking error type hides bugs
- **Empty Catch Blocks**: Silently swallowing errors
- **Logging and Re-throwing**: Creates duplicate log entries
- **Poor Error Messages**: "Error occurred" is not helpful
- **Returning Error Codes**: Use exceptions or Result types
- **Ignoring Async Errors**: Unhandled promise rejections

## Resources

- **references/exception-hierarchy-design.md**: Designing error class hierarchies
- **references/error-recovery-strategies.md**: Recovery patterns for different scenarios
- **references/async-error-handling.md**: Handling errors in concurrent code
- **assets/error-handling-checklist.md**: Review checklist for error handling
- **assets/error-message-guide.md**: Writing helpful error messages
- **scripts/error-analyzer.ts**: Analyze error patterns in typescript logs