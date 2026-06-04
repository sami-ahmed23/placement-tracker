import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('Service key loaded:', !!supabaseServiceKey)

export const supabase = createClient(supabaseUrl, supabaseServiceKey)