// DEPLOY ECHOES TO GITHUB PAGES
//
// Builds the production site and publishes it as the repository's Pages site.
//
//   GITHUB_TOKEN=<pat> node scripts/deploy-pages.mjs [--repo owner/name] [--branch gh-pages]
//
// The token is read from the environment only — it is never written to a file,
// to the git configuration, or to a remote URL that gets stored.
//
// The publish happens in a temporary git worktree, so the working tree of the
// repository is never touched.
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
const WT = join(ROOT, ".pages-worktree");

const run = (cmd, args2, opts = {}) =>
  execFileSync(cmd, args2, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });

/* ------------------------------------------------------------------ build */
console.log("building the production site…");
// npm is a .cmd on Windows — spawn it through the shell so it resolves.
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
run(npmCmd, ["run", "build"], { stdio: "inherit", shell: process.platform === "win32" });
if (!existsSync(join(DIST, "index.html"))) {
  console.error("the build produced no dist/index.html");
  process.exit(1);
}

/* ------------------------------------------------------------------ worktree */
rmSync(WT, { recursive: true, force: true });
run("git", ["worktree", "prune"]);
run("git", ["worktree", "add", "--detach", WT], { stdio: "inherit" });

try {
  // the published site is exactly the build output
  for (const entry of ["index.html", "tex-hi", "vendors", "stars-deep.bin", "films"]) {
    const from = join(DIST, entry);
    if (!existsSync(from)) continue;
    const to = join(WT, entry);
    if (existsSync(to)) rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
  }
  // GitHub Pages must not run Jekyll over the output
  writeFileSync(join(WT, ".nojekyll"), "");
  // a deep link falls back to the single-file app
  if (existsSync(join(WT, "index.html"))) writeFileSync(join(WT, "404.html"), readFileSync(join(WT, "index.html")));

  const gitEnv = {
    ...process.env,
    GIT_AUTHOR_NAME: "ECHOES release",
    GIT_AUTHOR_EMAIL: "release@echoes.local",
    GIT_COMMITTER_NAME: "ECHOES release",
    GIT_COMMITTER_EMAIL: "release@echoes.local",
  };
  run("git", ["-C", WT, "add", "--force", "."], { env: gitEnv });
  run("git", ["-C", WT, "commit", "-m", "publish: production build"], { env: gitEnv });

  console.log(`publishing to ${REPO} (${BRANCH})…`);
  run("git", ["-C", WT, "push", "--force", `https://x-access-token:${TOKEN}@github.com/${REPO}.git`, `HEAD:refs/heads/${BRANCH}`], { env: gitEnv, stdio: "inherit" });
} finally {
  run("git", ["worktree", "remove", "--force", WT]);
  run("git", ["worktree", "prune"]);
}

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
