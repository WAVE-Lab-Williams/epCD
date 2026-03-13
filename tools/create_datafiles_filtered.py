import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Global toggles
excludeOutlierParticipants = True # Exclude participants whose RT SD is > 2 SD from group mean SD
excludeOutlierTrials = True # Exclude trials where RT > mean ± 2 SD (per participant)
filterCupFullness = None  # None = all; a string (e.g. "Full") or list (e.g. ["Full","Half"])
filterTrialHalf = None   # None = all; "single" = simulates single trial, the first different trial that appeared. "first" = first half of each participant's trials; "second" = second half
filterTableType = None   # None = all; a string (e.g. "Groove") or list (e.g. ["Groove","Platform"])
filterDisplayTime = None  # None = all; a number (e.g. 500) or list (e.g. [500, 1000])

# 1. Load data
df = pd.read_csv("data/dataframe_answer.csv")

# 2. Filter by cup fullness
if filterCupFullness is not None:
    keep = np.atleast_1d(filterCupFullness).tolist()
    n_before = len(df)
    df = df.query("cupFullness in @keep")
    print(f"[filterCupFullness] Keeping {keep} — {len(df)} of {n_before} trials retained")
else:
    print(f"[filterCupFullness] None — all cup fullness levels included")

# 3. Filter by trial half
if filterTrialHalf == "single":
    n_before = len(df)
    different_img = df[df["firstCupPosition"] != df["secondCupPosition"]]
    first_different = (
        different_img.sort_values("trial_number")
        .groupby("participant_id", as_index=False)
        .first()
    )
    df = df[df.index.isin(first_different.index)]
    print(f"[filterTrialHalf] 'single' — first trial where images differ per participant — {len(df)} of {n_before} trials retained")
elif filterTrialHalf == "single_alltypes":
    n_before = len(df)
    different_img = df[df["firstCupPosition"] != df["secondCupPosition"]]
    first_per_type = (
        different_img.sort_values("trial_number")
        .groupby(["participant_id", "cupFullness", "firstCupPosition", "secondCupPosition", "tableType"], as_index=False)
        .first()
    )
    df = df[df.index.isin(first_per_type.index)]
    print(f"[filterTrialHalf] 'single_alltypes' — first trial per participant × cupFullness × position order × tableType — {len(df)} of {n_before} trials retained")
elif filterTrialHalf is not None:
    median_trial = df.groupby("participant_id")["trial_number"].transform("median")
    if filterTrialHalf == "first":
        mask = df["trial_number"] <= median_trial
    elif filterTrialHalf == "second":
        mask = df["trial_number"] > median_trial
    else:
        raise ValueError(f"filterTrialHalf must be None, 'first', or 'second' — got {filterTrialHalf!r}")
    n_before = len(df)
    df = df[mask]
    print(f"[filterTrialHalf] '{filterTrialHalf}' half — {len(df)} of {n_before} trials retained")
else:
    print("[filterTrialHalf] None — all trials included")

# 4. Filter by table type
if filterTableType is not None:
    keep = np.atleast_1d(filterTableType).tolist() #converts input to array with at least one dimension, then converts to list. This allows it to handle both list input and non-list input as the global variable
    n_before = len(df)
    df = df.query("tableType in @keep")
    print(f"[filterTableType] Keeping {keep} — {len(df)} of {n_before} trials retained")
else:
    print("[filterTableType] None — all table types included")

# 5. Filter by display time
if filterDisplayTime is not None:
    keep = np.atleast_1d(filterDisplayTime).tolist()
    n_before = len(df)
    df = df.query("dispImage_duration in @keep")
    print(f"[filterDisplayTime] Keeping {keep} — {len(df)} of {n_before} trials retained")
else:
    print("[filterDisplayTime] None — all display times included")

