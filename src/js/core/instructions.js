/* ----------------------------------------
 Functions for text: instructions, debrief, consent, and id form entry (*fxtext)
-------------------------------------------*/

var welcometext = function() {
    let warningText = '';

    // Check 1: Missing URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasRequiredParams = urlParams.get('key') && urlParams.get('experiment_id') && urlParams.get('participant_id');

    if (!hasRequiredParams) {
        warningText = '<p style="color: #d63384; background: #f8d7da; padding: 8px 12px; border: 1px solid #f5c2c7; border-radius: 4px; margin: 10px 0; font-size: 14px;"><strong>⚠️ Data Logging Disabled:</strong> Your responses will not be saved. Please ensure your URL includes the required parameters: <code style="background: rgba(0,0,0,0.1); padding: 1px 3px; font-size: 12px;">https://yoursite.com/?key=YOUR_API_KEY&experiment_id=YOUR_EXPERIMENT_ID&participant_id=PARTICIPANT_ID</code></p>';
    }

    // Add container for WAVE connection status warning (will be populated async)
    warningText += '<div id="wave-connection-warning"></div>';
    
    return "<div style='display: inline-block; margin: 0 auto; padding: 10px 200px 10px 200px; text-align: left'>" +
        '<p>Welcome to the experiment.</p><p>Please make sure you are completing the experiment on a LAPTOP or COMPUTER. ' +
        'You will <b>not</b> be able to complete this experiment on a phone or tablet.</p>' +
        warningText +
        '</div>';
};

function requestIDinput(participantType, workerID) {
    if (participantType == 'sona') {
        var insert =
            'SONA Portal ID (not your Williams ID) -- this should be a 5 digit number with no letters';
    } else {
        var insert = participantType + ' ID';
    }

    if (workerID.startsWith('manual')){
        console.log('Query-captured workerID requires manual input.')
        var inputbox =
            '<p>Please enter your initials (no spaces, no punctuation): ' +
            ":</p><br><input required='true' autofocus='true' name='numberID' type='text' size='70' />";
    } else if (workerID != 'no_query' && workerID != undefined) {
        console.log(workerID);
        var inputbox =
            '<p>Please enter your participant ID for this experiment: ' +
            ":</p><br><input required='true' autofocus='true' name='numberID' type='text' size='70' value='" +
            workerID +
            "' />";
    } else {
        console.log('workerID capture via Query has failed');
        var inputbox =
            '<p>Please provide your ' +
            insert +
            ":</p><br><input required='true' autofocus='true' name='numberID' type='text' size='70' />";
    }

    var text =
        "<div style='display: inline-block; margin: 0 auto; padding: 10px 200px 10px 200px; text-align: left'>";
    text += inputbox;
    text +=
        '<p>(Note: Depending on the way you accessed this link, you may find that your ID is already entered into the box for your convenience, but please double-check if this number is correct before proceeding.)</p>';
    text += '</div>';

    return text;
} // end requestID input

var fullscreenMessage = `<p>This experiment needs to be run in “fullscreen” mode, rather than a small browser window. Please click the button below to automatically send the browser into fullscreen mode. It is very important that you <b>stay in fullscreen throughout the entire experiment</b>. And do not worry: When the experiment is done, we will turn fullscreen mode back off again. Thank you.</p>`

function loadInstrContent() {
    var instrContent = [
        /* ind0 */ '<p>Hello! Thank you for participating in our study. Please take a moment to adjust your seating so that you can comfortably watch the monitor and use the keyboard. Feel free to dim the lights as well.</p><p>Close the door or do whatever is necessary to <b>minimize disturbance during the experiment</b>. Please also take a moment to silence your phone so that you are not interrupted by any messages mid-experiment. Do <i>not</i> switch to any other tabs or windows until you are complete.</p>',
        /* ind1 */ `<p>In this quick experiment, you will see an image of a circle flash on screen. The circle will either be <b>orange</b> or <b>blue</b>, as shown below:</p><p><div style='text-align: center'><img src="${stimFolder}demo-circles.png" height="${imgHeight}"/></div></p>`,
        /* ind2 */ `<p>These images will flash on screen for only a short amount of time, so pay close attention!</p><p>Your task is straightforward: If the circle is <strong>blue</strong>, <strong><i>press "f"</i></strong> on the keyboard as quickly as you can. But if the circle is <strong>orange</strong>, <strong><i>press "j"</i></strong> as quickly as you can.</p><p>Let's give this a try now! Press the button below when you're ready to practice this once!</p>`,
        /* ind3 */ `<p>Good work so far.</p><p>Sometimes, you may be unsure of your answer. This is okay, since the task is designed to be difficult, as images flash quickly!  In times like this, just give it your <b>best guess</b>, as we are interested in your <i>gut intuition</i>.</p><p>Please do your very best to remain as focused and attentive as possible, even at the end of the experiment. I know it is very difficult to stay focused for so long, especially when you are doing the same thing over and over. But remember, the experiment will be all over in less than ${String(estTotalRunTime)} minutes. Press the button below to begin.`,
    ];

    for (var i = 0; i < instrContent.length; i++) {
        instrContent[i] =
            "<div style='display: inline-block; margin: 0 auto; padding: 10px 200px 10px 200px; text-align: left'>" +
            instrContent[i] +
            '</div>';
    }
    return instrContent;
} // end function

