import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function extractJwt(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1]
}

export async function getSplitwiseApiKey(jwt: string): Promise<string | null> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { data: { user }, error } = await supabase.auth.getUser(jwt)
    if (error || !user) return null

    const { data } = await supabase
      .from('user_settings')
      .select('splitwise_api_key')
      .eq('user_id', user.id)
      .single()

    return data?.splitwise_api_key ?? null
  } catch {
    return null
  }
}
