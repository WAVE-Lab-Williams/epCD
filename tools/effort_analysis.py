import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Global toggles    
excludeOutlierParticipants = False # Exclude participants whose RT SD is > 2 SD from group mean SD
excludeOutlierTrials = False # Exclude trials where RT > mean ± 2 SD (per participant)
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

# 6. Outlier exclusion
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

# Build filter subtitle string for charts
_cup = ", ".join(np.atleast_1d(filterCupFullness).tolist()) if filterCupFullness is not None else "all"
_half = filterTrialHalf if filterTrialHalf is not None else "all"
_table = ", ".join(np.atleast_1d(filterTableType).tolist()) if filterTableType is not None else "all"
_disp = ", ".join(str(v) for v in np.atleast_1d(filterDisplayTime).tolist()) if filterDisplayTime is not None else "all"
_outlier_p = "excluded" if excludeOutlierParticipants else "included"
_outlier_t = "excluded" if excludeOutlierTrials else "included"
filter_subtitle = (
    f"cupFullness: {_cup}  |  trialHalf: {_half}  |  tableType: {_table}  "
    f"|  dispTime: {_disp}  |  outlier participants: {_outlier_p}  |  outlier trials: {_outlier_t}"
)

# 7. Save enriched CSV
if excludeOutlierParticipants and excludeOutlierTrials:
    out_path = "data/dataframe_answer_effortcomputed_outlierParticipants_outlierTrials.csv"
elif excludeOutlierParticipants:
    out_path = "data/dataframe_answer_effortcomputed_outlierParticipantsONLY.csv"
elif excludeOutlierTrials:
    out_path = "data/dataframe_answer_effortcomputed_outlierTrialsONLY.csv"
else:
    out_path = "data/dataframe_answer_effortcomputed.csv"
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

# Each row = one participant's average RT for one effort type
part_means_rt = (
    df.groupby(["participant_id", "effort_type"])["response_time"]
    .mean()
    .reset_index()
    .rename(columns={"response_time": "mean_rt"})
)

n_participants = part_means["participant_id"].nunique()
print(f"\nN participants: {n_participants}")

# 9. Summary stats across participants
effort_order = [
    "less effort movement",
    "neutral effort movement, moves along flat table",
    "more effort movement",
    "same effort/image",
]

def ci95(x):
    n = len(x)
    if n < 2:
        return np.nan
    sem = x.std(ddof=1) / np.sqrt(n)
    t_crit = stats.t.ppf(0.975, df=n - 1)
    return sem * t_crit

summary = (
    part_means.groupby("effort_type")["mean_acc"]
    .agg(mean="mean", ci95=ci95, n="count")
    .reindex([e for e in effort_order if e in part_means["effort_type"].unique()])
)

summary_rt = (
    part_means_rt.groupby("effort_type")["mean_rt"]
    .agg(mean="mean", ci95=ci95, n="count")
    .reindex([e for e in effort_order if e in part_means_rt["effort_type"].unique()])
)

print("\nAccuracy summary by effort type (participant-level, N per condition):")
print(summary)

print("\nReaction time summary by effort type (participant-level, N per condition):")
print(summary_rt)

# 10. Paired t-tests on participant averages
# Pivot to wide format so each row = one participant
pivot = part_means.pivot(index="participant_id", columns="effort_type", values="mean_acc")
pivot_rt = part_means_rt.pivot(index="participant_id", columns="effort_type", values="mean_rt")

comparisons = [
    ("less effort movement", "more effort movement"),
    ("less effort movement", "neutral effort movement, moves along flat table"),
    ("more effort movement", "neutral effort movement, moves along flat table"),
    ("less effort movement", "same effort/image"),
    ("more effort movement", "same effort/image"),
]

