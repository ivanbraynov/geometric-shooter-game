// -------- DOM Elements (for score form) --------
let scoreFormDiv;
let finalScoreDisplay;
let usernameInput;
let submitScoreButton;
let scoreFeedback;
let startMenuButton;

// -------- Score Form Handling --------
function initializeUI() {
    // Get references to score form elements
    scoreFormDiv = select('#score-form');
    finalScoreDisplay = select('#final-score-display');
    usernameInput = select('#username-input');
    submitScoreButton = select('#submit-score-button');
    scoreFeedback = select('#score-feedback');
    startMenuButton = select('#start-menu-button');

    if (!submitScoreButton) {
        console.error("Submit score button not found during UI initialization!");
        // return; // Keep going even if one button fails?
    }
    if (!startMenuButton) {
        console.error("Start Menu button not found during UI initialization!");
        // return;
    }

    // Add event listener for score submission
    if (submitScoreButton) {
        submitScoreButton.mousePressed(handleScoreSubmit);
    }
    
    // Add event listener for Start Menu button
    if (startMenuButton) {
        startMenuButton.mousePressed(() => {
            window.location.reload(); // Reload the page
        });
    }

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

    // Hide form and return to start menu after a delay
    setTimeout(() => {
        if(scoreFormDiv) scoreFormDiv.hide();
        // Leaderboard is part of the start menu, so switch state
        gameState = 'START_MENU'; 
    }, 1500); // Keep 1.5 second delay

  } catch (error) {
    console.error('Error submitting score:', error.message);
    if(scoreFeedback) scoreFeedback.html(`Error: ${error.message}`);
    submitScoreButton.removeAttribute('disabled'); // Re-enable button on error
  }
} 