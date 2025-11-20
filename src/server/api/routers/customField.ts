import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { customFieldDefinitions } from "~/server/db/schema";
import { randomUUID } from "crypto";

export const customFieldRouter = createTRPCRouter({
  // Get all custom field definitions for a specific entity type
  getByEntityType: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["contact", "deal"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await ctx.db.query.customFieldDefinitions.findMany({
        where: (customFieldDefinitions, { eq, and }) =>
          and(
            eq(customFieldDefinitions.entityType, input.entityType),
            eq(customFieldDefinitions.createdById, userId),
          ),
        orderBy: [asc(customFieldDefinitions.createdAt)],
      });
    }),

  // Create a new custom field definition
  create: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["contact", "deal"]),
        fieldKey: z.string().min(1).max(100),
        label: z.string().min(1).max(100),
        fieldType: z.enum(["text", "number", "date", "boolean"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if field key already exists for this user and entity type
      const existing = await ctx.db.query.customFieldDefinitions.findFirst({
        where: (customFieldDefinitions, { eq, and }) =>
          and(
            eq(customFieldDefinitions.entityType, input.entityType),
            eq(customFieldDefinitions.fieldKey, input.fieldKey),
            eq(customFieldDefinitions.createdById, userId),
          ),
      });

      if (existing) {
        throw new Error(
          "A custom field with this key already exists for this entity type",
        );
      }

      const id = randomUUID();
      await ctx.db.insert(customFieldDefinitions).values({
        id,
        entityType: input.entityType,
        fieldKey: input.fieldKey,
        label: input.label,
        fieldType: input.fieldType,
        createdById: userId,
      });

      return { id };
    }),

  // Update a custom field definition
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(100).optional(),
        fieldType: z.enum(["text", "number", "date", "boolean"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...updates } = input;

      // Verify ownership
      const existing = await ctx.db.query.customFieldDefinitions.findFirst({
        where: (customFieldDefinitions, { eq, and }) =>
          and(
            eq(customFieldDefinitions.id, id),
            eq(customFieldDefinitions.createdById, userId),
          ),
      });

      if (!existing) {
        throw new Error("Custom field definition not found");
      }

      await ctx.db
        .update(customFieldDefinitions)
        .set(updates)
        .where(
          and(
            eq(customFieldDefinitions.id, id),
            eq(customFieldDefinitions.createdById, userId),
          ),
        );

      return { success: true };
    }),

  // Delete a custom field definition
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const existing = await ctx.db.query.customFieldDefinitions.findFirst({
        where: (customFieldDefinitions, { eq, and }) =>
          and(
            eq(customFieldDefinitions.id, input.id),
            eq(customFieldDefinitions.createdById, userId),
          ),
      });

      if (!existing) {
        throw new Error("Custom field definition not found");
      }

      await ctx.db
        .delete(customFieldDefinitions)
        .where(
          and(
            eq(customFieldDefinitions.id, input.id),
            eq(customFieldDefinitions.createdById, userId),
          ),
        );

      return { success: true };
    }),
});
