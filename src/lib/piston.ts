export type PistonArgs = { language: string; version: string; code: string };

// Piston-compatible executor. The public emkc.org endpoint went
// whitelist-only in 2026, so owners should self-host Piston
// (1 command — see README) and point NEXT_PUBLIC_PISTON_URL at it.
const EXECUTOR =
  process.env.NEXT_PUBLIC_PISTON_URL ||
  "https://emkc.org/api/v2/piston/execute";

export async function executeCode({ language, version, code }: PistonArgs): Promise<{ output: string }> {
  if (!code.trim()) throw new Error("Please Enter Some Code");
  if (code.length > 50_000) throw new Error("Code too large (max 50KB)");

  const body = JSON.stringify({ language, version, files: [{ content: code }] });

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
