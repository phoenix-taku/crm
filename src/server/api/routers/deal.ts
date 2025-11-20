import { z } from "zod";
import { eq, desc, and, count, ilike } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { deals, dealContacts } from "~/server/db/schema";
import { randomUUID } from "crypto";

const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed-won",
  "closed-lost",
] as const;

export const dealRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          stage: z.enum(DEAL_STAGES).optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          includeContacts: z.boolean().default(true),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const whereConditions = [eq(deals.createdById, userId)];
      if (input?.stage) {
        whereConditions.push(eq(deals.stage, input.stage));
      }

      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        whereConditions.push(ilike(deals.name, searchTerm));
      }

      const rawWhereCondition = and(...whereConditions);

      const queryOptions: Parameters<typeof ctx.db.query.deals.findMany>[0] = {
        where: (deals, { eq, and, ilike: ilikeFn }) => {
          const conditions = [eq(deals.createdById, userId)];
          if (input?.stage) {
            conditions.push(eq(deals.stage, input.stage));
          }
          if (input?.search) {
            const searchTerm = `%${input.search}%`;
            conditions.push(ilikeFn(deals.name, searchTerm));
          }
          return and(...conditions);
        },
        orderBy: [desc(deals.createdAt)],
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
      };

      // Only include contacts if requested (for list view performance)
      if (input?.includeContacts !== false) {
        queryOptions.with = {
          dealContacts: {
            with: {
              contact: true,
            },
          },
        };
      }

      const [results, totalResult] = await Promise.all([
        ctx.db.query.deals.findMany(queryOptions),
        ctx.db
          .select({ count: count() })
          .from(deals)
          .where(rawWhereCondition)
          .then((result) => result[0]),
      ]);

      const total = totalResult?.count ?? 0;

      return {
        deals: results,
        total,
      };
    }),

  getByStage: protectedProcedure
    .input(
      z.object({
        stage: z.enum(DEAL_STAGES),
      }),
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db.query.deals.findMany({
        where: (deals, { eq, and }) =>
          and(
            eq(deals.createdById, ctx.session.user.id),
            eq(deals.stage, input.stage),
          ),
        with: {
          dealContacts: {
            with: {
              contact: true,
            },
          },
        },
        orderBy: [desc(deals.createdAt)],
      });

      return results;
    }),

  getAllForPipeline: protectedProcedure.query(async ({ ctx }) => {
    const results = await ctx.db.query.deals.findMany({
      where: (deals, { eq }) => eq(deals.createdById, ctx.session.user.id),
      with: {
        dealContacts: {
          with: {
            contact: true,
          },
        },
      },
      orderBy: [desc(deals.createdAt)],
    });

    return {
      deals: results,
      total: results.length,
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.query.deals.findFirst({
        where: (deals, { eq, and }) =>
          and(
            eq(deals.id, input.id),
            eq(deals.createdById, ctx.session.user.id),
          ),
        with: {
          dealContacts: {
            with: {
              contact: true,
            },
          },
        },
      });

      if (!deal) {
        throw new Error("Deal not found");
      }

      return deal;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        stage: z.enum(DEAL_STAGES).optional(),
        value: z.string().optional(),
        currency: z.string().optional(),
        contactIds: z.array(z.string()).optional(),
        expectedCloseDate: z.date().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = randomUUID();

      const [deal] = await ctx.db
        .insert(deals)
        .values({
          id,
          name: input.name,
          stage: input.stage ?? "lead",
          value: input.value ?? null,
          currency: input.currency ?? "USD",
          expectedCloseDate: input.expectedCloseDate ?? null,
          notes: input.notes ?? null,
          createdById: ctx.session.user.id,
        })
        .returning();

      // Create junction table entries for contacts
      if (input.contactIds && input.contactIds.length > 0) {
        await ctx.db.insert(dealContacts).values(
          input.contactIds.map((contactId) => ({
            id: randomUUID(),
            dealId: id,
            contactId,
          })),
        );
      }

      // Fetch the deal with contacts
      const dealWithContacts = await ctx.db.query.deals.findFirst({
        where: (deals, { eq }) => eq(deals.id, id),
        with: {
          dealContacts: {
            with: {
              contact: true,
            },
          },
        },
      });

      return dealWithContacts ?? deal;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        stage: z.enum(DEAL_STAGES).optional(),
        value: z.string().optional(),
        currency: z.string().optional(),
        contactIds: z.array(z.string()).optional(),
        expectedCloseDate: z.date().optional().nullable(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the deal belongs to the user
      const existing = await ctx.db.query.deals.findFirst({
        where: (deals, { eq, and }) =>
          and(
            eq(deals.id, input.id),
            eq(deals.createdById, ctx.session.user.id),
          ),
      });

      if (!existing) {
        throw new Error("Deal not found");
      }

      const [deal] = await ctx.db
        .update(deals)
        .set({
          name: input.name ?? existing.name,
          stage: input.stage ?? existing.stage,
          value: input.value ?? existing.value,
          currency: input.currency ?? existing.currency,
          expectedCloseDate:
            input.expectedCloseDate !== undefined
              ? input.expectedCloseDate
              : existing.expectedCloseDate,
          notes: input.notes ?? existing.notes,
        })
        .where(eq(deals.id, input.id))
        .returning();

      // Update contacts if contactIds is provided
      if (input.contactIds !== undefined) {
        // Delete existing contact associations
        await ctx.db
          .delete(dealContacts)
          .where(eq(dealContacts.dealId, input.id));

        // Insert new contact associations
        if (input.contactIds.length > 0) {
          await ctx.db.insert(dealContacts).values(
            input.contactIds.map((contactId) => ({
              id: randomUUID(),
              dealId: input.id,
              contactId,
            })),
          );
        }
      }

      // Fetch the deal with contacts
      const dealWithContacts = await ctx.db.query.deals.findFirst({
        where: (deals, { eq }) => eq(deals.id, input.id),
        with: {
          dealContacts: {
            with: {
              contact: true,
            },
          },
        },
      });

      return dealWithContacts ?? deal;
    }),

  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        stage: z.enum(DEAL_STAGES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the deal belongs to the user
      const existing = await ctx.db.query.deals.findFirst({
        where: (deals, { eq, and }) =>
          and(
            eq(deals.id, input.id),
            eq(deals.createdById, ctx.session.user.id),
          ),
      });

      if (!existing) {
        throw new Error("Deal not found");
      }

      const [deal] = await ctx.db
        .update(deals)
        .set({
          stage: input.stage,
        })
        .where(eq(deals.id, input.id))
        .returning();

      return deal;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First verify the deal belongs to the user
      const existing = await ctx.db.query.deals.findFirst({
        where: (deals, { eq, and }) =>
          and(
            eq(deals.id, input.id),
            eq(deals.createdById, ctx.session.user.id),
          ),
      });

      if (!existing) {
        throw new Error("Deal not found");
      }

      await ctx.db.delete(deals).where(eq(deals.id, input.id));

      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const allDeals = await ctx.db.query.deals.findMany({
      where: (deals, { eq }) => eq(deals.createdById, userId),
    });

    const totalDeals = allDeals.length;
    const dealsByStage = DEAL_STAGES.reduce(
      (acc, stage) => {
        acc[stage] = allDeals.filter((deal) => deal.stage === stage).length;
        return acc;
      },
      {} as Record<(typeof DEAL_STAGES)[number], number>,
    );

    const totalValue = allDeals.reduce((sum, deal) => {
      const value = deal.value ? parseFloat(deal.value) : 0;
      return sum + value;
    }, 0);

    const wonDeals = allDeals.filter((deal) => deal.stage === "closed-won");
    const wonValue = wonDeals.reduce((sum, deal) => {
      const value = deal.value ? parseFloat(deal.value) : 0;
      return sum + value;
    }, 0);

    return {
      totalDeals,
      dealsByStage,
      totalValue,
      wonValue,
    };
  }),
});
