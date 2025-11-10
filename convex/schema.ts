// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.union(v.id("_storage"), v.string())), 
  }).index("by_clerk_id", ["clerkId"]),

  posts: defineTable({
    userId: v.id("users"),
    content: v.string(),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.string())), 
    createdAt: v.number(),
    likesCount: v.optional(v.number()),
    commentsCount: v.optional(v.number()),
    sharesCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_and_user", ["postId", "userId"]),

  comments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),
}); 