function consentForm(participantType) {
    if (participantType == 'sona') {
        var consentContent =
            "<h5>USE ARROW KEYS TO SCROLL DOWN, AND PRESS 'Y' TO CONSENT.<br>In order to run this study, we need to include the standard consent form below.</h5><h1>Consent for Participation in a Research Study</h1><div style='width: 100%; text-align: center'><div style='display: inline-block; margin: 0 auto; padding: 10px 200px 10px 200px; text-align: left'><h5>STUDY TITLE</h5><p>Perceiving Objects and Events</p>" +
            '<h5>RESEARCH STUDY SUMMARY, RISKS, AND BENEFITS</h5><p>Thank you for volunteering to participate in this research study. The purpose of this study is to better understand how we see and how we think. Study activities will include examining simple displays and then responding by answering questions, pressing some keys, or using a computer mouse. Because these are activities that many people already experience hundreds or thousands of times every day, there are no risks involved in this study. The study may have no benefits to you, but it may help the scientific community come to better understand how the human mind works. Taking part in this study is your choice. You can choose to take part, or you can choose not to take part in this study. You can also change your mind at any time, with no penalty.</p><h5>DURATION</h5><p>If you agree to take part, the study will last approximately <strong> ' +
            String(estTotalRunTime) +
            ' minutes</strong>.</p>' +
            '<h5>COSTS AND COMPENSATION</h5><p>There are no costs associated with participation in this study. You will receive <strong>' +
            String(0.5) +
            ' credits</strong> for participating.</p><h5>CONFIDENTIALITY</h5><p>No personally identifying information will be collected, so your participation will be anonymous. The survey is anonymous. We will not know your name. We will not be able to connect any identifying information to your survey answers. However, we will know your mTurk number in order to pay you for your time. We will keep the information about your participation in this research confidential. Your data will be pooled with those from other participants, and may be included in scientific publications and uploaded to public data repositories.</p>' +
            '<h5>LEARNING MORE</h5><p>If you have questions about this study, you may contact your experimenter Kimberly Wong at kww3@williams.com. If you have questions about your rights as a research participant, or you have complaints about this research, you can contact the current chair of the Williams Institutional Review Board at: ksavitsk@williams.edu.</p><h5>INFORMED CONSENT</h5><p>Your participation indicates that you have read and understood this consent form and the information presented and that you agree to be in this study.</p></div></div>';
    } else {
        var consentContent =
            "<h5>USE ARROW KEYS TO SCROLL DOWN, AND PRESS 'Y' TO CONSENT.<br>In order to run this study, we need to include the standard consent form below.</h5><h1>Consent for Participation in a Research Study</h1><div style='width: 100%; text-align: center'><div style='display: inline-block; margin: 0 auto; padding: 10px 200px 10px 200px; text-align: left'><h5>STUDY TITLE</h5><p>Perceiving Objects and Events</p>" +
            '<h5>RESEARCH STUDY SUMMARY, RISKS, AND BENEFITS</h5><p>Thank you for volunteering to participate in this research study. The purpose of this study is to better understand how we see and how we think. Study activities will include examining simple displays and then responding by answering questions, pressing some keys, or using a computer mouse. Because these are activities that many people already experience hundreds or thousands of times every day, there are no risks involved in this study. The study may have no benefits to you, but it may help the scientific community come to better understand how the human mind works. Taking part in this study is your choice. You can choose to take part, or you can choose not to take part in this study. You can also change your mind at any time, with no penalty.</p><h5>DURATION</h5><p>If you agree to take part, the study will last approximately <strong> ' +
            String(estTotalRunTime) +
            ' minutes</strong>.</p>' +
            '<h5>COSTS AND COMPENSATION</h5><p>There are no costs associated with participation in this study. You will receive <strong>' +
            String(estDollars) +
            " dollars</strong> for participating.</p><h5>CONFIDENTIALITY</h5><p>No personally identifying information will be collected, so your participation will be anonymous. The survey is anonymous. We will not know your name. We will not be able to connect any identifying information to your survey answers. However, (if you are accessing this experiment through mTurk), we will know your mTurk number in order to pay you for your time. Your mTurk number could possibly be connected to your public profile, which could, in theory, be searched. We want to stress that we will not be looking at anyone's public profiles. We will keep the information about your participation in this research confidential. Your data will be pooled with those from other participants, and may be included in scientific publications and uploaded to public data repositories.</p>" +
            '<h5>LEARNING MORE</h5><p>If you have questions about this study, you may contact your experimenter Kimberly Wong at kww3@williams.com. If you have questions about your rights as a research participant, or you have complaints about this research, you can contact the the current chair of the Williams Institutional Review Board at: ksavitsk@williams.edu.</p><h5>INFORMED CONSENT</h5><p>Your participation indicates that you have read and understood this consent form and the information presented and that you agree to be in this study.</p></div></div>';
    }
    return consentContent;
}

