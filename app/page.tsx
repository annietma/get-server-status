import { getTranslationStatus } from "./lib/utils";

export default async function Home() {
  await getTranslationStatus((Math.random() * 1000).toString());
  return null;
}