print("\n-- Paired t-test results: ACCURACY (participant averages) ----------")
for a, b in comparisons:
    if a not in pivot.columns or b not in pivot.columns:
        continue
    paired = pivot[[a, b]].dropna()
    if len(paired) < 2:
        continue
    t, p = stats.ttest_rel(paired[a], paired[b])
    sig = "**" if p < 0.01 else ("*" if p < 0.05 else "ns")
    print(f"  {a!r:50s} vs {b!r}")
    print(f"    n = {len(paired)},  t = {t:.3f},  p = {p:.4f}  {sig}\n")

print("\n-- Paired t-test results: REACTION TIME (participant averages) -----")
for a, b in comparisons:
    if a not in pivot_rt.columns or b not in pivot_rt.columns:
        continue
    paired = pivot_rt[[a, b]].dropna()
    if len(paired) < 2:
        continue
    t, p = stats.ttest_rel(paired[a], paired[b])
    sig = "**" if p < 0.01 else ("*" if p < 0.05 else "ns")
    print(f"  {a!r:50s} vs {b!r}")
    print(f"    n = {len(paired)},  t = {t:.3f},  p = {p:.4f}  {sig}\n")

# 11. Bar charts
palette = {
    "less effort movement": "#4C9BE8",
    "neutral effort movement, moves along flat table": "#A0C878",
    "more effort movement": "#E8724C",
    "same effort/image": "#B0B0B0",
}

short_labels = {
    "less effort movement": "Less Effort",
    "neutral effort movement, moves along flat table": "Neutral\n(Flat)",
    "more effort movement": "More Effort",
    "same effort/image": "Same\nImage",
}

present_order = [e for e in effort_order if e in summary.index]
present_order_rt = [e for e in effort_order if e in summary_rt.index]

movement_types = ["less effort movement", "more effort movement"]
table_colors = {"Groove": "#6A5ACD", "Platform": "#E8A44C", "Flat": "#A0C878"}

# 11a. Accuracy charts
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle("Accuracy by Effort Type", fontsize=15, fontweight="bold", y=0.99)
fig.text(0.5, 0.93, filter_subtitle, ha="center", fontsize=9, color="#666666", style="italic")

ax = axes[0]
x = np.arange(len(present_order))
bars = ax.bar(
    x,
    summary.loc[present_order, "mean"],
    yerr=summary.loc[present_order, "ci95"],
    color=[palette[e] for e in present_order],
    capsize=5,
    edgecolor="white",
    linewidth=0.8,
    width=0.6,
)
ax.set_xticks(x)
ax.set_xticklabels([short_labels[e] for e in present_order], fontsize=10)
ax.set_ylim(0, 1.1)
ax.axhline(0.5, color="grey", linestyle="--", linewidth=0.8, label="Chance (0.5)")
ax.set_ylabel("Mean Accuracy (± 95% CI)", fontsize=11)
ax.set_title(f"Overall Accuracy per Effort Type\n(N={n_participants} participants)", fontsize=12)
ax.legend(fontsize=9)
for bar, label in zip(bars, present_order):
    n = summary.loc[label, "n"]
    ax.text(
        bar.get_x() + bar.get_width() / 2,
        bar.get_height() + summary.loc[label, "ci95"] + 0.02,
        f"n={n}",
        ha="center", va="bottom", fontsize=8, color="#555555",
    )

sub_df = df.query("effort_type in @movement_types")
part_means_table = (
    sub_df.groupby(["participant_id", "effort_type", "tableType"])["accuracy"]
    .mean()
    .reset_index()
    .rename(columns={"accuracy": "mean_acc"})
)
table_types = sorted(part_means_table["tableType"].unique())

ax = axes[1]
width = 0.35
x_pos = np.arange(len(movement_types))
for i, table in enumerate(table_types):
    means, cis = [], []
    for effort in movement_types:
        vals = part_means_table.query("effort_type == @effort and tableType == @table")["mean_acc"]
        means.append(vals.mean() if len(vals) > 0 else 0)
        cis.append(ci95(vals) if len(vals) > 1 else 0)
    offset = (i - len(table_types) / 2 + 0.5) * width
    ax.bar(
        x_pos + offset,
        means,
        yerr=cis,
        width=width,
        label=table,
        color=table_colors.get(table, "#888888"),
        capsize=4,
        edgecolor="white",
    )
