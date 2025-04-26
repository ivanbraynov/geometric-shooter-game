// Supabase Configuration
// !! IMPORTANT: Replace placeholders if necessary !!
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

// -------- Supabase Client Initialization --------
let supabaseClient = null; // Use a globally accessible name
try {
  // Correctly call the createClient function from the global Supabase object
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Supabase client initialized via db-setup.js.");
} catch (error) {
  console.error("Error initializing Supabase client:", error);
  alert("Could not connect to the leaderboard service (db-setup.js). Leaderboard will be unavailable.");
  // Handle the error appropriately, maybe disable leaderboard features
}
// -------- End Supabase Client Initialization -------- 
