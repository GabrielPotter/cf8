import path from "node:path";
import { promises as fs } from "node:fs";
import type { FileTreeNode } from "../common/fileTree";
import { catalogScanner, CatalogScanner } from "./catalogScanner";

export type ObjectFileItem = {
    name: string;
    fullPath: string;
    path: string;
    size?: number;
    extension?: string;
    error?: string;
    data?: unknown;
};

const DEFAULT_OBJECT_ROOT = process.env.CF8_OBJECT_ROOT ?? path.resolve(process.cwd(), "objects");

export class ObjectScanner {
    private readonly catalog: CatalogScanner;
    private rootPath: string;

    constructor(options?: { rootPath?: string; catalog?: CatalogScanner }) {
        this.catalog = options?.catalog ?? catalogScanner;
        this.rootPath = this.resolveRootPath(options?.rootPath);
    }

    public setRootPath(nextRoot: string): void {
        this.rootPath = this.resolveRootPath(nextRoot);
    }

    public getRootPath(): string {
        return this.rootPath;
    }

    public async listObjects(rootPath?: string): Promise<ObjectFileItem[]> {
        const resolvedRoot = this.resolveRootPath(rootPath ?? this.rootPath);
        this.rootPath = resolvedRoot;
        const tree = await this.catalog.scan(resolvedRoot);
        const items: ObjectFileItem[] = [];
        await this.collect(tree, items);
        return items;
    }

    private resolveRootPath(rootPath?: string): string {
        const candidate = rootPath?.trim() || DEFAULT_OBJECT_ROOT;
        if (!candidate) {
            throw new Error("Object scanner root path is required.");
        }
        return path.resolve(candidate);
    }

    private async collect(node: FileTreeNode, acc: ObjectFileItem[]): Promise<void> {
        if (node.type === "file") {
            acc.push(await this.toItem(node));
            return;
        }

        for (const child of node.children ?? []) {
            await this.collect(child, acc);
        }
    }

    private async toItem(node: FileTreeNode): Promise<ObjectFileItem> {
        const rawRelative = node.relativePath === "." ? node.name : node.relativePath;
        const item: ObjectFileItem = {
            name: node.name,
            fullPath: node.fullPath,
            path: this.normalizeRelativePath(rawRelative),
            size: node.size,
            extension: node.extension,
            error: node.error,
        };

        if (!node.error && node.extension?.toLowerCase() === "json") {
            try {
                const raw = await fs.readFile(node.fullPath, "utf8");
                item.data = JSON.parse(raw);
            } catch (error) {
                item.error = error instanceof Error ? error.message : String(error);
            }
        }

        return item;
    }

    private normalizeRelativePath(relativePath: string): string {
        return relativePath.replace(/\\+/g, "/");
    }
}

export const objectScanner = new ObjectScanner();
