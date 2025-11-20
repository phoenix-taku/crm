import { z } from "zod";
import { eq, desc, or, ilike, and, count, sql } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { contacts } from "~/server/db/schema";
import { randomUUID } from "crypto";

const buildSearchCondition = (search: string | undefined) => {
  if (!search) return null;
  const searchTerm = `%${search}%`;
  return or(
    ilike(contacts.firstName, searchTerm),
    ilike(contacts.lastName, searchTerm),
    ilike(contacts.email, searchTerm),
    ilike(contacts.company, searchTerm),
  )!;
};

export const contactRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          columnFilters: z
            .array(
              z.object({
                columnId: z.string(),
                columnType: z.enum(["text", "number", "date", "enum"]),
                operator: z.string(),
                value: z.string(),
                value2: z.string().optional(),
              }),
            )
            .optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const searchCondition = buildSearchCondition(input?.search);

      const whereConditions = [eq(contacts.createdById, userId)];
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }

      // Add column filter conditions
      if (input?.columnFilters && input.columnFilters.length > 0) {
        for (const filter of input.columnFilters) {
          switch (filter.columnId) {
            case "name":
              if (filter.columnType === "text") {
                const firstNameTerm =
                  filter.operator === "contains" || filter.operator === "equals"
                    ? `%${filter.value}%`
                    : filter.operator === "startsWith"
                      ? `${filter.value}%`
                      : filter.operator === "endsWith"
                        ? `%${filter.value}`
                        : `%${filter.value}%`;
                const lastNameTerm = firstNameTerm;
                whereConditions.push(
                  sql`(${contacts.firstName} ILIKE ${firstNameTerm} OR ${contacts.lastName} ILIKE ${lastNameTerm})`,
                );
              }
              break;
            case "email":
              if (filter.columnType === "text") {
                const searchTerm =
                  filter.operator === "contains" || filter.operator === "equals"
                    ? `%${filter.value}%`
                    : filter.operator === "startsWith"
                      ? `${filter.value}%`
                      : filter.operator === "endsWith"
                        ? `%${filter.value}`
                        : `%${filter.value}%`;
                whereConditions.push(ilike(contacts.email, searchTerm));
              }
              break;
            case "phone":
              if (filter.columnType === "text") {
                const searchTerm =
                  filter.operator === "contains" || filter.operator === "equals"
                    ? `%${filter.value}%`
                    : filter.operator === "startsWith"
                      ? `${filter.value}%`
                      : filter.operator === "endsWith"
                        ? `%${filter.value}`
                        : `%${filter.value}%`;
                whereConditions.push(ilike(contacts.phone, searchTerm));
              }
              break;
            case "company":
              if (filter.columnType === "text") {
                const searchTerm =
                  filter.operator === "contains" || filter.operator === "equals"
                    ? `%${filter.value}%`
                    : filter.operator === "startsWith"
                      ? `${filter.value}%`
                      : filter.operator === "endsWith"
                        ? `%${filter.value}`
                        : `%${filter.value}%`;
                whereConditions.push(ilike(contacts.company, searchTerm));
              }
              break;
            case "jobTitle":
              if (filter.columnType === "text") {
                const searchTerm =
                  filter.operator === "contains" || filter.operator === "equals"
                    ? `%${filter.value}%`
                    : filter.operator === "startsWith"
                      ? `${filter.value}%`
                      : filter.operator === "endsWith"
                        ? `%${filter.value}`
                        : `%${filter.value}%`;
                whereConditions.push(ilike(contacts.jobTitle, searchTerm));
              }
              break;
            case "createdAt":
            case "updatedAt":
              if (filter.columnType === "date") {
                const filterDate = new Date(filter.value);
                if (!isNaN(filterDate.getTime())) {
                  const dateColumn =
                    filter.columnId === "createdAt"
                      ? contacts.createdAt
                      : contacts.updatedAt;
                  switch (filter.operator) {
                    case "before":
                      whereConditions.push(sql`${dateColumn} < ${filterDate}`);
                      break;
                    case "after":
                      whereConditions.push(sql`${dateColumn} > ${filterDate}`);
                      break;
                    case "on":
                      const startOfDay = new Date(filterDate);
                      startOfDay.setHours(0, 0, 0, 0);
                      const endOfDay = new Date(filterDate);
                      endOfDay.setHours(23, 59, 59, 999);
                      whereConditions.push(
                        sql`${dateColumn} >= ${startOfDay} AND ${dateColumn} <= ${endOfDay}`,
                      );
                      break;
                    case "between":
                      if (filter.value2) {
                        const date1 = new Date(filter.value);
                        const date2 = new Date(filter.value2);
                        whereConditions.push(
                          sql`${dateColumn} >= ${date1} AND ${dateColumn} <= ${date2}`,
                        );
                      }
                      break;
                  }
                }
              }
              break;
            default:
              // Custom field filter
              if (filter.columnType === "number") {
                const filterValue = parseFloat(filter.value);
                if (!isNaN(filterValue)) {
                  switch (filter.operator) {
                    case "gt":
                      whereConditions.push(
                        sql`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) > ${filterValue}`,
                      );
                      break;
                    case "lt":
                      whereConditions.push(
                        sql`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) < ${filterValue}`,
                      );
                      break;
                    case "gte":
                      whereConditions.push(
                        sql`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) >= ${filterValue}`,
                      );
                      break;
                    case "lte":
                      whereConditions.push(
                        sql`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) <= ${filterValue}`,
                      );
                      break;
                    case "eq":
                      whereConditions.push(
                        sql`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) = ${filterValue}`,
                      );
                      break;
                  }
                }
              } else if (filter.columnType === "text") {
                const searchTerm =
                  filter.operator === "contains" || filter.operator === "equals"
                    ? `%${filter.value}%`
                    : filter.operator === "startsWith"
                      ? `${filter.value}%`
                      : filter.operator === "endsWith"
                        ? `%${filter.value}`
                        : `%${filter.value}%`;
                whereConditions.push(
                  sql`${contacts.customFields}->>${filter.columnId} ILIKE ${searchTerm}`,
                );
              }
              break;
          }
        }
      }

      const rawWhereCondition = and(...whereConditions);

      const [results, totalResult] = await Promise.all([
        ctx.db.query.contacts.findMany({
          where: (contacts, { eq, and, or, ilike, sql: sqlFn }) => {
            const conditions = [eq(contacts.createdById, userId)];
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
            // Add column filter conditions
            if (input?.columnFilters && input.columnFilters.length > 0) {
              for (const filter of input.columnFilters) {
                switch (filter.columnId) {
                  case "name":
                    if (filter.columnType === "text") {
                      const firstNameTerm =
                        filter.operator === "contains" ||
                        filter.operator === "equals"
                          ? `%${filter.value}%`
                          : filter.operator === "startsWith"
                            ? `${filter.value}%`
                            : filter.operator === "endsWith"
                              ? `%${filter.value}`
                              : `%${filter.value}%`;
                      const lastNameTerm = firstNameTerm;
                      conditions.push(
                        sqlFn`(${contacts.firstName} ILIKE ${firstNameTerm} OR ${contacts.lastName} ILIKE ${lastNameTerm})`,
                      );
                    }
                    break;
                  case "email":
                    if (filter.columnType === "text") {
                      const searchTerm =
                        filter.operator === "contains" ||
                        filter.operator === "equals"
                          ? `%${filter.value}%`
                          : filter.operator === "startsWith"
                            ? `${filter.value}%`
                            : filter.operator === "endsWith"
                              ? `%${filter.value}`
                              : `%${filter.value}%`;
                      conditions.push(ilike(contacts.email, searchTerm));
                    }
                    break;
                  case "phone":
                    if (filter.columnType === "text") {
                      const searchTerm =
                        filter.operator === "contains" ||
                        filter.operator === "equals"
                          ? `%${filter.value}%`
                          : filter.operator === "startsWith"
                            ? `${filter.value}%`
                            : filter.operator === "endsWith"
                              ? `%${filter.value}`
                              : `%${filter.value}%`;
                      conditions.push(ilike(contacts.phone, searchTerm));
                    }
                    break;
                  case "company":
                    if (filter.columnType === "text") {
                      const searchTerm =
                        filter.operator === "contains" ||
                        filter.operator === "equals"
                          ? `%${filter.value}%`
                          : filter.operator === "startsWith"
                            ? `${filter.value}%`
                            : filter.operator === "endsWith"
                              ? `%${filter.value}`
                              : `%${filter.value}%`;
                      conditions.push(ilike(contacts.company, searchTerm));
                    }
                    break;
                  case "jobTitle":
                    if (filter.columnType === "text") {
                      const searchTerm =
                        filter.operator === "contains" ||
                        filter.operator === "equals"
                          ? `%${filter.value}%`
                          : filter.operator === "startsWith"
                            ? `${filter.value}%`
                            : filter.operator === "endsWith"
                              ? `%${filter.value}`
                              : `%${filter.value}%`;
                      conditions.push(ilike(contacts.jobTitle, searchTerm));
                    }
                    break;
                  case "createdAt":
                  case "updatedAt":
                    if (filter.columnType === "date") {
                      const filterDate = new Date(filter.value);
                      if (!isNaN(filterDate.getTime())) {
                        const dateColumn =
                          filter.columnId === "createdAt"
                            ? contacts.createdAt
                            : contacts.updatedAt;
                        switch (filter.operator) {
                          case "before":
                            conditions.push(
                              sqlFn`${dateColumn} < ${filterDate}`,
                            );
                            break;
                          case "after":
                            conditions.push(
                              sqlFn`${dateColumn} > ${filterDate}`,
                            );
                            break;
                          case "on":
                            const startOfDay = new Date(filterDate);
                            startOfDay.setHours(0, 0, 0, 0);
                            const endOfDay = new Date(filterDate);
                            endOfDay.setHours(23, 59, 59, 999);
                            conditions.push(
                              sqlFn`${dateColumn} >= ${startOfDay} AND ${dateColumn} <= ${endOfDay}`,
                            );
                            break;
                          case "between":
                            if (filter.value2) {
                              const date1 = new Date(filter.value);
                              const date2 = new Date(filter.value2);
                              conditions.push(
                                sqlFn`${dateColumn} >= ${date1} AND ${dateColumn} <= ${date2}`,
                              );
                            }
                            break;
                        }
                      }
                    }
                    break;
                  default:
                    // Custom field filter
                    if (filter.columnType === "number") {
                      const filterValue = parseFloat(filter.value);
                      if (!isNaN(filterValue)) {
                        switch (filter.operator) {
                          case "gt":
                            conditions.push(
                              sqlFn`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) > ${filterValue}`,
                            );
                            break;
                          case "lt":
                            conditions.push(
                              sqlFn`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) < ${filterValue}`,
                            );
                            break;
                          case "gte":
                            conditions.push(
                              sqlFn`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) >= ${filterValue}`,
                            );
                            break;
                          case "lte":
                            conditions.push(
                              sqlFn`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) <= ${filterValue}`,
                            );
                            break;
                          case "eq":
                            conditions.push(
                              sqlFn`CAST(${contacts.customFields}->>${filter.columnId} AS NUMERIC) = ${filterValue}`,
                            );
                            break;
                        }
                      }
                    } else if (filter.columnType === "text") {
                      const searchTerm =
                        filter.operator === "contains" ||
                        filter.operator === "equals"
                          ? `%${filter.value}%`
                          : filter.operator === "startsWith"
                            ? `${filter.value}%`
                            : filter.operator === "endsWith"
                              ? `%${filter.value}`
                              : `%${filter.value}%`;
                      conditions.push(
                        sqlFn`${contacts.customFields}->>${filter.columnId} ILIKE ${searchTerm}`,
                      );
                    }
                    break;
                }
              }
            }
            return and(...conditions);
          },
          orderBy: [desc(contacts.createdAt)],
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        }),
        ctx.db
          .select({ count: count() })
          .from(contacts)
          .where(rawWhereCondition)
          .then((result) => result[0]),
      ]);

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
        firstName: z.string().min(1).optional().or(z.literal("")),
        lastName: z.string().min(1).optional().or(z.literal("")),
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

  getDeals: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // First verify the contact belongs to the user
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

      // Get all deal-contact relationships for this contact
      const dealContactRelations = await ctx.db.query.dealContacts.findMany({
        where: (dealContacts, { eq }) => eq(dealContacts.contactId, input.id),
        with: {
          deal: true,
        },
      });

      // Extract deals from relationships, filter by user ownership, and remove nulls
      const associatedDeals = dealContactRelations
        .map((dc) => dc.deal)
        .filter(
          (deal): deal is NonNullable<typeof deal> =>
            deal !== null && deal.createdById === ctx.session.user.id,
        );

      return associatedDeals;
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
    
    const [] = await ctx.db
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
