import { useState } from "react";

type Status = "pending" | "completed" | "error";

type PollingOptions = {
  initialDelay?: number;
  maxDelay?: number;
  maxAttempts?: number;
  backoffFactor?: number;
};

type Log = {
  timestamp: Date;
  jobId: string;
  status: Status;
};

async function fetchStatus(jobId: string): Promise<Status> {
  const response = await fetch(
    `http://localhost:3001/api/status?jobId=${jobId}`,
    { cache: "no-store" }
  );
  const status = await response.text();
  if (status !== "pending" && status !== "completed" && status !== "error") {
    throw new Error(`Unexpected status: ${status}`);
  }
  return status;
}

const useStatus = () => {
  const [statusLogs, setStatusLogs] = useState<Log[]>([]);

  async function subscribeToStatus(
    jobId: string,
    onCompleted: (status: Status) => void = () => {},
    options: PollingOptions = {}
  ) {
    const {
      initialDelay = 1000,
      maxDelay = 30000,
      maxAttempts = 10,
      backoffFactor = 2,
    } = options;

    let attempts = 0;
    let delay = initialDelay;

    while (attempts < maxAttempts) {
      try {
        const status = await fetchStatus(jobId);
        setStatusLogs((logs) => [
          ...logs,
          { timestamp: new Date(), jobId, status },
        ]);

        if (status === "completed" || status === "error") {
          onCompleted(status);
          return;
        }
      } catch (error) {
        console.error("Error retrieving translation status:", error);
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));

      delay = Math.min(delay * backoffFactor, maxDelay);
    }

    onCompleted("error");
  }
  return { statusLogs, subscribeToStatus };
};

export { useStatus };
