import { HttpError } from '../http';
// Best-effort per-isolate abuse guard; this is not a distributed quota ledger.
const requests = new Map<string, { until: number; count: number }>();
export function limitNova(userId: string, action: string, now = Date.now()) {
  for (const [key, value] of requests) if (value.until <= now) requests.delete(key);
  const key = `${userId}:${action}`,
    max = action === 'chat' ? 20 : 3;
  const entry = requests.get(key) ?? { until: now + 60000, count: 0 };
  if (entry.count >= max || requests.size >= 10000)
    throw new HttpError(429, 'استنى شوية قبل طلب جديد.');
  entry.count++;
  requests.set(key, entry);
}