function debriefForm() {
    var debriefContent =
        "<div style='width: 50%; text-align: left; margin: 0 auto'>" +
        '<p>Great work. Finally, we just have a couple things for you to answer.<br>' +
        '<p>Age: <br><input required="true" name="age" type="number" style="width: 20%; border-radius: 4px; padding: 10px 10px; margin: 8px 0; border: 1px solid #ccc; font-size: 15px"/>' +
        '<p>Please indicate your biological sex:<br><input required="true" type="radio" id="male" name="gender" value="male"><label for="male">Male</label><br><input required="true" type="radio" id="female" name="gender" value="female"><label for="female">Female</label><br><input required="true" type="radio" id="other" name="gender" value="other"><label for="other">Other</label><br><input required="true" type="radio" id="no_say" name="gender" value="no_say"><label for="no_say">I prefer not to say</label>' +
        '<p>In 1-2 sentences, did you notice yourself using any particular strategies or noticing any patterns throughout the task? <br><input required="true" name="strategies" type="text" size="50" style="width: 100%; border-radius: 4px; padding: 10px 10px; margin: 8px 0; border: 1px solid #ccc; font-size: 15px"/>' +
        '<p>In 1-2 sentences, what do you think this experiment was testing? <br><input required="true" name="experiment" type="text" size="50" style="width: 100%; border-radius: 4px; padding: 10px 10px; margin: 8px 0; border: 1px solid #ccc; font-size: 15px"/>' +
        '<p>Anything else to share (did any of the images get cut off on your screen, or just additional thoughts, etc.)? <br><input required="true" name="final" type="text" size="50" style="width: 100%; border-radius: 4px; padding: 10px 10px; margin: 8px 0; border: 1px solid #ccc; font-size: 15px"/></p>' +
        '<p>We know it is generally difficult to stay focused in online experiments. On a scale of 1-100 (with 1 being very distracted, and 100 being very focused), how well did you pay attention to the experiment?  (Whatever you respond with will NOT affect whether you receive credit or compensation). <br><input required="true" name="attention" type="number" max="100" style="width: 20%; border-radius: 4px; padding: 10px 10px; margin: 8px 0; border: 1px solid #ccc; font-size: 15px"></p>' +
        '</div>';
    return debriefContent;
}

function closingText(participantType) {
    var base =
        'Thank you so much for your contribution to science! The experiment has concluded. Please contact kww3@williams.com if you have any further questions.';
    var addition = '';
    if (participantType == 'mturk') {
        var rand_code = hitID + String(code) + participantID;
        var addition =
            '<p>Here is your <b>unique</b> code: ' +
            rand_code +
            '</p><p>To recieve payment for this experiment, you must take this code back to the page that directed you here. Enter the code into the box there. If you encounter problems during this step, please contact the email above.';
    } else if (participantType == 'prolific') {
        var addition =
            `<p>For your convenience, you will find your completion code in a new tab <b>after you press the Spacebar</b>. Alternatively, here is the code for you to enter manually: <b>${completionCode}</b>. If you encounter any problems during this step, please contact the email above.`;
    } else if (participantType == 'sona') {
        var addition =
            "<p>If you're interested in learning more about this experiment, please see the following google doc, and do not hesitate to reach out! Thank you for participating.</p><p>https://docs.google.com/document/d/1WxqXB8pD6Fv7XpP7IS3HsYDqlxJ-yT4M/edit?usp=sharing&ouid=109087269691106150998&rtpof=true&sd=true</p>";
    }
    return base + addition;
}
