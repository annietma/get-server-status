"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useStatus } from "./lib/clientLibrary";

export default function Home() {
  const [jobIdInput, setJobIdInput] = useState("");
  const { statusLogs, statuses, jobIds, subscribeToJob } = useStatus({
    initialJobIds: ["012345"],
  });

  return (
    <div className="bg-white h-screen w-screen flex flex-row py-20 min-w-[1000px]">
      <div className="w-1/2 items-center flex flex-col gap-4 px-10">
        <form
          className="flex flex-row items-center gap-2 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            subscribeToJob(jobIdInput);
          }}
        >
          <Input
            placeholder="Enter Job ID (e.g. 123450)"
            value={jobIdInput}
            onChange={(e) => setJobIdInput(e.target.value.slice(0, 10))}
          />
          <Button type="submit">Subscribe to Job Status</Button>
        </form>
        <div className="flex flex-col gap-1 w-full">
          {[...statusLogs].reverse().map((log, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-row items-center justify-between p-2 rounded",
                log.status === "completed" && "bg-green-100",
                log.status === "error" && "bg-red-100"
              )}
            >
              <div className="flex flex-row items-center gap-2">
                <p className="text-zinc-400 font-medium text-sm">
                  JOB {log.jobId}
                </p>
                <p className="text-black">
                  {new Date(log.timestamp).toLocaleDateString("en-US")}{" "}
                  {log.timestamp.toLocaleTimeString()}:
                </p>
              </div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  log.status === "completed" && "text-green-500",
                  log.status === "error" && "text-red-500"
                )}
              >
                {log.status.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/2 items-center flex flex-col gap-4 px-10">
        <div className="h-10 flex flex-col items-center justify-center border-b w-full">
          <p className="text-lg font-semibold text-zinc-600">JOB STATUSES</p>
        </div>
        <div className="w-full items-center flex flex-col gap-4">
          {Object.entries(statuses)
            .reverse()
            .map(([jobId, status], i) => (
              <div
                key={i}
                className="flex flex-row items-center justify-between gap-2 w-full"
              >
                <p className="text-zinc-600 font-medium ">JOB {jobId}</p>
                <p
                  className={cn(
                    " font-semibold",
                    status === "completed" && "text-green-500",
                    status === "error" && "text-red-500"
                  )}
                >
                  {status.toUpperCase()}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
