import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const store = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        ...(args.avatar && { avatar: args.avatar }),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      ...(args.avatar && { avatar: args.avatar }),
    });
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return null;

    let avatarUrl = null;

    if (user.avatar) {
      const trimmed = user.avatar.trim().toLowerCase();

      // ✅ Detect all possible full URLs (with/without spaces)
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        avatarUrl = user.avatar; // already a URL
      } else {
        try {
          avatarUrl = await ctx.storage.getUrl(user.avatar);
        } catch (err) {
          console.error("Invalid storage ID for avatar:", user.avatar, err);
          avatarUrl = null;
        }
      }
    }

    return {
      ...user,
      avatar: avatarUrl,
    };
  },
});
