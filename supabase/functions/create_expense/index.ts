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
  const groupId = url.searchParams.get('group_id')

  let requestData: Record<string, any>
  try {
    requestData = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!requestData.cost || !requestData.description) {
    const missing = !requestData.cost ? 'cost' : 'description'
    return new Response(JSON.stringify({ error: `Missing required field: ${missing}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const cost = Math.round(parseFloat(requestData.cost) * 100) / 100
  if (isNaN(cost)) {
    return new Response(JSON.stringify({ error: 'Invalid cost format' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  requestData.cost = cost

  // Collect and round user shares
  const userShares: Array<{ paid_share?: number; owed_share?: number }> = []
  let i = 0
  while (`users__${i}__user_id` in requestData) {
    const userEntry: { paid_share?: number; owed_share?: number } = {}
    for (const shareType of ['paid_share', 'owed_share'] as const) {
      const key = `users__${i}__${shareType}`
      if (key in requestData) {
        const share = Math.round(parseFloat(requestData[key]) * 100) / 100
        if (isNaN(share)) {
          return new Response(JSON.stringify({ error: `Invalid ${shareType} format` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        userEntry[shareType] = share
        requestData[key] = String(share)
      }
    }
    userShares.push(userEntry)
    i++
  }

  if (i === 0) {
    return new Response(JSON.stringify({ error: 'At least one user must be specified' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Adjust last user's owed_share to make totals match cost
  const totalOwed = userShares.reduce((sum, u) => sum + (u.owed_share ?? 0), 0)
  const roundedTotal = Math.round(totalOwed * 100) / 100
  if (roundedTotal !== cost) {
    for (let j = userShares.length - 1; j >= 0; j--) {
      if ('owed_share' in userShares[j] && (userShares[j].owed_share ?? 0) > 0) {
        const adjustment = Math.round((cost - (roundedTotal - (userShares[j].owed_share ?? 0))) * 100) / 100
        userShares[j].owed_share = adjustment
        requestData[`users__${j}__owed_share`] = String(adjustment)
        break
      }
    }
  }

  const dateStr = requestData.date ?? new Date().toISOString().split('T')[0]
  const formattedDate = `${dateStr}T00:00:00Z`

  const expenseData: Record<string, any> = {
    cost,
    description: requestData.description,
    date: formattedDate,
    repeat_interval: requestData.repeat_interval ?? 'never',
    currency_code: requestData.currency_code ?? 'USD',
    category_id: requestData.category_id ?? 1,
    group_id: parseInt(groupId ?? '0'),
    split_equally: false,
  }

  if (requestData.details) expenseData.details = requestData.details

  for (const [key, value] of Object.entries(requestData)) {
    if (key.startsWith('users__')) {
      expenseData[key] = value
    }
  }

  try {
    const response = await fetch('https://secure.splitwise.com/api/v3.0/create_expense', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    })

    if (!response.ok) throw new Error(`Splitwise API error: ${response.status}`)

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
