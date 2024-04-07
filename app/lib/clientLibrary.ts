import { useState } from "react";

type Status = "pending" | "completed" | "error" | "fetching error";

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
  try {
    const response = await fetch(
      `http://localhost:3001/api/status?jobId=${jobId}`,
      { cache: "no-store" }
    );
    const status = await response.text();
    if (!response.ok) {
      console.error(`Server returned error: ${response.statusText}`);
      return "fetching error";
    }
    if (status !== "pending" && status !== "completed" && status !== "error") {
      console.error(`Unexpected status: ${status}`);
      return "fetching error";
    }
    return status;
  } catch (error) {
    console.error(`Error fetching status: ${error}`);
    return "fetching error";
  }
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
      const status = await fetchStatus(jobId);
      setStatusLogs((logs) => [
        ...logs,
        { timestamp: new Date(), jobId, status },
      ]);

      if (status === "completed" || status === "error") {
        onCompleted(status);
        return;
      }
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));

      //exponential backoff with jitter
      delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempts),
        maxDelay
      );
      delay = delay * (0.5 + Math.random());
      delay = Math.min(delay, maxDelay);
    }

    onCompleted("error");
  }
  return { statusLogs, subscribeToStatus };
};

export { useStatus };
