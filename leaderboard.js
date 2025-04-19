// -------- Leaderboard Data --------
let leaderboardScores = []; // To store fetched scores
let leaderboardError = null; // To store fetch error message

// -------- Leaderboard Handling --------
async function displayLeaderboard() {
    // Use the global supabaseClient defined in db-setup.js
    if (!supabaseClient) {
        leaderboardError = "Leaderboard service unavailable.";
        console.warn(leaderboardError);
        return;
    }

    console.log("Fetching leaderboard...");
    leaderboardError = null; // Clear previous error
    try {
        const { data, error } = await supabaseClient
            .from('scores')
            .select('username, score, created_at')
            .order('score', { ascending: false })
            .limit(10);

        if (error) {
            throw error;
        }

        leaderboardScores = data || []; // Store fetched data, default to empty array
        console.log("Leaderboard fetched:", leaderboardScores);

    } catch (error) {
        console.error('Error fetching leaderboard:', error.message);
        leaderboardError = `Error loading scores: ${error.message}`;
        leaderboardScores = []; // Clear scores on error
    }
    // No drawing here, drawing happens in drawLeaderboardToCanvas
}

// Function to draw the leaderboard onto the canvas
function drawLeaderboardToCanvas(x, y) {
    push(); // Isolate text settings
    fill(255);
    textSize(20);
    textAlign(CENTER, TOP);
    text("--- Leaderboard --- ", x, y);

    if (leaderboardError) {
        fill(255, 100, 100); // Red for error message
        textSize(16);
        text(leaderboardError, x, y + 30);
    } else if (leaderboardScores.length === 0) {
        textSize(16);
        text("No scores yet!", x, y + 30);
    } else {
        textSize(18);
        textAlign(CENTER, TOP); // Center alignment for the whole line
        const startY = y + 35;
        const lineHeight = 22;

        for (let i = 0; i < leaderboardScores.length; i++) {
            const currentY = startY + i * lineHeight;
            const rank = i + 1;
            const entry = leaderboardScores[i];
            let formattedDateTime = "";

            // Format the timestamp
            try {
                const date = new Date(entry.created_at);
                const dateString = date.toLocaleDateString();
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                formattedDateTime = `${dateString} ${timeString}`;
            } catch (e) {
                formattedDateTime = "-invalid date-";
                console.error("Error formatting date:", entry.created_at, e);
            }

            // Construct the single line string
            const scoreText = `${rank}. ${entry.username} - ${entry.score} - ${formattedDateTime}`;

            // Draw the centered text
            text(scoreText, x, currentY);
        }
    }
    pop(); // Restore previous text settings
} 