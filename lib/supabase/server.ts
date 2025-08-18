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
          // @ts-ignore - This is a workaround for a persistent type error
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // @ts-ignore - This is a workaround for a persistent type error
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // @ts-ignore - This is a workaround for a persistent type error
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}