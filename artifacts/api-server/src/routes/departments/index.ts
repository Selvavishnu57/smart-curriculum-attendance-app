import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, departmentsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /departments — public so registration forms can populate the dropdown
router.get("/departments", async (req, res): Promise<void> => {
  const departments = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(departments);
});

// POST /departments
router.post("/departments", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { name, code, hodName } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: "Name and code required" });
    return;
  }
  const [dept] = await db.insert(departmentsTable).values({ name, code, hodName }).returning();
  res.status(201).json(dept);
});

// GET /departments/:id
router.get("/departments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
  if (!dept) { res.status(404).json({ error: "Department not found" }); return; }
  res.json(dept);
});

// PATCH /departments/:id
router.patch("/departments/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, code, hodName } = req.body;
  const [dept] = await db.update(departmentsTable).set({ ...(name && { name }), ...(code && { code }), ...(hodName !== undefined && { hodName }) }).where(eq(departmentsTable.id, id)).returning();
  if (!dept) { res.status(404).json({ error: "Department not found" }); return; }
  res.json(dept);
});

// DELETE /departments/:id
router.delete("/departments/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [dept] = await db.delete(departmentsTable).where(eq(departmentsTable.id, id)).returning();
  if (!dept) { res.status(404).json({ error: "Department not found" }); return; }
  res.sendStatus(204);
});

export default router;
