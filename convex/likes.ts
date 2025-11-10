// convex/likes.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user already liked this post
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .unique();

    if (existingLike) {
      // Unlike: remove the like
      await ctx.db.delete(existingLike._id);
      
      // Decrease like count
      const post = await ctx.db.get(args.postId);
      if (post) {
        await ctx.db.patch(args.postId, {
          likesCount: Math.max(0, (post.likesCount || 0) - 1),
        });
      }
      
      return { liked: false };
    } else {
      // Like: add the like
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: args.userId,
        createdAt: Date.now(),
      });
      
      // Increase like count
      const post = await ctx.db.get(args.postId);
      if (post) {
        await ctx.db.patch(args.postId, {
          likesCount: (post.likesCount || 0) + 1,
        });
      }
      
      return { liked: true };
    }
  },
});

export const hasUserLiked = query({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .unique();
    
    return !!like;
  },
});

export const getPostLikes = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const likesWithUsers = await Promise.all(
      likes.map(async (like) => {
        const user = await ctx.db.get(like.userId);
        return {
          ...like,
          user: user ? { _id: user._id, name: user.name } : null,
        };
      })
    );

    return likesWithUsers;
  },
});