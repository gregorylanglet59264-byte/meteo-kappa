import urllib.request
import urllib.parse
import re
import json
from datetime import datetime

def rot13(s):
    res = []
    for c in s:
        if 'a' <= c <= 'z':
            res.append(chr(97 + (ord(c) - 97 + 13) % 26))
        elif 'A' <= c <= 'Z':
            res.append(chr(65 + (ord(c) - 65 + 13) % 26))
        else:
            res.append(c)
    return "".join(res)

def get_session_token():
    url = "https://vigilance.meteofrance.fr/fr"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    mfsession = None
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            headers = response.getheaders()
            for header, value in headers:
                if header.lower() == 'set-cookie' and 'mfsession=' in value:
                    m = re.search(r'mfsession=([^;]+)', value)
                    if m:
                        mfsession = m.group(1)
                        break
    except Exception as e:
        print("Error fetching main page:", e)
        return None
    if not mfsession:
        return None
    return rot13(urllib.parse.unquote(mfsession))

token = get_session_token()
print("Token:", token[:20] if token else "None")

CITIES = [
    { "name": "BREST", "lat": 48.39, "lon": -4.48 },
    { "name": "RENNES", "lat": 48.11, "lon": -1.67 },
    { "name": "CHERBOURG", "lat": 49.63, "lon": -1.62 },
    { "name": "ROUEN", "lat": 49.44, "lon": 1.10 },
    { "name": "PARIS", "lat": 48.85, "lon": 2.35 },
    { "name": "LILLE", "lat": 50.62, "lon": 3.05 },
    { "name": "BOULOGNE-SUR-MER", "lat": 50.726, "lon": 1.614 },
    { "name": "REIMS", "lat": 49.25, "lon": 4.03 },
    { "name": "METZ", "lat": 49.11, "lon": 6.17 },
    { "name": "NANTES", "lat": 47.21, "lon": -1.55 },
    { "name": "TOURS", "lat": 47.39, "lon": 0.68 },
    { "name": "AUXERRE", "lat": 47.79, "lon": 3.57 },
    { "name": "CHAUMONT", "lat": 48.11, "lon": 5.14 },
    { "name": "STRASBOURG", "lat": 48.57, "lon": 7.75 },
    { "name": "BOURGES", "lat": 47.08, "lon": 2.39 },
    { "name": "BELFORT", "lat": 47.63, "lon": 6.86 },
    { "name": "LIMOGES", "lat": 45.83, "lon": 1.26 },
    { "name": "VICHY", "lat": 46.12, "lon": 3.42 },
    { "name": "LYON", "lat": 45.76, "lon": 4.83 },
    { "name": "PONTARLIER", "lat": 46.90, "lon": 6.35 },
    { "name": "LA ROCHELLE", "lat": 46.16, "lon": -1.15 },
    { "name": "BORDEAUX", "lat": 44.83, "lon": -0.57 },
    { "name": "BIARRITZ", "lat": 43.48, "lon": -1.56 },
    { "name": "TARBES", "lat": 43.23, "lon": 0.07 },
    { "name": "TOULOUSE", "lat": 43.60, "lon": 1.44 },
    { "name": "AURILLAC", "lat": 44.92, "lon": 2.44 },
    { "name": "MONTÉLIMAR", "lat": 44.55, "lon": 4.75 },
    { "name": "GAP", "lat": 44.55, "lon": 6.07 },
    { "name": "PERPIGNAN", "lat": 42.69, "lon": 2.89 },
    { "name": "MONTPELLIER", "lat": 43.61, "lon": 3.87 },
    { "name": "MARSEILLE", "lat": 43.296, "lon": 5.381 },
    { "name": "AMIENS", "lat": 49.894, "lon": 2.295 },
    { "name": "NICE", "lat": 43.71, "lon": 7.26 },
    { "name": "AJACCIO", "lat": 41.92, "lon": 8.73 },
    { "name": "BASTIA", "lat": 42.69, "lon": 9.45 },
    { "name": "ALENÇON", "lat": 48.43, "lon": 0.09 },
    { "name": "BOURG-ST-MAURICE", "lat": 45.62, "lon": 6.77 },
    { "name": "CHALON/SAÔNE", "lat": 46.78, "lon": 4.85 },
    { "name": "AGEN", "lat": 44.20, "lon": 0.61 }
]

snow_cities = []
all_results = []

for c in CITIES:
    lat, lon, name = c["lat"], c["lon"], c["name"]
    url = f"https://rwg.meteofrance.com/internet2018client/2.0/forecast?lat={lat}&lon={lon}&token={token}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            
            # Check daily forecast for Saturday 2026-08-15
            daily = data.get('properties', {}).get('daily_forecast', [])
            hourly = data.get('properties', {}).get('hourly_forecast', [])
            
            # Find saturday morning forecast
            sat_daily = None
            for d in daily:
                if '2026-08-15' in d.get('time', ''):
                    sat_daily = d
                    break
            
            # Saturday 08:00 UTC (10h locale)
            sat_morning_hourly = None
            for h in hourly:
                if '2026-08-15T06:00:00' in h.get('time', '') or '2026-08-15T08:00:00' in h.get('time', ''):
                    sat_morning_hourly = h
                    break
                    
            weather_desc = sat_daily.get('daily_weather_description', '') if sat_daily else ''
            weather_icon = sat_daily.get('daily_weather_icon', '') if sat_daily else ''
            h_desc = sat_morning_hourly.get('weather_description', '') if sat_morning_hourly else ''
            h_icon = sat_morning_hourly.get('weather_icon', '') if sat_morning_hourly else ''
            t = sat_morning_hourly.get('T', '') if sat_morning_hourly else ''
            t_min = sat_daily.get('T_min', '') if sat_daily else ''
            t_max = sat_daily.get('T_max', '') if sat_daily else ''

            entry = {
                "name": name,
                "t_min": t_min,
                "t_max": t_max,
                "t_morning": t,
                "daily_icon": weather_icon,
                "daily_desc": weather_desc,
                "morning_icon": h_icon,
                "morning_desc": h_desc
            }
            all_results.append(entry)
            
            # Check if snow icon
            if any(k in str(weather_icon).lower() or k in str(h_icon).lower() or k in str(weather_desc).lower() or k in str(h_desc).lower() for k in ['neige', 'snow', 'p10', 'p11', 'p12']):
                snow_cities.append(entry)
    except Exception as ex:
        print(f"Error {name}: {ex}")

print(f"\n--- Total checked: {len(all_results)} cities ---")
print(f"Snow detected in {len(snow_cities)} cities:")
for sc in snow_cities:
    print(sc)

print("\n--- Summary of all cities Saturday Morning (15 Août 2026) ---")
for r in all_results:
    print(f"{r['name']:<18} | Tmin:{r['t_min']}°C Tmax:{r['t_max']}°C | Matin:{r['t_morning']}°C | Icon:{r['morning_icon']} ({r['morning_desc']}) | DailyIcon:{r['daily_icon']}")
