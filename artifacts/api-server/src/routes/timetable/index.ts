import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, timetableTable, subjectsTable, facultyTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getCurrentDay(): string {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

function isCurrentSlot(start: string, end: string): boolean {
  const now = new Date();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= sh * 60 + sm && nowMins <= eh * 60 + em;
}

async function enrichEntry(entry: typeof timetableTable.$inferSelect) {
  const [subj] = entry.subjectId ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, entry.subjectId)) : [null];
  const [fac] = entry.facultyId ? await db.select().from(facultyTable).where(eq(facultyTable.id, entry.facultyId)) : [null];
  return {
    ...entry,
    subjectName: subj?.name ?? null,
    subjectCode: subj?.code ?? null,
    facultyName: fac?.name ?? null,
    isCurrent: isCurrentSlot(entry.startTime, entry.endTime) && entry.dayOfWeek === getCurrentDay(),
  };
}

// GET /timetable/today
router.get("/timetable/today", requireAuth, async (req, res): Promise<void> => {
  const { department, year, section } = req.query as Record<string, string>;
  const today = getCurrentDay();
  const conditions = [eq(timetableTable.dayOfWeek, today)];
  if (department) conditions.push(eq(timetableTable.department, department));
  if (year) conditions.push(eq(timetableTable.year, parseInt(year, 10)));
  if (section) conditions.push(eq(timetableTable.section, section));
  const entries = await db.select().from(timetableTable).where(and(...conditions)).orderBy(timetableTable.startTime);
  const enriched = await Promise.all(entries.map(enrichEntry));
  res.json(enriched);
});

// GET /timetable
router.get("/timetable", requireAuth, async (req, res): Promise<void> => {
  const { department, year, section, dayOfWeek } = req.query as Record<string, string>;
  const conditions = [];
  if (department) conditions.push(eq(timetableTable.department, department));
  if (year) conditions.push(eq(timetableTable.year, parseInt(year, 10)));
  if (section) conditions.push(eq(timetableTable.section, section));
  if (dayOfWeek) conditions.push(eq(timetableTable.dayOfWeek, dayOfWeek));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const entries = await db.select().from(timetableTable).where(where).orderBy(timetableTable.dayOfWeek, timetableTable.startTime);
  const enriched = await Promise.all(entries.map(enrichEntry));
  res.json(enriched);
});

// POST /timetable
router.post("/timetable", requireAuth, async (req, res): Promise<void> => {
  const { subjectId, facultyId, department, year, section, dayOfWeek, startTime, endTime, room } = req.body;
  if (!subjectId || !department || !year || !section || !dayOfWeek || !startTime || !endTime) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }
  const [entry] = await db.insert(timetableTable).values({ subjectId, facultyId, department, year, section, dayOfWeek, startTime, endTime, room }).returning();
  res.status(201).json(await enrichEntry(entry));
});

// PATCH /timetable/:id
router.patch("/timetable/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { subjectId, facultyId, dayOfWeek, startTime, endTime, room } = req.body;
  const updates: Record<string, unknown> = {};
  if (subjectId !== undefined) updates.subjectId = subjectId;
  if (facultyId !== undefined) updates.facultyId = facultyId;
  if (dayOfWeek) updates.dayOfWeek = dayOfWeek;
  if (startTime) updates.startTime = startTime;
  if (endTime) updates.endTime = endTime;
  if (room !== undefined) updates.room = room;
  const [entry] = await db.update(timetableTable).set(updates).where(eq(timetableTable.id, id)).returning();
  if (!entry) { res.status(404).json({ error: "Timetable entry not found" }); return; }
  res.json(await enrichEntry(entry));
});

// DELETE /timetable/:id
router.delete("/timetable/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [entry] = await db.delete(timetableTable).where(eq(timetableTable.id, id)).returning();
  if (!entry) { res.status(404).json({ error: "Timetable entry not found" }); return; }
  res.sendStatus(204);
});

export default router;
