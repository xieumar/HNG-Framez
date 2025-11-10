// convex/posts.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.patch(args.postId, {
      content: args.content,
    });
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    // Delete the image from storage if it exists
    if (post.imageStorageId && !post.imageStorageId.startsWith("http")) {
      try {
        await ctx.storage.delete(post.imageStorageId);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }

    await ctx.db.delete(args.postId);
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