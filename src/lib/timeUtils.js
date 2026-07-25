/**
 * Lightweight "time ago" formatter.
 * Returns strings like "2 minutes ago", "3 hours ago", "yesterday", etc.
 */
export function formatDistanceToNow(date) {
  if (!date) return "";

  const now   = Date.now();
  const then  = new Date(date).getTime();
  const diff  = Math.max(0, now - then); // ms
  const secs  = Math.floor(diff / 1000);
  const mins  = Math.floor(secs  / 60);
  const hours = Math.floor(mins  / 60);
  const days  = Math.floor(hours / 24);

  if (secs  < 60)   return "just now";
  if (mins  < 60)   return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24)   return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days  === 1)  return "yesterday";
  if (days  < 30)   return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12)  return `${months} month${months !== 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

/**
 * Format a date to a readable locale string.
 */
export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
    hour:  "2-digit",
    minute: "2-digit",
  });
}
