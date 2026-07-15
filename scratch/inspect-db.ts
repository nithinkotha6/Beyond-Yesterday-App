import { createAdminClient } from '../lib/supabase/server';

async function main() {
  const supabase = createAdminClient();
  
  // Inspect active tables and their RLS policies
  const { data: profiles, error: profError } = await supabase.from('profiles').select('id, full_name').limit(2);
  console.log('Profiles via Admin Client:', { profiles, profError });
}

main().catch(console.error);
