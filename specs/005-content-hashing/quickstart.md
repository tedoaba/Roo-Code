# Quickstart: Content Hashing

## Installation

The hashing utility is part of the core `src/utils` package.

```typescript
import { generate_content_hash } from "./utils/hashing"
```

## Basic Usage

### Hashing a string

```typescript
const content = "Hello World"
const hash = generate_content_hash(content)
// Result: a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e
```

### Hashing an empty string

```typescript
const emptyHash = generate_content_hash("")
// Result: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Error Handling

### 1GB Limit

The utility throws a `RangeError` for inputs exceeding 1GB to protect system stability.

```typescript
try {
	const hugeString = "a".repeat(1024 * 1024 * 1025)
	generate_content_hash(hugeString)
} catch (e) {
	if (e instanceof RangeError) {
		console.error("Content exceeds 1GB limit")
	}
}
```

### Type Safety

The utility throws a `TypeError` if non-string values are passed at runtime.

```typescript
// @ts-ignore
generate_content_hash(null) // Throws TypeError
```
