import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, facultyTable, departmentsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /faculty
router.get("/faculty", requireAuth, async (req, res): Promise<void> => {
  const { department, search } = req.query as Record<string, string>;
  const conditions = [];
  if (search) conditions.push(ilike(facultyTable.name, `%${search}%`));
  if (department) {
    const [dept] = await db.select().from(departmentsTable).where(ilike(departmentsTable.name, `%${department}%`));
    if (dept) conditions.push(eq(facultyTable.departmentId, dept.id));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const results = await db.select({
    id: facultyTable.id, employeeId: facultyTable.employeeId, name: facultyTable.name,
    departmentId: facultyTable.departmentId, departmentName: departmentsTable.name,
    designation: facultyTable.designation, email: facultyTable.email,
    phone: facultyTable.phone, photoUrl: facultyTable.photoUrl, createdAt: facultyTable.createdAt,
  }).from(facultyTable).leftJoin(departmentsTable, eq(facultyTable.departmentId, departmentsTable.id)).where(where).orderBy(facultyTable.name);
  res.json(results);
});

// POST /faculty
router.post("/faculty", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { name, employeeId, departmentId, designation, email, phone, photoUrl } = req.body;
  if (!name || !employeeId || !departmentId) {
    res.status(400).json({ error: "name, employeeId, departmentId required" });
    return;
  }
  const [f] = await db.insert(facultyTable).values({ name, employeeId, departmentId, designation, email, phone, photoUrl }).returning();
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, f.departmentId));
  res.status(201).json({ ...f, departmentName: dept?.name ?? null });
});

// GET /faculty/:id
router.get("/faculty/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [f] = await db.select({
    id: facultyTable.id, employeeId: facultyTable.employeeId, name: facultyTable.name,
    departmentId: facultyTable.departmentId, departmentName: departmentsTable.name,
    designation: facultyTable.designation, email: facultyTable.email,
    phone: facultyTable.phone, photoUrl: facultyTable.photoUrl, createdAt: facultyTable.createdAt,
  }).from(facultyTable).leftJoin(departmentsTable, eq(facultyTable.departmentId, departmentsTable.id)).where(eq(facultyTable.id, id));
  if (!f) { res.status(404).json({ error: "Faculty not found" }); return; }
  res.json(f);
});

// PATCH /faculty/:id
router.patch("/faculty/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, employeeId, departmentId, designation, email, phone, photoUrl } = req.body;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (employeeId) updates.employeeId = employeeId;
  if (departmentId !== undefined) updates.departmentId = departmentId;
  if (designation !== undefined) updates.designation = designation;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (photoUrl !== undefined) updates.photoUrl = photoUrl;
  const [f] = await db.update(facultyTable).set(updates).where(eq(facultyTable.id, id)).returning();
  if (!f) { res.status(404).json({ error: "Faculty not found" }); return; }
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, f.departmentId));
  res.json({ ...f, departmentName: dept?.name ?? null });
});

// DELETE /faculty/:id
router.delete("/faculty/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [f] = await db.delete(facultyTable).where(eq(facultyTable.id, id)).returning();
  if (!f) { res.status(404).json({ error: "Faculty not found" }); return; }
  res.sendStatus(204);
});

export default router;
