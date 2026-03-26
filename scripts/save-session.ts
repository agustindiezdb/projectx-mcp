import { runLoginFlow } from "../src/auth/session";

runLoginFlow().catch((err) => {
  console.error("Error saving session:", err);
  process.exit(1);
});
