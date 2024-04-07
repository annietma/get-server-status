"use client";
import { useEffect, useState } from "react";
import { useStatus } from "./lib/clientLibrary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { statusLogs, subscribeToStatus } = useStatus();
  const [jobId, setJobId] = useState(
    Math.floor(Math.random() * 10000).toString()
  );

  return (
    <div className="bg-white h-screen w-screen flex flex-col items-center pt-20">
      <div className="w-1/2 items-center flex flex-col gap-4">
        <div className="flex flex-row items-center gap-2 w-full">
          <Input
            placeholder="Enter Job ID"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          />
          <Button onClick={() => subscribeToStatus(jobId)}>Submit</Button>
        </div>
        <div className="flex flex-col gap-2 w-full">
          {statusLogs.map((log, i) => (
            <div key={i} className="">
              {log.timestamp.toLocaleTimeString()}: {log.jobId} - {log.status}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
