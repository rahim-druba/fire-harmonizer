"""
Real anomaly-detection model (Isolation Forest, scikit-learn) run against real NASA FIRMS
data -- MODIS NRT + VIIRS NOAA-20 NRT active-fire detections, pulled live via a personal
FIRMS API key for the full NRT retention window this key has access to: Sept 1 - Nov 14,
2026 (75 real days), over a bounding box covering all of Kazakhstan (46,40 to 87,55.5).
Not Suomi NPP: that feed was retired Nov 2, 2026.

Pull command used (MAP_KEY redacted -- get your own free one at
https://firms.modaps.eosdis.nasa.gov/api/map_key/). The area/csv endpoint caps day_range
at 5, so the full window was pulled in 5-day chunks:
  https://firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/MODIS_NRT/46,40,87,55.5/5/2026-09-01
  https://firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/VIIRS_NOAA20_NRT/46,40,87,55.5/5/2026-09-01
  (repeated with the start date advanced by 5 days each time, through 2026-11-10, then
  counted per acq_date; Sept 1 is the earliest date this key's NRT access actually returns
  data for -- everything before it comes back empty, which is the real boundary, not a bug.)

The output below is copy-pasted verbatim into the artifact's JS as pre-computed values
(the equivalent of a backend having already scored the day before serving it to the page).
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

# day -> (MODIS detections, VIIRS NOAA-20 detections), real FIRMS counts, Sept 1 - Nov 14, 2026
DATA = {
    "2026-09-01": (26, 374), "2026-09-02": (57, 560), "2026-09-03": (163, 755), "2026-09-04": (97, 605), "2026-09-05": (119, 682),
    "2026-09-06": (463, 1721), "2026-09-07": (656, 2647), "2026-09-08": (418, 1284), "2026-09-09": (124, 598), "2026-09-10": (162, 844),
    "2026-09-11": (177, 854), "2026-09-12": (130, 825), "2026-09-13": (59, 456), "2026-09-14": (86, 624), "2026-09-15": (114, 548),
    "2026-09-16": (44, 293), "2026-09-17": (23, 348), "2026-09-18": (70, 508), "2026-09-19": (94, 520), "2026-09-20": (152, 632),
    "2026-09-21": (135, 495), "2026-09-22": (110, 513), "2026-09-23": (142, 786), "2026-09-24": (119, 677), "2026-09-25": (112, 571),
    "2026-09-26": (151, 468), "2026-09-27": (160, 635), "2026-09-28": (201, 870), "2026-09-29": (225, 898), "2026-09-30": (339, 1102),
    "2026-10-01": (185, 577), "2026-10-02": (157, 609), "2026-10-03": (22, 132), "2026-10-04": (33, 170), "2026-10-05": (32, 259),
    "2026-10-06": (37, 207), "2026-10-07": (61, 274), "2026-10-08": (101, 391), "2026-10-09": (53, 501), "2026-10-10": (104, 503),
    "2026-10-11": (128, 666), "2026-10-12": (130, 256), "2026-10-13": (251, 769), "2026-10-14": (127, 562), "2026-10-15": (153, 638),
    "2026-10-16": (141, 549), "2026-10-17": (33, 588), "2026-10-18": (172, 538), "2026-10-19": (107, 545), "2026-10-20": (108, 701),
    "2026-10-21": (128, 561), "2026-10-22": (111, 541), "2026-10-23": (140, 527), "2026-10-24": (103, 520), "2026-10-25": (100, 816),
    "2026-10-26": (180, 839), "2026-10-27": (157, 937), "2026-10-28": (168, 861), "2026-10-29": (124, 771), "2026-10-30": (131, 836),
    "2026-10-31": (157, 803), "2026-11-01": (72, 559), "2026-11-02": (85, 390), "2026-11-03": (105, 384), "2026-11-04": (59, 238),
    "2026-11-05": (35, 254), "2026-11-06": (14, 136), "2026-11-07": (16, 176), "2026-11-08": (29, 251), "2026-11-09": (26, 155),
    "2026-11-10": (13, 123), "2026-11-11": (2, 31), "2026-11-12": (2, 35), "2026-11-13": (3, 37), "2026-11-14": (4, 53),
}

rows = []
for date, (m, v) in DATA.items():
    rows.append({"date": date, "modis": m, "viirs": v, "total": m + v})
df = pd.DataFrame(rows).set_index("date")

# Baseline: the median daily total across all 75 real days -- an honest proxy. A true
# multi-year seasonal climatology needs a multi-year FIRMS pull beyond this key's NRT window.
BASELINE = df["total"].median()
df["gap"] = df["viirs"] - df["modis"]
df["ratio"] = df["total"] / BASELINE

features = df[["modis", "viirs", "total", "gap", "ratio"]]

model = IsolationForest(
    n_estimators=200,
    contamination=0.15,
    random_state=42,
)
model.fit(features)

raw_score = model.decision_function(features)   # higher = more normal
is_outlier = model.predict(features)            # -1 = anomaly, 1 = normal

lo, hi = raw_score.min(), raw_score.max()
ml_score = ((hi - raw_score) / (hi - lo) * 100).round(1)

df["ml_anomaly_score"] = ml_score
df["ml_flag"] = np.where(is_outlier == -1, "anomaly", "normal")


def tier_for(ratio):
    if ratio > 2.2: return "critical"
    if ratio > 1.5: return "serious"
    if ratio > 1.1: return "warning"
    return "good"


def print_agreement_matrix():
    """
    IMPORTANT CAVEAT: Isolation Forest is unsupervised -- there is no labeled ground
    truth for "this day was truly anomalous." A textbook accuracy/precision/recall
    against ground truth does not honestly exist here. What follows instead is the
    AGREEMENT between two independently-designed methods (a ratio-to-baseline rule,
    and an unsupervised ML model) looking at the same real data -- useful because
    they're methodologically independent, not because either one is "truth."
    """
    d = df.copy()
    d["tier"] = d["ratio"].apply(tier_for)
    d["rule_flag"] = d["tier"].isin(["serious", "critical"])
    d["ml_flag_bool"] = d["ml_flag"] == "anomaly"

    tp = int(((d.rule_flag) & (d.ml_flag_bool)).sum())
    fn = int(((d.rule_flag) & (~d.ml_flag_bool)).sum())
    fp = int(((~d.rule_flag) & (d.ml_flag_bool)).sum())
    tn = int(((~d.rule_flag) & (~d.ml_flag_bool)).sum())

    precision = tp / (tp + fp) if (tp + fp) else float("nan")
    recall = tp / (tp + fn) if (tp + fn) else float("nan")
    accuracy = (tp + tn) / len(d)
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else float("nan")

    print("\nAgreement matrix: rule-based tier (serious/critical) vs ML Isolation Forest flag\n")
    print(f"{'':20}{'ML: anomaly':>14}{'ML: normal':>14}")
    print(f"{'Rule: high/critical':20}{tp:>14}{fn:>14}")
    print(f"{'Rule: normal/mild':20}{fp:>14}{tn:>14}")
    print(f"\nAgreement: {accuracy:.1%}  Recall: {recall:.1%}  Precision: {precision:.1%}  F1: {f1:.2f}")
    print(f"ML-only flags (disagreement): {list(d[(~d.rule_flag) & (d.ml_flag_bool)].index)} "
          f"-- days the model reads as statistically unusual in the other direction (e.g. unusually quiet).")


if __name__ == "__main__":
    pd.set_option("display.width", 100)
    pd.set_option("display.max_rows", 100)
    print(f"Baseline (median of all {len(df)} real days): {BASELINE}")
    print(df)
    print_agreement_matrix()
    print()
    print("JS object literal (date: [ml_score, flag]):")
    print("{")
    for date, row in df.iterrows():
        print(f'  "{date}": [{row["ml_anomaly_score"]}, {"true" if row["ml_flag"]=="anomaly" else "false"}],')
    print("}")
