import { useEffect, useState } from "react";

enum Status {
  pending = "pending",
  completed = "completed",
  error = "error",
  fetchingError = "fetching error",
}

type SubscribeToStatusProps = {
  jobId: string;
  onStatusUpdate?: (log: Log) => void;
  onCompleted?: (log: Log) => void;
  pollingOptions?: PollingOptions;
};

type UseStatusProps = Omit<SubscribeToStatusProps, "jobId"> & {
  initialJobIds?: string[];
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
      return Status.fetchingError;
    }
    const resBody = await response.text();
    const { result: status } = JSON.parse(resBody);
    if (!Object.values(Status).includes(status)) {
      console.error(`Unexpected status: ${status}`);
      return Status.fetchingError;
    }
    return status;
  } catch (error) {
    console.error(`Error fetching status: ${error}`);
    return Status.fetchingError;
  }
}

async function subscribeToStatus({
  jobId,
  onStatusUpdate = () => {},
  onCompleted = () => {},
  pollingOptions = {},
}: SubscribeToStatusProps) {
  const {
    initialDelay = 1000,
    maxDelay = 30000,
    maxAttempts = 10,
    backoffFactor = 2,
    jitter = true,
  } = pollingOptions;

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

  onCompleted({ timestamp: new Date(), jobId, status: Status.fetchingError });
}

const useStatus = ({
  initialJobIds = [],
  onStatusUpdate = () => {},
  onCompleted = () => {},
  pollingOptions = {},
}: UseStatusProps) => {
  const [jobIds, setJobIds] = useState<string[]>(initialJobIds);
  const [statusLogs, setStatusLogs] = useState<Log[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  async function subscribeToJob(jobId: string) {
    setJobIds((prev) => [...prev, jobId]);
  }

  useEffect(() => {
    jobIds.forEach(async (jobId) => {
      if (
        statuses[jobId] != Status.completed &&
        statuses[jobId] != Status.error
      ) {
        await subscribeToStatus({
          jobId,
          onStatusUpdate: (log) => {
            setStatusLogs((prev) => [...prev, log]);
            setStatuses((prev) => ({ ...prev, [log.jobId]: log.status }));
            onStatusUpdate(log);
          },
          onCompleted: (log) => {
            setStatuses((prev) => ({ ...prev, [log.jobId]: log.status }));
            onCompleted(log);
          },
          pollingOptions,
        });
      }
    });
  }, [jobIds]);

  return { statusLogs, statuses, jobIds, subscribeToJob };
};

//exports of the client library that the user can use
export { subscribeToStatus, useStatus };
