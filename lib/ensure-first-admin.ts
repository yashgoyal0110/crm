import type { Session } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function ensureFirstAdmin(session: Session | null) {
  if (!session?.user?.id || session.user.userStatus !== "PENDING") {
    return session;
  }

  const activeAdminCount = await prismadb.users.count({
    where: {
      role: "admin",
      userStatus: "ACTIVE",
    },
  });

  if (activeAdminCount > 0) {
    return session;
  }

  await prismadb.users.update({
    where: { id: session.user.id },
    data: {
      role: "admin",
      userStatus: "ACTIVE",
    },
  });

  return {
    ...session,
    user: {
      ...session.user,
      role: "admin",
      userStatus: "ACTIVE",
    },
  };
}
