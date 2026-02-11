/*
===============================================================
WAVE Client Setup and Integration
===============================================================
This module handles WAVE client initialization and data logging
for JSPsych experiments. It extracts required parameters from URL
and provides logging functionality.

⚠️  CRITICAL REQUIREMENT: EXPERIMENT SCHEMA MUST BE DEFINED FIRST ⚠️
Before using this template with WAVE data logging, you MUST:
1. Define your experiment schema in the WAVE backend
2. Specify all data columns that will be collected
3. Get the experiment_id (UUID) from the backend
4. Only then can you collect data - the backend will reject data 
   that doesn't match the predefined schema

Required URL Parameters:
- key: WAVE API key
- experiment_id: Experiment UUID from WAVE backend (schema must exist!)
- participant_id: Unique participant identifier (or PROLIFIC_PID for Prolific platform)

Example URLs:
runexperiment.html?key=your_api_key&experiment_id=experiment_uuid&participant_id=P001
runexperiment.html?key=your_api_key&experiment_id=experiment_uuid&PROLIFIC_PID=5f8c3a2b1d9e4f

Note: PROLIFIC_PID is checked first, then participant_id. Either one will work.

For more information: https://github.com/WAVE-Lab-Williams/wave-client/
*/

import WaveClient from 'https://cdn.jsdelivr.net/gh/WAVE-Lab-Williams/wave-client@v1.1.0/javascript/dist/wave-client.esm.js';

// Extract URL parameters
const urlParams = new URLSearchParams(window.location.search);
const WAVE_API_KEY = urlParams.get('key');
const EXPERIMENT_ID = urlParams.get('experiment_id') || null;
// Handle edge case: treat empty string as null to avoid overriding user input
// Check for PROLIFIC_PID first (Prolific platform), then fall back to participant_id
const PARTICIPANT_ID = urlParams.get('PROLIFIC_PID') || urlParams.get('participant_id') || null;

// Global variables for WAVE integration
let waveClient = null;
let waveEnabled = false;

// Function to update connection warning in the UI
function updateConnectionWarning(message) {
    const warningElement = document.getElementById('wave-connection-warning');
    if (warningElement) {
        warningElement.innerHTML = message;
    }
}


// Initialize WAVE client
function initializeWaveClient() {
    console.log('🔍 Initializing WAVE Client...');
    console.log('API Key:', WAVE_API_KEY ? 'Found' : 'Missing');
    console.log('Experiment ID:', EXPERIMENT_ID || 'Missing');
    console.log('Participant ID:', PARTICIPANT_ID || 'Missing');

    if (!WAVE_API_KEY || !EXPERIMENT_ID) { 
        console.warn('⚠️ WAVE parameters missing. Data will only be displayed locally.');
        console.warn('Required URL format: https://yoursite.com/?key=YOUR_API_KEY&experiment_id=YOUR_EXPERIMENT_ID');
        if (!PARTICIPANT_ID){
            console.warn('No participant_id nor PROLIFIC_PID provided. Will default to manual input, but will still save data')
        }
        return false;
    }

    try {
        waveClient = new WaveClient({
            apiKey: WAVE_API_KEY,
            baseUrl: waveBackendUrl
        });

        // Test connection
        waveClient.getHealth().then(health => {
            console.log('✅ WAVE backend connected:', health);
            console.log('⚠️ REMINDER: Verify experiment schema exists for experiment_id:', EXPERIMENT_ID);
            waveEnabled = true;
            // Clear any connection warning since we're now connected
            updateConnectionWarning('');
        }).catch(error => {
            console.warn('⚠️ WAVE backend connection failed:', error.message);
            console.warn('Data will only be displayed locally.');
            // Show connection failure warning
            updateConnectionWarning('<p style="color: #d63384; background: #f8d7da; padding: 8px 12px; border: 1px solid #f5c2c7; border-radius: 4px; margin: 10px 0; font-size: 14px;"><strong>⚠️ WAVE Backend Connection Failed:</strong> URL parameters are present but unable to connect to WAVE backend. Your responses will not be saved. Please check your API key and network connection.</p>');
        });

        return true;
    } catch (error) {
        console.error('❌ Failed to initialize WAVE client:', error.message);
        return false;
    }
}

// Log experiment data to WAVE backend
async function logToWave(data, experiment_id, participant_id) {
    if (!waveEnabled || !waveClient) {
        return null;
    }

    try {
        const response = await waveClient.logExperimentData(experiment_id, participant_id, data);
        console.log('✅ Data logged to WAVE:', response);
        return response;
    } catch (error) {
        console.error('❌ Failed to log data to WAVE:', error);
        console.error('❌ Data that failed to log:', data);
        console.error(
          '❌ This may indicate experiment schema mismatch, missing schema definition,',
          'or too many writes to the backend in close proximity'
        );
        return null;
    }
}

// Enhanced JSPsych data processing
function processTrialData(data) {
    // Add WAVE-specific standard fields
    // checks if PARTICIPANT_ID (pulled from URL) is "null"
    // if yes, uses data.participant_id (input during experiment) instead
    // ensures fields are explicitly null (not undefined) for consistent output
    data.participant_id = PARTICIPANT_ID ?? data.participant_id ?? null;
    data.experiment_id = EXPERIMENT_ID ?? data.experiment_id ?? null;
    data.timestamp = new Date().toISOString();
    data.user_agent = navigator.userAgent;

    // Log to WAVE if experiment trial
    if (data.trial_category && data.trial_category.includes('expt')) {
        // ⚠️ IMPORTANT: Modify these fields to match your experiment's data structure!
        // The fields below must align with the schema you defined in the WAVE backend.
        const waveData = {
            trial_number: data.trial_index,
            trial_type: data.trial_type,
            trial_category: data.trial_category,
            stimulus: data.stimulus,
            response: JSON.stringify(data.response),
            response_time: data.rt,
            accuracy: data.thisAcc,
            correct_response: data.correct_response,
            stimulus_duration: data.trial_duration,
            time_elapsed: data.time_elapsed,
            timestamp: data.timestamp,
            user_agent: data.user_agent
        };

        logToWave(waveData, data.experiment_id, data.participant_id);
    }

    return data;
}

// Enhanced JSPsych completion handler
function handleExperimentCompletion() {
    console.log('🎯 Experiment completed');
    
    if (waveEnabled) {
        console.log('✅ All data has been logged to WAVE backend');
        // Show success message
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h2 style="color: #28a745;">✅ Experiment Complete</h2>
                <p>Your data has been successfully logged, thank you for participating!</p>
            </div>
        `;
    } else {
        console.log('📊 Data displayed locally only (WAVE not available)');
        
        // Log data to console for easy copy/paste
        const allData = jsPsych.data.get().values();
        console.log('🔍 All experiment data:', allData);
        
        // Original JSPsych data display
        jsPsych.data.displayData();
    }
}

// Initialize WAVE client when script loads
const waveInitialized = initializeWaveClient();

// Export functions for use in main experiment
window.waveClient = {
    enabled: () => waveEnabled,
    log: logToWave,
    processTrialData: processTrialData,
    handleCompletion: handleExperimentCompletion
};

console.log('📡 WAVE Client setup complete');