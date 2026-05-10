const HIDDEN_EVENT_TARGETS_KEY = "jv-connect-hidden-event-targets";

const isBrowser = typeof window !== "undefined";

function getStoredTargets(): string[] {
  if (!isBrowser) return [];

  const rawValue = window.localStorage.getItem(HIDDEN_EVENT_TARGETS_KEY);
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTargets(targets: string[]) {
  if (!isBrowser) return;
  window.localStorage.setItem(HIDDEN_EVENT_TARGETS_KEY, JSON.stringify(targets));
}

export function hideEventContent(target: string) {
  const safeTarget = target.trim();
  if (!safeTarget) return;

  const existingTargets = getStoredTargets();
  if (existingTargets.includes(safeTarget)) return;
  saveTargets([...existingTargets, safeTarget]);
}

export function isEventContentHidden(target: string) {
  return getStoredTargets().includes(target.trim());
}
