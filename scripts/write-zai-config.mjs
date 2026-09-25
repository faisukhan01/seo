/**
 * Build-time helper: materialize the z-ai-web-dev-sdk config file.
 *
 * The SDK reads credentials ONLY from a `.z-ai-config` JSON file
 * (cwd → homedir → /etc). On hosting platforms like Vercel there is no
 * such file and no env-var support in the SDK, so we allow the config
 * to be supplied through the `ZAI_CONFIG_JSON` environment variable
 * (or the separate `ZAI_BASE_URL` + `ZAI_API_KEY` variables) and write
 * it to the project root at build time.
 *
 * next.config.ts includes this file in the serverless bundle via
 * outputFileTracingIncludes, so the AI features work on Vercel too.
 *
 * If no env vars are set (e.g. local sandbox where /etc/.z-ai-config
 * already exists), this script is a no-op.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const target = join(process.cwd(), ".z-ai-config");

function main() {
  if (existsSync(target)) {
    try {
      const existing = JSON.parse(readFileSync(target, "utf-8"));
      if (existing?.baseUrl && existing?.apiKey) {
        console.log("[write-zai-config] .z-ai-config already present — skipping");
        return;
      }
    } catch {
      /* fall through and regenerate */
    }
  }

  let config = null;

  if (process.env.ZAI_CONFIG_JSON) {
    try {
      config = JSON.parse(process.env.ZAI_CONFIG_JSON);
    } catch {
      console.warn(
        "[write-zai-config] ZAI_CONFIG_JSON is not valid JSON — ignoring",
      );
    }
  } else if (process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY) {
    config = {
      baseUrl: process.env.ZAI_BASE_URL,
      apiKey: process.env.ZAI_API_KEY,
    };
  }

  if (!config?.baseUrl || !config?.apiKey) {
    console.log(
      "[write-zai-config] No ZAI_CONFIG_JSON (or ZAI_BASE_URL + ZAI_API_KEY) set — AI features will rely on a pre-existing config file",
    );
    return;
  }

  writeFileSync(target, JSON.stringify(config), "utf-8");
  console.log("[write-zai-config] wrote .z-ai-config from environment");
}

main();
