import { useState } from "react";

type Status = "pending" | "completed" | "error" | "fetching error";

type SubscribeToStatusProps = {
  jobId: string;
  onStatusUpdate?: (log: Log) => void;
  onCompleted?: (log: Log) => void;
  options?: PollingOptions;
};

type PollingOptions = {
  initialDelay?: number;
  maxDelay?: number;
  maxAttempts?: number;
  backoffFactor?: number;
  jitter?: boolean;
};

type Log = {
  timestamp: Date;
  jobId: string;
  status: Status;
};

async function fetchStatus(jobId: string): Promise<Status> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/status?jobId=${jobId}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      console.error(`Server returned error: ${response.statusText}`);
      return "fetching error";
    }
    const resBody = await response.text();
    const { result: status } = JSON.parse(resBody);
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

async function subscribeToStatus({
  jobId,
  onStatusUpdate = () => {},
  onCompleted = () => {},
  options = {},
}: SubscribeToStatusProps) {
  const {
    initialDelay = 1000,
    maxDelay = 30000,
    maxAttempts = 10,
    backoffFactor = 2,
    jitter = true,
  } = options;

  let attempts = 0;
  let delay = initialDelay;

  while (attempts < maxAttempts) {
    const status = await fetchStatus(jobId);
    onStatusUpdate({ timestamp: new Date(), jobId, status });

    if (status != "pending") {
      onCompleted({ timestamp: new Date(), jobId, status });
      return;
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, delay));

    //exponential backoff with optional jitter
    delay = Math.min(
      initialDelay * Math.pow(backoffFactor, attempts),
      maxDelay
    );
    if (jitter) {
      delay = delay * (0.5 + Math.random());
    }
    delay = Math.min(delay, maxDelay);
  }

  onCompleted({ timestamp: new Date(), jobId, status: "fetching error" });
}

const useStatus = () => {
  const [statusLogs, setStatusLogs] = useState<Log[]>([]);

  async function subscribeToStatusWithHook({
    jobId,
    onStatusUpdate = () => {},
    onCompleted = () => {},
    options = {},
  }: SubscribeToStatusProps) {
    await subscribeToStatus({
      jobId,
      onStatusUpdate: (log) => {
        setStatusLogs((logs) => [...logs, log]);
        onStatusUpdate(log);
      },
      onCompleted: (status) => {
        onCompleted(status);
      },
      options,
    });
  }

  return { statusLogs, subscribeToStatusWithHook };
};

export { useStatus, subscribeToStatus };
