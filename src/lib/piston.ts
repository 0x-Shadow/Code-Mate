export type PistonArgs = { language: string; version: string; code: string };

const PRIMARY = "https://emkc.org/api/v2/piston/execute";
const FALLBACK = "https://api.piston.rs/api/v2/execute";

export async function executeCode({ language, version, code }: PistonArgs): Promise<{ output: string }> {
  if (!code.trim()) throw new Error("Please Enter Some Code");
  if (code.length > 50_000) throw new Error("Code too large (max 50KB)");

  const body = JSON.stringify({ language, version, files: [{ content: code }] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attempt = async (url: string): Promise<any> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Executor HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = await attempt(PRIMARY);
  } catch {
    data = await attempt(FALLBACK);
  }

  if (data.message) throw new Error(data.message);
  if (data.compile && data.compile.code !== 0) {
    throw new Error(data.compile.stderr || data.compile.output || "Compile error");
  }
  if (data.run && data.run.code !== 0) {
    throw new Error(data.run.stderr || data.run.output || "Runtime error");
  }
  const out: string = data.run?.output ?? "";
  return { output: out.trim() };
}
