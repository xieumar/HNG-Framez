// convex/posts.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      ...args,
      createdAt: Date.now(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
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

    // Delete associated likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete associated comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete the image from storage if it exists
    if (post.imageStorageId && typeof post.imageStorageId !== 'string') {
      try {
        await ctx.storage.delete(post.imageStorageId);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }

    await ctx.db.delete(args.postId);
  },
});

export const incrementShareCount = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        sharesCount: (post.sharesCount || 0) + 1,
      });
    }
  },
});

export const getAllPosts = query({
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    // Return posts + user + image data (Convex will now track changes)
    return await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);

        let imageUrl = null;
        if (post.imageStorageId) {
          if (typeof post.imageStorageId === "string" && post.imageStorageId.startsWith("http")) {
            imageUrl = post.imageStorageId;
          } else {
            try {
              imageUrl = await ctx.storage.getUrl(post.imageStorageId as any);
            } catch {
              imageUrl = null;
            }
          }
        }

        let avatarUrl = null;
        if (user?.avatar) {
          if (typeof user.avatar === "string" && user.avatar.startsWith("http")) {
            avatarUrl = user.avatar;
          } else {
            try {
              avatarUrl = await ctx.storage.getUrl(user.avatar as any);
            } catch {
              avatarUrl = null;
            }
          }
        }

        return {
          _id: post._id,
          content: post.content,
          createdAt: post.createdAt,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount, // 👈 Convex tracks this now
          sharesCount: post.sharesCount,
          imageUrl,
          author: user
            ? {
                name: user.name,
                avatar: avatarUrl,
                _id: user._id,
              }
            : null,
        };
      })
    );
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
          if (typeof post.imageStorageId === 'string' && post.imageStorageId.startsWith("http")) {
            imageUrl = post.imageStorageId;
          } else {
            try {
              imageUrl = await ctx.storage.getUrl(post.imageStorageId as any);
            } catch (err) {
              imageUrl = null;
            }
          }
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