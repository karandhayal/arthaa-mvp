    import { createClient } from '@/lib/supabase/server'
    import { NextResponse } from 'next/server'

    export async function GET(request: Request) {
      const { searchParams, origin } = new URL(request.url)
      const code = searchParams.get('code')
      
      if (code) {
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          // On success, redirect the user to a page inside your app.
          // The new library will handle the session synchronization.
          return NextResponse.redirect(`${origin}/builder`)
        }
      }

      // If there's an error or no code, redirect to an error page
      console.error('Authentication failed in callback.')
      return NextResponse.redirect(`${origin}/`)
    }
    