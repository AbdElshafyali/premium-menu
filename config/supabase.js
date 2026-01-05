// Supabase Configuration
const SUPABASE_URL = 'https://dtmilzeolazsdjafuecg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RPmGum8y2YFETUWh-jYLRQ_fg-KpLR-';

// Initialize Supabase Client
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = client;
