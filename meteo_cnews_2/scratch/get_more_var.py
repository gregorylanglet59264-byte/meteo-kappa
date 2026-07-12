import requests
import json
import time

new_cities = [
    "Saint-Cyr-sur-Mer", "Le Beausset", "La Cadière-d'Azur", "Le Castellet",
    "Évenos", "Toulon", "Saint-Mandrier-sur-Mer", "La Valette-du-Var",
    "La Garde", "Le Pradet", "Carqueiranne", "Solliès-Pont",
    "Solliès-Toucas", "Solliès-Ville", "Belgentier"
]

results = []
for city in new_cities:
    url = f"https://geo.api.gouv.fr/communes?nom={city}&codeDepartement=83&fields=nom,centre&boost=population&limit=1"
    res = requests.get(url)
    if res.ok and res.json():
        data = res.json()[0]
        lon, lat = data['centre']['coordinates']
        results.append({"name": data['nom'], "lat": lat, "lon": lon})
    time.sleep(0.1)

print(json.dumps(results, indent=4, ensure_ascii=False))
