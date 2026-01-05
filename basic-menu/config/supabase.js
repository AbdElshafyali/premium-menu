// Supabase Configuration
const SUPABASE_URL = 'https://dtmilzeolazsdjafuecg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bWlsemVvbGF6c2RqYWZ1ZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MjYyNTEsImV4cCI6MjA1MTY2NjI5M30.yD8dcy0OnfUEejnRHHv_JTFajsNSVIWjr_Y968IZpyo';

// Initialize Supabase Client
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = client;
