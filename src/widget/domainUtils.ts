/**
 * Domain validation utilities for RPC-based navigation.
 * Ensures the agent can only navigate to URLs on the same domain
 * as the embedding website.
 */

export function getRootDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

export function isSameDomain(
  currentHostname: string,
  targetUrl: string,
): boolean {
  try {
    const targetHostname = new URL(targetUrl).hostname;
    return (
      getRootDomain(targetHostname) === getRootDomain(currentHostname)
    );
  } catch {
    return false;
  }
}
