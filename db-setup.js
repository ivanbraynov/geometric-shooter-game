// Supabase Configuration
// !! IMPORTANT: Replace placeholders if necessary !!
const SUPABASE_URL = 'https://baugtyjpxftbgyilckaf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdWd0eWpweGZ0Ymd5aWxja2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNTA1MDksImV4cCI6MjA2MDYyNjUwOX0.vJVgED0LBRaF7CsslSW9nLQFMSQ_BDoCS9clFnxJ6bM';

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