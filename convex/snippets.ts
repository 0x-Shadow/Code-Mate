import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const MAX_TITLE_CHARS = 100;
const MAX_CODE_CHARS = 50_000;
const MAX_COMMENT_CHARS = 5_000;

function cleanText(value: string, max: number, field: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new Error(`${field} must not be empty`);
    if (trimmed.length > max) throw new Error(`${field} too long (max ${max} chars)`);
    return trimmed;
}

export const createSnippet = mutation({
    args: {
        title: v.string(),
        language: v.string(),
        code: v.string(),
    },
    handler: async (ctx, args) => {
        // Get user identity for authentication
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const title = cleanText(args.title, MAX_TITLE_CHARS, "Title");
        const code = cleanText(args.code, MAX_CODE_CHARS, "Code");
        const language = cleanText(args.language, 30, "Language");


        const user= await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("userId", identity.subject)).
        first();

        if(!user) throw new Error("User not found");

        const snippetId =await ctx.db.insert("snippets",{
            userId: identity.subject,
            userName:user.name,
            title,
            language,
            code
        })

        return snippetId;

    },
    
});

export const deleteSnippet =mutation({
    args:{
        snippetId: v.id("snippets"),
    },
    handler:async(ctx,args)=>{
        const identity= await ctx.auth.getUserIdentity();
        if(!identity) throw new Error("Not authenticated");

        const snippet = await ctx.db.get(args.snippetId);
        if(!snippet) throw new Error("Snippet Not found");

        if (snippet.userId!==identity.subject){
            throw new Error("Not authorized to delete this snippet")
        }

        const comments= await ctx.db
        .query("snippetComments")
        .withIndex("by_snippet_id")
        .filter((q)=>q.eq(q.field("snippetId"),args.snippetId))
        .collect()

        for(const comment of comments){
            await ctx.db.delete(comment._id);
        }

        const stars= await ctx.db
        .query("stars")
        .withIndex("by_snippet_id")
        .filter((q)=>q.eq(q.field("snippetId"),args.snippetId))
        .collect()

        for(const star of stars){
            await ctx.db.delete(star._id);
        }

        await ctx.db.delete(args.snippetId);
    }
})

export const starSnippet = mutation({
    args:{
        snippetId: v.id("snippets")
    },
    handler:async(ctx,args)=>{
        const identity= await ctx.auth.getUserIdentity();
        if(!identity) throw new Error("Not authenticated");

        const existing = await ctx.db
        .query("stars")
        .withIndex("by_user_id_and_snippet_id")
        .filter(
            (q)=>q.eq(q.field("userId"),identity.subject) && q.eq(q.field("snippetId"),args.snippetId)
        )
        .first()

        if(existing){
            await ctx.db.delete(existing._id);
        }else{
            const snippet = await ctx.db.get(args.snippetId);
            if (!snippet) throw new Error("Snippet not found");
            await ctx.db.insert("stars",{
                userId: identity.subject,
                snippetId: args.snippetId,
            })
        }
    }
})

export const addComment = mutation({
  args: {
    snippetId: v.id("snippets"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const snippet = await ctx.db.get(args.snippetId);
    if (!snippet) throw new Error("Snippet not found");

    const content = cleanText(args.content, MAX_COMMENT_CHARS, "Comment");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    return await ctx.db.insert("snippetComments", {
      snippetId: args.snippetId,
      userId: identity.subject,
      userName: user.name,
      content,
    });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("snippetComments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    // Check if the user is the comment author
    if (comment.userId !== identity.subject) {
      throw new Error("Not authorized to delete this comment");
    }

    await ctx.db.delete(args.commentId);
  },
});

export const getSnippets= query({
    handler:async(ctx)=>{
        //collecting snippets from db in orders by time (bounded: full
        // pagination is a buyer TODO — 200 newest is plenty for a starter).
        const snippets = await ctx.db.query("snippets").order("desc").take(200);
        return snippets;
    }
})

export const getSnippetById= query({
    args:{snippetId: v.id("snippets")},
    handler: async (ctx,args)=>{
        const snippet= await ctx.db.get(args.snippetId);
        if(!snippet) throw new Error("Snippet Not Found");

        return snippet;
    }
})

export const getcomments=query({
    args:{snippetId: v.id("snippets")},
    handler: async(ctx,args)=>{
        const comments= await ctx.db
        .query("snippetComments")
        .withIndex("by_snippet_id")
        .filter((q)=>q.eq(q.field("snippetId"),args.snippetId))
        .order("desc")
        .collect();

        return comments;
    }
})

export const isSnippetStarred = query({
    args:{
        snippetId: v.id("snippets")
    },
    handler: async(ctx,args)=>{
        const identity= await ctx.auth.getUserIdentity();
        if(!identity) return false;

        const star= await ctx.db
        .query("stars")
        .withIndex("by_user_id_and_snippet_id")
        .filter(
            (q)=>q.eq(q.field("userId"),identity.subject) && q.eq(q.field("snippetId"),args.snippetId)
        ).first();

        //!! used to convert it itno boolean value for returing true or false;
        return !!star;
    }
})

export const getSnippetStarCount= query({
    args:{
        snippetId: v.id("snippets")
    },
    handler: async(ctx,args)=>{
        const stars= await ctx.db.query("stars")
        .withIndex("by_snippet_id")
        .filter((q)=>q.eq(q.field("snippetId"),args.snippetId))
        .collect();
        
        return stars.length;
    }

})

export const getStarredSnippets = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const stars = await ctx.db
      .query("stars")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();

    const snippets = await Promise.all(stars.map((star) => ctx.db.get(star.snippetId)));

    return snippets.filter((snippet) => snippet !== null);
  },
});