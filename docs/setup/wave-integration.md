# WAVE Client Integration for Experiment Template

This JSPsych experiment template has been integrated with the WAVE client for automated data logging to the WAVE backend system.

## 🚀 Recommended Setup: Use the Setup Notebook

**The easiest way to set up WAVE integration is using our interactive setup notebook:**

- Located at `tools/setup_experiment.ipynb`
- Automatically handles schema definition, experiment creation, and validation
- Guides you through the complete setup process step-by-step
- See [Getting Started Guide](getting-started.md) for notebook setup instructions

## Manual Setup (Advanced Users)

### ⚠️ CRITICAL REQUIREMENTS

**If setting up manually, you MUST:**

1. **Define your experiment schema in the WAVE backend first**
   - All data columns must be pre-defined
   - Get the experiment UUID from the backend
   - The backend will reject data that doesn't match the schema

2. **Include required URL parameters**
   - `key` - Your WAVE API key (EXPERIMENTEE-level)
   - `experiment_id` - The experiment UUID from WAVE backend
   - `participant_id` - Unique identifier for each participant

## Backend Configuration

The WAVE backend URL is configured in `src/js/core/params.js`:

```javascript
// WAVE Backend Configuration  
var waveBackendUrl = 'https://wave-backend-production-8781.up.railway.app';
// var waveBackendUrl = 'http://localhost:8000';  // For local development
```

To switch between production and development:
- **Production**: Use the Railway URL (default)
- **Development**: Comment out production line, uncomment localhost line

## Quick Start

### Step 1: Set up your experiment in WAVE backend
```bash
# Example: Create experiment with required columns
# This must be done through the WAVE backend interface
```

### Step 2: Run your experiment with proper URL
```
http://localhost:8080/?key=your_api_key&experiment_id=experiment_uuid&participant_id=P001
```

**Note**: You must use the development server (`npm run dev`) - the experiment cannot be opened directly as a file due to ES6 module imports.

### Step 3: Data is automatically logged
The template will automatically log experiment data to WAVE including:
- Trial responses and reaction times
- Stimulus information  
- Accuracy scores
- Timestamps and browser info

## Data Schema

The template automatically sends these fields to WAVE:
- `trial_number` - Sequential trial number
- `trial_type` - Type of trial (e.g., 'answerexpt')
- `stimulus` - Stimulus file path
- `response` - Participant's key response ('f' or 'j')
- `response_time` - Reaction time in seconds
- `accuracy` - Boolean: true if correct
- `correct_response` - Expected correct response
- `stimulus_duration` - Duration stimulus was displayed (ms)
- `timestamp` - ISO timestamp
- `user_agent` - Browser information

## Development/Testing

### Local Server Setup
Due to ES6 module imports, you must serve the files via HTTP:

```bash
# Install and start development server
npm install
npm run dev
```

Then open: `http://localhost:8080/`

### Testing Without WAVE Backend:
- Run without URL parameters (`http://localhost:8080/`)
- Data will be displayed locally via JSPsych
- Console will show WAVE integration warnings

## Troubleshooting

**"Failed to log data to WAVE" errors:**
- Check experiment schema exists in WAVE backend
- Verify experiment_id matches backend
- Ensure all required columns are defined
- Check API key validity

**Console shows "WAVE parameters missing":**
- Add required URL parameters: key, experiment_id, participant_id
- Check URL parameter spelling and format

**Backend connection failed:**
- Check the backend URL is correct in `src/js/core/params.js`
- For production: `waveBackendUrl = 'https://wave-backend-production-8781.up.railway.app'`
- For local development: `waveBackendUrl = 'http://localhost:8000'`
- Verify WAVE backend is running and accessible
- Check network connectivity
- Verify API key permissions

## More Information

- WAVE Client Documentation: https://github.com/WAVE-Lab-Williams/wave-client/
- JSPsych Documentation: https://www.jspsych.org/