import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createAdminClient } from '../lib/supabase/server';

async function main() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('metric_definitions').select('*');
  console.log('metric_definitions:', { data, error });
}

main().catch(console.error);
