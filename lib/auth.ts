import * as bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "your-secret-key"
);

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as { userId: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

// Role-based authorization
export async function requireAuth(req: Request): Promise<{ userId: string } | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function requireRole(userId: string, allowedRoles: string[]): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true }
  });

  if (!user || !user.isActive) return false;
  return allowedRoles.includes(user.role);
}

export async function checkAdminAccess(userId: string): Promise<boolean> {
  return requireRole(userId, ["owner", "admin"]);
}

export async function checkOwnerAccess(userId: string): Promise<boolean> {
  return requireRole(userId, ["owner"]);
}

export async function checkContractorAccess(userId: string): Promise<boolean> {
  const contractor = await prisma.contractor.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  return !!contractor;
}
