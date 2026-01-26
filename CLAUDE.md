# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a JSPsych experiment template for psychology/cognitive science research, specifically designed for simple visual perception studies. The experiment presents colored circles (blue/orange) to participants and collects response time and accuracy data.

## Architecture

The codebase follows a modular structure organized in logical directories:

- `index.html` - Main entry point that loads all dependencies and runs the experiment
- `src/js/core/timeline.js` - Core experiment flow and JSPsych initialization 
- `src/js/core/params.js` - Configuration parameters and variables
- `src/js/core/instructions.js` - All text content (consent, instructions, debrief)
- `src/js/core/trial.js` - Single trial logic and stimulus presentation
- `src/js/utils/standard-functions.js` - Utility functions for randomization and URL parsing
- `src/js/integrations/wave-client.js` - WAVE backend integration
- `src/css/styles.css` - Styling
- `src/assets/stimuli/circles/` - Image assets organized by stimulus type

## Key Parameters

Core experiment parameters are defined in `src/js/core/params.js`:
- `stimFolder` - Path to stimulus images (`src/assets/stimuli/circles/`)
- `PRESTIM_DISP_TIME` - Pre-stimulus display duration (800ms)
- `FIXATION_DISP_TIME` - Fixation cross duration (500ms)
- `participantType` - Platform type ('prolific', 'mturk', 'sona')
- `completionCode` - Participant completion code
- Display dimensions are calculated from original image size (300x300) scaled to desired width

## Experiment Flow

The experiment follows this sequence (controlled by boolean flags in params):
1. **Introduction** (`runIntro`): Welcome, consent, ID collection, fullscreen
2. **Instructions** (`runInstr`): Task explanation with example images
3. **Experiment** (`runExpt`): Main trials with factorial design
4. **Closing** (`runClose`): Performance feedback, debrief questions, completion

## Trial Structure

Each trial (defined in `src/js/core/trial.js`) consists of:
1. Fullscreen check
2. Cursor hiding
3. Pre-stimulus display with response prompt
4. Fixation cross
5. Stimulus presentation (blue/orange circle)
6. Response collection ('f' for blue, 'j' for orange)
7. Cursor restoration

## Participant Management

The system supports multiple platforms:
- **Prolific**: Uses PROLIFIC_PID URL parameter
- **MTurk**: Generates completion codes from hitID
- **SONA**: Uses 5-digit portal ID

Worker IDs are captured via URL parameters when available, with manual input as fallback.

## Data Collection

### WAVE Backend Integration
The template includes WAVE client integration in `src/js/integrations/wave-client.js` and `src/js/core/timeline.js`. Key technical details:

- WAVE client initializes automatically from URL parameters (key, experiment_id, participant_id)
- Data logging happens in JSPsych's `on_trial_finish` callback
- Experiment schema must be pre-defined in WAVE backend before data collection
- Falls back to local data display if WAVE unavailable
- See docs/setup/wave-integration.md for user-facing documentation

## Testing/Development

Due to ES6 module imports, the experiment must be served via HTTP:

1. **Setup Node.js environment**:
   ```bash
   nvm use              # Uses Node.js 20 LTS from .nvmrc
   npm install          # Install dependencies
   npm run dev          # Start development server on port 8080
   ```

2. **Access experiment**: Open `http://localhost:8080/` in browser

3. **Development workflow**:
   - Toggle experiment sections using boolean flags in `src/js/core/params.js`
   - Monitor console output using browser developer tools
   - Check stimulus loading by examining the `forPreload` array in timeline.js
   - Use `npm run lint` to check code quality

4. **File structure**: 
   - Core logic in `src/js/core/`
   - Utilities in `src/js/utils/`
   - WAVE integration in `src/js/integrations/`

The experiment uses CDN-hosted JSPsych (v7.3.4) and includes http-server for local development.