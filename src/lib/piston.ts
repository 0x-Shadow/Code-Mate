export type PistonArgs = {
  language: string;
  version: string;
  code: string;
  fileName?: string;
};

// Piston-compatible executor. The public emkc.org endpoint went
// whitelist-only in 2026, so owners should self-host Piston
// (1 command — see README) and point NEXT_PUBLIC_PISTON_URL at it.
const EXECUTOR =
  process.env.NEXT_PUBLIC_PISTON_URL ||
  "https://emkc.org/api/v2/piston/execute";

type PistonRuntime = { language: string; version: string; aliases?: string[] };

// Pinned versions rot (every Piston release ships new ones), so resolve the
// newest matching runtime from the executor itself, falling back to pinned.
function runtimesUrl(): string {
  const base = EXECUTOR.replace(/\/+$/, "");
  if (base.endsWith("/piston/execute")) {
    return base.slice(0, -"/piston/execute".length) + "/piston/runtimes";
  }
  if (base.endsWith("/execute")) {
    return base.slice(0, -"/execute".length) + "/runtimes";
  }
  return base + "/runtimes";
}

function normLang(s: string): string {
  return s.toLowerCase().replace(/\+\+/g, "pp").replace(/^c#$/, "csharp");
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(/[^0-9]+/).filter(Boolean).map(Number);
  const pb = b.split(/[^0-9]+/).filter(Boolean).map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

let runtimesCache: Promise<PistonRuntime[]> | null = null;

function loadRuntimes(): Promise<PistonRuntime[]> {
  if (!runtimesCache) {
    runtimesCache = (async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(runtimesUrl(), { signal: ctrl.signal });
        if (!res.ok) throw new Error(`runtimes HTTP ${res.status}`);
        const list = (await res.json()) as PistonRuntime[];
        if (!Array.isArray(list)) throw new Error("bad runtimes payload");
        return list;
      } finally {
        clearTimeout(t);
      }
    })();
    // A failed probe must not poison later runs — retry next time.
    runtimesCache.catch(() => {
      runtimesCache = null;
    });
  }
  return runtimesCache;
}

async function resolveRuntime(
  language: string,
  pinnedVersion: string
): Promise<{ language: string; version: string }> {
  try {
    const list = await loadRuntimes();
    const want = normLang(language);
    const matches = list.filter(
      (r) =>
        normLang(r.language) === want ||
        (r.aliases ?? []).some((a) => normLang(a) === want)
    );
    if (matches.length > 0) {
      const best = matches.reduce((a, b) =>
        compareVersions(b.version, a.version) > 0 ? b : a
      );
      return { language: best.language, version: best.version };
    }
  } catch {
    // Executor without a runtimes endpoint (or offline) — use pinned.
  }
  return { language, version: pinnedVersion };
}

export async function executeCode({ language, version, code, fileName }: PistonArgs): Promise<{ output: string }> {
  if (!code.trim()) throw new Error("Please Enter Some Code");
  if (code.length > 50_000) throw new Error("Code too large (max 50KB)");

  const runtime = await resolveRuntime(language, version);
  const body = JSON.stringify({
    language: runtime.language,
    version: runtime.version,
    // A real filename: required by Java (public class ↔ file), ignored elsewhere.
    files: [{ name: fileName || "main.txt", content: code }],
  });

  let data: unknown;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(EXECUTOR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text.slice(0, 300) ||
            `Executor HTTP ${res.status} — the site owner must configure a working executor (see README).`
        );
      }
      data = await res.json();
    } finally {
      clearTimeout(t);
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Execution timed out (10s limit)");
    }
    throw e instanceof Error
      ? e
      : new Error("Executor unreachable — try again later");
  }

  const d = data as {
    message?: string;
    compile?: { code?: number; stderr?: string; output?: string };
    run?: { code?: number; stderr?: string; output?: string };
  };
  if (d.message) throw new Error(d.message);
  if (d.compile && d.compile.code !== 0) {
    throw new Error(d.compile.stderr || d.compile.output || "Compile error");
  }
  if (d.run && d.run.code !== 0) {
    throw new Error(d.run.stderr || d.run.output || "Runtime error");
  }
  const out: string = d.run?.output ?? "";
  // Cap rendered output — runaway prints (e.g. infinite loops) must never
  // balloon the DOM. Piston kills the process at the timeout regardless.
  const MAX_OUTPUT = 20_000;
  const trimmed = out.trim();
  const output =
    trimmed.length > MAX_OUTPUT
      ? trimmed.slice(0, MAX_OUTPUT) + "\n…[output truncated]"
      : trimmed;
  return { output };
}
