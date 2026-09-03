import os
import glob
import csv

paths = [
    r"C:\Users\grego\Desktop\cartes_alertes\meteofrance_daily_forecast.csv",
    r"C:\Users\grego\Desktop\cartes_alertes\meteofrance_hourly_forecast.csv",
    r"C:\Users\grego\Documents\METEO_CLIMAT\meteo-kappa\meteo_cnews_2\meteofrance_daily_forecast.csv",
    r"C:\Users\grego\Documents\METEO_CLIMAT\meteo-kappa\meteo_cnews_2\meteofrance_hourly_forecast.csv"
]

for p in paths:
    if not os.path.exists(p):
        print(f"File not found: {p}")
        continue
    print(f"\n==================== {p} ====================")
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f, delimiter=";")
        header = next(reader, None)
        print("Header:", header)
        rows = list(reader)
        # Check rows with weathercode == 9 or Temps_Label containing 'neige' or 'P12'
        snow_rows = []
        for r in rows:
            line_str = ";".join(r)
            if any(k in line_str.lower() for k in ["neige", "p12", "pluie"]):
                snow_rows.append(r)
            # Also check if weathercode column is 9
            # In header: weathercode is usually column 4 or 6
            if len(r) > 4 and r[4] in ["9", "P12", "P12 (neige)"]:
                snow_rows.append(r)
        
        print(f"Total rows: {len(rows)}, Matching rows: {len(snow_rows)}")
        for r in snow_rows[:15]:
            print("  ", r)
