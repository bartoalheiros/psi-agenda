import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "psi_session";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "psi-clinic-dev-secret-change-me",
);

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PSYCHOLOGIST";
  psychologistId: string | null;
};

export async function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "PSYCHOLOGIST";
}) {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: String(payload.userId) },
      include: { psychologist: true },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      psychologistId: user.psychologist?.id ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
