// DEPLOY ECHOES TO GITHUB PAGES
//
// Builds the production site and publishes it as the repository's Pages site.
//
//   GITHUB_TOKEN=<pat> node scripts/deploy-pages.mjs [--repo owner/name] [--branch gh-pages]
//
// The token is read from the environment only — it is never written to a file,
// to the git configuration, or to a remote URL that gets stored.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const argOf = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("GITHUB_TOKEN is not set — nothing was published.");
  process.exit(1);
}
const REPO = argOf("--repo", "yaseztaha-cyber/echoes");
const BRANCH = argOf("--branch", "gh-pages");
const ROOT = resolve(".");
const DIST = join(ROOT, "dist");
const STAGE = join(ROOT, ".pages-stage");

const run = (cmd, args2, opts = {}) =>
  execFileSync(cmd, args2, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });

/* ------------------------------------------------------------------ build */
console.log("building the production site…");
run("npm", ["run", "build"], { stdio: "inherit" });
if (!existsSync(join(DIST, "index.html"))) {
  console.error("the build produced no dist/index.html");
  process.exit(1);
}

/* ------------------------------------------------------------------ stage */
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });
cpSync(DIST, STAGE, { recursive: true });
// GitHub Pages must not run Jekyll over the output
writeFileSync(join(STAGE, ".nojekyll"), "");
// deep links fall back to the single-file app
if (existsSync(join(STAGE, "index.html"))) writeFileSync(join(STAGE, "404.html"), readFileSync(join(STAGE, "index.html")));

/* ------------------------------------------------------------------ publish */
const auth = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${TOKEN}`).toString("base64")}`;
const gitEnv = { ...process.env, GIT_AUTHOR_NAME: "ECHOES release", GIT_AUTHOR_EMAIL: "release@echoes.local" };

console.log(`publishing to ${REPO} (${BRANCH})…`);
run("git", ["checkout", "--orphan", BRANCH], { env: gitEnv });
run("git", ["rm", "-rf", "--cached", "."], { env: gitEnv });
for (const entry of ["index.html", "404.html", ".nojekyll", "films", "tex-hi", "vendors"]) {
  if (!existsSync(join(STAGE, entry))) continue;
  run("git", ["add", "--force", entry], { env: gitEnv });
}
for (const f of readFileSync(join(STAGE, ".gitignore-stage"), "utf8").split("\n").filter(Boolean)) {
  run("git", ["rm", "-rf", "--cached", "--ignore-unmatch", f], { env: gitEnv });
}
run("git", ["-c", "user.name=ECHOES release", "-c", "user.email=release@echoes.local", "commit", "-m", "publish: production build"], { env: gitEnv });
run("git", ["push", "-f", `https://x-access-token:${TOKEN}@github.com/${REPO}.git`, BRANCH], { env: gitEnv });
run("git", ["checkout", "main"], { env: gitEnv });
rmSync(STAGE, { recursive: true, force: true });

/* ------------------------------------------------------------------ pages */
const api = async (path, method = "GET") => {
  const res = await fetch(`https://api.github.com/repos/${REPO}/pages${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "User-Agent": "echoes-release", "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify({ source: { branch: BRANCH, path: "/" } }) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
};

const created = await api("", "POST");
if (created.status === 201) console.log("pages site created:", created.json.html_url ?? "");
else if (created.status === 409 || created.status === 422) console.log("pages site already configured");
else console.log("pages configuration:", created.status, JSON.stringify(created.json).slice(0, 200));

const info = await api("");
console.log("pages url:", info.json?.html_url ?? "(pending)");
console.log("done.");
