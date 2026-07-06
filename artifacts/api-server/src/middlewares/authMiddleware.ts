import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  name: string;
  email: string | null;
  departmentId: number | null;
  studentId: number | null;
  facultyId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.sessionToken, token));
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.authUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email ?? null,
    departmentId: user.departmentId ?? null,
    studentId: user.studentId ?? null,
    facultyId: user.facultyId ?? null,
  };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
