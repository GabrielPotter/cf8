import path from "node:path";
import { promises as fs } from "node:fs";
import type { Stats } from "node:fs";
import type { FileTreeNode } from "../common/fileTree";

/**
 * Recursive file system scanner utility for building a navigable tree structure.
 */
export class CatalogScanner {
    /**
     * Walks the provided root directory and returns a hierarchical file tree.
     */
    public async scan(rootPath: string): Promise<FileTreeNode> {
        if (!rootPath) {
            throw new Error("scan rootPath is required");
        }

        const absoluteRoot = path.resolve(rootPath);
        const stats = await fs.stat(absoluteRoot).catch((error) => {
            throw new Error(`Cannot access path ${absoluteRoot}: ${error instanceof Error ? error.message : String(error)}`);
        });

        if (!stats.isDirectory()) {
            throw new Error(`Path ${absoluteRoot} is not a directory`);
        }

        return this.buildNode(absoluteRoot, absoluteRoot, stats);
    }

    /**
     * Creates an empty file inside the provided directory.
     */
    public async createFile(directoryPath: string, fileName: string): Promise<string> {
        const targetPath = await this.prepareTargetPath(directoryPath, fileName, "file");
        await fs.writeFile(targetPath, "");
        return targetPath;
    }

    /**
     * Creates an empty folder inside the provided directory.
     */
    public async createFolder(directoryPath: string, folderName: string): Promise<string> {
        const targetPath = await this.prepareTargetPath(directoryPath, folderName, "folder");
        await fs.mkdir(targetPath);
        return targetPath;
    }

    /**
     * Deletes the provided file path.
     */
    public async deleteFile(filePath: string): Promise<void> {
        const resolvedPath = this.resolveExistingPath(filePath, "file");
        await this.ensureExists(resolvedPath, "file");
        await fs.unlink(resolvedPath);
    }

    /**
     * Deletes the provided directory recursively.
     */
    public async deleteFolder(folderPath: string): Promise<void> {
        const resolvedPath = this.resolveExistingPath(folderPath, "folder");
        await this.ensureExists(resolvedPath, "folder");
        await fs.rm(resolvedPath, { recursive: true, force: true });
    }

    /**
     * Renames an existing file within its parent directory.
     */
    public async renameFile(filePath: string, newName: string): Promise<string> {
        return this.renameEntry(filePath, newName, "file");
    }

    /**
     * Renames an existing folder within its parent directory.
     */
    public async renameFolder(folderPath: string, newName: string): Promise<string> {
        return this.renameEntry(folderPath, newName, "folder");
    }

    private async buildNode(root: string, current: string, stats?: Stats): Promise<FileTreeNode> {
        const name = path.basename(current) || current;
        const relative = path.relative(root, current) || ".";
        const nodeStats = stats ?? (await fs.stat(current));

        if (nodeStats.isDirectory()) {
            const children = await this.readChildren(root, current);
            return {
                name,
                fullPath: current,
                relativePath: relative,
                type: "directory",
                children,
            };
        }

        const extension = path.extname(name).replace(/^\./, "") || undefined;

        return {
            name,
            fullPath: current,
            relativePath: relative,
            type: "file",
            size: nodeStats.size,
            extension,
        };
    }

    private async readChildren(root: string, current: string): Promise<FileTreeNode[]> {
        const entries = await fs.readdir(current, { withFileTypes: true });

        const childPromises = entries
            .filter((entry) => !entry.isSymbolicLink())
            .map(async (entry) => {
                const nextPath = path.join(current, entry.name);
                const relative = path.relative(root, nextPath) || entry.name;
                try {
                    if (entry.isDirectory()) {
                        return await this.buildNode(root, nextPath);
                    }
                    const stats = await fs.stat(nextPath);
                    return this.buildNode(root, nextPath, stats);
                } catch (error) {
                    return {
                        name: entry.name,
                        fullPath: nextPath,
                        relativePath: relative,
                        type: entry.isDirectory() ? "directory" : "file",
                        error: error instanceof Error ? error.message : String(error),
                    } satisfies FileTreeNode;
                }
            });

        const children = await Promise.all(childPromises);

        children.sort((a, b) => {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
            }
            return a.type === "directory" ? -1 : 1;
        });

