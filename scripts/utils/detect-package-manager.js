import fs from "fs";
function detectPackageManager() {
    const lockFiles = {
        "bun.lock": "bun",
        "bun.lockb": "bun",
        "pnpm-lock.yaml": "pnpm",
        "yarn.lock": "yarn",
        "package-lock.json": "npm",
    };
    try {
        const files = fs.readdirSync(process.cwd());
        for (const [lockFile, manager] of Object.entries(lockFiles)) {
            if (files.includes(lockFile)) {
                return manager;
            }
        }
        // Default to npm if no lock file is found
        return "npm";
    }
    catch (error) {
        console.error("Error detecting package manager:", error);
        return "npm";
    }
}
export { detectPackageManager };
//# sourceMappingURL=detect-package-manager.js.map