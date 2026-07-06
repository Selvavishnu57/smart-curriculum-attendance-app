import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, contactsTable, notificationsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../../middlewares/authMiddleware";

const router: IRouter = Router();

// POST /contact  — public (no auth required)
router.post("/contact", async (req, res): Promise<void> => {
  const { name, email, phone, userType, college, department, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "name, email, subject, message are required" });
    return;
  }

  const [contact] = await db.insert(contactsTable).values({
    name, email, phone: phone ?? null,
    userType: userType ?? null,
    college: college ?? null,
    department: department ?? null,
    subject, message,
  }).returning();

  // Create admin notification
  await db.insert(notificationsTable).values({
    type: "contact_message",
    title: `New Contact Message from ${name}`,
    message: `${userType ?? "User"} ${name} sent a message: "${subject}"`,
    targetRole: "admin",
    isRead: false,
  });

  res.status(201).json(contact);
});

// GET /contact  — admin only
router.get("/contact", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;
  let messages;
  if (status) {
    messages = await db.select().from(contactsTable).where(eq(contactsTable.status, status)).orderBy(contactsTable.createdAt);
  } else {
    messages = await db.select().from(contactsTable).orderBy(contactsTable.createdAt);
  }
  res.json(messages.reverse());
});

// PATCH /contact/:id  — admin only
router.patch("/contact/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, adminReply } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status) updates.status = status;
  if (adminReply !== undefined) updates.adminReply = adminReply;
  const [contact] = await db.update(contactsTable).set(updates).where(eq(contactsTable.id, id)).returning();
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }
  res.json(contact);
});

// DELETE /contact/:id  — admin only
router.delete("/contact/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [contact] = await db.delete(contactsTable).where(eq(contactsTable.id, id)).returning();
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }
  res.sendStatus(204);
});

// GET /contact/count  — admin only
router.get("/contact/count", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const [row] = await db.select({ total: sql<number>`count(*)`, unread: sql<number>`sum(case when ${contactsTable.status} = 'unread' then 1 else 0 end)` }).from(contactsTable);
  res.json({ total: Number(row?.total ?? 0), unread: Number(row?.unread ?? 0) });
});

export default router;
