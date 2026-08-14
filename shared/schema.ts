import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  date,
  time,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique(),
  password: varchar("password"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  homeAddress: text("home_address"),
  inktricateStartDate: date("inktricate_start_date"),
  role: varchar("role").notNull().default("employee"), // 'admin' or 'employee'
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }), // Auto-generate bills for this amount monthly
  isActive: boolean("is_active").notNull().default(true),
  mustResetPassword: boolean("must_reset_password").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // QuickBooks integration fields
  quickbooksCustomerId: varchar("quickbooks_customer_id"), // QB Customer/Vendor ID
  quickbooksItemId: varchar("quickbooks_item_id"), // QB Service Item ID
  quickbooksVendorId: varchar("quickbooks_vendor_id"), // QB Vendor ID for bill creation
});

// Task categories table
export const taskCategories = pgTable("task_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  color: varchar("color").default("#000000"),
  defaultHourlyRate: decimal("default_hourly_rate", { precision: 8, scale: 2 }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User task assignments table with task-specific hourly rates
export const userTaskAssignments = pgTable("user_task_assignments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  taskCategoryId: integer("task_category_id").notNull().references(() => taskCategories.id),
  taskSpecificHourlyRate: decimal("task_specific_hourly_rate", { precision: 8, scale: 2 }), // Override rate for specific tasks
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
});

// Monthly payroll status table
export const monthlyPayroll = pgTable("monthly_payroll", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalHours: decimal("total_hours", { precision: 8, scale: 2 }).notNull(),
  grossPay: decimal("gross_pay", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, paid
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  quickbooksBillId: varchar("quickbooks_bill_id"), // QB Bill ID for tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  project: varchar("project").notNull(),
  clientName: varchar("client_name"),
  taskCategoryId: integer("task_category_id").references(() => taskCategories.id),
  notes: text("notes"),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // QuickBooks integration fields
  quickbooksTimeActivityId: varchar("quickbooks_time_activity_id"), // QB Time Activity ID
  quickbooksInvoiceId: varchar("quickbooks_invoice_id"), // QB Invoice ID if billed
  isQuickbooksBillable: boolean("is_quickbooks_billable").default(true),
  quickbooksStatus: varchar("quickbooks_status").default("unbilled"), // 'unbilled', 'billed', 'paid'
});

// QuickBooks integration configuration
export const quickbooksConfig = pgTable("quickbooks_config", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id").notNull().unique(), // QB Company ID
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: timestamp("token_expiry").notNull(),
  sandbox: boolean("sandbox").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Database-stored backups (survives Replit redeploys)
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  trigger: varchar("trigger").notNull(),
  data: jsonb("data").notNull(),
  counts: jsonb("counts"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  timeEntries: many(timeEntries),
  taskAssignments: many(userTaskAssignments),
  payrollRecords: many(monthlyPayroll),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  taskCategory: one(taskCategories, {
    fields: [timeEntries.taskCategoryId],
    references: [taskCategories.id],
  }),
}));

export const taskCategoriesRelations = relations(taskCategories, ({ many }) => ({
  assignments: many(userTaskAssignments),
  timeEntries: many(timeEntries),
}));

export const userTaskAssignmentsRelations = relations(userTaskAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userTaskAssignments.userId],
    references: [users.id],
  }),
  taskCategory: one(taskCategories, {
    fields: [userTaskAssignments.taskCategoryId],
    references: [taskCategories.id],
  }),
  assignedByUser: one(users, {
    fields: [userTaskAssignments.assignedBy],
    references: [users.id],
  }),
}));

export const monthlyPayrollRelations = relations(monthlyPayroll, ({ one }) => ({
  user: one(users, {
    fields: [monthlyPayroll.userId],
    references: [users.id],
  }),
  paidByUser: one(users, {
    fields: [monthlyPayroll.paidBy],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = insertUserSchema.partial().extend({
  id: z.string(),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalHours: true,
});

export const updateTimeEntrySchema = insertTimeEntrySchema.partial();

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type TimeEntryWithUser = TimeEntry & {
  user: User;
};

// Project types for time entries
export const PROJECT_TYPES = [
  "wedding-invites",
  "place-cards", 
  "wooden-fixtures",
  "design-consultation",
  "production",
] as const;

export type ProjectType = typeof PROJECT_TYPES[number];

// ============================================================================
// Load-out feature: event packing lists and production tracking
// Built from Dubsado contract PDFs. See docs/LOADOUT_SPEC.md.
// Additive only — nothing above this line changes.
// ============================================================================

// An event = one wedding job, imported from a contract/invoice
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  client: text("client").notNull(), // "Rajitha + Ambar"
  invoiceNo: text("invoice_no"), // "306"
  eventDate: date("event_date"),
  sourceFile: text("source_file"), // original PDF filename
  createdAt: timestamp("created_at").defaultNow(),
});

// A venue groups items within an event ("Home Puja", "Plaza")
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0), // document order
});

// A packable line item. stage is the index into the stage list (0-4).
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  qty: integer("qty").notNull().default(1),
  spec: text("spec"), // "3ft x 7ft, 3D lotuses, irregular shape"
  stage: integer("stage").notNull().default(0), // 0=Not started ... 4=Packed
  oversized: boolean("oversized").default(false),
  dependency: text("dependency"), // "Floral arrangement from Design House"
  needsCheck: boolean("needs_check").default(false), // venue assignment uncertain
  position: integer("position").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Day-of services (delivery/setup/breakdown) — scheduled, not packed
export const eventServices = pgTable("event_services", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // "Delivery / setup / breakdown - Plaza"
});

// Crew kit checklist state, per event. Composite PK on (eventId, line).
export const kitChecks = pgTable(
  "kit_checks",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    line: text("line").notNull(),
    checked: boolean("checked").default(false),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.line] })],
);

// Access control: which users can see and use the Load-out tab.
// Presence of a row grants access (tab-level). Admins are granted in code.
export const loadoutAccess = pgTable("loadout_access", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  assignedBy: varchar("assigned_by")
    .notNull()
    .references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Relations
export const eventsRelations = relations(events, ({ many }) => ({
  venues: many(venues),
  services: many(eventServices),
  kitChecks: many(kitChecks),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  event: one(events, {
    fields: [venues.eventId],
    references: [events.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  venue: one(venues, {
    fields: [items.venueId],
    references: [venues.id],
  }),
}));

export const eventServicesRelations = relations(eventServices, ({ one }) => ({
  event: one(events, {
    fields: [eventServices.eventId],
    references: [events.id],
  }),
}));

export const kitChecksRelations = relations(kitChecks, ({ one }) => ({
  event: one(events, {
    fields: [kitChecks.eventId],
    references: [events.id],
  }),
}));

export const loadoutAccessRelations = relations(loadoutAccess, ({ one }) => ({
  user: one(users, {
    fields: [loadoutAccess.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [loadoutAccess.assignedBy],
    references: [users.id],
  }),
}));

// Insert/validation schemas
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  updatedAt: true,
});

export const insertEventServiceSchema = createInsertSchema(eventServices).omit({
  id: true,
});

// Types
export type Event = typeof events.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Item = typeof items.$inferSelect;
export type EventService = typeof eventServices.$inferSelect;
export type KitCheck = typeof kitChecks.$inferSelect;
export type LoadoutAccess = typeof loadoutAccess.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertEventService = z.infer<typeof insertEventServiceSchema>;
