import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, attendanceTable, studentsTable, subjectsTable, departmentsTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /attendance/today-summary
router.get("/attendance/today-summary", requireAuth, async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const records = await db.select({
    status: attendanceTable.status,
    studentId: attendanceTable.studentId,
    departmentId: studentsTable.departmentId,
    departmentName: departmentsTable.name,
  }).from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .leftJoin(departmentsTable, eq(studentsTable.departmentId, departmentsTable.id))
    .where(eq(attendanceTable.date, today));

  const present = records.filter(r => r.status === "present" || r.status === "late").length;
  const absent = records.filter(r => r.status === "absent").length;
  const late = records.filter(r => r.status === "late").length;
  const total = records.length;

  const deptMap = new Map<string, { present: number; absent: number; total: number }>();
  for (const r of records) {
    const deptName = r.departmentName ?? "Unknown";
    const d = deptMap.get(deptName) ?? { present: 0, absent: 0, total: 0 };
    d.total++;
    if (r.status === "present" || r.status === "late") d.present++;
    else d.absent++;
    deptMap.set(deptName, d);
  }
  const byDepartment = Array.from(deptMap.entries()).map(([departmentName, d]) => ({
    departmentName, ...d, percentage: d.total > 0 ? Math.round((d.present / d.total) * 100 * 10) / 10 : 0,
  }));

  res.json({ date: today, totalStudents: total, present, absent, late, percentage: total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0, byDepartment });
});

// GET /attendance/low-attendance
router.get("/attendance/low-attendance", requireAuth, async (req, res): Promise<void> => {
  const threshold = parseInt((req.query.threshold as string) ?? "75", 10);
  const students = await db.select({
    id: studentsTable.id, name: studentsTable.name, registerNumber: studentsTable.registerNumber,
    departmentId: studentsTable.departmentId, departmentName: departmentsTable.name,
    year: studentsTable.year, section: studentsTable.section,
  }).from(studentsTable).leftJoin(departmentsTable, eq(studentsTable.departmentId, departmentsTable.id));

  const results = [];
  for (const s of students) {
    const [agg] = await db.select({
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
    }).from(attendanceTable).where(eq(attendanceTable.studentId, s.id));
    const total = Number(agg?.total ?? 0);
    const present = Number(agg?.present ?? 0);
    if (total > 0) {
      const pct = Math.round((present / total) * 100 * 10) / 10;
      if (pct < threshold) {
        results.push({ studentId: s.id, name: s.name, registerNumber: s.registerNumber, departmentName: s.departmentName ?? "Unknown", year: s.year, section: s.section, percentage: pct });
      }
    }
  }
  results.sort((a, b) => a.percentage - b.percentage);
  res.json(results);
});

// GET /attendance
router.get("/attendance", requireAuth, async (req, res): Promise<void> => {
  const { studentId, subjectId, date, month, department, year, section, page = "1", limit = "50" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (studentId) conditions.push(eq(attendanceTable.studentId, parseInt(studentId, 10)));
  if (subjectId) conditions.push(eq(attendanceTable.subjectId, parseInt(subjectId, 10)));
  if (date) conditions.push(eq(attendanceTable.date, date));
  if (month) conditions.push(sql`to_char(${attendanceTable.date}::date, 'YYYY-MM') = ${month}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(attendanceTable).where(where);
  const records = await db.select({
    id: attendanceTable.id, studentId: attendanceTable.studentId,
    studentName: studentsTable.name, registerNumber: studentsTable.registerNumber,
    subjectId: attendanceTable.subjectId, subjectName: subjectsTable.name,
    date: attendanceTable.date, status: attendanceTable.status, method: attendanceTable.method,
    markedAt: attendanceTable.markedAt, notes: attendanceTable.notes,
  }).from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .leftJoin(subjectsTable, eq(attendanceTable.subjectId, subjectsTable.id))
    .where(where).orderBy(attendanceTable.markedAt).limit(limitNum).offset(offset);

  res.json({ records, total: Number(countRow?.count ?? 0), page: pageNum, limit: limitNum });
});

// POST /attendance
router.post("/attendance", requireAuth, async (req, res): Promise<void> => {
  const { studentId, subjectId, date, status, method, notes } = req.body;
  if (!studentId || !subjectId || !date || !status) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }
  const [record] = await db.insert(attendanceTable).values({ studentId, subjectId, date, status, method: method ?? "manual", notes }).returning();
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, record.studentId));
  const [subj] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, record.subjectId));
  res.status(201).json({ ...record, studentName: s?.name ?? null, registerNumber: s?.registerNumber ?? null, subjectName: subj?.name ?? null });
});

// POST /attendance/bulk
router.post("/attendance/bulk", requireAuth, async (req, res): Promise<void> => {
  const { subjectId, date, method, records } = req.body;
  if (!subjectId || !date || !records || !Array.isArray(records)) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }
  let created = 0;
  let updated = 0;
  for (const r of records) {
    const existing = await db.select().from(attendanceTable).where(
      and(eq(attendanceTable.studentId, r.studentId), eq(attendanceTable.subjectId, subjectId), eq(attendanceTable.date, date))
    );
    if (existing.length > 0) {
      await db.update(attendanceTable).set({ status: r.status, method: method ?? "manual" }).where(eq(attendanceTable.id, existing[0].id));
      updated++;
    } else {
      await db.insert(attendanceTable).values({ studentId: r.studentId, subjectId, date, status: r.status, method: method ?? "manual" });
      created++;
    }
  }
  res.status(201).json({ created, updated, total: created + updated });
});

// PATCH /attendance/:id
router.patch("/attendance/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, notes } = req.body;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  const [record] = await db.update(attendanceTable).set(updates).where(eq(attendanceTable.id, id)).returning();
  if (!record) { res.status(404).json({ error: "Attendance record not found" }); return; }
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, record.studentId));
  const [subj] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, record.subjectId));
  res.json({ ...record, studentName: s?.name ?? null, registerNumber: s?.registerNumber ?? null, subjectName: subj?.name ?? null });
});

export default router;
