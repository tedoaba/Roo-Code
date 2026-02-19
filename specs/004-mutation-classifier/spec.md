# Feature Specification: Semantic Mutation Classifier

**Feature Branch**: `004-mutation-classifier`  
**Created**: 2026-02-19  
**Status**: Draft  
**Input**: User description: "Title: Implement Deterministic Mutation Classification. Build a mutation classification module that distinguishes semantic refactors from intent changes. Definitions: AST_REFACTOR: Syntax-only changes. No functional behavior change. INTENT_EVOLUTION: New or modified behavior. Requirements: Accept previous_content, new_content. Return AST_REFACTOR or INTENT_EVOLUTION. Implement deterministic logic: Use AST comparison OR structured diff. Avoid probabilistic AI decisions. Provide unit tests with: Formatting-only change, Variable rename, Added logic branch, New function. Success Criteria: Correct classification for test cases. Deterministic output for identical inputs."

## Clarifications

### Session 2026-02-19

- Q: Is the implementation strictly limited to TypeScript (and JavaScript), or must it be extensible to other languages (e.g., Python, Go) in this phase? → A: Extensible architecture (generic AST) but only TS/JS implemented now.
- Q: If the `new_content` contains syntax errors that prevent AST parsing, how should the system categorize the change? → A: Classify as `INTENT_EVOLUTION` (Safe Default).
- Q: How should the mutation classifier be exposed to other tools in the codebase? → A: Internal TypeScript library (Class/Singleton).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Categorize Refactoring Activity (Priority: P1)

As a developer or governing agent, I want to distinguish between code changes that only affect structure/formatting and those that change behavior, so that I can automatically approve safe refactors while requiring stricter scrutiny for functional changes.

**Why this priority**: This is the core functionality required to enable automated governance and distinguish between low-risk and high-risk file modifications.

**Independent Test**: Can be fully tested by providing pairs of code strings (before and after) and asserting the returned classification matches the expected label (AST_REFACTOR vs INTENT_EVOLUTION).

**Acceptance Scenarios**:

1. **Given** a TypeScript file with specific logic, **When** the content is modified by only changing whitespace or indentation, **Then** the system returns `AST_REFACTOR`.
2. **Given** a TypeScript function, **When** a local variable is renamed across all its usages, **Then** the system returns `AST_REFACTOR`.
3. **Given** a TypeScript function, **When** an `if` statement or a new logic branch is added, **Then** the system returns `INTENT_EVOLUTION`.
4. **Given** a TypeScript file, **When** a new function is appended to the end of the file, **Then** the system returns `INTENT_EVOLUTION`.

---

### User Story 2 - Ensure Deterministic Governance (Priority: P2)

As a system administrator, I want to ensure that the same pair of code changes always results in the same classification, so that the governance process is predictable and verifiable without relying on non-deterministic AI models.

**Why this priority**: Predictability is crucial for audit trails and automated pipelines. Non-deterministic results would lead to flapping CI checks or inconsistent security enforcement.

**Independent Test**: Can be tested by running the classifier multiple times on the same input set and confirming the output never changes.

**Acceptance Scenarios**:

1. **Given** two versions of a complex file, **When** the classification is performed 100 times in a row, **Then** all 100 results are identical.
2. **Given** a code change, **When** analyzed in different environments (local vs CI), **Then** the result remains consistent.

---

### Edge Cases

- **Empty Files**: How does the system handle comparing two empty files or a file being deleted? (Should likely be `AST_REFACTOR` for empty-to-empty, `INTENT_EVOLUTION` for deletion).
- **Invalid Syntax**: If `new_content` contains syntax errors that prevent AST parsing, the system MUST return `INTENT_EVOLUTION` for safety.
- **Comment-only changes**: Are changes to JSDoc or comments considered `AST_REFACTOR`? (Assumption: Yes, as they don't change functional behavior).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST accept a `MutationComparisonRequest` containing `previous_content`, `new_content`, and `filename`.
- **FR-002**: The system MUST return exactly one of two constants: `AST_REFACTOR` or `INTENT_EVOLUTION`.
- **FR-003**: The classification logic MUST be deterministic (no random seeds or probabilistic AI models).
- **FR-004**: The system MUST use an extensible Abstract Syntax Tree (AST) comparison or structured diffing architecture that supports multiple languages, with TypeScript/JavaScript as the initial implementation.
- **FR-005**: Changes that ONLY affect formatting, whitespace, or non-functional comments MUST be classified as `AST_REFACTOR`.
- **FR-006**: Renaming of symbols (variables, functions, classes) where the structure and logic remain identical MUST be classified as `AST_REFACTOR`.
- **FR-007**: Any change that modifies the control flow, data processing logic, or adds/removes exported symbols MUST be classified as `INTENT_EVOLUTION`.
- **FR-008**: The system MUST return `INTENT_EVOLUTION` if either input cannot be successfully parsed into an AST for semantic comparison.
- **FR-009**: The classification module MUST be implemented as an internal TypeScript library (likely a Class or Singleton) to be consumed directly by core services.

### Key Entities _(include if feature involves data)_

- **Mutation Classification**: The result of the comparison, representing the semantic nature of the change.
- **AST Node**: Represenation of a code element used for semantic comparison.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% accuracy on the predefined test suite (formatting, renames, logic branches, new functions).
- **SC-002**: 0% variance in output when run repeatedly on the same input (100/100 consistency).
- **SC-003**: Classification of a 1000-line file pair completes in under 500ms (performance target for developer workflow).
