import { cpSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "..");
const extensionDir = resolve(rootDir, "extension");
const distDir = resolve(extensionDir, "dist");

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy manifest.json to dist/
cpSync(resolve(extensionDir, "manifest.json"), resolve(distDir, "manifest.json"));

// Copy popup HTML and CSS to dist/popup/
const popupDistDir = resolve(distDir, "popup");
if (!existsSync(popupDistDir)) {
  mkdirSync(popupDistDir, { recursive: true });
}
cpSync(resolve(extensionDir, "src", "popup", "popup.html"), resolve(popupDistDir, "popup.html"));
cpSync(resolve(extensionDir, "src", "popup", "popup.css"), resolve(popupDistDir, "popup.css"));
cpSync(resolve(extensionDir, "src", "popup", "llm_settings.css"), resolve(popupDistDir, "llm_settings.css"));
