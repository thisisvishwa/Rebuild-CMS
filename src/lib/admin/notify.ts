import { prisma } from "@/lib/prisma";

/**
 * Admin notification creation (in-app). These are created by system events:
 * new order, payment failure, refund, new customer, email failure, webhook
 * failure, security event, eBook replacement, system failure.
 */
export interface NotifyInput {
  type: string;
  title: string;
  body?: string;
  link?: string;
}

export async function createNotification(input: NotifyInput) {
  return prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      read: false,
    },
  });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({ where: { id }, data: { read: true } });
}

export async function markAllNotificationsRead() {
  await prisma.notification.updateMany({ data: { read: true } });
}

export async function unreadNotifications() {
  return prisma.notification.findMany({
    where: { read: false },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
