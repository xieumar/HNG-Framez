import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    imageStorageId: v.optional(v.string()), // CHANGED from imageUrl
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getAllPosts = query({
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);

        let imageUrl = null;
        if (post.imageStorageId) {
          if (!post.imageStorageId.startsWith("http")) {
            imageUrl = await ctx.storage.getUrl(post.imageStorageId);
          } else {
            imageUrl = post.imageStorageId;
          }
        }

        let avatarUrl = null;
        if (user?.avatar) {
          if (!user.avatar.startsWith("http")) {
            avatarUrl = await ctx.storage.getUrl(user.avatar);
          } else {
            avatarUrl = user.avatar;
          }
        }

        return {
          ...post,
          imageUrl,
          author: user
            ? {
                ...user,
                avatar: avatarUrl,
              }
            : null,
        };
      })
    );

    return postsWithUsers;
  },
});


export const getUserPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get image URLs for each post
    const postsWithImages = await Promise.all(
      posts.map(async (post) => {
        let imageUrl = null;
        if (post.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(post.imageStorageId);
        }
        return {
          ...post,
          imageUrl,
        };
      })
    );

    return postsWithImages;
  },
});