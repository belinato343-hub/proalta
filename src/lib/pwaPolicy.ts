// Somente o site publicado pode registrar o worker de cache do aplicativo.
export function shouldDisableAppWorker({ production, hostname, embedded, search, delegatedPreviewHostname }: {
  production: boolean;
  hostname: string;
  embedded: boolean;
  search: string;
  delegatedPreviewHostname?: string;
}) {
  const host = hostname.toLowerCase();
  const platformDomain = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host);
  const label = host.split(".")[0];
  return !production || embedded || new URLSearchParams(search).get("sw") === "off"
    || host === delegatedPreviewHostname?.toLowerCase()
    || (platformDomain && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) || /^project--.+-dev$/.test(label)))
    || ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some(domain => host === domain || host.endsWith(`.${domain}`));
}

export function isAppWorker(scriptURL: string, origin: string) {
  const url = new URL(scriptURL, origin);
  return url.origin === origin && url.pathname === "/sw.js";
}