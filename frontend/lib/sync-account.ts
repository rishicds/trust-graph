import { api, Profile, User } from "@/lib/api";

const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 750;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SyncAccountResult = {
  user?: User | null;
  profile: Profile | null;
  shadowHandle?: string;
  bootstrapMessage?: string;
};

export async function syncAccount(
  getToken: () => Promise<string | null>,
  handle?: string,
): Promise<SyncAccountResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const token = await getToken();
    if (!token) {
      await sleep(RETRY_DELAY_MS);
      continue;
    }

    try {
      const sync = await api.syncClerk(token, handle);
      return {
        user: (sync.user as User | undefined) ?? null,
        profile: (sync.profile as Profile | undefined) ?? null,
        shadowHandle: sync.shadow_handle,
        bootstrapMessage: sync.bootstrap_message,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Account sync failed");
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError ?? new Error("Account sync failed");
}
