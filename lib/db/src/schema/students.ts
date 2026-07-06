import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  registerNumber: text("register_number").notNull().unique(),
  name: text("name").notNull(),
  departmentId: integer("department_id").notNull(),
  year: integer("year").notNull(),
  section: text("section").notNull(),
  email: text("email"),
  phone: text("phone"),
  collegeName: text("college_name"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  photoUrl: text("photo_url"),
  accountStatus: text("account_status").notNull().default("active"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  registrationIp: text("registration_ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
