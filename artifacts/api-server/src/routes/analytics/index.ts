import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, attendanceTable, studentsTable, departmentsTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /analytics/daily
router.get("/analytics/daily", requireAuth, async (req, res): Promise<void> => {
  const { month } = req.query as Record<string, string>;
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);
  const rows = await db.select({
    date: attendanceTable.date,
    present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
    absent: sql<number>`sum(case when ${attendanceTable.status} = 'absent' then 1 else 0 end)`,
    late: sql<number>`sum(case when ${attendanceTable.status} = 'late' then 1 else 0 end)`,
    total: sql<number>`count(*)`,
  }).from(attendanceTable)
    .where(sql`to_char(${attendanceTable.date}::date, 'YYYY-MM') = ${targetMonth}`)
    .groupBy(attendanceTable.date)
    .orderBy(attendanceTable.date);

  const result = rows.map(r => ({
    date: r.date,
    present: Number(r.present),
    absent: Number(r.absent),
    late: Number(r.late),
    total: Number(r.total),
    percentage: Number(r.total) > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100 * 10) / 10 : 0,
  }));
  res.json(result);
});

// GET /analytics/weekly
router.get("/analytics/weekly", requireAuth, async (req, res): Promise<void> => {
  const { weeks = "8" } = req.query as Record<string, string>;
  const weeksNum = parseInt(weeks, 10);
  const rows = await db.select({
    week: sql<string>`to_char(date_trunc('week', ${attendanceTable.date}::date), 'YYYY-MM-DD')`,
    present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
    absent: sql<number>`sum(case when ${attendanceTable.status} = 'absent' then 1 else 0 end)`,
    total: sql<number>`count(*)`,
  }).from(attendanceTable)
    .where(sql`${attendanceTable.date}::date >= current_date - interval '${sql.raw(String(weeksNum * 7))} days'`)
    .groupBy(sql`date_trunc('week', ${attendanceTable.date}::date)`)
    .orderBy(sql`date_trunc('week', ${attendanceTable.date}::date)`);

  const result = rows.map(r => ({
    week: r.week,
    present: Number(r.present),
    absent: Number(r.absent),
    total: Number(r.total),
    percentage: Number(r.total) > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100 * 10) / 10 : 0,
  }));
  res.json(result);
});

// GET /analytics/monthly
router.get("/analytics/monthly", requireAuth, async (req, res): Promise<void> => {
  const { year } = req.query as Record<string, string>;
  const targetYear = year ?? new Date().getFullYear().toString();
  const rows = await db.select({
    month: sql<string>`to_char(${attendanceTable.date}::date, 'YYYY-MM')`,
    present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
    absent: sql<number>`sum(case when ${attendanceTable.status} = 'absent' then 1 else 0 end)`,
    total: sql<number>`count(*)`,
  }).from(attendanceTable)
    .where(sql`extract(year from ${attendanceTable.date}::date) = ${targetYear}::integer`)
    .groupBy(sql`to_char(${attendanceTable.date}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${attendanceTable.date}::date, 'YYYY-MM')`);

  const result = rows.map(r => ({
    month: r.month,
    present: Number(r.present),
    absent: Number(r.absent),
    total: Number(r.total),
    percentage: Number(r.total) > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100 * 10) / 10 : 0,
  }));
  res.json(result);
});

// GET /analytics/department-comparison
router.get("/analytics/department-comparison", requireAuth, async (req, res): Promise<void> => {
  const departments = await db.select().from(departmentsTable);
  const results = [];
  for (const dept of departments) {
    const studentIds = (await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.departmentId, dept.id))).map(s => s.id);
    if (studentIds.length === 0) continue;
    const [agg] = await db.select({
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${attendanceTable.status} in ('present','late') then 1 else 0 end)`,
      absent: sql<number>`sum(case when ${attendanceTable.status} = 'absent' then 1 else 0 end)`,
    }).from(attendanceTable).where(sql`${attendanceTable.studentId} = ANY(${sql.raw(`ARRAY[${studentIds.join(",")}]`)})`);
    const total = Number(agg?.total ?? 0);
    const present = Number(agg?.present ?? 0);
    const absent = Number(agg?.absent ?? 0);
    results.push({ department: dept.name, present, absent, total, percentage: total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0 });
  }
  res.json(results);
});

export default router;
