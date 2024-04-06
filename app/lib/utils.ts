export async function fetchStatus(jobId: string) {
  const response = await fetch(
    `http://localhost:3001/api/status?jobId=${jobId}`,
    { cache: "no-store" }
  );
  const text = await response.text();
  return text;
}

export async function getTranslationStatus(
  jobId: string,
  retryDelay = 1000,
  maxRetries = 10
) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const status = await fetchStatus(jobId);
      console.log("Translation status:", status);
    } catch (error) {
      console.error("Error retrieving translation status:", error);
    }

    retries++;
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  throw new Error("Max retries exceeded");
}
