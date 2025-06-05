const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1)
    if (error) throw error
  } catch (error) {
    console.error('Connection failed:', error.message)
  }
}

testConnection() 