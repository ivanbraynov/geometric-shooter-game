// -------- DOM Elements (for score form) --------
let scoreFormDiv;
let finalScoreDisplay;
let usernameInput;
let submitScoreButton;
let scoreFeedback;

// -------- Score Form Handling --------
function initializeUI() {
    // Get references to score form elements
    scoreFormDiv = select('#score-form');
    finalScoreDisplay = select('#final-score-display');
    usernameInput = select('#username-input');
    submitScoreButton = select('#submit-score-button');
    scoreFeedback = select('#score-feedback');

    if (!submitScoreButton) {
        console.error("Submit score button not found during UI initialization!");
        return;
    }

    // Add event listener for score submission
    submitScoreButton.mousePressed(handleScoreSubmit);

    // Ensure form is hidden initially
    if(scoreFormDiv) scoreFormDiv.hide();
}

function showScoreForm(currentScore) {
  // Needs access to global 'score' from sketch.js -> NO LONGER TRUE
  if (scoreFormDiv && finalScoreDisplay && usernameInput) {
    finalScoreDisplay.html(`Final Score: ${currentScore}`); // Use passed score
    usernameInput.value(''); // Clear previous input
    scoreFeedback.html(''); // Clear previous feedback
    submitScoreButton.removeAttribute('disabled'); // Ensure button is enabled
    scoreFormDiv.show();
  }
}

async function handleScoreSubmit() {
  // Needs access to global 'supabaseClient' from db-setup.js
  // Needs access to global 'score' from sketch.js
  // Needs access to global 'displayLeaderboard' from leaderboard.js

  if (!supabaseClient) {
    if(scoreFeedback) scoreFeedback.html('Error: Leaderboard service unavailable.');
    return;
  }

  const username = usernameInput.value().trim();
  if (!username) {
    alert('Please enter a username.');
    return;
  }

  // Disable button while submitting
  submitScoreButton.attribute('disabled', true);
  if(scoreFeedback) scoreFeedback.html('Submitting...');

  try {
    const { data, error } = await supabaseClient
      .from('scores')
      .insert([{ username: username, score: score }])
      .select(); // Select to potentially get back the inserted data (optional)

    if (error) {
      throw error; // Throw error to be caught by catch block
    }

    console.log('Score submitted successfully:', data);
    if(scoreFeedback) scoreFeedback.html('Score Submitted!');

    // Fetch updated leaderboard after successful submission
    if(typeof displayLeaderboard === 'function') {
        displayLeaderboard(); // Call global function from leaderboard.js
    } else {
        console.error("displayLeaderboard function not found!");
    }


    setTimeout(() => {
        if(scoreFormDiv) scoreFormDiv.hide();
        // Leaderboard will be drawn automatically in drawGameOver now
    }, 1500);

  } catch (error) {
    console.error('Error submitting score:', error.message);
    if(scoreFeedback) scoreFeedback.html(`Error: ${error.message}`);
    submitScoreButton.removeAttribute('disabled'); // Re-enable button on error
  }
} 