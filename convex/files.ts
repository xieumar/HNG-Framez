import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Query to get file URL from storage ID
export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    try {
      return await ctx.storage.getUrl(args.storageId);
    } catch (error) {
      console.error("Error getting URL for storageId:", args.storageId, error);
      return null;
    }
  },
});