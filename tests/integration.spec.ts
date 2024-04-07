import { subscribeToStatus } from "@/app/lib/clientLibrary";
import { expect, test } from "@playwright/test";

test("subscribeToStatus", async () => {
  await subscribeToStatus({
    jobId: Math.floor(Math.random() * 100000).toString(),
    onStatusUpdate: async (log) => {
      console.log(
        `JOB ${log.jobId}, ${new Date(log.timestamp).toLocaleDateString(
          "en-US"
        )} ${log.timestamp.toLocaleTimeString()}: ${log.status.toUpperCase()}`
      );
      await expect(log.status).toMatch(/^(pending|completed|error)$/);
    },
    onCompleted: (log) => {
      console.log(
        `JOB ${log.jobId} completed with status ${log.status.toUpperCase()}`
      );
    },
  });
});
