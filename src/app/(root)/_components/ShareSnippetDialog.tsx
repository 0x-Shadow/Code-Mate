import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { isConvexConfigured } from "@/lib/env";

function ShareSnippetDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const { language, getCode } = useCodeEditorStore();

  // Defense in depth: the Share button is disabled in demo mode, but the
  // dialog must never mount a mutation without a Convex provider either.
  if (!isConvexConfigured) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1e1e2e] rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold text-white mb-2">Sharing unavailable</h2>
          <p className="text-sm text-gray-400 mb-4">
            Add Convex keys to .env.local to enable snippet sharing.
          </p>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-gray-300">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <ShareSnippetForm onClose={onClose} title={title} setTitle={setTitle} isSharing={isSharing} setIsSharing={setIsSharing} language={language} getCode={getCode} />;
}

function ShareSnippetForm({
  onClose,
  title,
  setTitle,
  isSharing,
  setIsSharing,
  language,
  getCode,
}: {
  onClose: () => void;
  title: string;
  setTitle: (v: string) => void;
  isSharing: boolean;
  setIsSharing: (v: boolean) => void;
  language: string;
  getCode: () => string;
}) {
  const createSnippet = useMutation(api.snippets.createSnippet);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Give your snippet a title");
      return;
    }
    const code = getCode();
    if (!code.trim()) {
      toast.error("Nothing to share — the editor is empty");
      return;
    }
    if (code.length > 50_000) {
      toast.error("Snippet too large (max 50KB)");
      return;
    }

    setIsSharing(true);

    try {
      await createSnippet({ title: title.trim(), language, code });
      onClose();
      setTitle("");
      toast.success("Snippet shared successfully");
    } catch {
      toast.error("Error creating snippet");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e2e] rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Share Snippet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleShare}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#181825] border border-[#313244] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter snippet title"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
              disabled:opacity-50"
            >
              {isSharing ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default ShareSnippetDialog;
