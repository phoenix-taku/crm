import { z } from "zod";
import { eq, desc, or, ilike, and, count } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { contacts } from "~/server/db/schema";
import { randomUUID } from "crypto";

export const contactRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db.query.contacts.findMany({
        where: (contacts, { eq, and, or, ilike }) => {
          const conditions = [eq(contacts.createdById, ctx.session.user.id)];
          if (input?.search) {
            const searchTerm = `%${input.search}%`;
            const searchCondition = or(
              ilike(contacts.firstName, searchTerm),
              ilike(contacts.lastName, searchTerm),
              ilike(contacts.email, searchTerm),
              ilike(contacts.company, searchTerm),
            )!;
            conditions.push(searchCondition);
          }
          return and(...conditions);
        },
        orderBy: [desc(contacts.createdAt)],
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
      });

      // Optimized count query
      const whereConditions = [eq(contacts.createdById, ctx.session.user.id)];
      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        const searchCondition = or(
          ilike(contacts.firstName, searchTerm),
          ilike(contacts.lastName, searchTerm),
          ilike(contacts.email, searchTerm),
          ilike(contacts.company, searchTerm),
        )!;
        whereConditions.push(searchCondition);
      }

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(contacts)
        .where(and(...whereConditions));
      const total = totalResult?.count ?? 0;

      return {
        contacts: results,
        total,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.db.query.contacts.findFirst({
        where: (contacts, { eq, and }) =>
          and(
            eq(contacts.id, input.id),
            eq(contacts.createdById, ctx.session.user.id),
          ),
      });

      if (!contact) {
        throw new Error("Contact not found");
      }

      return contact;
    }),

  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = randomUUID();

      const [contact] = await ctx.db
        .insert(contacts)
        .values({
          id,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          email: input.email && input.email !== "" ? input.email : null,
          phone: input.phone ?? null,
          company: input.company ?? null,
          jobTitle: input.jobTitle ?? null,
          notes: input.notes ?? null,
          tags: input.tags ?? null,
          createdById: ctx.session.user.id,
        })
        .returning();

      return contact;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the contact belongs to the user
      const existing = await ctx.db.query.contacts.findFirst({
        where: (contacts, { eq, and }) =>
          and(
            eq(contacts.id, input.id),
            eq(contacts.createdById, ctx.session.user.id),
          ),
      });

      if (!existing) {
        throw new Error("Contact not found");
      }

      const [contact] = await ctx.db
        .update(contacts)
        .set({
          firstName: input.firstName ?? existing.firstName,
          lastName: input.lastName ?? existing.lastName,
          email:
            input.email !== undefined
              ? input.email === ""
                ? null
                : input.email
              : existing.email,
          phone: input.phone ?? existing.phone,
          company: input.company ?? existing.company,
          jobTitle: input.jobTitle ?? existing.jobTitle,
          notes: input.notes ?? existing.notes,
          tags: input.tags ?? existing.tags,
        })
        .where(eq(contacts.id, input.id))
        .returning();

      return contact;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First verify the contact belongs to the user
      const existing = await ctx.db.query.contacts.findFirst({
        where: (contacts, { eq, and }) =>
          and(
            eq(contacts.id, input.id),
            eq(contacts.createdById, ctx.session.user.id),
          ),
      });

      if (!existing) {
        throw new Error("Contact not found");
      }

      await ctx.db.delete(contacts).where(eq(contacts.id, input.id));

      return { success: true };
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const searchTerm = `%${input.query}%`;

      const results = await ctx.db.query.contacts.findMany({
        where: (contacts, { eq, and, or, ilike }) => {
          const searchCondition = or(
            ilike(contacts.firstName, searchTerm),
            ilike(contacts.lastName, searchTerm),
            ilike(contacts.email, searchTerm),
            ilike(contacts.phone, searchTerm),
            ilike(contacts.company, searchTerm),
            ilike(contacts.jobTitle, searchTerm),
          )!;
          return and(
            eq(contacts.createdById, ctx.session.user.id),
            searchCondition,
          );
        },
        orderBy: [desc(contacts.createdAt)],
        limit: input.limit,
      });

      return results;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalResult] = await ctx.db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.createdById, ctx.session.user.id));

    const total = totalResult?.count ?? 0;

    // Get contacts with companies
    const contactsWithCompanies = await ctx.db.query.contacts.findMany({
      where: (contacts, { eq, and, isNotNull }) =>
        and(
          eq(contacts.createdById, ctx.session.user.id),
          isNotNull(contacts.company),
        ),
      });

    const companiesCount = new Set(
      contactsWithCompanies
        .map((c) => c.company)
        .filter((c): c is string => c !== null),
    ).size;

    // Get contacts created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentResult] = await ctx.db
      .select({ count: count() })
      .from(contacts)
      .where(
        and(
          eq(contacts.createdById, ctx.session.user.id),
          // Note: This would need a proper date comparison in production
        ),
      );

    return {
      totalContacts: total,
      totalCompanies: companiesCount,
      recentContacts: 0, // Placeholder - would need proper date filtering
    };
  }),
});
