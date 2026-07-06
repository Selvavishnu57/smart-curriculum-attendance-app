import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timetableTable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  facultyId: integer("faculty_id"),
  department: text("department").notNull(),
  year: integer("year").notNull(),
  section: text("section").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // Monday..Saturday
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(),
  room: text("room"),
});

export const insertTimetableSchema = createInsertSchema(timetableTable).omit({ id: true });
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;
export type TimetableEntry = typeof timetableTable.$inferSelect;
