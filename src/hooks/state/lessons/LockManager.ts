import * as lockfile from "proper-lockfile"
import * as fs from "node:fs"
import * as path from "node:path"

/**
 * Manages file-based locking for atomic cross-process writes.
 */
export class LockManager {
	/**
	 * Acquires a lock on the specified file.
	 * If the file doesn't exist, it creates it first.
	 * @param filePath Path to the file to lock
	 * @returns A release function
	 */
	static async acquireLock(filePath: string): Promise<() => Promise<void>> {
		const absolutePath = path.resolve(filePath)

		// Ensure file exists before locking
		if (!fs.existsSync(absolutePath)) {
			fs.writeFileSync(absolutePath, "", { flag: "a" })
		}

		try {
			const release = await lockfile.lock(absolutePath, {
				retries: {
					retries: 5,
					factor: 3,
					minTimeout: 100,
					maxTimeout: 2000,
					randomize: true,
				},
				realpath: false, // Don't resolve symlinks as it can cause issues on some systems
			})
			return release
		} catch (error) {
			throw new Error(
				`Failed to acquire lock on ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	/**
	 * Utility to execute a function within a lock.
	 * @param filePath Path to the file to lock
	 * @param action Function to execute while locked
	 */
	static async withLock<T>(filePath: string, action: () => Promise<T>): Promise<T> {
		const release = await this.acquireLock(filePath)
		try {
			return await action()
		} finally {
			await release()
		}
	}
}
