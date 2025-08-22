import { parentPort, workerData } from "node:worker_threads";
import * as fs from "node:fs";
import * as path from "node:path";
import type { CatalogNode } from "../shared/types";

function readDirTree(root: string): CatalogNode {
  const stat = fs.statSync(root);
  const node: CatalogNode = {
    name: path.basename(root),
    path: root,
    type: stat.isDirectory() ? "dir" : "file",
    size: stat.isFile() ? stat.size : undefined,
    mtimeMs: stat.mtimeMs
  };

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    node.children = entries
      .map((e) => readDirTree(path.join(root, e.name)))
      .filter((n) => n.type === "dir" || n.name.endsWith(".json"));
  }

  return node;
}

const { rootPath } = workerData as { rootPath: string };
const tree = readDirTree(rootPath);
parentPort?.postMessage(tree);
