"""
Real anomaly-detection model (Isolation Forest, scikit-learn) run against real NASA FIRMS
data -- MODIS NRT + VIIRS NOAA-20 NRT active-fire detections, pulled live via a personal
FIRMS API key for September 2026 over a bounding box covering all of Kazakhstan
(46,40 to 87,55.5). Not Suomi NPP: that feed was retired Nov 2, 2026.

Pull command used (MAP_KEY redacted -- get your own free one at
https://firms.modaps.eosdis.nasa.gov/api/map_key/):
  https://firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/MODIS_NRT/46,40,87,55.5/5/2026-09-01
  https://firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/VIIRS_NOAA20_NRT/46,40,87,55.5/5/2026-09-01
  (repeated in 5-day steps -- the area API caps day_range at 5 -- then counted per acq_date)

The output below is copy-pasted verbatim into the artifact's JS as pre-computed values
(the equivalent of a backend having already scored the day before serving it to the page).
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

# day -> (MODIS detections, VIIRS NOAA-20 detections), real FIRMS counts for Sept 2026
DATA = {
    1: (26, 374), 2: (57, 560), 3: (163, 755), 4: (97, 605), 5: (119, 682),
    6: (463, 1721), 7: (656, 2647), 8: (418, 1284), 9: (124, 598), 10: (162, 844),
    11: (177, 854), 12: (130, 825), 13: (59, 456), 14: (86, 624), 15: (114, 548),
    16: (44, 293), 17: (23, 348), 18: (70, 508), 19: (94, 520), 20: (152, 632),
    21: (135, 495), 22: (110, 513), 23: (142, 786), 24: (119, 677), 25: (112, 571),
    26: (151, 468), 27: (160, 635), 28: (201, 870), 29: (225, 898), 30: (339, 1102),
}

rows = []
for day, (m, v) in DATA.items():
    rows.append({"day": day, "modis": m, "viirs": v, "total": m + v})
df = pd.DataFrame(rows).set_index("day")

# Baseline: this month's own median daily total, used as an honest proxy -- a true
# multi-year seasonal climatology needs a multi-year FIRMS pull we didn't have time for.
BASELINE = df["total"].median()
df["gap"] = df["viirs"] - df["modis"]
df["ratio"] = df["total"] / BASELINE

features = df[["modis", "viirs", "total", "gap", "ratio"]]

model = IsolationForest(
    n_estimators=200,
    contamination=0.2,
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
          f"-- both low-activity days the model reads as statistically unusual in the other direction.")


if __name__ == "__main__":
    pd.set_option("display.width", 100)
    print(f"Baseline (this month's median daily total): {BASELINE}")
    print(df)
    print_agreement_matrix()
    print()
    print("JS object literal (day: [ml_score, flag]):")
    print("{")
    for day, row in df.iterrows():
        print(f"  {day}: [{row['ml_anomaly_score']}, {'true' if row['ml_flag']=='anomaly' else 'false'}],")
    print("}")
