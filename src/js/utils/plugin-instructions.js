var jsPsychInstructions = (function (jspsych) {
  'use strict';

  var version = "2.1.0";

  const info = {
    name: "instructions",
    version,
    parameters: {
      /** Each element of the array is the content for a single page. Each page should be an HTML-formatted string.  */
      pages: {
        type: jspsych.ParameterType.HTML_STRING,
        default: void 0,
        array: true
      },
      /** This is the key that the participant can press in order to advance to the next page. This key should be
       * specified as a string (e.g., `'a'`, `'ArrowLeft'`, `' '`, `'Enter'`). */
      key_forward: {
        type: jspsych.ParameterType.KEY,
        default: "ArrowRight"
      },
      /** This is the key that the participant can press to return to the previous page. This key should be specified as a
       * string (e.g., `'a'`, `'ArrowLeft'`, `' '`, `'Enter'`). */
      key_backward: {
        type: jspsych.ParameterType.KEY,
        default: "ArrowLeft"
      },
      /** If true, the participant can return to previous pages of the instructions. If false, they may only advace to the next page. */
      allow_backward: {
        type: jspsych.ParameterType.BOOL,
        default: true
      },
      /** If `true`, the participant can use keyboard keys to navigate the pages. If `false`, they may not. */
      allow_keys: {
        type: jspsych.ParameterType.BOOL,
        default: true
      },
      /** If true, then a `Previous` and `Next` button will be displayed beneath the instructions. Participants can
       * click the buttons to navigate. */
      show_clickable_nav: {
        type: jspsych.ParameterType.BOOL,
        default: false
      },
      /** If true, and clickable navigation is enabled, then Page x/y will be shown between the nav buttons. */
      show_page_number: {
        type: jspsych.ParameterType.BOOL,
        default: false
      },
      /** The text that appears before x/y pages displayed when show_page_number is true.*/
      page_label: {
        type: jspsych.ParameterType.STRING,
        default: "Page"
      },
      /** The text that appears on the button to go backwards. */
      button_label_previous: {
        type: jspsych.ParameterType.STRING,
        default: "Previous"
      },
      /** The text that appears on the button to go forwards. */
      button_label_next: {
        type: jspsych.ParameterType.STRING,
        default: "Next"
      },
      /** Time in milliseconds that must elapse before participant can navigate away from each page.
       * Can be a single integer (applies to all pages) or an array of integers (one per page). */
      delay_time: {
        type: jspsych.ParameterType.INT,
        default: 0,
        array: true
      },
      /** The callback function when page changes */
      on_page_change: {
        type: jspsych.ParameterType.FUNCTION,
        pretty_name: "Page change callback",
        default: function(current_page) {
        }
      }
    },
    data: {
      /** An array containing the order of pages the participant viewed (including when the participant returned to previous pages)
       *  and the time spent viewing each page. Each object in the array represents a single page view,
       * and contains keys called `page_index` (the page number, starting with 0) and `viewing_time`
       * (duration of the page view). This will be encoded as a JSON string when data is saved using the `.json()` or `.csv()`
       * functions.
       */
      view_history: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        nested: {
          page_index: {
            type: jspsych.ParameterType.INT
          },
          viewing_time: {
            type: jspsych.ParameterType.INT
          }
        }
      },
      /** The response time in milliseconds for the participant to view all of the pages. */
      rt: {
        type: jspsych.ParameterType.INT
      }
    },
    // prettier-ignore
    citations: {
      "apa": "de Leeuw, J. R., Gilbert, R. A., & Luchterhandt, B. (2023). jsPsych: Enabling an Open-Source Collaborative Ecosystem of Behavioral Experiments. Journal of Open Source Software, 8(85), 5351. https://doi.org/10.21105/joss.05351 ",
      "bibtex": '@article{Leeuw2023jsPsych, 	author = {de Leeuw, Joshua R. and Gilbert, Rebecca A. and Luchterhandt, Bj{\\" o}rn}, 	journal = {Journal of Open Source Software}, 	doi = {10.21105/joss.05351}, 	issn = {2475-9066}, 	number = {85}, 	year = {2023}, 	month = {may 11}, 	pages = {5351}, 	publisher = {Open Journals}, 	title = {jsPsych: Enabling an {Open}-{Source} {Collaborative} {Ecosystem} of {Behavioral} {Experiments}}, 	url = {https://joss.theoj.org/papers/10.21105/joss.05351}, 	volume = {8}, }  '
    }
  };
  class InstructionsPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    static {
      this.info = info;
    }
    trial(display_element, trial) {
      var current_page = 0;
      var view_history = [];
      var start_time = performance.now();
      var last_page_update_time = start_time;
      var page_start_time = start_time;

      // Helper function to get delay time for current page
      function getCurrentPageDelayTime(trial, page_index) {
        if (Array.isArray(trial.delay_time)) {
          // If it's an array, use the corresponding index, or 0 if index exceeds array length
          return page_index < trial.delay_time.length ? trial.delay_time[page_index] : 0;
        } else {
          // If it's a single value, use it for all pages
          return trial.delay_time;
        }
      }

      var navigation_enabled = getCurrentPageDelayTime(trial, current_page) === 0;
      var delay_timeout = null;

      function enableNavigation() {
        navigation_enabled = true;
        updateNavigationButtons();
      }

      function updateNavigationButtons() {
        const backBtn = display_element.querySelector("#jspsych-instructions-back");
        const nextBtn = display_element.querySelector("#jspsych-instructions-next");

        if (backBtn) {
          if (navigation_enabled && current_page > 0 && trial.allow_backward) {
            backBtn.disabled = false;
            backBtn.style.opacity = '1';
            backBtn.style.cursor = 'pointer';
          } else {
            backBtn.disabled = true;
            backBtn.style.opacity = '0.5';
            backBtn.style.cursor = 'not-allowed';
          }
        }

        if (nextBtn) {
          if (navigation_enabled) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
          } else {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
          }
        }
      }

      function btnListener() {
        if (!navigation_enabled) return;

        if (this.id === "jspsych-instructions-back") {
          back();
        } else if (this.id === "jspsych-instructions-next") {
          next();
        }
      }

      function show_current_page() {
        var html = trial.pages[current_page];
        var pagenum_display = "";
        if (trial.show_page_number) {
          pagenum_display = "<span style='margin: 0 1em;' class='jspsych-instructions-pagenum'>" + trial.page_label + " " + (current_page + 1) + "/" + trial.pages.length + "</span>";
        }
        if (trial.show_clickable_nav) {
          var nav_html = "<div class='jspsych-instructions-nav' style='padding: 10px 0px;'>";
          if (trial.allow_backward) {
            nav_html += "<button id='jspsych-instructions-back' class='jspsych-btn' style='margin-right: 5px;'>&lt; " + trial.button_label_previous + "</button>";
          }
          if (trial.pages.length > 1 && trial.show_page_number) {
            nav_html += pagenum_display;
          }
          nav_html += "<button id='jspsych-instructions-next' class='jspsych-btn' style='margin-left: 5px;'>" + trial.button_label_next + " &gt;</button></div>";
          html += nav_html;
          display_element.innerHTML = html;

          if (trial.allow_backward) {
            display_element.querySelector("#jspsych-instructions-back").addEventListener("click", btnListener);
          }
          display_element.querySelector("#jspsych-instructions-next").addEventListener("click", btnListener);

          // Update button states
          updateNavigationButtons();
        } else {
          if (trial.show_page_number && trial.pages.length > 1) {
            html += "<div class='jspsych-instructions-pagenum'>" + pagenum_display + "</div>";
          }
          display_element.innerHTML = html;
        }

        // Reset navigation for new page
        page_start_time = performance.now();
        var current_delay = getCurrentPageDelayTime(trial, current_page);
        navigation_enabled = current_delay === 0;

        // Clear any existing timeout
        if (delay_timeout) {
          clearTimeout(delay_timeout);
        }

        // Set new timeout if delay is specified for this page
        if (current_delay > 0) {
          delay_timeout = setTimeout(enableNavigation, current_delay);
        }

        // Update button states for new page
        if (trial.show_clickable_nav) {
          updateNavigationButtons();
        }
      }

      function next() {
        if (!navigation_enabled) return;

        add_current_page_to_view_history();
        current_page++;
        if (current_page >= trial.pages.length) {
          endTrial();
        } else {
          show_current_page();
        }
        trial.on_page_change(current_page);
      }

      function back() {
        if (!navigation_enabled) return;

        add_current_page_to_view_history();
        current_page--;
        show_current_page();
        trial.on_page_change(current_page);
      }

      function add_current_page_to_view_history() {
        var current_time = performance.now();
        var page_view_time = Math.round(current_time - last_page_update_time);
        view_history.push({
          page_index: current_page,
          viewing_time: page_view_time
        });
        last_page_update_time = current_time;
      }

      const endTrial = () => {
        if (trial.allow_keys) {
          this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);
        }
        if (delay_timeout) {
          clearTimeout(delay_timeout);
        }
        var trial_data = {
          view_history,
          rt: Math.round(performance.now() - start_time)
        };
        this.jsPsych.finishTrial(trial_data);
      };

      const after_response = (info2) => {
        if (!navigation_enabled) {
          // Re-register the keyboard listener to continue monitoring
          keyboard_listener = this.jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: after_response,
            valid_responses: [trial.key_forward, trial.key_backward],
            rt_method: "performance",
            persist: false,
            allow_held_key: false
          });
          return;
        }

        keyboard_listener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_response,
          valid_responses: [trial.key_forward, trial.key_backward],
          rt_method: "performance",
          persist: false,
          allow_held_key: false
        });
        if (this.jsPsych.pluginAPI.compareKeys(info2.key, trial.key_backward)) {
          if (current_page !== 0 && trial.allow_backward) {
            back();
          }
        }
        if (this.jsPsych.pluginAPI.compareKeys(info2.key, trial.key_forward)) {
          next();
        }
      };

      show_current_page();
      if (trial.allow_keys) {
        var keyboard_listener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_response,
          valid_responses: [trial.key_forward, trial.key_backward],
          rt_method: "performance",
          persist: false
        });
      }
    }
    simulate(trial, simulation_mode, simulation_options, load_callback) {
      if (simulation_mode == "data-only") {
        load_callback();
        this.simulate_data_only(trial, simulation_options);
      }
      if (simulation_mode == "visual") {
        this.simulate_visual(trial, simulation_options, load_callback);
      }
    }
    create_simulation_data(trial, simulation_options) {
      let curr_page = 0;
      let rt = 0;
      let view_history = [];

      // Helper function to get delay time for simulation
      const getPageDelayTime = (page_index) => {
        if (Array.isArray(trial.delay_time)) {
          return page_index < trial.delay_time.length ? trial.delay_time[page_index] : 0;
        } else {
          return trial.delay_time;
        }
      };

      if (!simulation_options.data?.view_history && !simulation_options.data?.rt) {
        while (curr_page !== trial.pages.length) {
          const page_delay = getPageDelayTime(curr_page);
          const base_view_time = Math.max(page_delay || 0,
            this.jsPsych.randomization.sampleExGaussian(3e3, 300, 1 / 300)
          );
          const view_time = Math.round(base_view_time);
          view_history.push({ page_index: curr_page, viewing_time: view_time });
          rt += view_time;
          if (curr_page == 0 || !trial.allow_backward) {
            curr_page++;
          } else {
            if (this.jsPsych.randomization.sampleBernoulli(0.9) == 1) {
              curr_page++;
            } else {
              curr_page--;
            }
          }
        }
      }
      if (!simulation_options.data?.view_history && simulation_options.data?.rt) {
        rt = simulation_options.data.rt;
        while (curr_page !== trial.pages.length) {
          view_history.push({ page_index: curr_page, viewing_time: null });
          if (curr_page == 0 || !trial.allow_backward) {
            curr_page++;
          } else {
            if (this.jsPsych.randomization.sampleBernoulli(0.9) == 1) {
              curr_page++;
            } else {
              curr_page--;
            }
          }
        }
        const avg_rt_per_page = simulation_options.data.rt / view_history.length;
        let total_time = 0;
        for (const page of view_history) {
          const page_delay = getPageDelayTime(page.page_index);
          const min_time = page_delay || 0;
          const t = Math.round(Math.max(min_time,
            this.jsPsych.randomization.sampleExGaussian(
              avg_rt_per_page,
              avg_rt_per_page / 10,
              1 / (avg_rt_per_page / 10)
            )
          ));
          page.viewing_time = t;
          total_time += t;
        }
        const diff = simulation_options.data.rt - total_time;
        const diff_per_page = Math.round(diff / view_history.length);
        for (const page of view_history) {
          page.viewing_time += diff_per_page;
        }
      }
      if (simulation_options.data?.view_history && !simulation_options.data?.rt) {
        view_history = simulation_options.data.view_history;
        rt = 0;
        for (const page of simulation_options.data.view_history) {
          rt += page.viewing_time;
        }
      }
      const default_data = {
        view_history,
        rt
      };
      const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
      this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
      return data;
    }
    simulate_data_only(trial, simulation_options) {
      const data = this.create_simulation_data(trial, simulation_options);
      this.jsPsych.finishTrial(data);
    }
    simulate_visual(trial, simulation_options, load_callback) {
      const data = this.create_simulation_data(trial, simulation_options);
      const display_element = this.jsPsych.getDisplayElement();
      this.trial(display_element, trial);
      load_callback();
      const advance = (rt) => {
        if (trial.allow_keys) {
          this.jsPsych.pluginAPI.pressKey(trial.key_forward, rt);
        } else if (trial.show_clickable_nav) {
          this.jsPsych.pluginAPI.clickTarget(
            display_element.querySelector("#jspsych-instructions-next"),
            rt
          );
        }
      };
      const backup = (rt) => {
        if (trial.allow_keys) {
          this.jsPsych.pluginAPI.pressKey(trial.key_backward, rt);
        } else if (trial.show_clickable_nav) {
          this.jsPsych.pluginAPI.clickTarget(
            display_element.querySelector("#jspsych-instructions-back"),
            rt
          );
        }
      };
      let curr_page = 0;
      let t = 0;
      for (let i = 0; i < data.view_history.length; i++) {
        if (i == data.view_history.length - 1) {
          advance(t + data.view_history[i].viewing_time);
        } else {
          if (data.view_history[i + 1].page_index > curr_page) {
            advance(t + data.view_history[i].viewing_time);
          }
          if (data.view_history[i + 1].page_index < curr_page) {
            backup(t + data.view_history[i].viewing_time);
          }
          t += data.view_history[i].viewing_time;
          curr_page = data.view_history[i + 1].page_index;
        }
      }
    }
  }

  return InstructionsPlugin;

})(jsPsychModule);