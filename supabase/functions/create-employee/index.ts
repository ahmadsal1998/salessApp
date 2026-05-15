import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is an authenticated admin using their JWT
    const callerJwt = req.headers.get('Authorization')
    if (!callerJwt) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Client that respects RLS — used only to verify the caller's role
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: callerJwt } } }
    )

    const { data: { user }, error: userError } = await anonClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile, error: profileError } = await anonClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client with service_role — never exposed to the browser
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, password, fullName, phone } = await req.json()

    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ error: 'email, password, and fullName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: fullName, role: 'sales' },
      email_confirm: true,
    })

    if (error) throw error

    // Update phone if provided. The DB trigger creates the profile row after
    // createUser(), but may not have committed yet — upsert handles both cases.
    if (phone && data.user) {
      await adminClient
        .from('profiles')
        .upsert(
          { id: data.user.id, phone, updated_at: new Date().toISOString() },
          { onConflict: 'id', ignoreDuplicates: false }
        )
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
