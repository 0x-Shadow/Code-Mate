import Header from "./_components/Header";
import OutputPanel from "./_components/OutputPanel";
import EditorPanel from "./_components/EditorPanel";
import AdSlot from "@/components/AdSlot";


export default function Home() {
  const topSlot = process.env.NEXT_PUBLIC_AD_SLOT_TOP || undefined;
  const bottomSlot = process.env.NEXT_PUBLIC_AD_SLOT_BOTTOM || undefined;
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header/>
        <AdSlot label="top leaderboard" slot={topSlot} className="mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EditorPanel/>
            <OutputPanel/>
        </div>
        <AdSlot label="bottom leaderboard" slot={bottomSlot} className="mt-4" />
      </div>
    </div>
  );
}
