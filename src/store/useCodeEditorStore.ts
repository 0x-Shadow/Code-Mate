import { CodeEditorState } from "./../types/index";
// import { LANGUAGE_CONFIG } from "@/app/(root)/_constants";
import { create } from "zustand";
// import { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { LANGUAGE_CONFIG, THEMES } from "@/app/(root)/_constants";

const DEFAULT_LANGUAGE = "javascript";
const DEFAULT_THEME = "vs-dark";
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;

function sanitizeLanguage(value: string | null): string {
    return value && value in LANGUAGE_CONFIG ? value : DEFAULT_LANGUAGE;
}

function sanitizeTheme(value: string | null): string {
    return value && THEMES.some((t) => t.id === value) ? value : DEFAULT_THEME;
}

function sanitizeFontSize(value: string | null): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return DEFAULT_FONT_SIZE;
    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(n)));
}

// Abuse guard: the playground is anonymous, so each browser self-limits.
// (Piston also rate-limits server-side; this stops casual hammering and
// crypto-miner-style loops from one tab.)
const MIN_RUN_INTERVAL_MS = 2000;
const MAX_RUNS_PER_HOUR = 60;
const RUN_STAMPS_KEY = "codemate-run-stamps";

function checkRateLimit(): string | null {
    if (typeof window === "undefined") return null;
    const now = Date.now();
    let stamps: number[] = [];
    try {
        stamps = JSON.parse(localStorage.getItem(RUN_STAMPS_KEY) || "[]");
        if (!Array.isArray(stamps)) stamps = [];
    } catch {
        stamps = [];
    }
    stamps = stamps.filter((t) => typeof t === "number" && now - t < 3_600_000);
    const last = stamps[stamps.length - 1];
    if (last !== undefined && now - last < MIN_RUN_INTERVAL_MS) {
        return "Wait a moment before running again";
    }
    if (stamps.length >= MAX_RUNS_PER_HOUR) {
        return "Hourly run limit reached — try again later";
    }
    stamps.push(now);
    try {
        localStorage.setItem(RUN_STAMPS_KEY, JSON.stringify(stamps));
    } catch {
        // Storage full/blocked — still allow the run.
    }
    return null;
}

const getInitialState = () => {
    //if we are on server side return default values 
    if (typeof window === "undefined") {
        return {
            language: DEFAULT_LANGUAGE,
            fontSize: DEFAULT_FONT_SIZE,
            theme: DEFAULT_THEME,
        }
    }

    //but if we r on client side then we take data from local storage ad it is a browser api
    //Stored values are validated — a poisoned/migrated key must never crash the app.
    return {
        language: sanitizeLanguage(localStorage.getItem("editor-language")),
        theme: sanitizeTheme(localStorage.getItem("editor-theme")),
        fontSize: sanitizeFontSize(localStorage.getItem("editor-font-size")),
    }
}

export const useCodeEditorStore = create<CodeEditorState>((set, get) => {
    //used for like when we  first refreshes we want some data to be there like font size some code and theme or language using that why creating this
    // const initialState= getInitialState();

    // return{
    //     ...initialState,
    //     output:"",
    //     isRunning:false,
    //     error:null,
    //     editor:null,
    //     executionResult:null,

    //     getCode:() => get().editor?.

    // }
    const initialState = getInitialState();

    return {
        ...initialState,
        output: "",
        isRunning: false,
        error: null,
        editor: null,
        executionResult: null,
        isHydrated: false,

        hydrate: () => {
            if (typeof window !== "undefined") {
                set({
                    language: sanitizeLanguage(localStorage.getItem("editor-language")),
                    theme: sanitizeTheme(localStorage.getItem("editor-theme")),
                    fontSize: sanitizeFontSize(localStorage.getItem("editor-font-size")),
                    isHydrated: true,
                });
            }
        },

        getCode: () => get().editor?.getValue() || "",


        // setEditor: (editor: Monaco) => {
        //   const savedCode = localStorage.getItem(`editor-code-${get().language}`);
        //   if (savedCode) editor.setValue(savedCode);

        //   set({ editor });
        // },
        setEditor: (editor: monaco.editor.IStandaloneCodeEditor) => {
            const savedCode = localStorage.getItem(`editor-code-${get().language}`);
            if (savedCode) editor.setValue(savedCode);

            set({ editor });
        },

        setTheme: (theme: string) => {
            const safe = sanitizeTheme(theme);
            localStorage.setItem("editor-theme", safe);
            set({ theme: safe });
        },

        setFontSize: (fontSize: number) => {
            const safe = sanitizeFontSize(String(fontSize));
            localStorage.setItem("editor-font-size", safe.toString());
            set({ fontSize: safe });
        },

        setLanguage: (language: string) => {
            // Save current language code before switching
            const currentCode = get().editor?.getValue();
            if (currentCode) {
                localStorage.setItem(`editor-code-${get().language}`, currentCode);
            }

            localStorage.setItem("editor-language", language);

            set({
                language,
                output: "",
                error: null,
            });
        },
        runCode: async () => {
          // Single flight — a second click while running is ignored instead
          // of racing and overwriting the first result.
          if (get().isRunning) return;
          const { language, getCode } = get();
          const code = getCode();
          if (!code) {
            set({ error: "Please Enter Some Code" });
            return;
          }
          const config = LANGUAGE_CONFIG[language];
          if (!config) {
            set({
              error: `Unknown language "${language}". Pick one from the language menu.`,
              executionResult: { code, output: "", error: "Unknown language" },
            });
            return;
          }
          const limited = checkRateLimit();
          if (limited) {
            set({
              error: limited,
              executionResult: { code, output: "", error: limited },
            });
            return;
          }
          set({ isRunning: true, error: null, output: "" });
          try {
            const runtime = config.pistonRuntime;
            const { executeCode } = await import("@/lib/piston");
            const { output } = await executeCode({ language: runtime.language, version: runtime.version, code });
            set({
              output,
              error: null,
              executionResult: { code, output, error: null },
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Error Running Code";
            set({ error: msg, executionResult: { code, output: "", error: msg } });
          } finally {
            set({ isRunning: false });
          }
        },
    }
});

export const getExecutionResult=()=> useCodeEditorStore.getState().executionResult;