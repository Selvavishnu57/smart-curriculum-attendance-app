import { Router, type IRouter } from "express";
import { eq, and, or } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// GET /notifications
router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const { unreadOnly } = req.query as Record<string, string>;
  const user = req.authUser!;
  const conditions = [
    or(
      eq(notificationsTable.userId, user.id),
      and(eq(notificationsTable.targetRole, user.role)),
      eq(notificationsTable.targetRole, "all"),
    )!
  ];
  if (unreadOnly === "true") conditions.push(eq(notificationsTable.isRead, false));
  const notifications = await db.select().from(notificationsTable)
    .where(and(...conditions))
    .orderBy(notificationsTable.createdAt);
  res.json(notifications.reverse());
});

// POST /notifications
router.post("/notifications", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const { type, title, message, targetRole } = req.body;
  if (!type || !title || !message) {
    res.status(400).json({ error: "type, title, message required" });
    return;
  }
  const [notification] = await db.insert(notificationsTable).values({ type, title, message, targetRole: targetRole ?? "all" }).returning();
  res.status(201).json(notification);
});

// PATCH /notifications/:id/read
router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [notification] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id)).returning();
  if (!notification) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(notification);
});

// PATCH /notifications/read-all
router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const user = req.authUser!;
  await db.update(notificationsTable).set({ isRead: true }).where(
    or(eq(notificationsTable.userId, user.id), eq(notificationsTable.targetRole, user.role), eq(notificationsTable.targetRole, "all"))!
  );
  res.json({ message: "All notifications marked as read" });
});

export default router;
