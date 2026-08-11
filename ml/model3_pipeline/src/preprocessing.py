import pandas as pd
import os
from paths import DATA_PATH, MODELS_DIR

os.makedirs(MODELS_DIR, exist_ok=True)

USE_COLS = [
    "Anon Student Id", "KC(Default)", "Correct First Attempt",
    "Incorrects", "Hints", "Corrects", "Opportunity(Default)",
    "Step Duration (sec)"
]


def load_and_aggregate_mastery(chunksize=200_000):
    """
    Reads the large KDD Cup file in chunks (avoids loading 533MB at once),
    and aggregates per-student-per-KC mastery statistics on the fly.
    """
    agg_data = {}  # key: (student, kc) -> running totals

    reader = pd.read_csv(DATA_PATH, sep="\t", usecols=USE_COLS, chunksize=chunksize)

    for i, chunk in enumerate(reader):
        chunk = chunk.dropna(subset=["KC(Default)"])  # rows without a tagged skill aren't usable here
        grouped = chunk.groupby(["Anon Student Id", "KC(Default)"]).agg(
            attempts=("Correct First Attempt", "count"),
            correct_first_sum=("Correct First Attempt", "sum"),
            hints_sum=("Hints", "sum"),
            incorrects_sum=("Incorrects", "sum"),
            avg_duration=("Step Duration (sec)", "mean")
        ).reset_index()

        for _, row in grouped.iterrows():
            key = (row["Anon Student Id"], row["KC(Default)"])
            if key not in agg_data:
                agg_data[key] = {"attempts": 0, "correct_first_sum": 0, "hints_sum": 0,
                                  "incorrects_sum": 0, "duration_sum": 0, "duration_count": 0}
            agg_data[key]["attempts"] += row["attempts"]
            agg_data[key]["correct_first_sum"] += row["correct_first_sum"]
            agg_data[key]["hints_sum"] += row["hints_sum"]
            agg_data[key]["incorrects_sum"] += row["incorrects_sum"]
            if pd.notna(row["avg_duration"]):
                agg_data[key]["duration_sum"] += row["avg_duration"]
                agg_data[key]["duration_count"] += 1

        print(f"Processed chunk {i+1} ({chunksize * (i+1):,} rows read so far)...")

    # Convert aggregated dict into a dataframe
    records = []
    for (student, kc), vals in agg_data.items():
        mastery_rate = vals["correct_first_sum"] / vals["attempts"] if vals["attempts"] > 0 else 0
        avg_dur = vals["duration_sum"] / vals["duration_count"] if vals["duration_count"] > 0 else 0
        records.append({
            "student_id": student,
            "kc": kc,
            "attempts": vals["attempts"],
            "mastery_rate": mastery_rate,
            "hints_used": vals["hints_sum"],
            "incorrects": vals["incorrects_sum"],
            "avg_duration_sec": avg_dur
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    print("Processing large file in chunks — this may take a few minutes...")
    df = load_and_aggregate_mastery()
    print("\nFinal aggregated shape:", df.shape)
    print(df.head(10))

    out_path = os.path.join(MODELS_DIR, "..", "student_kc_mastery.csv")
    df.to_csv(out_path, index=False)
    print(f"\nSaved aggregated mastery table to {out_path}")
