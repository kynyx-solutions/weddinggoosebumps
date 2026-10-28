import prisma from "./prisma";

// Best effort: a failed log write must never fail the change it describes
export async function logActivity(
  userId: string | undefined,
  action: string,
  module: string,
  details?: Record<string, unknown>
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        action,
        module,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("[ACTIVITY_LOG]", error);
  }
}
