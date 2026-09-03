import urllib.request
import urllib.parse
import re
import json

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
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            for h, v in resp.getheaders():
                if h.lower() == 'set-cookie' and 'mfsession=' in v:
                    m = re.search(r'mfsession=([^;]+)', v)
                    if m: return rot13(urllib.parse.unquote(m.group(1)))
    except: pass
    return None

token = get_session_token()

# Let's fetch several cities across France and examine all icons and descriptions
cities = [
    ("PARIS", 48.85, 2.35),
    ("REIMS", 49.25, 4.03),
    ("AUXERRE", 47.79, 3.57),
    ("LILLE", 50.62, 3.05),
    ("STRASBOURG", 48.57, 7.75),
    ("LYON", 45.76, 4.83),
    ("BORDEAUX", 44.83, -0.57),
    ("TOULOUSE", 43.60, 1.44),
    ("MARSEILLE", 43.296, 5.381),
    ("NICE", 43.71, 7.26),
    ("BREST", 48.39, -4.48),
    ("CLERMONT", 45.78, 3.08)
]

icon_desc_map = {}

for name, lat, lon in cities:
    url = f"https://rwg.meteofrance.com/internet2018client/2.0/forecast?lat={lat}&lon={lon}&token={token}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            daily = data.get('properties', {}).get('daily_forecast', [])
            hourly = data.get('properties', {}).get('hourly_forecast', [])
            
            for d in daily:
                icon = d.get('daily_weather_icon')
                desc = d.get('daily_weather_description')
                if icon:
                    icon_desc_map[icon] = desc
            for h in hourly:
                icon = h.get('weather_icon')
                desc = h.get('weather_description')
                if icon:
                    icon_desc_map[icon] = desc
    except Exception as e:
        print(f"Error {name}: {e}")

print("=== Météo-France icon -> description mapping found in live API ===")
for k in sorted(icon_desc_map.keys()):
    print(f"'{k}': '{icon_desc_map[k]}'")
