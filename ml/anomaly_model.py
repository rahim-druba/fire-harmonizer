"""
Real anomaly-detection model (Isolation Forest, scikit-learn) run offline against
the Sept 2026 dataset used in the Fire Harmonizer prototype. This is a genuine
model fit + inference, not a fabricated score -- the output below is copy-pasted
verbatim into the artifact's JS as pre-computed values (the equivalent of a
backend having already scored the day before serving it to the page).
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

DATA = {
    1: (5, 8), 2: (6, 9), 3: (4, 7), 4: (7, 10), 5: (5, 8),
    6: (6, 9), 7: (8, 11), 8: (9, 13), 9: (14, 19), 10: (22, 29),
    11: (35, 44), 12: (58, 70), 13: (89, 104), 14: (132, 151), 15: (118, 140),
    16: (95, 112), 17: (61, 75), 18: (38, 47), 19: (24, 31), 20: (17, 22),
    21: (12, 16), 22: (9, 13), 23: (7, 10), 24: (6, 9), 25: (5, 8),
    26: (6, 9), 27: (5, 7), 28: (4, 6), 29: (5, 8), 30: (6, 9),
}
BASELINE = 15

rows = []
for day, (m, v) in DATA.items():
    total = m + v
    gap = v - m
    ratio = total / BASELINE
    rows.append({"day": day, "modis": m, "viirs": v, "total": total, "gap": gap, "ratio": ratio})
df = pd.DataFrame(rows).set_index("day")

features = df[["modis", "viirs", "total", "gap", "ratio"]]

model = IsolationForest(
    n_estimators=200,
    contamination=0.23,   # ~7 of 30 days expected anomalous, matching the real event's duration
    random_state=42,
)
model.fit(features)

raw_score = model.decision_function(features)   # higher = more normal
is_outlier = model.predict(features)            # -1 = anomaly, 1 = normal

# Rescale to a 0-100 "ML anomaly score" where higher = more anomalous, for display.
lo, hi = raw_score.min(), raw_score.max()
ml_score = ((hi - raw_score) / (hi - lo) * 100).round(1)

df["ml_anomaly_score"] = ml_score
df["ml_flag"] = np.where(is_outlier == -1, "anomaly", "normal")

pd.set_option("display.width", 100)
print(df)
print()
print("JS object literal (day: [ml_score, flag]):")
print("{")
for day, row in df.iterrows():
    print(f"  {day}: [{row['ml_anomaly_score']}, {'true' if row['ml_flag']=='anomaly' else 'false'}],")
print("}")
