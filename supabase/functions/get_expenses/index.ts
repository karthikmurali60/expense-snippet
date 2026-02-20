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

  const url = new URL(req.url)
  const afterDate = url.searchParams.get('after_date')
  const userId = url.searchParams.get('user_id')

  const params = new URLSearchParams()
  if (afterDate) params.set('dated_after', afterDate)

  try {
    const response = await fetch(
      `https://secure.splitwise.com/api/v3.0/get_expenses?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) throw new Error(`Splitwise API error: ${response.status}`)

    const data = await response.json()

    const filteredExpenses = (data.expenses ?? []).filter((expense: any) => {
      if (expense.payment || expense.deleted_at !== null) return false

      for (const userShare of expense.users ?? []) {
        if (String(userShare.user_id) === String(userId)) {
          return parseFloat(userShare.owed_share ?? '0') > 0
        }
      }
      return false
    })

    return new Response(JSON.stringify({ expenses: filteredExpenses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
