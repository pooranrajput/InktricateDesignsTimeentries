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

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // 'admin' or 'employee'
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task categories table
export const taskCategories = pgTable("task_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  color: varchar("color").default("#3B82F6"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User task assignments table
export const userTaskAssignments = pgTable("user_task_assignments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  taskCategoryId: integer("task_category_id").notNull().references(() => taskCategories.id),
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
  taskCategoryId: integer("task_category_id").references(() => taskCategories.id),
  notes: text("notes"),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const updateTimeEntrySchema = insertTimeEntrySchema.partial().extend({
  id: z.number(),
});

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
