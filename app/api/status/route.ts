import client from "@/app/lib/redis";

const JOB_DURATION = 4000; //4 seconds

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return new Response("Missing jobId", {
      status: 400,
    });
  }

  try {
    const startTime = await client.get(`${jobId}:startTime`);
    const currentTime = Date.now();
    const randomDelay = await client.get(`${jobId}:randomDelay`);

    if (!startTime || !randomDelay) {
      await client.set(`${jobId}:startTime`, currentTime.toString());
      await client.set(
        `${jobId}:randomDelay`,
        Math.floor(Math.random() * 6000).toString()
      );
      return new Response("pending", {
        status: 200,
      });
    }

    const elapsedTime = currentTime - parseInt(startTime);

    if (elapsedTime > JOB_DURATION + parseInt(randomDelay)) {
      await client.del(`${jobId}:startTime`);
      await client.del(`${jobId}:randomDelay`);

      const randomResult = Math.random() < 0.7 ? "completed" : "error";
      return new Response(randomResult, {
        status: 200,
      });
    } else {
      return new Response("pending", {
        status: 200,
      });
    }
  } catch (error) {
    console.error("Error retrieving job status:", error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
