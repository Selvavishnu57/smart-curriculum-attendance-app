import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  status: text("status").notNull(), // present, absent, late
  method: text("method").notNull().default("manual"), // manual, qr, face
  markedAt: timestamp("marked_at", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true, markedAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
