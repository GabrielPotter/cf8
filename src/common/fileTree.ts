export type FileNodeType = "file" | "directory";

export type FileTreeNode = {
    name: string;
    fullPath: string;
    relativePath: string;
    type: FileNodeType;
    size?: number;
    extension?: string;
    children?: FileTreeNode[];
    error?: string;
};
