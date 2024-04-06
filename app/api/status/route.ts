import client from "@/app/lib/redis";

const JOB_DURATION = 5000; //5 seconds

export async function GET(request: Request) {
  const { jobId } = await request.json();
  if (!jobId) {
    return new Response(JSON.stringify({ error: "Missing jobId" }), {
      status: 400,
    });
  }

  try {
    const startTime = await client.get(`${jobId}:startTime`);
    const currentTime = Date.now();

    if (startTime === null) {
      await client.set(`${jobId}:startTime`, currentTime.toString());
      return new Response("pending", {
        status: 200,
      });
    }

    const elapsedTime = currentTime - parseInt(startTime, 10);

    if (elapsedTime > JOB_DURATION) {
      await client.del(`${jobId}:startTime`);
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
