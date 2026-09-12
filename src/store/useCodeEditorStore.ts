import { CodeEditorState } from "./../types/index";
// import { LANGUAGE_CONFIG } from "@/app/(root)/_constants";
import { create } from "zustand";
// import { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { LANGUAGE_CONFIG } from "@/app/(root)/_constants";

const getInitialState = () => {
    //if we are on server side return default values 
    if (typeof window === "undefined") {
        return {
            language: "javascript",
            fontSize: 16,
            theme: "vs-dark",
        }
    }

    //but if we r on client side then we take data from local storage ad it is a browser api
    const savedLanguage = localStorage.getItem("editor-language") || "javascript";
    const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";
    const savedFontSize = localStorage.getItem("editor-font-size") || 16;

    return {
        language: savedLanguage,
        theme: savedTheme,
        fontSize: Number(savedFontSize),
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
                const savedLanguage = localStorage.getItem("editor-language") || "javascript";
                const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";
                const savedFontSize = localStorage.getItem("editor-font-size") || 16;

                set({
                    language: savedLanguage,
                    theme: savedTheme,
                    fontSize: Number(savedFontSize),
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
            localStorage.setItem("editor-theme", theme);
            set({ theme });
        },

        setFontSize: (fontSize: number) => {
            localStorage.setItem("editor-font-size", fontSize.toString());
            set({ fontSize });
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
          const { language, getCode } = get();
          const code = getCode();
          if (!code) {
            set({ error: "Please Enter Some Code" });
            return;
          }
          set({ isRunning: true, error: null, output: "" });
          try {
            const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
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