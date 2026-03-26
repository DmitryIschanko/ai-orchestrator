import Queue from "bull";
import { prisma } from "../index.js";
import { gatewayService } from "./gateway.service.js";
import { logger } from "../utils/logger.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

interface HeartbeatJobData {
  heartbeatId: string;
  companyId: string;
  agentId: string;
}

export const heartbeatQueue = new Queue<HeartbeatJobData>("heartbeat", REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 60000,
    },
  },
});

heartbeatQueue.process(async (job) => {
  const { heartbeatId, companyId, agentId } = job.data;
  
  logger.info("Processing heartbeat job " + job.id + " for agent " + agentId);
  
  await prisma.heartbeat.update({
    where: { id: heartbeatId },
    data: {
      lastRunAt: new Date(),
      runCount: { increment: 1 },
    },
  });
  
  try {
    await gatewayService.executeCommand(agentId, "heartbeat.ping");
    logger.info("Heartbeat sent to agent " + agentId);
  } catch (error: any) {
    logger.error("Failed to send heartbeat to agent " + agentId + ": " + error.message);
    await prisma.heartbeat.update({
      where: { id: heartbeatId },
      data: { failCount: { increment: 1 } },
    });
    throw error;
  }
  
  return { success: true };
});

heartbeatQueue.on("completed", (job) => {
  logger.info("Heartbeat job " + job.id + " completed");
});

heartbeatQueue.on("failed", (job, error) => {
  logger.error("Heartbeat job failed: " + error);
});

export async function scheduleHeartbeat(
  heartbeatId: string,
  companyId: string,
  agentId: string,
  schedule: string
): Promise<void> {
  await heartbeatQueue.add(
    { heartbeatId, companyId, agentId },
    { repeat: { cron: schedule }, jobId: "heartbeat-" + heartbeatId }
  );
  logger.info("Scheduled heartbeat " + heartbeatId + " with cron: " + schedule);
}

export async function unscheduleHeartbeat(heartbeatId: string): Promise<void> {
  const jobId = "heartbeat-" + heartbeatId;
  const job = await heartbeatQueue.getJob(jobId);
  if (job) {
    await job.remove();
    logger.info("Unscheduled heartbeat " + heartbeatId);
  }
}

export async function getQueueStats(): Promise<any> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    heartbeatQueue.getWaitingCount(),
    heartbeatQueue.getActiveCount(),
    heartbeatQueue.getCompletedCount(),
    heartbeatQueue.getFailedCount(),
    heartbeatQueue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}
