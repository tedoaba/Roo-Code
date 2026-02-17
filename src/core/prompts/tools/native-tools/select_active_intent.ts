import type OpenAI from "openai"

const SELECT_ACTIVE_INTENT_DESCRIPTION = `Declare which intent you are working on. This tool allows you to opt-in to a specific intent and receive enriched context (constraints, scope, history) required to perform tasks. You must call this tool before making any changes if an intent is not already selected.`

const INTENT_ID_DESCRIPTION = `The unique ID of the intent to select.`

export default {
	type: "function",
	function: {
		name: "select_active_intent",
		description: SELECT_ACTIVE_INTENT_DESCRIPTION,
		strict: true,
		parameters: {
			type: "object",
			properties: {
				intent_id: {
					type: "string",
					description: INTENT_ID_DESCRIPTION,
				},
			},
			required: ["intent_id"],
			additionalProperties: false,
		},
	},
} satisfies OpenAI.Chat.ChatCompletionTool
