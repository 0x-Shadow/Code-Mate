import Header from "./_components/Header";
import OutputPanel from "./_components/OutputPanel";
import EditorPanel from "./_components/EditorPanel";
import { isConvexConfigured } from "@/lib/env";


export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header/>
        {!isConvexConfigured && (
          <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-300">
            Demo mode — code execution works. Add Clerk + Convex keys to .env.local to enable saving, history &amp; Pro.
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EditorPanel/>
            <OutputPanel/>
        </div>
      </div>
    </div>
  );
}
