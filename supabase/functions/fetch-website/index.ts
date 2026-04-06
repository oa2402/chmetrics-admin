import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { url } = await req.json()

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })

  const html = await response.text()

  return new Response(JSON.stringify({ html }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
})