import { spawn } from "child_process";
import * as crypto from "crypto";

function getSessionId(vaultPath: string): string {
	// Generate a deterministic UUID from vault path
	const hash = crypto
		.createHash("md5")
		.update(`obsidian-copilot:${vaultPath}`)
		.digest("hex");
	// Format as UUID: 8-4-4-4-12
	return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export class ClaudeClient {
	private activeSessions = new Set<string>();
	private vaultPath: string;
	private readonly allowedTools = "Read,Grep,Glob,LS";

	constructor(vaultPath: string) {
		this.vaultPath = vaultPath;
	}

	isNewSession(): boolean {
		return !this.activeSessions.has(getSessionId(this.vaultPath));
	}

	async getFeedback(prompt: string): Promise<string> {
		const sessionId = getSessionId(this.vaultPath);
		const isNewSession = !this.activeSessions.has(sessionId);

		const args = [
			isNewSession ? "--session-id" : "--resume",
			sessionId,
			"-p",
			"--allowedTools",
			this.allowedTools,
		];

		try {
			const result = await this.runClaude(args, prompt);
			this.activeSessions.add(sessionId);
			return result;
		} catch (error) {
			// Handle case where session exists from previous plugin session
			if (
				isNewSession &&
				error instanceof Error &&
				error.message.includes("already in use")
			) {
				this.activeSessions.add(sessionId);
				const resumeArgs = [
					"--resume",
					sessionId,
					"-p",
					"--allowedTools",
					this.allowedTools,
				];
				return this.runClaude(resumeArgs, prompt);
			}
			throw error;
		}
	}

	private runClaude(args: string[], prompt: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const shell = process.env.SHELL || "/bin/zsh";
			const child = spawn(
				shell,
				["-l", "-c", `claude ${args.join(" ")}`],
				{
					cwd: this.vaultPath,
					stdio: ["pipe", "pipe", "pipe"],
				},
			);

			let stdout = "";
			let stderr = "";

			child.stdout.on("data", (data) => {
				stdout += data.toString();
			});

			child.stderr.on("data", (data) => {
				stderr += data.toString();
			});

			child.on("error", (error) => {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") {
					reject(
						new Error(
							'Claude CLI not found. Please install Claude Code and ensure "claude" is in your PATH.',
						),
					);
				} else {
					reject(error);
				}
			});

			child.on("close", (code) => {
				if (code === 0) {
					resolve(stdout.trim() || "No response from Claude.");
				} else {
					reject(
						new Error(stderr || `Claude exited with code ${code}`),
					);
				}
			});

			child.stdin.write(prompt);
			child.stdin.end();
		});
	}
}
