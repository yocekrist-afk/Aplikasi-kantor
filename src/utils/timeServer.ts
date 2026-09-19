export async function getServerTimeOffset(): Promise<number> {
  try {
    const start = performance.now();
    const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
    const data = await res.json();
    const end = performance.now();
    const roundTrip = end - start;
    const serverTime = new Date(data.utc_datetime).getTime();
    
    // Adjusted server time at the moment the request finished
    const adjustedServerTime = serverTime + (roundTrip / 2);
    
    // Base true time using performance.now() anchor
    const offset = adjustedServerTime - performance.now();
    return offset;
  } catch (error) {
    console.warn('Failed to fetch server time, falling back to local clock', error);
    // If it fails, fallback to local clock by aligning offset to Date.now()
    return Date.now() - performance.now();
  }
}

let cachedOffset: number | null = null;

export async function getTrueTime(): Promise<number> {
  if (cachedOffset === null) {
    cachedOffset = await getServerTimeOffset();
  }
  // True time is completely independent of the OS clock changes during the session!
  return performance.now() + cachedOffset;
}
