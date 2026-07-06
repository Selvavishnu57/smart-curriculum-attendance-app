import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable, studentsTable, facultyTable, departmentsTable, notificationsTable, activityLogTable } from "@workspace/db";
import { hashPassword, verifyPassword, generateToken } from "../../lib/crypto";
import { requireAuth } from "../../middlewares/authMiddleware";
import type { Request } from "express";

const router: IRouter = Router();

/** Look up or create a department by name. Returns department id. */
async function resolveDepartmentId(deptId: string | undefined, customName: string | undefined): Promise<number> {
  // If a numeric id is given, try to use it directly
  if (deptId && deptId !== "other") {
    const parsed = parseInt(deptId, 10);
    if (!isNaN(parsed)) {
      const [existing] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, parsed));
      if (existing) return existing.id;
    }
  }
  // Otherwise resolve/create by name
  const name = customName?.trim() || "Other";
  const [existing] = await db.select().from(departmentsTable).where(eq(departmentsTable.name, name));
  if (existing) return existing.id;
  // Create new department
  const code = name.replace(/[^A-Z]/gi, "").slice(0, 6).toUpperCase() || "DEPT";
  const [created] = await db.insert(departmentsTable).values({ name, code }).returning();
  return created.id;
}

function getIp(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? "unknown";
}

// POST /auth/login — accepts username OR email
router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.username, username), eq(usersTable.email, username)));

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (role && user.role !== role) {
    res.status(401).json({ error: "Invalid role for this account" });
    return;
  }
  const token = generateToken();
  await db.update(usersTable).set({ sessionToken: token }).where(eq(usersTable.id, user.id));

  // Update lastLoginAt on student/faculty record
  if (user.studentId) {
    await db.update(studentsTable).set({ lastLoginAt: new Date() }).where(eq(studentsTable.id, user.studentId));
  }
  if (user.facultyId) {
    await db.update(facultyTable).set({ lastLoginAt: new Date() }).where(eq(facultyTable.id, user.facultyId));
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId,
      studentId: user.studentId,
      facultyId: user.facultyId,
    },
    token,
  });
});

// POST /auth/logout
router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  await db.update(usersTable).set({ sessionToken: null }).where(eq(usersTable.id, req.authUser!.id));
  res.json({ message: "Logged out successfully" });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  res.json(req.authUser);
});

// POST /auth/change-password
router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.authUser!.id));
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    res.status(401).json({ error: "Current password incorrect" });
    return;
  }
  await db.update(usersTable).set({ passwordHash: hashPassword(newPassword) }).where(eq(usersTable.id, req.authUser!.id));
  res.json({ message: "Password changed successfully" });
});