ax.set_xticks(x_pos)
ax.set_xticklabels(["Less Effort", "More Effort"], fontsize=11)
ax.set_ylim(0, 1.1)
ax.axhline(0.5, color="grey", linestyle="--", linewidth=0.8, label="Chance")
ax.set_ylabel("Mean Accuracy (± 95% CI)", fontsize=11)
ax.set_title("Accuracy by Effort × Table Type", fontsize=12)
ax.legend(title="Table Type", fontsize=9)

plt.tight_layout(rect=[0, 0, 1, 0.91])
chart_path = "data/effort_accuracy_charts.png"
plt.savefig(chart_path, dpi=150, bbox_inches="tight")
print(f"\nCharts saved to {chart_path}")
plt.show()

# 11b. Reaction time charts
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle("Reaction Time by Effort Type", fontsize=15, fontweight="bold", y=0.99)
fig.text(0.5, 0.93, filter_subtitle, ha="center", fontsize=9, color="#666666", style="italic")

ax = axes[0]
x = np.arange(len(present_order_rt))
bars = ax.bar(
    x,
    summary_rt.loc[present_order_rt, "mean"],
    yerr=summary_rt.loc[present_order_rt, "ci95"],
    color=[palette[e] for e in present_order_rt],
    capsize=5,
    edgecolor="white",
    linewidth=0.8,
    width=0.6,
)
ax.set_xticks(x)
ax.set_xticklabels([short_labels[e] for e in present_order_rt], fontsize=10)
ax.set_ylabel("Mean RT in ms (± 95% CI)", fontsize=11)
ax.set_title(f"Overall RT per Effort Type\n(N={n_participants} participants)", fontsize=12)
for bar, label in zip(bars, present_order_rt):
    n = summary_rt.loc[label, "n"]
    ax.text(
        bar.get_x() + bar.get_width() / 2,
        bar.get_height() + summary_rt.loc[label, "ci95"] + 5,
        f"n={n}",
        ha="center", va="bottom", fontsize=8, color="#555555",
    )

part_means_table_rt = (
    sub_df.groupby(["participant_id", "effort_type", "tableType"])["response_time"]
    .mean()
    .reset_index()
    .rename(columns={"response_time": "mean_rt"})
)
table_types_rt = sorted(part_means_table_rt["tableType"].unique())

ax = axes[1]
x_pos = np.arange(len(movement_types))
for i, table in enumerate(table_types_rt):
    means, cis = [], []
    for effort in movement_types:
        vals = part_means_table_rt.query("effort_type == @effort and tableType == @table")["mean_rt"]
        means.append(vals.mean() if len(vals) > 0 else 0)
        cis.append(ci95(vals) if len(vals) > 1 else 0)
    offset = (i - len(table_types_rt) / 2 + 0.5) * width
    ax.bar(
        x_pos + offset,
        means,
        yerr=cis,
        width=width,
        label=table,
        color=table_colors.get(table, "#888888"),
        capsize=4,
        edgecolor="white",
    )
ax.set_xticks(x_pos)
ax.set_xticklabels(["Less Effort", "More Effort"], fontsize=11)
ax.set_ylabel("Mean RT in ms (± 95% CI)", fontsize=11)
ax.set_title("RT by Effort × Table Type", fontsize=12)
ax.legend(title="Table Type", fontsize=9)

plt.tight_layout(rect=[0, 0, 1, 0.91])
rt_chart_path = "data/effort_rt_charts.png"
plt.savefig(rt_chart_path, dpi=150, bbox_inches="tight")
print(f"Charts saved to {rt_chart_path}")
plt.show()
