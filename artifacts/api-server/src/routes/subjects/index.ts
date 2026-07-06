import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, subjectsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /subjects
router.get("/subjects", requireAuth, async (req, res): Promise<void> => {
  const { department, semester, search } = req.query as Record<string, string>;
  const conditions = [];
  if (department) conditions.push(eq(subjectsTable.department, department));
  if (semester) conditions.push(eq(subjectsTable.semester, parseInt(semester, 10)));
  if (search) conditions.push(ilike(subjectsTable.name, `%${search}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const subjects = await db.select().from(subjectsTable).where(where).orderBy(subjectsTable.department, subjectsTable.semester, subjectsTable.code);
  res.json(subjects);
});

// POST /subjects
router.post("/subjects", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const { code, name, department, semester, credits, lectureHours, practicalHours, category } = req.body;
  if (!code || !name || !department || !semester || !credits) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }
  const [subj] = await db.insert(subjectsTable).values({ code, name, department, semester, credits, lectureHours, practicalHours, category }).returning();
  res.status(201).json(subj);
});

// GET /subjects/:id
router.get("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [subj] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, id));
  if (!subj) { res.status(404).json({ error: "Subject not found" }); return; }
  res.json(subj);
});

// PATCH /subjects/:id
router.patch("/subjects/:id", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { code, name, department, semester, credits, lectureHours, practicalHours, category } = req.body;
  const updates: Record<string, unknown> = {};
  if (code) updates.code = code;
  if (name) updates.name = name;
  if (department) updates.department = department;
  if (semester !== undefined) updates.semester = semester;
  if (credits !== undefined) updates.credits = credits;
  if (lectureHours !== undefined) updates.lectureHours = lectureHours;
  if (practicalHours !== undefined) updates.practicalHours = practicalHours;
  if (category !== undefined) updates.category = category;
  const [subj] = await db.update(subjectsTable).set(updates).where(eq(subjectsTable.id, id)).returning();
  if (!subj) { res.status(404).json({ error: "Subject not found" }); return; }
  res.json(subj);
});

// DELETE /subjects/:id
router.delete("/subjects/:id", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [subj] = await db.delete(subjectsTable).where(eq(subjectsTable.id, id)).returning();
  if (!subj) { res.status(404).json({ error: "Subject not found" }); return; }
  res.sendStatus(204);
});

export default router;
