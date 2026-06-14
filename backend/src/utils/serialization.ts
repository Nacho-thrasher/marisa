/**
 * Prisma usa BigInt para los IDs, que JSON.stringify no sabe serializar.
 * Para este sistema los IDs nunca superan MAX_SAFE_INTEGER, así que los
 * exponemos como number en la API (coherente con docs/05_API_ENDPOINTS.md).
 */
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this as unknown as bigint);
};
