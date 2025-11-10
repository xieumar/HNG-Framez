// convex/comments.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      userId: args.userId,
      content: args.content,
      createdAt: Date.now(),
    });

    // Increase comment count
    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        commentsCount: (post.commentsCount || 0) + 1,
      });
    }

    return commentId;
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    
    if (!comment) {
      throw new Error("Comment not found");
    }

    await ctx.db.delete(args.commentId);

    // Decrease comment count
    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentsCount: Math.max(0, (post.commentsCount || 0) - 1),
      });
    }
  },
});

export const getPostComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .collect();

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        
        let avatarUrl = null;
        if (user?.avatar) {
          if (typeof user.avatar === 'string' && (user.avatar.startsWith("http://") || user.avatar.startsWith("https://"))) {
            avatarUrl = user.avatar;
          } else {
            try {
              avatarUrl = await ctx.storage.getUrl(user.avatar as any);
            } catch (err) {
              avatarUrl = null;
            }
          }
        }

        return {
          ...comment,
          author: user
            ? {
                ...user,
                avatar: avatarUrl,
              }
            : null,
        };
      })
    );

    return commentsWithUsers;
  },
});