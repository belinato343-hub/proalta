import { isAppWorker, shouldDisableAppWorker } from "./pwaPolicy";

export async function registerAppWorker() {
  if (!("serviceWorker" in navigator)) return;
  const disabled = shouldDisableAppWorker({
    production: import.meta.env.PROD,
    hostname: window.location.hostname,
    embedded: window.self !== window.top,
    search: window.location.search,
  });

  if (disabled) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(registration => {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      return worker && isAppWorker(worker.scriptURL, window.location.origin);
    }).map(registration => registration.unregister()));
    return;
  }

  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}