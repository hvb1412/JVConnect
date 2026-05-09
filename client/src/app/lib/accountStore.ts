export type UserAccount = {
  id: number;
  name: string;
  email: string;
  password: string;
  joinDate: string;
  isLocked: boolean;
};

const STORAGE_KEY = "jv-connect-user-accounts";

const defaultAccounts: UserAccount[] = [
  {
    id: 1,
    name: "田中美咲",
    email: "tanaka@example.com",
    password: "password123",
    joinDate: "2026年3月28日",
    isLocked: false,
  },
  {
    id: 2,
    name: "佐藤健太",
    email: "sato@example.com",
    password: "password123",
    joinDate: "2026年3月27日",
    isLocked: false,
  },
  {
    id: 3,
    name: "鈴木恵美",
    email: "suzuki@example.com",
    password: "password123",
    joinDate: "2026年3月26日",
    isLocked: false,
  },
];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isBrowser = typeof window !== "undefined";

export function getAccounts(): UserAccount[] {
  if (!isBrowser) {
    return defaultAccounts;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccounts));
    return defaultAccounts;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as UserAccount[];
    if (!Array.isArray(parsedValue)) {
      return defaultAccounts;
    }
    return parsedValue;
  } catch {
    return defaultAccounts;
  }
}

export function saveAccounts(accounts: UserAccount[]) {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function registerAccount(input: {
  name: string;
  email: string;
  password: string;
}): { ok: true } | { ok: false; reason: "duplicate_email" } {
  const accounts = getAccounts();
  const normalizedEmail = normalizeEmail(input.email);

  const exists = accounts.some((account) => normalizeEmail(account.email) === normalizedEmail);
  if (exists) {
    return { ok: false, reason: "duplicate_email" };
  }

  const nextAccount: UserAccount = {
    id: Date.now(),
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
    joinDate: new Date().toLocaleDateString("ja-JP"),
    isLocked: false,
  };

  saveAccounts([nextAccount, ...accounts]);
  return { ok: true };
}

export function authenticateAccount(input: {
  email: string;
  password: string;
}): { ok: true } | { ok: false; reason: "invalid_credentials" | "locked" } {
  const normalizedEmail = normalizeEmail(input.email);
  const account = getAccounts().find((item) => normalizeEmail(item.email) === normalizedEmail);

  if (!account || account.password !== input.password) {
    return { ok: false, reason: "invalid_credentials" };
  }

  if (account.isLocked) {
    return { ok: false, reason: "locked" };
  }

  return { ok: true };
}

export function updateAccountLock(accountId: number, isLocked: boolean) {
  const updatedAccounts = getAccounts().map((account) =>
    account.id === accountId ? { ...account, isLocked } : account,
  );
  saveAccounts(updatedAccounts);
}