# 6. Build effort_type column
def classify_effort(row):
    first = row["firstCupPosition"]
    second = row["secondCupPosition"]
    table = row["tableType"]

    if first == second:
        return "same effort/image"

    if table == "Flat":
        return "neutral effort movement, moves along flat table"

    if table == "Platform":
        if first == "Center" and second == "Right":
            return "more effort movement"
        if first == "Right" and second == "Center":
            return "less effort movement"

    if table == "Groove":
        if first == "Center" and second == "Right":
            return "less effort movement"
        if first == "Right" and second == "Center":
            return "more effort movement"

    # Fallback (shouldn't be reached with clean data)
    return "unknown"


df["effort_type"] = df.apply(classify_effort, axis=1)

# 6b. Outlier exclusion
if excludeOutlierParticipants:
    part_rt_sd = (
        df.groupby("participant_id")["response_time"]
        .std()
        .reset_index()
        .rename(columns={"response_time": "rt_sd"})
    )
    group_sd_mean = part_rt_sd["rt_sd"].mean()
    group_sd_sd = part_rt_sd["rt_sd"].std()
    upper = group_sd_mean + 2 * group_sd_sd
    lower = group_sd_mean - 2 * group_sd_sd
    outlier_pids = part_rt_sd.query("rt_sd > @upper or rt_sd < @lower")["participant_id"]
    n_parts_before = df["participant_id"].nunique()
    df = df.query("participant_id not in @outlier_pids")
    n_parts_after = df["participant_id"].nunique()
    print(
        f"[excludeOutlierParticipants] Removed {len(outlier_pids)} participants "
        f"({n_parts_before} → {n_parts_after}); "
        f"group RT-SD mean={group_sd_mean:.1f}ms, SD={group_sd_sd:.1f}ms"
    )
else:
    print("[excludeOutlierParticipants] OFF — no participant-level outliers removed")

if excludeOutlierTrials:
    rt_stats = (
        df.groupby("participant_id")["response_time"]
        .agg(rt_mean="mean", rt_std="std")
        .reset_index()
    )
    df = df.merge(rt_stats, on="participant_id")
    n_before = len(df)
    df = df.query(
        "response_time >= rt_mean - 2 * rt_std and response_time <= rt_mean + 2 * rt_std"
    ).drop(columns=["rt_mean", "rt_std"])
    n_after = len(df)
    print(f"[excludeOutlierTrials] Removed {n_before - n_after} trials ({n_before} → {n_after})")
else:
    print("[excludeOutlierTrials] OFF — no trial-level RT outliers removed")

# 7. Save enriched CSV
suffix_parts = []

if excludeOutlierParticipants and excludeOutlierTrials:
    suffix_parts.append("outlierParticipants_outlierTrials")
elif excludeOutlierParticipants:
    suffix_parts.append("outlierParticipantsONLY")
elif excludeOutlierTrials:
    suffix_parts.append("outlierTrialsONLY")

if filterCupFullness is not None:
    vals = "_".join(np.atleast_1d(filterCupFullness).tolist())
    suffix_parts.append(f"cupFullness-{vals}")

if filterTrialHalf is not None:
    suffix_parts.append(f"trialHalf-{filterTrialHalf}")

if filterTableType is not None:
    vals = "_".join(np.atleast_1d(filterTableType).tolist())
    suffix_parts.append(f"tableType-{vals}")

if filterDisplayTime is not None:
    vals = "_".join(str(v) for v in np.atleast_1d(filterDisplayTime).tolist())
    suffix_parts.append(f"dispTime-{vals}")

suffix = ("_" + "_".join(suffix_parts)) if suffix_parts else ""
out_path = f"data/dataframe_answer_effortcomputed{suffix}.csv"
df.to_csv(out_path, index=False)
print(f"Saved enriched data to {out_path}")
print("\nEffort type counts (trials):")
print(df["effort_type"].value_counts())

# 8. Compute per-participant means
# Each row = one participant's average accuracy for one effort type
part_means = (
    df.groupby(["participant_id", "effort_type"])["accuracy"]
    .mean()
    .reset_index()
    .rename(columns={"accuracy": "mean_acc"})
)
