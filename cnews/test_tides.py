
import requests

lat, lon = 48.39, -4.48
vars_to_test = ["sea_level_height", "tide_height", "water_level", "height", "sea_level", "tides", "level"]

for v in vars_to_test:
    url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly={v}&timezone=Europe/Paris"
    r = requests.get(url)
    print(f"Testing {v}: {r.status_code}")
    if r.status_code == 200:
        print(f"SUCCESS for {v}!")
        break
    else:
        print(f"Error for {v}: {r.text[:100]}")
