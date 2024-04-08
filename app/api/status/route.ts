import client from "@/app/server/redis";

const JOB_BASE_DURATION = 2000; //2 seconds
const JOB_RANDOM_DELAY = 10000; //10 seconds
const JOB_ERROR_RATE = 0.1;
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
      return new Response(null, {
        status: 429,
        statusText: "Too Many Requests",
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
      return new Response(null, {
        status: 400,
        statusText: "Bad Request, missing jobId",
      });
    }

    //simulate random errors
    if (Math.random() < JOB_ERROR_RATE) {
      await client.del(`${jobId}:startTime`);
      await client.del(`${jobId}:randomDelay`);
      return new Response(JSON.stringify({ result: "error" }), {
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
        Math.floor(Math.random() * JOB_RANDOM_DELAY).toString()
      );
      return new Response(JSON.stringify({ result: "pending" }), {
        status: 200,
      });
    }

    const elapsedTime = currentTime - parseInt(startTime);

    if (elapsedTime > JOB_BASE_DURATION + parseInt(randomDelay)) {
      await client.del(`${jobId}:startTime`);
      await client.del(`${jobId}:randomDelay`);
      return new Response(JSON.stringify({ result: "completed" }), {
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ result: "pending" }), {
        status: 200,
      });
    }
  } catch (error) {
    return new Response(null, {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
}
