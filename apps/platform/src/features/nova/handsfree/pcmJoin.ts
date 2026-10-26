/** Joins base64 PCM chunks into one base64 clip, keeping at most `maxBytes` from the start. */
export function joinPcm(chunks: string[], maxBytes: number) {
  const parts: string[] = [];
  let size = 0;
  for (const chunk of chunks) {
    if (size >= maxBytes) break;
    const binary = atob(chunk).slice(0, maxBytes - size);
    parts.push(binary);
    size += binary.length;
  }
  const joined = parts.join('');
  return btoa(joined.length % 2 ? joined.slice(0, -1) : joined);
}
