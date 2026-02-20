# Data Model: Content Hashing

## Entities

### ContentHash

- **Description**: A cryptographic representation of string content used for integrity verification.
- **Representation**: 64-character hexadecimal string.
- **Algorithm**: SHA-256.
- **Validation Rules**:
    - Must be a non-empty string for valid trace identification (though hashing an empty string is supported).
    - Must match regex `/^[a-f0-9]{64}$/`.

## Logic / State Transitions

### generate_content_hash(content: string) -> ContentHash

1. **Input Validation**: Check if `content` is a string. If not, throw `TypeError`.
2. **Size Check**: Check if `content.length <= 1,073,741,824` (1GB). If not, throw `RangeError`.
3. **Hashing**: Compute SHA-256 digest using UTF-8 encoding.
4. **Output**: Return hex-encoded string.
