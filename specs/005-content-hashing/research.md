# Research: SHA-256 Content Hashing Utility

## Decisions

### Algorithm and API

- **Decision**: Use Node.js built-in `crypto.createHash('sha256')`.
- **Rationale**:
    - Standard cryptographic algorithm required by System Constitution.
    - `crypto` is high-performance and built into the Node.js runtime.
    - Synchronous execution is acceptable for 1MB targets (<1ms expected) and ensures simplicity for trace system call sites.
- **Alternatives Considered**:
    - `crypto.subtle` (Web Crypto API): Rejected as it is asynchronous and requires more boilerplate in Node.js environments where `crypto` is the primary interface.
    - External libraries (e.g., `js-sha256`): Rejected to avoid unnecessary dependencies and potentially lower performance.

### Size Validation

- **Decision**: Validate input using `content.length` before processing.
- **Rationale**:
    - O(1) check.
    - 1GB limit (1,073,741,824 characters) prevents heap overflow and excessively long blocking of the event loop.
- **Note**: In V8, strings can be UTF-16 or Latin1. `content.length` returns number of code units. For Latin1, 1 code unit = 1 byte. For UTF-16, it's 2 bytes. However, SHA-256 `update(string)` defaults to UTF-8 encoding. A string of 1B characters can be up to 3B-4B bytes in UTF-8.
- **Refinement**: To strictly follow "1GB length", we will use `content.length > 1024 * 1024 * 1024`.

### Performance Verification

- **Decision**: Use `performance.now()` in Vitest unit tests to assert the < 50ms requirement for 1MB payloads.
- **Rationale**: Provides verifiable automated regression check for performance targets.

## Best Practices

- **Encoding**: Always specify 'utf8' (implicit default in `update`) or ensure the input is handled consistently to maintain determinism across environments.
- **Error Handling**: Throw informative error messages for type and size violations to facilitate debugging in the complex trace system.
