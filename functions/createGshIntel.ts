import { createClient } from 'https://deno.land/x/supabase/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { records } = await req.json();
    
    if (!records || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: 'Invalid records array' }), {
        status: 400,
      });
    }

    const { data, error } = await supabase
      .from('GshIntel')
      .insert(records)
      .select();

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      created: data.length,
      data
    }), {
      status: 200,
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
