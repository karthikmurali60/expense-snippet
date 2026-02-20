import { handleCors, corsHeaders } from '../_shared/cors.ts'

const GEMINI_PROMPT =
  'Analyze the items in the receipt. For each item calculate its price including tax. Only items marked with "T" are taxable. Distribute the tax proportionally among the taxable items. The total of all times must match the bill total. Output the items list as plaintext parsable JSON string and not as a code block, with item_name and price as the keys for each item.'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { image?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!body.image) {
    return new Response(JSON.stringify({ error: 'Missing image field' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse data URI: "data:image/jpeg;base64,<data>" or plain base64
  let mimeType = 'image/jpeg'
  let base64Data = body.image

  if (body.image.includes(',')) {
    const [prefix, data] = body.image.split(',')
    base64Data = data
    const mimeMatch = prefix.match(/data:([^;]+);/)
    if (mimeMatch) mimeType = mimeMatch[1]
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: GEMINI_PROMPT },
                { inline_data: { mime_type: mimeType, data: base64Data } },
              ],
            },
          ],
        }),
      },
    )

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text()
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${err}`)
    }

    const geminiData = await geminiResponse.json()
    const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return new Response(JSON.stringify({ response: JSON.stringify(parsed, null, 2) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
