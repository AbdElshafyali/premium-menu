// Supabase Configuration
const SUPABASE_URL = 'https://dtmilzeolazsdjafuecg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bWlsemVvbGF6c2RqYWZ1ZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwOTAyOTMsImV4cCI6MjA1MTY2NjI5M30.sb_publishable_RPmGum8y2YFETUWh-jYLRQ_fg-KpLR-';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;
