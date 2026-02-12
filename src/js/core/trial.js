/*
===============================================================
PUSHING/RUNNING A CUSTOM SINGLE TRIAL (*singleTrial)
===============================================================
*/
function runSingleTrial(
    cupFullness,
    firstCupPosition,
    secondCupPosition,
    tableType,
    stimDuration,
    timelineTrialsToPush,
    trialType,
) {

    /*--------------------------- General Utility ---------------------------*/
    var checkScreen = {
        type: jsPsychFullscreen,
        message:
            '<p>Unfortunately, it appears you are no longer in fullscreen mode. Please make sure to remain in fullscreen mode. <br>Click on the button to fullscreen the experiment again and proceed.</p>',
        fullscreen_mode: true,
        button_label: 'Resume',
    };

    var if_notFull = {
        timeline: [checkScreen],
        conditional_function: function () {
            if (full_check == false) {
                return true;
            } else {
                return false;
            }
        },
    };

    var cursor_off = {
        type: jsPsychCallFunction,
        func: function () {
            document.body.style.cursor = 'none';
        },
    };

    var cursor_on = {
        type: jsPsychCallFunction,
        func: function () {
            document.body.style.cursor = 'auto';
        },
    };

    /*--------------------------- Experiment specific variables ---------------------------*/
    var firstStim = `${stimFolder}cup${cupFullness}_pos${firstCupPosition}_table${tableType}`
    var secondStim =  `${stimFolder}cup${cupFullness}_pos${secondCupPosition}_table${tableType}`
    var persistent_prompt = `<div style="position: fixed; top: 50px; left: 50%; transform: translateX(-50%); text-align: center;">f = same; j = different</div>`;

    var random_y_pos = randomIntFromRange(50, h-imgHeight); // generate a random number that will fall within the screen region (taking into account the image size)

    function dispImage(useStim){
        var actualImage = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus:  function(){
                w =
                    window.innerWidth ||
                    document.documentElement.clientWidth ||
                    document.body.clientWidth;
                var x_pos = (w/2)-(imgWidth/2)
                var display = `<div style="position: absolute; top: ${random_y_pos}px; left: ${x_pos}px;">`+
                `<img src="${useStim}.png" style="width:${imgWidth}px;" />` + 
                `</div>`;
                return display},
            choices: "NO_KEYS",
            trial_duration: stimDuration,
            prompt: `${persistent_prompt}`,
            data: {
                trial_category: 'dispImage'+trialType,
                trial_stimulus: useStim,
                trial_duration: stimDuration,
            }, // data end
            on_finish: function(){
                console.log(useStim, random_y_pos)
            }
        }; // dispCircle end
        return actualImage
    };
    

    var prestim = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `${persistent_prompt}`,
        choices: "NO_KEYS",
        trial_duration: PRESTIM_DISP_TIME,
        data: {
            trial_category: 'prestim_ISI' + trialType,
        }
    };

    var fixation = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `${persistent_prompt}<div style="font-size:60px;">+</div>`,
        choices: "NO_KEYS",
        trial_duration: FIXATION_DISP_TIME,
        data: {
            trial_category: 'fixation' + trialType,
        }
    };

    var mask = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function(){
            w =
                window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth;
            var x_pos = (w/2)-(imgWidth/2)
            var display = `${persistent_prompt}<div style="position: absolute; top: ${random_y_pos}px; left: ${x_pos}px;">`+
            `<img src="${generalFolder}mask.png" style="width:${imgWidth}px;" />` + 
            `</div>`
            return display
        },
        choices: "NO_KEYS",
        trial_duration: MASK_DISP_TIME,
        data: {
            trial_category: 'mask' + trialType,
        }
    };

    var answer = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `${persistent_prompt}`,
        choices: ["f","j"],
        data: {
            trial_category: "answer" + trialType,
            firstStim: firstStim,
            secondStim: secondStim,
            dispImage_duration: stimDuration, // this is to see what the dispImg duration was, otherwise trial_duration would just be null for this answer trial
            cupFullness: cupFullness,
            tableType: tableType,
            y_position: random_y_pos,
            correct_response: function(){
                if (firstStim == secondStim){
                    return "f"
                } else {
                    return "j"
                }
            }
        },
        on_finish: function(data){
            if (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response)){
                data.thisAcc = 1;
            } else {
                data.thisAcc = 0;
            }
            console.log(data.thisAcc)
        } // on finish end
    }



    /*--------------------------- push single trial sequence ---------------------------*/

    timelineTrialsToPush.push(if_notFull);
    timelineTrialsToPush.push(cursor_off);
    timelineTrialsToPush.push(prestim);
    timelineTrialsToPush.push(fixation);
    timelineTrialsToPush.push(dispImage(firstStim));
    timelineTrialsToPush.push(mask); // SWITCH IT BACK TO MASK ONCE YOU HAVE MASK
    timelineTrialsToPush.push(dispImage(secondStim));
    timelineTrialsToPush.push(mask);
    timelineTrialsToPush.push(answer);
    timelineTrialsToPush.push(cursor_on);

}