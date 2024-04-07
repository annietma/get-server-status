"use client";
import { useEffect, useState } from "react";
import { useStatus } from "./lib/clientLibrary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const { statusLogs, subscribeToStatus } = useStatus();
  const [jobId, setJobId] = useState(
    Math.floor(Math.random() * 10000).toString()
  );

  return (
    <div className="bg-white h-screen w-screen flex flex-col items-center py-20">
      <div className="w-1/2 items-center flex flex-col gap-4">
        <form
          className="flex flex-row items-center gap-2 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            subscribeToStatus(jobId);
          }}
        >
          <Input
            placeholder="Enter Job ID"
            value={jobId}
            onChange={(e) => setJobId(e.target.value.slice(0, 10))}
          />
          <Button type="submit">Subscribe</Button>
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
                {log.status.toLocaleUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
