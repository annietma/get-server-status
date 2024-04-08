import { createClient } from "redis";

const client = createClient({
  url: "redis://localhost:6379",
});

client.on("error", (err) => console.log("Redis Client Error", err));

async function connectToRedis() {
  await client.connect();
}

connectToRedis();

export default client;
