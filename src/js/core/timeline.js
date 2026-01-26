/*
===============================================================
Table of Contents (*TOC)
===============================================================
1. JSPsych Init, and onFinish (*sec_init)
2. Introduction Section (*sec_intro)
    2a. Push Intro Trials to timeline_intro (*push_intro)
3. Instruction Section + Demo Trials (*sec_instr)
    3a. Set Preload Images for Instr + Demo (*preload_instr)
    3b. Push Instr Trials to timeline_instr (*push_instr)
4. Experiment Section (*sec_expt)
    4a. Define Factors + Expt Design (*factors)
    4b. Set Preload Images for Experiment
    4c. Determine Expt Trials + logic (*exptTrials)
5. Closing Section (*sec_closing)
6. Run Expt (*sec_run)
    6a. Define Preload plugin
    6b. Combine all timelines


*/

/*
===============================================================
JSPsych Init, and onFinish (*sec_init)
===============================================================
*/

/* initialize jsPsych */
var jsPsych = initJsPsych({
    on_trial_finish: function(data) {
        // console.log(JSON.stringify(data));
        data.participant_id = workerID;
        
        // Process data through WAVE client if available
        if (window.waveClient) {
            window.waveClient.processTrialData(data);
        }
    },
    on_finish: function() {
        // Handle experiment completion through WAVE client if available
        if (window.waveClient) {
            window.waveClient.handleCompletion();
        } else {
            jsPsych.data.displayData();
        }
    },
    on_interaction_data_update: function () {
        var interaction_data = jsPsych.data
            .getInteractionData()
            .last(1)
            .values()[0].event;
        if (interaction_data == 'fullscreenexit') {
            console.log('Fullscreen Exit detected');
            full_check = false;
        } else if (interaction_data == 'fullscreenenter') {
            console.log('Fullscreen problem now solved');
            full_check = true;
        }
    },
});

/*
===============================================================
Introduction Section (*sec_intro)
===============================================================
*/

var welcome = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        return welcometext();
    },
    choices: ['Next'],
    data: {
        trial_category: 'welcome',
        screenWidth: String(w),
        screenHeight: String(h),
        clock: function () {
            var startTime = new Date().toLocaleString('en-US', {
                timeZone: 'America/New_York',
            });
            console.log('Start Time' + startTime);
            return startTime;
        }, // clock ends
    }, // data ends
    on_finish: function() {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            console.log("Uh oh, this is a mobile device");
        } else {
            console.log("Desktop device");
        }
    }, // on_finish ends
};

var consent = {
    type: jsPsychHtmlKeyboardResponse,
    choices: ['y'],
    stimulus: consentForm(participantType),
    prompt: '<h3>PRESS THE Y KEY TO CONSENT</h3><p></p><p></p>',
    data: { trial_category: 'consent' },
};

// First check for PROLIFIC_PID, then participant_id, then generate random
var workerID = getURLParameter('PROLIFIC_PID');
if (workerID === 'no_query') {
    workerID = getURLParameter('participant_id');
}

if (workerID !== 'no_query') {
    console.log('Worker singID captured from URL:', workerID);
} else {
    workerID = 'no_query_worker'+ Math.floor(Math.random() * 90000) + 10000;
    console.warn('⚠️ No participant ID found in URL - randomly generated:', workerID);
}

var id = {
    type: jsPsychSurveyHtmlForm,
    html: requestIDinput(participantType, workerID),
    button_label: ['Submit'],
    data: { trial_category: 'id_info' },
    on_finish: function (data) {
        var respObj = data.response;
        for (var key in respObj) {
            if (respObj[key] == workerID) {
                console.log(
                    'The manual type matches the query capture, going with query input.',
                );
            } else if (workerID.startsWith('no_query')) {
                console.log(
                    `The query was not successfully captured, or there was nothing to query, going with manual input. workerID now = ${respObj[key]}`,
                );
                workerID = respObj[key];
            } else if (workerID.startsWith('manual_input')) {
                console.log(`The query designates to go with the manual input. workerID now = ${respObj[key]}`)
                workerID = respObj[key]
            } else {
                console.log(
                    'The manual type differed from the query capture, going with query capture. Assuming the manual input was the wrong one, and that query was correct.',
                );
            }
        } /*end of for loop*/
    } /*end of on_finish*/,
}; /* end of id*/

/* ------- timeline intro push (*push_intro) -------------- */
timelineintro.push(welcome);
timelineintro.push(consent);
timelineintro.push(id);
timelineintro.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: fullscreenMessage,
    on_finish: function () {
        full_check = true;
    },
});

/*
===============================================================
INSTR PROCEDURE (*sec_instr)
===============================================================
*/

/* -------  Set Preload Images for Instr + Demo (*preload_instr) -------------- */

