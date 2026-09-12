import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

const FREE_DAILY_RUNS = 30;
const PRO_DAILY_RUNS = 1000;

export const checkQuota = query({
  args: { userId: v.string(), dayKey: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    const isPro = user?.isPro === true;
    const limit = isPro ? PRO_DAILY_RUNS : FREE_DAILY_RUNS;
    const used = (
      await ctx.db
        .query("codeExecutions")
        .withIndex("by_user_and_day")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .filter((q) => q.eq(q.field("dayKey"), args.dayKey))
        .collect()
    ).length;
    return { used, limit, isPro, remaining: Math.max(0, limit - used) };
  },
});

export const saveExecution = mutation({
    args:{
        language: v.string(),
        code:v.string(),
        output:v.optional(v.string()),
        error:v.optional(v.string()),
        dayKey: v.string(),
    },
    handler:async(ctx,args)=>{
        const identity=await ctx.auth.getUserIdentity();
        if(!identity) throw new ConvexError("Not authenticated");
        if (args.code.length > 50_000) throw new ConvexError("Code too large");

        const user=await ctx.db
        .query("users")
        .withIndex("by_user_id")
        .filter((q)=>q.eq(q.field("userId"),identity.subject))
        .first();

        if(!user?.isPro && args.language!=="javascript"){
            throw new ConvexError("Pro Subscription Required");
        }

        const used = (
          await ctx.db
            .query("codeExecutions")
            .withIndex("by_user_and_day")
            .filter((q) => q.eq(q.field("userId"), identity.subject))
            .filter((q) => q.eq(q.field("dayKey"), args.dayKey))
            .collect()
        ).length;
        const limit = user?.isPro ? PRO_DAILY_RUNS : FREE_DAILY_RUNS;
        if (used >= limit) throw new ConvexError("Daily limit reached");

        await ctx.db.insert("codeExecutions",{
            language: args.language,
            code: args.code,
            output: args.output,
            error: args.error,
            dayKey: args.dayKey,
            userId:identity.subject,
        })
    }
})

export const getUserExecutions = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codeExecutions")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("codeExecutions")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    // Get starred snippets
    const starredSnippets = await ctx.db
      .query("stars")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
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
