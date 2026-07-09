import { Users } from "@prisma/client";

import { prismadb } from "./prisma";
import sendEmail from "./sendmail";

export async function newUserNotify(newUser: Users) {
  const admins = await prismadb.users.findMany({
    where: {
      role: "admin",
    },
  });

  for (const admin of admins) {
    try {
      await sendEmail({
        from: process.env.EMAIL_FROM,
        to: admin.email,
        subject: "New user waiting for approval",
        text: `New user registered: ${newUser.name}\n\nLog in to ${process.env.NEXT_PUBLIC_APP_URL}/admin/users to activate them.\n\n${process.env.NEXT_PUBLIC_APP_NAME}`,
      });

      console.log("Email sent to admin");
    } catch (error) {
      console.warn("Admin notification email skipped:", error);
    }
  }
}