        return children;
    }

    private async prepareTargetPath(directoryPath: string, rawName: string, kind: "file" | "folder"): Promise<string> {
        const trimmedDirectory = directoryPath?.trim();
        if (!trimmedDirectory) {
            throw new Error("A könyvtár útvonala kötelező.");
        }

        const trimmedName = rawName?.trim();
        if (!trimmedName) {
            throw new Error(kind === "folder" ? "Adj meg mappanevet." : "Adj meg fájlnevet.");
        }

        if (trimmedName.includes("/") || trimmedName.includes("\\")) {
            throw new Error(kind === "folder" ? "A mappanév nem tartalmazhat elérési utat." : "A fájlnév nem tartalmazhat elérési utat.");
        }

        const resolvedDirectory = path.resolve(trimmedDirectory);
        const targetPath = path.join(resolvedDirectory, trimmedName);

        await fs.mkdir(resolvedDirectory, { recursive: true });

        const exists = await fs
            .stat(targetPath)
            .then(() => true)
            .catch((error: NodeJS.ErrnoException) => {
                if (error && error.code === "ENOENT") {
                    return false;
                }
                throw error;
            });

        if (exists) {
            throw new Error(kind === "folder" ? "A mappa már létezik." : "A fájl már létezik.");
        }

        return targetPath;
    }

    private resolveExistingPath(pathLike: string | null | undefined, kind: "file" | "folder"): string {
        const trimmed = pathLike?.trim();
        if (!trimmed) {
            throw new Error(kind === "folder" ? "Adj meg könyvtárat a törléshez." : "Adj meg fájlt a törléshez.");
        }

        return path.resolve(trimmed);
    }

    private async ensureExists(resolvedPath: string, kind: "file" | "folder"): Promise<void> {
        const stats = await fs.stat(resolvedPath).catch((error: NodeJS.ErrnoException) => {
            if (error && error.code === "ENOENT") {
                return null;
            }
            throw error;
        });

        if (!stats) {
            throw new Error(kind === "folder" ? "A megadott mappa nem létezik." : "A megadott fájl nem létezik.");
        }

        if (kind === "folder" && !stats.isDirectory()) {
            throw new Error("A megadott útvonal nem mappa.");
        }

        if (kind === "file" && !stats.isFile()) {
            throw new Error("A megadott útvonal nem fájl.");
        }
    }

    private normalizeNewName(rawName: string | null | undefined, kind: "file" | "folder"): string {
        const trimmed = rawName?.trim();
        if (!trimmed) {
            throw new Error(kind === "folder" ? "Adj meg új mappanevet." : "Adj meg új fájlnevet.");
        }

        if (trimmed.includes("/") || trimmed.includes("\\")) {
            throw new Error(kind === "folder" ? "Az új mappanév nem tartalmazhat elérési utat." : "Az új fájlnév nem tartalmazhat elérési utat.");
        }

        return trimmed;
    }

    private async renameEntry(currentPath: string, newName: string, kind: "file" | "folder"): Promise<string> {
        const resolvedCurrent = this.resolveExistingPath(currentPath, kind);
        await this.ensureExists(resolvedCurrent, kind);

        const normalizedName = this.normalizeNewName(newName, kind);
        const parentDir = path.dirname(resolvedCurrent);
        const targetPath = path.join(parentDir, normalizedName);

        if (targetPath === resolvedCurrent) {
            return targetPath;
        }

        const targetExists = await fs
            .stat(targetPath)
            .then(() => true)
            .catch((error: NodeJS.ErrnoException) => {
                if (error && error.code === "ENOENT") {
                    return false;
                }
                throw error;
            });

        if (targetExists) {
            throw new Error(kind === "folder" ? "Ilyen nevű mappa már létezik." : "Ilyen nevű fájl már létezik.");
        }

        await fs.rename(resolvedCurrent, targetPath);
        return targetPath;
    }
}

export const catalogScanner = new CatalogScanner();
