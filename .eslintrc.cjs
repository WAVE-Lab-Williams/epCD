module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-undef': 'warn',
        'no-redeclare': 'warn',
        'no-extra-semi': 'warn'
    },
    globals: {
        jsPsych: 'readonly',
        initJsPsych: 'readonly',
        jsPsychHtmlButtonResponse: 'readonly',
        jsPsychHtmlKeyboardResponse: 'readonly',
        jsPsychSurveyHtmlForm: 'readonly',
        jsPsychFullscreen: 'readonly',
        jsPsychInstructions: 'readonly',
        jsPsychPreload: 'readonly',
        jsPsychImageKeyboardResponse: 'readonly',
        jsPsychCallFunction: 'readonly'
    }
};