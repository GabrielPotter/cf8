import { app } from "electron";
import path from "node:path";
import fs from "node:fs";

export function getSystemConfigDir(): string {
  // Fejlesztés: dist/ melletti assets/config
  // Csomagolt:   resources/config
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "config");
  }
  // __dirname a dist/ -re fordul, ezért megyünk egy szinttel fel
  return path.resolve(__dirname, "../../assets/config");
}

export function getUserConfigDir(): string {
  // A korábbi döntéshez igazodva: ~/.cf8/
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".cf8");
}