forPreload.push(`${stimFolder}demo-circles.png`);
// make sure to load any images you need for the demo itself. Usually you have different demo images than the main expt, such that you don't give away the content of the expt itself (but still give the participant practice and familiarity with the task. In this case, though, the demo images themselves are identical to the main expt. Variable names are the only difference.
var demo_circle_colors = ["blue","orange"];
var demo_display_durations = [200, 500];
for (var i = 0; i < demo_circle_colors.length; i++) {
    forPreload.push(`${stimFolder}${demo_circle_colors[i]}-circle.png`);
}

//decide what the parameters for the demo trial should be. Sometimes you hardcode this, sometimes you randomly choose from the options you defined above.
var thisDemoCircle = randomChoice(demo_circle_colors,1)[0];
var thisDemoDispDuration = randomChoice(demo_display_durations,1)[0];

/* -------  Push Instr + Demo Trials to timeline_instr (*push_instr) -------------- */
var instrContent = loadInstrContent();
var demoTrialIndex = 3;
var [instrContent_beforedemo,instrContent_afterdemo] = cutArray(instrContent,3);

var instructions1 = {
    type: jsPsychInstructions,
    pages: instrContent_beforedemo,
    show_clickable_nav: true,
    allow_keys: false,
    allow_backward: false,
    delay_time: function(){
        const calculated_delays = [];
        for (let i = 0; i < instrContent.length; i++) {
            calculated_delays.push(calculate_delay_time(count_words(instrContent[i]),60));
        }
        return calculated_delays
    }, // end delay_time
};

var instructions2 = {
    type: jsPsychInstructions,
    pages: instrContent_afterdemo,
    show_clickable_nav: true,
    allow_keys: false,
    allow_backward: false,
    delay_time: function(){
        const calculated_delays = [];
        for (let i = demoTrialIndex; i < instrContent.length; i++) {
            calculated_delays.push(calculate_delay_time(count_words(instrContent[i]),60));
        }
        return calculated_delays
    }, // end delay_time
};

timelineinstr.push(instructions1);
runSingleTrial(thisDemoCircle,thisDemoDispDuration,timelineinstr,"prac") // pushesyour demo trial
timelineinstr.push(instructions2);

/*
===============================================================
EXPERIMENT SECTION (*sec_expt)
===============================================================
*/

/* -------- defining factors && exptdesign (*factors) --------*/

var poss_circle_colors = ["blue","orange"];
var poss_disp_duration = [200, 500];

var factors = {
    circle_color: poss_circle_colors,
    disp_duration: poss_disp_duration
}

var full_design = jsPsych.randomization.factorial(factors, 1);
console.log(full_design);

/* -------  Set Preload Images for Expt (*preload_expt) -------------- */
for (var i = 0; i < poss_circle_colors.length; i++) {
    forPreload.push(`${stimFolder}${poss_circle_colors[i]}-circle.png`);
}

/* ------- timeline expt push (*pushExpt ) -------------- */
for (var elem = 0; elem < full_design.length; elem++) {
    runSingleTrial(
        full_design[elem].circle_color,
        full_design[elem].disp_duration,
        timelineexpt,
        'expt',
    );
}

/*
===============================================================
CLOSING SECTION (*sec_closing)
===============================================================
*/

var feedback_summary = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {

    var trials = jsPsych.data.get().filter({trial_category: 'answerexpt'});
    var correct_trials = trials.filter({thisAcc: 1});
    var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
    var rt = Math.round(correct_trials.select('rt').mean());

    return `<p>You responded correctly on ${accuracy}% of the trials.</p>
        <p>Your average response time was ${rt}ms.</p>
        <p>Press any key to continue to the next part of the study.</p>`;
    }
};

var debrief_qs = {
    type: jsPsychSurveyHtmlForm,
    html: debriefForm(),
    button_label: ['Submit'],
    data: {
        trial_category: 'debrief',
        endTime: function () {
            var endTime = new Date().toLocaleString('en-US', {
                timeZone: 'America/New_York',
            });
            console.log('End Time' + endTime);
            return endTime;
        },
    } // data ends
}

var closing = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: closingText(participantType),
    choices: [' '],
    data: { trial_category: 'closing' },
    on_finish: function(){
        if (participantType == 'prolific') {
            window.open(prolific_url, '_blank');
        }
    }, // on finish complete
};

timelineclose.push(feedback_summary);
timelineclose.push(debrief_qs);
timelineclose.push({ type: jsPsychFullscreen, fullscreen_mode: false });
timelineclose.push(closing);

/*
===============================================================
Run Expt (*sec_run)
===============================================================
*/

if (runPreload) {
    var preload = {
        type: jsPsychPreload,
        images: forPreload,
    }
    timelinebase = timelinebase.concat(preload);
}

if (runIntro) { timelinebase = timelinebase.concat(timelineintro) }
if (runInstr) { timelinebase = timelinebase.concat(timelineinstr) }
if (runExpt) { timelinebase = timelinebase.concat(timelineexpt) }
if (runClose) { timelinebase = timelinebase.concat(timelineclose) }

jsPsych.run(timelinebase);