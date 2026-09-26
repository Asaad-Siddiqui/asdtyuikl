import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Reads the session cookie and resolves the signed-in user from the database.
 * Returns null when there is no valid session (expired sessions included).
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;

  const user = await findUserById(session.userId);
  return user ? toSafeUser(user) : null;
}

/**
 * Guards a server component / route. Redirects to /auth when signed out.
 */
export async function requireUser(redirectTo = "/auth"): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}
