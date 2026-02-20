import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { extractJwt, getSplitwiseApiKey } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const jwt = extractJwt(req.headers.get('Authorization'))
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = await getSplitwiseApiKey(jwt)
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Splitwise API key not found' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const response = await fetch('https://secure.splitwise.com/api/v3.0/get_groups', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) throw new Error(`Splitwise API error: ${response.status}`)

    const data = await response.json()
    const groups = data.groups.map((g: any) => ({ id: g.id, name: g.name }))

    return new Response(JSON.stringify(groups), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
