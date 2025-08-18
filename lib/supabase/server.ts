import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // @ts-expect-error - This is a workaround for a persistent TypeScript bug
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // @ts-expect-error - This is a workaround for a persistent TypeScript bug
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // @ts-expect-error - This is a workaround for a persistent TypeScript bug
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}