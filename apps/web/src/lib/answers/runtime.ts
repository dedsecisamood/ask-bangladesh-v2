import "server-only";
import { createRagService } from "./service";
import { reviewPublishedClaims } from "./review";
import { createVertexProvider } from "./vertex";

/** Prepared server composition only; public routing remains closed. No environment
 * setting grants live approval. The default provider cannot call Google/ADC.
 */
export function createDatabaseAnswerService() {
  return createRagService({
    provider: createVertexProvider(),
    review: reviewPublishedClaims,
  });
}
