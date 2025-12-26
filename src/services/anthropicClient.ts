import { requestUrl, RequestUrlResponse } from "obsidian";
import {
	AnthropicClientConfig,
	AnthropicRequestBody,
	AnthropicResponse,
	AnthropicErrorResponse,
} from "../types";

export interface ModelInfo {
	id: string;
	display_name: string;
	created_at: string;
}

export class AnthropicClient {
	private config: AnthropicClientConfig;
	private readonly baseUrl = "https://api.anthropic.com/v1/messages";
	private readonly apiVersion = "2023-06-01";
	private static readonly modelsUrl = "https://api.anthropic.com/v1/models";

	constructor(config: AnthropicClientConfig) {
		this.config = config;
	}

	/**
	 * Query Claude for feedback based on the provided prompt
	 * @param prompt The prompt to send to Claude
	 * @param maxTokens Maximum number of tokens in the response (default: 500)
	 * @returns The feedback text from Claude
	 * @throws Error if the API request fails
	 */
	async queryForFeedback(prompt: string, maxTokens = 500): Promise<string> {
		const requestBody: AnthropicRequestBody = {
			model: this.config.model,
			max_tokens: maxTokens,
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
		};

		// Log the curl command for debugging
		const curlCommand = `curl ${this.baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${this.config.apiKey.substring(0, 10)}..." \\
  -H "anthropic-version: ${this.apiVersion}" \\
  -d '${JSON.stringify(requestBody, null, 2)}'`;

		console.log("Claude API Request (as curl):", curlCommand);
		console.log("Full request body:", requestBody);

		try {
			const response = await requestUrl({
				url: this.baseUrl,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": this.config.apiKey,
					"anthropic-version": this.apiVersion,
				},
				body: JSON.stringify(requestBody),
			});

			if (response.status !== 200) {
				await this.handleErrorResponse(response);
			}

			const data: AnthropicResponse = JSON.parse(response.text);
			console.log("Claude API Success Response:", data);

			return data.content[0]?.text || "No feedback available";
		} catch (error) {
			console.error("Claude API Error:", error);
			throw this.formatError(error);
		}
	}

	/**
	 * Handle error responses from the Anthropic API
	 */
	private async handleErrorResponse(
		response: RequestUrlResponse,
	): Promise<never> {
		console.error("Claude API Error - Full Response:");
		console.error("Status:", response.status);
		console.error("Response Headers:", response.headers);
		console.error("Response Body (raw):", response.text);

		let errorData: AnthropicErrorResponse;
		try {
			errorData = JSON.parse(response.text);
			console.error("Response Body (parsed):", errorData);
		} catch {
			errorData = { error: { message: response.text, type: "unknown" } };
			console.error("Failed to parse response as JSON");
		}

		const errorMessage =
			errorData.error?.message ||
			response.text ||
			`API Error: ${response.status}`;
		throw new Error(`HTTP ${response.status}: ${errorMessage}`);
	}

	/**
	 * Format error messages for better user experience
	 */
	private formatError(error: unknown): Error {
		if (error instanceof Error) {
			if (error.message === "Failed to fetch") {
				const detailedMessage =
					"Failed to fetch - This could be a CORS issue. Check console for details.";
				console.error("Fetch failed - possible causes:");
				console.error(
					"1. CORS blocking (Obsidian may need to whitelist api.anthropic.com)",
				);
				console.error("2. Network connectivity issue");
				console.error("3. Invalid API endpoint");
				return new Error(detailedMessage);
			}
			return error;
		}

		return new Error("Unknown error occurred");
	}

	/**
	 * Update the client configuration
	 */
	updateConfig(config: Partial<AnthropicClientConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Fetch available models from the Anthropic API
	 * @param apiKey The API key to authenticate with
	 * @returns Array of model info objects sorted by creation date (newest first)
	 */
	static async fetchModels(apiKey: string): Promise<ModelInfo[]> {
		const allModels: ModelInfo[] = [];
		let afterId: string | undefined;

		do {
			const url = afterId
				? `${AnthropicClient.modelsUrl}?limit=100&after_id=${afterId}`
				: `${AnthropicClient.modelsUrl}?limit=100`;

			const response = await requestUrl({
				url,
				method: "GET",
				headers: {
					"x-api-key": apiKey,
					"anthropic-version": "2023-06-01",
				},
			});

			if (response.status !== 200) {
				throw new Error(`Failed to fetch models: ${response.status}`);
			}

			const data = JSON.parse(response.text);
			for (const model of data.data) {
				allModels.push({
					id: model.id,
					display_name: model.display_name,
					created_at: model.created_at,
				});
			}

			afterId = data.has_more ? data.last_id : undefined;
		} while (afterId);

		// Sort by created_at descending (newest first)
		return allModels.sort(
			(a, b) =>
				new Date(b.created_at).getTime() -
				new Date(a.created_at).getTime(),
		);
	}
}
