import { describe, it, expect, vi, beforeEach } from "vitest"
import { HookEngine, ToolResult } from "../HookEngine"
import { OrchestrationService } from "../../services/orchestration/OrchestrationService"
import { StateMachine } from "../../core/state/StateMachine"
import { StaleWriteError, StaleFileErrorPayload } from "../errors/StaleWriteError"
import * as fs from "fs/promises"

vi.mock("fs/promises")

/**
 * Manual schema validation function that mirrors the constraints from
 * contracts/stale-write-error.json (JSON Schema Draft-07):
 * - required: error_type, file_path, expected_hash, actual_hash, resolution
 * - error_type: const "STALE_FILE"
 * - resolution: const "RE_READ_REQUIRED"
 * - additionalProperties: false
 */
function validateSchema(payload: any): { valid: boolean; errors: string[] } {
	const errors: string[] = []
	const requiredKeys = ["error_type", "file_path", "expected_hash", "actual_hash", "resolution"]

	// Check required fields
	for (const key of requiredKeys) {
		if (!(key in payload)) {
			errors.push(`Missing required field: ${key}`)
		}
	}

	// Check no additional properties
	const actualKeys = Object.keys(payload)
	for (const key of actualKeys) {
		if (!requiredKeys.includes(key)) {
			errors.push(`Unexpected additional property: ${key}`)
		}
	}

	// Check const values
	if (payload.error_type !== "STALE_FILE") {
		errors.push(`error_type must be "STALE_FILE", got "${payload.error_type}"`)
	}
	if (payload.resolution !== "RE_READ_REQUIRED") {
		errors.push(`resolution must be "RE_READ_REQUIRED", got "${payload.resolution}"`)
	}

	// Check all values are strings
	for (const key of requiredKeys) {
		if (key in payload && typeof payload[key] !== "string") {
			errors.push(`${key} must be a string, got ${typeof payload[key]}`)
		}
	}

	return { valid: errors.length === 0, errors }
}

describe("T010: StaleFileErrorPayload JSON Schema Validation", () => {
	it("StaleWriteError.toPayload() output matches the stale-write-error.json schema", () => {
		const error = new StaleWriteError("/some/path.ts", "abc123", "def456")
		const payload = error.toPayload()
		const { valid, errors } = validateSchema(payload)

		expect(errors).toEqual([])
		expect(valid).toBe(true)
	})

	it("StaleWriteError.toPayload() with DELETED hash matches schema", () => {
		const error = new StaleWriteError("/deleted/file.ts", "abc123", "DELETED")
		const payload = error.toPayload()
		const { valid, errors } = validateSchema(payload)

		expect(errors).toEqual([])
		expect(valid).toBe(true)
	})

	it("HookEngine produces a reason string that parses to a schema-valid payload", async () => {
		const mockOrchestrationService = {
			isOrchestrationHealthy: vi.fn().mockResolvedValue(true),
			validateScope: vi.fn().mockResolvedValue({ allowed: true }),
			checkFileOwnership: vi.fn().mockResolvedValue(null),
			updateBudget: vi.fn().mockResolvedValue({ withinBudget: true }),
			logTrace: vi.fn().mockResolvedValue(undefined),
			isIntentIgnored: vi.fn().mockReturnValue(false),
			logMutation: vi.fn().mockResolvedValue(undefined),
		}
		const mockStateMachine = {
			isToolAllowed: vi.fn().mockReturnValue({ allowed: true }),
			getCurrentState: vi.fn().mockReturnValue("ACTION"),
		}

		const hookEngine = new HookEngine(
			mockOrchestrationService as unknown as OrchestrationService,
			mockStateMachine as unknown as StateMachine,
		)

		const filePath = "C:/repo/schema-test.ts"
		const intentId = "REQ-SCHEMA"

		// 1. Read baseline
		await hookEngine.postToolUse({
			toolName: "read_file",
			params: { path: filePath },
			intentId,
			success: true,
			fileContent: "original content",
			filePath,
		})

		// 2. External change
		vi.mocked(fs.readFile).mockResolvedValue("changed content")

		// 3. Attempt write
		const response = await hookEngine.preToolUse({
			toolName: "write_to_file",
			params: { path: filePath, content: "agent attempt" },
			intentId,
		})

		expect(response.action).toBe("DENY")

		// Parse and validate the JSON payload in `reason`
		const payload = JSON.parse(response.reason!)
		const { valid, errors } = validateSchema(payload)

		expect(errors).toEqual([])
		expect(valid).toBe(true)
	})
})
