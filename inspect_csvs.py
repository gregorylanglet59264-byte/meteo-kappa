import os
import glob
import csv

folders = [
    r"C:\Users\grego\Desktop\cartes_alertes",
    r"C:\Users\grego\Documents\METEO_CLIMAT\meteo-kappa\meteo_cnews_2",
    r"C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2"
]

for folder in folders:
    print(f"\n==================== FOLDER: {folder} ====================")
    if not os.path.exists(folder):
        print("Folder does not exist.")
        continue
    csvs = glob.glob(os.path.join(folder, "*.csv"))
    for c in csvs:
        fname = os.path.basename(c)
        try:
            with open(c, "r", encoding="utf-8", errors="ignore") as fp:
                reader = csv.reader(fp)
                header = next(reader, None)
                rows = list(reader)
                
                # Check for Saturday 15/08 or 2026-08-15
                sat_rows = []
                for r in rows:
                    row_str = " | ".join(r)
                    if "15/08" in row_str or "2026-08-15" in row_str or "P12" in row_str or "Neige" in row_str or "neige" in row_str:
                        sat_rows.append(r)
                
                print(f"File: {fname} (total rows: {len(rows)})")
                if header:
                    print(f"  Header: {header[:8]}")
                if sat_rows:
                    print(f"  Found {len(sat_rows)} matching lines for 15/08 or P12/Neige:")
                    for sr in sat_rows[:5]:
                        print(f"    {sr[:10]}")
        except Exception as e:
            print(f"File {fname}: Error {e}")
