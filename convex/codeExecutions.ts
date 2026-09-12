import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

const FREE_DAILY_RUNS = 30;
const PRO_DAILY_RUNS = 1000;
const MAX_OUTPUT_CHARS = 20_000;

// Server-side UTC day key. Never trust the client's dayKey — a client
// that omits or forges it would bypass quotas entirely.
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getCaller(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  return identity.subject;
}

async function countToday(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  dayKey: string
): Promise<number> {
  const rows = await ctx.db
    .query("codeExecutions")
    .withIndex("by_user_and_day", (q) =>
      q.eq("userId", userId).eq("dayKey", dayKey)
    )
    .collect();
  return rows.length;
}

export const checkQuota = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCaller(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    const isPro = user?.isPro === true;
    const limit = isPro ? PRO_DAILY_RUNS : FREE_DAILY_RUNS;
    const dayKey = todayKey();
    const used = await countToday(ctx, userId, dayKey);
    return { used, limit, isPro, remaining: Math.max(0, limit - used) };
  },
});

export const saveExecution = mutation({
    args:{
        language: v.string(),
        code:v.string(),
        output:v.optional(v.string()),
        error:v.optional(v.string()),
    },
    handler:async(ctx,args)=>{
        const userId = await getCaller(ctx);
        if (args.code.length > 50_000) throw new ConvexError("Code too large");
        if ((args.output?.length ?? 0) > MAX_OUTPUT_CHARS)
          throw new ConvexError("Output too large");
        if ((args.error?.length ?? 0) > MAX_OUTPUT_CHARS)
          throw new ConvexError("Error output too large");

        const user=await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();

        if(!user?.isPro && args.language!=="javascript"){
            throw new ConvexError("Pro Subscription Required");
        }

        const dayKey = todayKey();
        const used = await countToday(ctx, userId, dayKey);
        const limit = user?.isPro ? PRO_DAILY_RUNS : FREE_DAILY_RUNS;
        if (used >= limit) throw new ConvexError("Daily limit reached");

        await ctx.db.insert("codeExecutions",{
            language: args.language,
            code: args.code,
            output: args.output,
            error: args.error,
            dayKey,
            userId,
        })
    }
})

export const getUserExecutions = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getCaller(ctx);
    return await ctx.db
      .query("codeExecutions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCaller(ctx);
    const executions = await ctx.db
      .query("codeExecutions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .take(500);

    // Get starred snippets
    const starredSnippets = await ctx.db
      .query("stars")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    // Get all starred snippet details to analyze languages
    const snippetIds = starredSnippets.map((star) => star.snippetId);
    const snippetDetails = await Promise.all(snippetIds.map((id) => ctx.db.get(id)));

    // Calculate most starred language
    const starredLanguages = snippetDetails.filter(Boolean).reduce(
      (acc, curr) => {
        if (curr?.language) {
          acc[curr.language] = (acc[curr.language] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const mostStarredLanguage =
      Object.entries(starredLanguages).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "N/A";

    // Calculate execution stats
    const last24Hours = executions.filter(
      (e) => e._creationTime > Date.now() - 24 * 60 * 60 * 1000
    ).length;

    const languageStats = executions.reduce(
      (acc, curr) => {
        acc[curr.language] = (acc[curr.language] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const languages = Object.keys(languageStats);
    const favoriteLanguage = languages.length
      ? languages.reduce((a, b) => (languageStats[a] > languageStats[b] ? a : b))
      : "N/A";

    return {
      totalExecutions: executions.length,
      languagesCount: languages.length,
      languages: languages,
      last24Hours,
      favoriteLanguage,
      languageStats,
      mostStarredLanguage,
    };
  },
});
