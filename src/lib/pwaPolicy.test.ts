import { describe, expect, it } from "vitest";
import { isAppWorker, shouldDisableAppWorker } from "./pwaPolicy";

const published = { production: true, embedded: false, hostname: "proalta.lovable.app", search: "" };
describe("Segurança do PWA", () => {
  it("permite offline no endereço publicado", () => expect(shouldDisableAppWorker(published)).toBe(false));
  it("bloqueia registro em desenvolvimento", () => expect(shouldDisableAppWorker({ ...published, production: false })).toBe(true));
  it("bloqueia registro em iframe", () => expect(shouldDisableAppWorker({ ...published, embedded: true })).toBe(true));
  it("respeita o desligamento sw=off", () => expect(shouldDisableAppWorker({ ...published, search: "?sw=off" })).toBe(true));
  it.each([
    "id-preview--70fedbee-cdfe-4f94-93bf-5237a640cc08.lovable.app",
    "preview-v2--proalta.lovable.app", "id-preview-abc--proalta.gpt-eng.com",
    "project--70fedbee-cdfe-4f94-93bf-5237a640cc08-dev.lovable.app",
    "lovableproject.com", "app.lovableproject-dev.com", "beta.lovable.dev",
  ])("bloqueia preview %s", hostname => expect(shouldDisableAppWorker({ ...published, hostname })).toBe(true));
  it("bloqueia o hostname delegado exato", () => expect(shouldDisableAppWorker({ ...published, hostname: "review.example.com", delegatedPreviewHostname: "review.example.com" })).toBe(true));
  it("permite domínio personalizado com nome preview", () => expect(shouldDisableAppWorker({ ...published, hostname: "preview-v2--shop.example.com" })).toBe(false));
  it("limpa somente o worker de cache próprio", () => {
    expect(isAppWorker("https://proalta.lovable.app/sw.js", "https://proalta.lovable.app")).toBe(true);
    expect(isAppWorker("https://proalta.lovable.app/firebase-messaging-sw.js", "https://proalta.lovable.app")).toBe(false);
    expect(isAppWorker("https://other.example/sw.js", "https://proalta.lovable.app")).toBe(false);
  });
});