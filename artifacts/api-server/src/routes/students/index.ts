import { Router, type IRouter } from "express";
import { eq, and, ilike, sql } from "drizzle-orm";
import { db, studentsTable, departmentsTable, attendanceTable } from "@workspace/db";
import { requireAuth, requireRole } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /students
router.get("/students", requireAuth, async (req, res): Promise<void> => {
  const { department, year, section, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (year) conditions.push(eq(studentsTable.year, parseInt(year, 10)));
  if (section) conditions.push(eq(studentsTable.section, section));
  if (search) conditions.push(ilike(studentsTable.name, `%${search}%`));
  if (department) {
    const [dept] = await db.select().from(departmentsTable).where(ilike(departmentsTable.name, `%${department}%`));
    if (dept) conditions.push(eq(studentsTable.departmentId, dept.id));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(studentsTable).where(where);
  const students = await db.select({
    id: studentsTable.id,
    registerNumber: studentsTable.registerNumber,
    name: studentsTable.name,
    departmentId: studentsTable.departmentId,
    departmentName: departmentsTable.name,
    year: studentsTable.year,
    section: studentsTable.section,
    email: studentsTable.email,
    phone: studentsTable.phone,
    photoUrl: studentsTable.photoUrl,
    createdAt: studentsTable.createdAt,
  }).from(studentsTable)
    .leftJoin(departmentsTable, eq(studentsTable.departmentId, departmentsTable.id))
    .where(where)
    .orderBy(studentsTable.name)
    .limit(limitNum)
    .offset(offset);

  // Compute attendance percentage per student
  const studentsWithAttendance = await Promise.all(students.map(async (s) => {
    const [agg] = await db.select({
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
    }).from(attendanceTable).where(eq(attendanceTable.studentId, s.id));
    const total = Number(agg?.total ?? 0);
    const present = Number(agg?.present ?? 0);
    return { ...s, attendancePercentage: total > 0 ? Math.round((present / total) * 100 * 10) / 10 : null };
  }));

  res.json({ students: studentsWithAttendance, total: Number(countResult?.count ?? 0), page: pageNum, limit: limitNum });
});

// POST /students
router.post("/students", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const { registerNumber, name, departmentId, year, section, email, phone, photoUrl } = req.body;
  if (!registerNumber || !name || !departmentId || !year || !section) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }
  const [student] = await db.insert(studentsTable).values({ registerNumber, name, departmentId, year, section, email, phone, photoUrl }).returning();
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, student.departmentId));
  res.status(201).json({ ...student, departmentName: dept?.name ?? null, attendancePercentage: null });
});

// GET /students/:id
router.get("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [student] = await db.select({
    id: studentsTable.id, registerNumber: studentsTable.registerNumber, name: studentsTable.name,
    departmentId: studentsTable.departmentId, departmentName: departmentsTable.name,
    year: studentsTable.year, section: studentsTable.section, email: studentsTable.email,
    phone: studentsTable.phone, photoUrl: studentsTable.photoUrl, createdAt: studentsTable.createdAt,
  }).from(studentsTable).leftJoin(departmentsTable, eq(studentsTable.departmentId, departmentsTable.id)).where(eq(studentsTable.id, id));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }
  const [agg] = await db.select({
    total: sql<number>`count(*)`,
    present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
  }).from(attendanceTable).where(eq(attendanceTable.studentId, id));
  const total = Number(agg?.total ?? 0);
  const present = Number(agg?.present ?? 0);
  res.json({ ...student, attendancePercentage: total > 0 ? Math.round((present / total) * 100 * 10) / 10 : null });
});

// PATCH /students/:id
router.patch("/students/:id", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { registerNumber, name, departmentId, year, section, email, phone, photoUrl } = req.body;
  const updates: Record<string, unknown> = {};
  if (registerNumber) updates.registerNumber = registerNumber;
  if (name) updates.name = name;
  if (departmentId !== undefined) updates.departmentId = departmentId;
  if (year !== undefined) updates.year = year;
  if (section) updates.section = section;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (photoUrl !== undefined) updates.photoUrl = photoUrl;
  const [student] = await db.update(studentsTable).set(updates).where(eq(studentsTable.id, id)).returning();
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, student.departmentId));
  res.json({ ...student, departmentName: dept?.name ?? null, attendancePercentage: null });
});

// DELETE /students/:id
router.delete("/students/:id", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [student] = await db.delete(studentsTable).where(eq(studentsTable.id, id)).returning();
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }
  res.sendStatus(204);
});

// GET /students/:id/attendance-summary
router.get("/students/:id/attendance-summary", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const records = await db.select().from(attendanceTable).where(eq(attendanceTable.studentId, id));
  const total = records.length;
  const present = records.filter(r => r.status === "present" || r.status === "late").length;
  const absent = records.filter(r => r.status === "absent").length;
  const late = records.filter(r => r.status === "late").length;
  const percentage = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;

  // Group by subject
  const subjectMap = new Map<number, { total: number; present: number; absent: number; late: number }>();
  for (const r of records) {
    const s = subjectMap.get(r.subjectId) ?? { total: 0, present: 0, absent: 0, late: 0 };
    s.total++;
    if (r.status === "present" || r.status === "late") s.present++;
    if (r.status === "absent") s.absent++;
    if (r.status === "late") s.late++;
    subjectMap.set(r.subjectId, s);
  }

  const { subjectsTable } = await import("@workspace/db");
  const bySubject = await Promise.all(Array.from(subjectMap.entries()).map(async ([subjectId, agg]) => {
    const [subj] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
    return {
      subjectId,
      subjectName: subj?.name ?? "Unknown",
      ...agg,
      percentage: agg.total > 0 ? Math.round((agg.present / agg.total) * 100 * 10) / 10 : 0,
    };
  }));

  res.json({ studentId: id, totalClasses: total, present, absent, late, percentage, bySubject });
});

export default router;
