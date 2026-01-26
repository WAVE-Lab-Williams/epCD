# Customizing Parameters

This guide explains how to modify experiment parameters and settings.

## Core Parameters

Edit `src/js/core/params.js` to adjust these key settings:

### Timing Parameters
```javascript
// How long the prompt shows before stimulus (milliseconds)
var PRESTIM_DISP_TIME = 800;

// How long the fixation cross shows (milliseconds)
var FIXATION_DISP_TIME = 500;
```

### Experiment Sections
Toggle which parts of the experiment run:
```javascript
var runIntro = true;    // Welcome, consent, ID collection, fullscreen
var runInstr = true;    // Instructions and demo
var runExpt = true;     // Main experiment trials
var runClose = true;    // Feedback, debrief, completion
var runPreload = true;  // Image preloading (recommended: true)
```

### Participant Information
```javascript
var estTotalRunTime = 5;        // Estimated minutes
var estDollars = 0.9;          // Estimated payment
var participantType = 'prolific'; // 'prolific', 'mturk', or 'sona'
var completionCode = 'C4MF2IV1'; // Your completion code
```

### Display Settings
```javascript
var imgWidth = 150;  // Display width in pixels
// Height calculated automatically to maintain aspect ratio
var imgHeight = (imgWidth / origWidth) * origHeight;
```

## Experimental Design

Edit `src/js/core/timeline.js` to modify the experimental design:

### Stimulus Conditions
```javascript
var poss_circle_colors = ["blue", "orange"];     // Stimulus types
var poss_disp_duration = [200, 500];            // Display durations (ms)
```

### Factorial Design
The experiment uses JSPsych's factorial design:
```javascript
var factors = {
    circle_color: poss_circle_colors,
    disp_duration: poss_disp_duration
}

// Creates all combinations: blue-200ms, blue-500ms, orange-200ms, orange-500ms
var full_design = jsPsych.randomization.factorial(factors, 1);
```

### Repetitions
Change the last parameter in `factorial()` to adjust repetitions:
```javascript
var full_design = jsPsych.randomization.factorial(factors, 3); // 3 repetitions
```

## Response Settings

Edit `src/js/core/trial.js` to modify response collection:

### Response Keys
```javascript
choices: ['f', 'j'],  // Allowed response keys
```

### Response Prompt
```javascript
var persistent_prompt = `<div style="position: fixed; top: 50px; left: 50%; transform: translateX(-50%); text-align: center;">f = blue; j = orange </div>`;
```

### Correct Response Logic
```javascript
correct_response: function(){
    if (stimColor === 'blue') {
        return 'f';
    } else if (stimColor === 'orange') {
        return 'j';
    }
},
```

## Platform-Specific Settings

### For Prolific
```javascript
var participantType = 'prolific';
var completionCode = 'YOUR_PROLIFIC_CODE';
var prolific_url = 'https://app.prolific.co/submissions/complete?cc='+completionCode;
```

### For MTurk
```javascript
var participantType = 'mturk';
// Completion code generated from hitID automatically
```

### For SONA
```javascript
var participantType = 'sona';
// Uses 5-digit portal ID
```

## Advanced Timing

### Trial-Level Timing
In `src/js/core/trial.js`:
```javascript
var dispCircle = {
    // ... other settings
    stimulus_duration: stimDuration,  // How long stimulus shows
    trial_duration: null,             // Max trial time (null = no limit)
    response_ends_trial: true,        // End trial on response
}
```

### Inter-Trial Intervals
Add delays between trials by modifying the timeline push sequence in `src/js/core/trial.js`:
```javascript
// Add an inter-trial interval
var iti = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '',
    choices: "NO_KEYS",
    trial_duration: 1000,  // 1 second blank screen
}

// Push to timeline
timelineTrialsToPush.push(dispCircle);
timelineTrialsToPush.push(iti);  // Add ITI after each trial
```

## Testing Parameter Changes

After making changes:
1. **Save the file**
2. **Refresh** your browser
3. **Run through the experiment** to test changes
4. **Check browser console** for any errors

## Common Parameter Patterns

### Longer Experiment
```javascript
var poss_disp_duration = [100, 200, 300, 500, 800];
var full_design = jsPsych.randomization.factorial(factors, 5); // More repetitions
```

### Faster Paced
```javascript
var PRESTIM_DISP_TIME = 300;   // Shorter pre-stimulus
var FIXATION_DISP_TIME = 200;  // Shorter fixation
```

### More Stimulus Categories
```javascript
var poss_circle_colors = ["red", "blue", "green", "yellow"];
// Remember to add corresponding images and update response mapping
```