import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const facultyTable = pgTable("faculty", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  departmentId: integer("department_id").notNull(),
  designation: text("designation"),
  email: text("email"),
  phone: text("phone"),
  collegeName: text("college_name"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  photoUrl: text("photo_url"),
  accountStatus: text("account_status").notNull().default("active"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  registrationIp: text("registration_ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFacultySchema = createInsertSchema(facultyTable).omit({ id: true, createdAt: true });
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type FacultyMember = typeof facultyTable.$inferSelect;
