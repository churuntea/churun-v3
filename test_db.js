require('dotenv').config({path:'.env.local'});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('products').update({ description: 'test||_EXT_JSON_||{"order_unit_size":50}' }).eq('id', '4c756097-0dc8-4928-b54a-8704e2a5eb8e').select().then(console.log).catch(console.error);
