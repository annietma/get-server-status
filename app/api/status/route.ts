import client from "@/app/lib/redis";

const JOB_BASE_DURATION = 2000; //2 seconds
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    //rate limiting
    const clientIp = request.headers.get("X-Forwarded-For") || "unknown_ip";
    const rateLimitKey = `rateLimit:${clientIp}`;
    const currentWindowCount = await client.get(rateLimitKey);
    if (
      currentWindowCount !== null &&
      parseInt(currentWindowCount) >= RATE_LIMIT
    ) {
      return new Response("Too Many Requests", {
        status: 429,
      });
    }
    if (currentWindowCount === null) {
      await client.set(rateLimitKey, 1, { EX: RATE_LIMIT_WINDOW });
    } else {
      await client.incr(rateLimitKey);
    }

    //check for jobId
    const jobId = url.searchParams.get("jobId");
    if (!jobId) {
      return new Response("Missing jobId", {
        status: 400,
      });
    }

    //simulate random errors
    if (Math.random() < 0.1) {
      await client.del(`${jobId}:startTime`);
      await client.del(`${jobId}:randomDelay`);
      return new Response("error", {
        status: 200,
      });
    }

    //simulate expected job duration and random delay
    const startTime = await client.get(`${jobId}:startTime`);
    const currentTime = Date.now();
    const randomDelay = await client.get(`${jobId}:randomDelay`);

    if (!startTime || !randomDelay) {
      await client.set(`${jobId}:startTime`, currentTime.toString());
      await client.set(
        `${jobId}:randomDelay`,
        Math.floor(Math.random() * 10000).toString()
      );
      return new Response("pending", {
        status: 200,
      });
    }

    const elapsedTime = currentTime - parseInt(startTime);

    if (elapsedTime > JOB_BASE_DURATION + parseInt(randomDelay)) {
      await client.del(`${jobId}:startTime`);
      await client.del(`${jobId}:randomDelay`);
      return new Response("completed", {
        status: 200,
      });
    } else {
      return new Response("pending", {
        status: 200,
      });
    }
  } catch (error) {
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