// POST /auth/reset-password  — admin only, reset any user's password
router.post("/auth/reset-password", requireAuth, async (req, res): Promise<void> => {
  if (req.authUser!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    res.status(400).json({ error: "userId and newPassword required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const [user] = await db.update(usersTable).set({ passwordHash: hashPassword(newPassword) }).where(eq(usersTable.id, userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ message: "Password reset successfully" });
});

// POST /auth/register/student  — public
router.post("/auth/register/student", async (req, res): Promise<void> => {
  const {
    name, registerNumber, email, phone, password,
    departmentId, customDepartment,
    year, section, collegeName,
    gender, dateOfBirth, address, parentName, parentPhone,
  } = req.body;

  if (!name || !registerNumber || !email || !password || !year || !section) {
    res.status(400).json({ error: "name, registerNumber, email, password, year, section are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  // Duplicate checks
  const [existingRegNo] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.registerNumber, registerNumber));
  if (existingRegNo) { res.status(409).json({ error: "Register number already exists" }); return; }

  const [existingEmail] = await db.select({ id: usersTable.id }).from(usersTable).where(
    or(eq(usersTable.email, email), eq(usersTable.username, email))
  );
  if (existingEmail) { res.status(409).json({ error: "Email is already registered" }); return; }

  // Resolve department
  const resolvedDeptId = await resolveDepartmentId(departmentId, customDepartment);

  const [student] = await db.insert(studentsTable).values({
    name, registerNumber, email,
    phone: phone ?? null,
    departmentId: resolvedDeptId,
    year: parseInt(year, 10),
    section,
    collegeName: collegeName ?? null,
    gender: gender ?? null,
    dateOfBirth: dateOfBirth ?? null,
    address: address ?? null,
    parentName: parentName ?? null,
    parentPhone: parentPhone ?? null,
    accountStatus: "active",
    registrationIp: getIp(req),
  }).returning();

  const [user] = await db.insert(usersTable).values({
    username: registerNumber,
    passwordHash: hashPassword(password),
    role: "student",
    name,
    email,
    departmentId: resolvedDeptId,
    studentId: student.id,
  }).returning();

  const token = generateToken();
  await db.update(usersTable).set({ sessionToken: token }).where(eq(usersTable.id, user.id));

  // Admin notification
  await db.insert(notificationsTable).values({
    type: "new_registration",
    title: "New Student Registration",
    message: `${name} (${registerNumber}) registered as a student in ${collegeName ?? "unknown college"}.`,
    targetRole: "admin",
    isRead: false,
  });
  await db.insert(activityLogTable).values({
    action: "student_registered",
    description: `New student ${name} (${registerNumber}) self-registered`,
    userName: name,
    userRole: "student",
  });

  res.status(201).json({
    user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email, departmentId: user.departmentId, studentId: user.studentId, facultyId: null },
    token,
    student,
  });
});

// POST /auth/register/faculty  — public
router.post("/auth/register/faculty", async (req, res): Promise<void> => {
  const {
    name, employeeId, email, phone, password,
    departmentId, customDepartment,
    designation, collegeName,
    gender, dateOfBirth, address,
  } = req.body;

  if (!name || !employeeId || !email || !password) {
    res.status(400).json({ error: "name, employeeId, email, password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  // Duplicate checks
  const [existingEmpId] = await db.select({ id: facultyTable.id }).from(facultyTable).where(eq(facultyTable.employeeId, employeeId));
  if (existingEmpId) { res.status(409).json({ error: "Faculty ID already exists" }); return; }

  const [existingEmail] = await db.select({ id: usersTable.id }).from(usersTable).where(
    or(eq(usersTable.email, email), eq(usersTable.username, email))
  );
  if (existingEmail) { res.status(409).json({ error: "Email is already registered" }); return; }

  // Resolve department (required)
  if (!departmentId && !customDepartment) {
    res.status(400).json({ error: "Department is required" });
    return;
  }
  const resolvedDeptId = await resolveDepartmentId(departmentId, customDepartment);

  const [faculty] = await db.insert(facultyTable).values({
    name, employeeId, email,
    phone: phone ?? null,
    departmentId: resolvedDeptId,
    designation: designation ?? null,
    collegeName: collegeName ?? null,
    gender: gender ?? null,
    dateOfBirth: dateOfBirth ?? null,
    address: address ?? null,
    accountStatus: "active",
    registrationIp: getIp(req),
  }).returning();

  const [user] = await db.insert(usersTable).values({
    username: employeeId,
    passwordHash: hashPassword(password),
    role: "faculty",
    name,
    email,
    departmentId: resolvedDeptId,
    facultyId: faculty.id,
  }).returning();

  const token = generateToken();
  await db.update(usersTable).set({ sessionToken: token }).where(eq(usersTable.id, user.id));

  // Admin notification
  await db.insert(notificationsTable).values({
    type: "new_registration",
    title: "New Faculty Registration",
    message: `${name} (${employeeId}) registered as faculty in ${collegeName ?? "unknown college"}.`,
    targetRole: "admin",
    isRead: false,
  });
  await db.insert(activityLogTable).values({
    action: "faculty_registered",
    description: `New faculty ${name} (${employeeId}) self-registered`,
    userName: name,
    userRole: "faculty",
  });

  res.status(201).json({
    user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email, departmentId: user.departmentId, studentId: null, facultyId: user.facultyId },
    token,
    faculty,
  });
});

export default router;
