import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const contacts = createTable(
  "contact",
  (d) => ({
    id: d.text("id").primaryKey(),
    firstName: d.text("first_name"),
    lastName: d.text("last_name"),
    email: d.text("email"),
    phone: d.text("phone"),
    company: d.text("company"),
    jobTitle: d.text("job_title"),
    notes: d.text("notes"),
    tags: d.text("tags").array(),
    customFields: d.jsonb("custom_fields").$type<Record<string, unknown>>(),
    createdById: d
      .text("created_by_id")
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("contact_created_by_idx").on(t.createdById),
    index("contact_email_idx").on(t.email),
    index("contact_company_idx").on(t.company),
  ],
);

export const deals = createTable(
  "deal",
  (d) => ({
    id: d.text("id").primaryKey(),
    name: d.text("name").notNull(),
    stage: d
      .text("stage")
      .$default(() => "lead")
      .notNull(),
    value: d.text("value"), // Store as text to handle currency formatting, or could be numeric
    currency: d.text("currency").$default(() => "NZD"),
    expectedCloseDate: d.timestamp("expected_close_date", {
      withTimezone: true,
    }),
    notes: d.text("notes"),
    customFields: d.jsonb("custom_fields").$type<Record<string, unknown>>(),
    createdById: d
      .text("created_by_id")
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("deal_created_by_idx").on(t.createdById),
    index("deal_stage_idx").on(t.stage),
    index("deal_name_idx").on(t.name),
  ],
);

// Junction table for many-to-many relationship between deals and contacts
export const dealContacts = createTable(
  "deal_contact",
  (d) => ({
    id: d.text("id").primaryKey(),
    dealId: d
      .text("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    contactId: d
      .text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("deal_contact_deal_idx").on(t.dealId),
    index("deal_contact_contact_idx").on(t.contactId),
  ],
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
  contacts: many(contacts),
  deals: many(deals),
  customFieldDefinitions: many(customFieldDefinitions),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const contactRelations = relations(contacts, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [contacts.createdById],
    references: [user.id],
  }),
  dealContacts: many(dealContacts),
}));

export const dealRelations = relations(deals, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [deals.createdById],
    references: [user.id],
  }),
  dealContacts: many(dealContacts),
}));

export const dealContactRelations = relations(dealContacts, ({ one }) => ({
  deal: one(deals, {
    fields: [dealContacts.dealId],
    references: [deals.id],
  }),
  contact: one(contacts, {
    fields: [dealContacts.contactId],
    references: [contacts.id],
  }),
}));

// Custom Field Definitions - stores metadata about user-created custom fields
export const customFieldDefinitions = createTable(
  "custom_field_definition",
  (d) => ({
    id: d.text("id").primaryKey(),
    entityType: d.text("entity_type").notNull(), // "contact" or "deal"
    fieldKey: d.text("field_key").notNull(), // unique key for the field (e.g., "custom_1", "budget")
    label: d.text("label").notNull(), // display name (e.g., "Budget", "Priority")
    fieldType: d.text("field_type").notNull(), // "text", "number", "date", "boolean"
    createdById: d
      .text("created_by_id")
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("custom_field_entity_idx").on(t.entityType, t.createdById),
    index("custom_field_key_idx").on(t.fieldKey, t.entityType, t.createdById),
  ],
);

export const customFieldDefinitionRelations = relations(
  customFieldDefinitions,
  ({ one }) => ({
    createdBy: one(user, {
      fields: [customFieldDefinitions.createdById],
      references: [user.id],
    }),
  }),
);
