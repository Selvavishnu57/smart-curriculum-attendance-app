import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, activitiesTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /activities
router.get("/activities", requireAuth, async (req, res): Promise<void> => {
  const { category } = req.query as Record<string, string>;
  const conditions = [];
  if (category) conditions.push(eq(activitiesTable.category, category));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const activities = await db.select().from(activitiesTable).where(where).orderBy(activitiesTable.category, activitiesTable.title);
  res.json(activities);
});

// POST /activities
router.post("/activities", requireAuth, async (req, res): Promise<void> => {
  const { title, category, description, resourceUrl, difficulty, estimatedMinutes, isActive } = req.body;
  if (!title || !category || !description) {
    res.status(400).json({ error: "title, category, description required" });
    return;
  }
  const [activity] = await db.insert(activitiesTable).values({ title, category, description, resourceUrl, difficulty, estimatedMinutes, isActive: isActive ?? true }).returning();
  res.status(201).json(activity);
});

// PATCH /activities/:id
router.patch("/activities/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { title, category, description, resourceUrl, difficulty, estimatedMinutes, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (title) updates.title = title;
  if (category) updates.category = category;
  if (description) updates.description = description;
  if (resourceUrl !== undefined) updates.resourceUrl = resourceUrl;
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (estimatedMinutes !== undefined) updates.estimatedMinutes = estimatedMinutes;
  if (isActive !== undefined) updates.isActive = isActive;
  const [activity] = await db.update(activitiesTable).set(updates).where(eq(activitiesTable.id, id)).returning();
  if (!activity) { res.status(404).json({ error: "Activity not found" }); return; }
  res.json(activity);
});

// DELETE /activities/:id
router.delete("/activities/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [activity] = await db.delete(activitiesTable).where(eq(activitiesTable.id, id)).returning();
  if (!activity) { res.status(404).json({ error: "Activity not found" }); return; }
  res.sendStatus(204);
});

export default router;
