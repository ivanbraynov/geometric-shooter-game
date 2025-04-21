// -------- Leaderboard Data --------
let leaderboardScores = []; // To store fetched scores
let leaderboardError = null; // To store fetch error message

// -------- Leaderboard Handling --------
async function displayLeaderboard() {
    // Use the global supabaseClient defined in db-setup.js
    if (!supabaseClient) {
        leaderboardError = "Leaderboard service unavailable.";
        console.warn(leaderboardError);
        populateLeaderboardHtml(); // Update HTML even if service unavailable
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
    
    // Update the HTML leaderboard display
    populateLeaderboardHtml();
}

// // Function to draw the leaderboard onto the canvas (REMOVED)
// function drawLeaderboardToCanvas(x, y) {
//    ...
// }

// NEW Function to populate the leaderboard HTML container
function populateLeaderboardHtml() {
    // Needs access to the global `leaderboardContainerElement` from sketch.js
    if (!leaderboardContainerElement) return; // Exit if the container isn't created yet

    let leaderboardHtml = '<h3>--- Leaderboard ---</h3>'; // Add title

    if (leaderboardError) {
        leaderboardHtml += `<p class="error">${leaderboardError}</p>`;
    } else if (leaderboardScores.length === 0) {
        leaderboardHtml += '<p>No scores yet!</p>';
    } else {
        // Create an HTML table for scores
        leaderboardHtml += '<table><thead><tr><th>Rank</th><th>Username</th><th>Score</th><th>Date</th></tr></thead><tbody>';
        leaderboardScores.forEach((entry, i) => {
            const rank = i + 1;
            let formattedDateTime = "-";
            try {
                if (entry.created_at) {
                    const date = new Date(entry.created_at);
                    // Simplified date/time format
                    formattedDateTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                }
            } catch (e) { 
                formattedDateTime = "invalid date";
                console.error("Error formatting date:", entry.created_at, e);
            }
            
            leaderboardHtml += `<tr>
                                    <td>${rank}</td>
                                    <td>${entry.username || '-'}</td>
                                    <td>${entry.score || 0}</td>
                                    <td>${formattedDateTime}</td>
                                 </tr>`;
        });
        leaderboardHtml += '</tbody></table>';
    }

    leaderboardContainerElement.html(leaderboardHtml); // Set the innerHTML of the container
} 