import { Router, type IRouter } from "express";
import { sql, eq } from "drizzle-orm";
import { db, studentsTable, facultyTable, subjectsTable, departmentsTable, attendanceTable, notificationsTable, activityLogTable, contactsTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [[totalStudentsRow], [totalFacultyRow], [totalSubjectsRow], [totalDepartmentsRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(studentsTable),
    db.select({ count: sql<number>`count(*)` }).from(facultyTable),
    db.select({ count: sql<number>`count(*)` }).from(subjectsTable),
    db.select({ count: sql<number>`count(*)` }).from(departmentsTable),
  ]);

  const [[todayAgg], [overallAgg]] = await Promise.all([
    db.select({
      present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
      absent: sql<number>`sum(case when ${attendanceTable.status} = 'absent' then 1 else 0 end)`,
      total: sql<number>`count(*)`,
    }).from(attendanceTable).where(eq(attendanceTable.date, today)),
    db.select({
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
    }).from(attendanceTable),
  ]);

  const overallTotal = Number(overallAgg?.total ?? 0);
  const overallPresent = Number(overallAgg?.present ?? 0);
  const overallPct = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100 * 10) / 10 : 0;

  const user = req.authUser!;
  const [[unreadNotifsRow], [contactsRow], [newStudentsRow], [newFacultyRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(notificationsTable)
      .where(sql`(${notificationsTable.userId} = ${user.id} OR ${notificationsTable.targetRole} = ${user.role} OR ${notificationsTable.targetRole} = 'all') AND ${notificationsTable.isRead} = false`),
    db.select({ count: sql<number>`count(*)`, unread: sql<number>`sum(case when ${contactsTable.status} = 'unread' then 1 else 0 end)` }).from(contactsTable),
    db.select({ count: sql<number>`count(*)` }).from(studentsTable)
      .where(sql`date_trunc('day', ${studentsTable.createdAt}) = current_date`),
    db.select({ count: sql<number>`count(*)` }).from(facultyTable)
      .where(sql`date_trunc('day', ${facultyTable.createdAt}) = current_date`),
  ]);

  // Low attendance count
  const allStudents = await db.select({ id: studentsTable.id }).from(studentsTable);
  let lowCount = 0;
  for (const s of allStudents) {
    const [agg] = await db.select({
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
    }).from(attendanceTable).where(eq(attendanceTable.studentId, s.id));
    const t = Number(agg?.total ?? 0);
    const p = Number(agg?.present ?? 0);
    if (t > 0 && (p / t) * 100 < 75) lowCount++;
  }

  res.json({
    totalStudents: Number(totalStudentsRow?.count ?? 0),
    totalFaculty: Number(totalFacultyRow?.count ?? 0),
    totalSubjects: Number(totalSubjectsRow?.count ?? 0),
    totalDepartments: Number(totalDepartmentsRow?.count ?? 0),
    todayPresent: Number(todayAgg?.present ?? 0),
    todayAbsent: Number(todayAgg?.absent ?? 0),
    overallAttendancePercentage: overallPct,
    lowAttendanceCount: lowCount,
    unreadNotifications: Number(unreadNotifsRow?.count ?? 0),
    contactMessages: Number(contactsRow?.count ?? 0),
    unreadContactMessages: Number(contactsRow?.unread ?? 0),
    newStudentsToday: Number(newStudentsRow?.count ?? 0),
    newFacultyToday: Number(newFacultyRow?.count ?? 0),
  });
});

// GET /dashboard/recent-activity
router.get("/dashboard/recent-activity", requireAuth, async (req, res): Promise<void> => {
  const { limit = "10" } = req.query as Record<string, string>;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const logs = await db.select().from(activityLogTable).orderBy(activityLogTable.createdAt).limit(limitNum);
  res.json(logs.reverse());
});

export default router;
