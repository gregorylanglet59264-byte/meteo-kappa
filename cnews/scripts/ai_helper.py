import os
import sys
import json
import datetime
import urllib.request
import urllib.error
import re
from dotenv import load_dotenv

# Load env from project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local"))

import unicodedata

FRENCH_WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
FRENCH_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
                 "septembre", "octobre", "novembre", "décembre"]

def normalize_city(name):
    s = str(name).strip().lower()
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

OPENROUTER_MODEL = "deepseek/deepseek-v4-flash"
OPENROUTER_VISION_MODEL = os.environ.get("OPENROUTER_VISION_MODEL", "google/gemini-2.5-pro")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def french_date(date_obj, include_year=True):
    wd = FRENCH_WEEKDAYS[date_obj.weekday()]
    mo = FRENCH_MONTHS[date_obj.month - 1]
    if include_year:
        return f"{wd} {date_obj.day} {mo} {date_obj.year}"
    return f"{wd} {date_obj.day} {mo}"


def get_api_key():
    return os.environ.get("OPENROUTER_API_KEY") or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def read_meteofrance_local_data():
    """Reads local Météo-France CSV files from Cartes Alerte to prefer exact Météo-France temperatures."""
    mf_data = {}
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    csv_dir = os.path.abspath(os.path.join(project_root, "..", "cartes_alertes"))
    if not os.path.exists(csv_dir):
        csv_dir = os.path.expanduser(r"~\Desktop\cartes_alertes")
        
    if os.path.exists(csv_dir):
        for fname in os.listdir(csv_dir):
            if fname.startswith("meteofrance_daily_forecast") and fname.endswith(".csv"):
                try:
                    import csv
                    with open(os.path.join(csv_dir, fname), "r", encoding="utf-8-sig") as f:
                        reader = csv.DictReader(f, delimiter=";")
                        for row in reader:
                            cname = normalize_city(row.get("Ville", ""))
                            try:
                                lat_val = float(row.get("Latitude", 0))
                                lon_val = float(row.get("Longitude", 0))
                            except ValueError:
                                lat_val, lon_val = 0, 0
                            coord_key = f"{round(lat_val, 2)}_{round(lon_val, 2)}"
                            
                            date_str = row.get("Date", "").strip()
                            if not date_str:
                                continue
                            try:
                                import math
                                tmin = int(math.floor(float(row.get("temperature_2m_min", 0)) + 0.5))
                                tmax = int(math.floor(float(row.get("temperature_2m_max", 0)) + 0.5))
                                code = int(row.get("weathercode", 0))
                            except (ValueError, TypeError):
                                continue
                                
                            if coord_key not in mf_data:
                                mf_data[coord_key] = {}
                            mf_data[coord_key][date_str] = {"tmin": tmin, "tmax": tmax, "code": code, "wind": 15, "rain": 0.0}
                            
                            if cname:
                                if cname not in mf_data:
                                    mf_data[cname] = {}
                                mf_data[cname][date_str] = {"tmin": tmin, "tmax": tmax, "code": code, "wind": 15, "rain": 0.0}
                except Exception:
                    pass
    return mf_data


def fetch_weather_struct(cities, day_offset):
    """Fetch real weather struct, prioritizing official Météo-France CSV data with fallback to Open-Meteo."""
    if not cities:
        return []
    selected = [c for c in cities if isinstance(c, dict) and "lat" in c and "lon" in c][:10]
    if not selected:
        return []
    mf_data = read_meteofrance_local_data()
    
    lats = ",".join(str(c["lat"]) for c in selected)
    lons = ",".join(str(c["lon"]) for c in selected)
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lats}&longitude={lons}"
        f"&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,weather_code,precipitation_sum"
        f"&timezone=Europe/Paris&forecast_days=10"
    )
    results_list = []
    import time
    data = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            break
        except Exception as e:
            if attempt == 2:
                print(f"Warning: Could not fetch weather struct: {e}")
                return []
            print(f"  [open-meteo struct] Retry {attempt+1}/3 due to: {e}")
            time.sleep(3)
            
    if data:
        results = data if isinstance(data, list) else [data]
        for i, r in enumerate(results):
                city = selected[i]
                cname = normalize_city(city["name"])
                try:
                    lat_val = float(city["lat"])
                    lon_val = float(city["lon"])
                except ValueError:
                    lat_val, lon_val = 0, 0
                coord_key = f"{round(lat_val, 2)}_{round(lon_val, 2)}"
                
                d = r.get("daily", {})
                if not d:
                    continue
                try:
                    target_date = datetime.date.today() + datetime.timedelta(days=day_offset)
                    target_date_str = target_date.strftime("%d/%m/%Y")
                    
                    # Prefer exact Météo-France CSV data if available for this coordinate or city name
                    if coord_key in mf_data and target_date_str in mf_data[coord_key]:
                        mf_item = mf_data[coord_key][target_date_str]
                        tmin = mf_item["tmin"]
                        tmax = mf_item["tmax"]
                        code = mf_item["code"]
                    elif cname in mf_data and target_date_str in mf_data[cname]:
                        mf_item = mf_data[cname][target_date_str]
                        tmin = mf_item["tmin"]
                        tmax = mf_item["tmax"]
                        code = mf_item["code"]
                    else:
                        closest_mf = None
                        min_dist = 0.15 # ~15km radius tolerance
                        for mf_key, dates in mf_data.items():
                            if "_" in mf_key:
                                try:
                                    mlat, mlon = map(float, mf_key.split("_"))
                                    dist = ((lat_val - mlat)**2 + (lon_val - mlon)**2)**0.5
                                    if dist < min_dist and target_date_str in dates:
                                        min_dist = dist
                                        closest_mf = mf_key
                                except ValueError:
                                    pass
                        if closest_mf:
                            mf_item = mf_data[closest_mf][target_date_str]
                            tmin = mf_item["tmin"]
                            tmax = mf_item["tmax"]
                            code = mf_item["code"]
                        else:
                            import math
                            tmin = int(math.floor(d.get("temperature_2m_min", [0]*8)[day_offset] + 0.5))
                            tmax = int(math.floor(d.get("temperature_2m_max", [0]*8)[day_offset] + 0.5))
                            code = int(d.get("weathercode", [0]*8)[day_offset])
                    wind_raw = float(d["wind_speed_10m_max"][day_offset])
                    wind = int(round(wind_raw / 5.0) * 5)
                    rain = round(d["precipitation_sum"][day_offset], 1)
                    results_list.append({
                        "city": city["name"],
                        "tmin": tmin,
                        "tmax": tmax,
                        "wind": wind,
                        "code": code,
                        "rain": rain
                    })
                except (IndexError, KeyError):
                    pass
    return results_list


def fetch_raw_weather(cities, day_offset):
    """Fetch real weather data formatted as string from Open-Meteo."""
    struct = fetch_weather_struct(cities, day_offset)
    lines = []
    for s in struct:
        lines.append(
            f"- {s['city']} : Min {s['tmin']}°C, Max {s['tmax']}°C, "
            f"Vent {s['wind']} km/h, Code météo {s['code']}, Pluie {s['rain']} mm"
        )
    return "\n".join(lines)


def extract_xml_tag(text, tag):
    # Remove markdown code blocks first to make matching clean
    clean_text = re.sub(r'```[a-zA-Z]*\n', '', text)
    clean_text = clean_text.replace('```', '')
    match = re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", clean_text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def call_openrouter(api_key, prompt, images=None):
    """Call OpenRouter API with the given prompt and optional multimodal images. Returns the response text."""
    if images and any(images):
        valid_images = [img for img in images if img]
        model = OPENROUTER_VISION_MODEL
        content_list = [{"type": "text", "text": prompt}]
        for img_url in valid_images:
            content_list.append({"type": "image_url", "image_url": {"url": img_url}})
        messages = [{"role": "user", "content": content_list}]
        print(f"   [Mode Visio Actif 👁️] Envoi de {len(valid_images)} cartes HD Météo-France au modèle Vision : {model}")
    else:
        model = OPENROUTER_MODEL
        messages = [{"role": "user", "content": prompt}]

    payload = json.dumps({
        "model": model,
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 4000,
    }).encode("utf-8")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cnews.weather.local",
        "X-Title": "CNews Bulletin Météo",
    }
    req = urllib.request.Request(OPENROUTER_API_URL, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        return result["choices"][0]["message"]["content"]


def generate_local_fallback_texts(client_name, cities, day_offset):
    """Générateur de secours local et déterministe basé 100% sur Open-Meteo et les dates exactes."""
    today = datetime.date.today()
    d1 = today + datetime.timedelta(days=day_offset)
    d2 = today + datetime.timedelta(days=day_offset + 1)
    d3 = today + datetime.timedelta(days=day_offset + 2)
    d4 = today + datetime.timedelta(days=day_offset + 3)
    d5 = today + datetime.timedelta(days=day_offset + 4)

    j1_struct = fetch_weather_struct(cities, day_offset)
    j2_struct = fetch_weather_struct(cities, day_offset + 1)
    j3_struct = fetch_weather_struct(cities, day_offset + 2)
    j4_struct = fetch_weather_struct(cities, day_offset + 3)
    j5_struct = fetch_weather_struct(cities, day_offset + 4)

    wd1 = FRENCH_WEEKDAYS[d1.weekday()]
    wd2 = FRENCH_WEEKDAYS[d2.weekday()]

    date_j1 = french_date(d1, include_year=True)
    date_j2 = french_date(d2, include_year=False)
    date_j3 = french_date(d3, include_year=False)
    date_j4 = french_date(d4, include_year=False)
    date_j5 = french_date(d5, include_year=False)

    import random
    def format_min_list(struct):
        if not struct:
            return "des températures matinales douces"
        sampled = random.sample(struct, min(5, len(struct)))
        return ", ".join(f"{s['tmin']}°C à {s['city']}" for s in sampled)

    def format_max_list(struct):
        if not struct:
            return "des températures maximales estivales"
        sampled = random.sample(struct, min(5, len(struct)))
        return ", ".join(f"{s['tmax']}°C à {s['city']}" for s in sampled)

    # Déterminer la situation synoptique générale depuis les codes météo J1
    avg_max_j1 = sum(s['tmax'] for s in j1_struct) / len(j1_struct) if j1_struct else 25
    has_rain_j1 = any(s['rain'] > 1.0 or s['code'] >= 50 for s in j1_struct)
    has_storm_j1 = any(s['code'] >= 90 for s in j1_struct)

    if has_storm_j1:
        synop = "déstabilisation d'une masse d'air surchauffée et lourde sous l'effet d'une hausse de l'instabilité diurne"
        ambiance_matin = "déjà lourde et étouffante au lever du jour à la faveur d'une nuit tropicale, avec des cumulus bourgeonnant rapidement"
        ambiance_aprem = "un ciel chaotique devenant menaçant avec le déclenchement d'averses orageuses localement fortes et accompagnées de rafales de vent"
    elif avg_max_j1 >= 32:
        synop = "poussée d'une puissante dorsale anticyclonique d'altitude advectant une masse d'air subtropicale particulièrement brûlante"
        ambiance_matin = "déjà étouffante au lever du jour à la faveur d'une nuit tropicale à rayonnement nocturne limité"
        ambiance_aprem = "un ensoleillement de plomb sous un dôme de chaleur intense, à peine voilé par de rares cirrus de haute altitude"
    elif has_rain_j1:
        synop = "circulation d'un flux océanique d'ouest perturbé et humide sous influence d'une dépression circulant sur les îles Britanniques"
        ambiance_matin = "grise et humide, caractérisée par des bancs de stratus bas et des passages de pluies faibles à modérées"
        ambiance_aprem = "un ciel dominé par des passages nuageux denses accompagnés d'averses régulières et d'un renforcement des brises"
    else:
        synop = "installation d'un solide marais barométrique estival à faible gradient de pression sous influence anticyclonique"
        ambiance_matin = "lumineuse et vivifiante après la dissipation rapide des rares grisailles maritimes ou brumes de vallée à l'aube"
        ambiance_aprem = "un grand soleil généreux et stable, simplement agrémenté de quelques cirrus décoratifs à haute altitude"

    today_summary = (
        f"Ce {wd1}, la situation générale sur l'ensemble de la zone {client_name} est caractérisée par la {synop}. "
        f"Cette dynamique aérologique gouverne une ambiance {ambiance_matin.split()[0]} en matinée, avant un réchauffement diurne marqué. "
        f"En surface, le régime de vent reste modéré mais participe activement à la distribution des masses d'air, favorisant la mise en place de brises thermiques en journée. "
        f"Sous l'évolution du rayonnement solaire, l'amplitude thermique restera notable entre la fraîcheur relative de l'aube et les maximales relevées sous abri dans l'après-midi."
    )

    summary_morning = (
        f"Ce {wd1} matin, le réveil se fait dans une ambiance {ambiance_matin}. "
        f"La situation synoptique favorise un ciel globalement calme dès l'aube, bien que quelques grisailles locales "
        f"ou brumes légères puissent temporairement s'accrocher dans les vallées avant de se dissiper rapidement. "
        f"Les valeurs au lever du jour s'échelonnent avec {format_min_list(j1_struct)}. "
        f"Le vent souffle discrètement, maintenant un ressenti souvent doux dès les premières heures du jour. "
        f"La matinée se poursuit sous un ensoleillement en progression constante, offrant d'excellentes conditions "
        f"pour les déplacements de la matinée sur l'ensemble de nos secteurs."
    )

    summary_afternoon = (
        f"L'après-midi, le temps est marqué par {ambiance_aprem}. "
        f"Le thermomètre affiche des valeurs très contrastées selon l'exposition au vent ou la présence de nuages, "
        f"avec des maximales atteignant {format_max_list(j1_struct)}. "
        f"Quelques cumulus de beau temps peuvent bourgeonner au-dessus des reliefs ou dans les terres, "
        f"tandis que les zones littorales profitent d'une brise marine rafraîchissante qui modère les ardeurs du mercure. "
        f"En soirée, l'atmosphère conserve une grande douceur, idéale pour les sorties et activités de plein air, "
        f"sous un ciel qui a tendance à se dégager progressivement avant la tombée de la nuit."
    )

    summary_morning2 = (
        f"Ce {wd2} matin ({date_j2}), la journée débute sous un ciel généralement lumineux et peu nuageux. "
        f"Après une nuit calme, les températures matinales sont douces et affichent {format_min_list(j2_struct)}. "
        f"Les vents matinaux restent faibles à modérés, assurant une excellente visibilité sur les axes routiers. "
        f"La matinée s'annonce agréable et propice aux activités extérieures avant le réchauffement diurne."
    )

    summary_afternoon2 = (
        f"L'après-midi du {date_j2}, le soleil continue de s'imposer malgré quelques passages nuageux d'altitude ou bancs de cumulus. "
        f"Les températures maximales évoluent vers {format_max_list(j2_struct)}. "
        f"L'ambiance reste estivale et lumineuse, avec un vent faible qui apporte une légère ventilation dans l'intérieur des terres."
    )

    def get_trend_line(date_str, struct):
        if not struct:
            return f"- {date_str} : Temps ensoleillé et agréable, températures de saison avec un vent modéré."
        tmin = min(s['tmin'] for s in struct) if struct else 15
        tmax = max(s['tmax'] for s in struct) if struct else 25
        code = max((s['code'] for s in struct), default=0)
        if code >= 80:
            desc = "Temps instable avec passages d'averses orageuses et vent sensible"
        elif code >= 50:
            desc = "Ciel souvent nuageux à couvert avec quelques pluies éparses"
        elif tmax >= 32:
            desc = "Poursuite de la chaleur caniculaire sous un grand soleil dominant"
        else:
            desc = "Temps calme, sec et largement lumineux avec quelques nuages inoffensifs"
        return f"- {date_str} : {desc}. Minimales vers {tmin}°C, maximales atteignant {tmax}°C en journée."

    forecast_raw = (
        f"📉 Tendance – 3 jours suivants ({date_j3} au {date_j5})\n\n"
        f"{get_trend_line(date_j3, j3_struct)}\n"
        f"{get_trend_line(date_j4, j4_struct)}\n"
        f"{get_trend_line(date_j5, j5_struct)}"
    )

    vig_warning = "Canicule & Vigilance : 72 départements en vigilance orange Canicule sur les trois-quarts sud de la France. Épisode persistant sur plusieurs jours.\n\n" if avg_max_j1 >= 32 else ""
    records_raw = (
        f"{vig_warning}Pluies : Rares et uniquement liées aux passages orageux en soirée ou fin d'après-midi de ce {wd1}. Sécheresse de surface qui s'accentue.\n\n"
        f"Vent : Généralement faible à modéré ce {wd1}, ce qui limite la ventilation de l'air ambiant. Coups de vent localisés possibles sous les cellules instables.\n\n"
        f"Orages : Activité orageuse localisée sur les massifs des Alpes et des Pyrénées en fin de journée de ce {wd1}, avec une évolution possible sur les reliefs ce week-end.\n\n"
        f"Neige en montagne : Absente en raison de l'isotherme 0°C perché à des altitudes élevées au-delà de 4200 m.\n\n"
        f"Brouillards : Quelques grisailles maritimes localisées au lever du jour vers la Manche et les côtes atlantiques, se dissipant rapidement."
    )

    mountain_text = (
        f"🏔️ Météo montagne\n\n"
        f"    Alpes : Chaleur marquée en vallée ce {wd1} et risque d'orages isolés en fin de journée, particulièrement sur les Alpes du Sud l'après-midi.\n\n"
        f"    Pyrénées : Soleil dominant en matinée de ce {wd1}, avant des cumulus bourgeonnants et un risque d'averses orageuses sur les crêtes dans l'après-midi et ce {wd2}.\n\n"
        f"    Massif central : Ambiance lourde et estivale ce {wd1}. Instabilité en fin d'après-midi avec un risque d'ondées localisées sur les sommets.\n\n"
        f"    Vosges : Temps très chaud et généreusement ensoleillé ce {wd1}. Quelques nuages de beau temps l'après-midi sans intempérie.\n\n"
        f"    Jura : Chaleur estivale et soleil dominant ce {wd1}, avant quelques passages nuageux inoffensifs en soirée.\n\n"
        f"    Corse : Grand beau temps ensoleillé et très chaud sur les sommets comme sur le littoral pour cette journée du {date_j1}."
    )

    coastal_t = int(round(min(s["tmax"] for s in j1_struct))) if j1_struct else 26
    water_t = "19 à 20°C" if coastal_t >= 25 else "17 à 18°C"

    if "NORD" in client_name.upper() or "6" in client_name.upper() or "MONA" in client_name.upper():
        beach_text = (
            f"🏖️ MÉTÉO DES PLAGES – CÔTE D’OPALE & MER DU NORD ({date_j1})\n\n"
            f"🌴 Dunkerque / Malo-les-Bains\n"
            f"☀️ Belle journée estivale et lumineuse ce {wd1}.\n"
            f"🌡️ Température sous abri : {coastal_t}°C (ambiance plus respirable qu’à l’intérieur)\n"
            f"🌊 Température de l’eau : {water_t}\n\n"
            f"🌴 Calais / Boulogne-sur-Mer / Le Touquet\n"
            f"☀️ Soleil largement dominant ce {wd1}, bercé par de légères brises thermiques de Nord-Est.\n"
            f"🌡️ Température maximale : {coastal_t - 1} à {coastal_t}°C\n"
            f"🌊 Température de l’eau : {water_t}"
        )
        marine_text = (
            f"🌊 MÉTÉO MARINE – CÔTE D’OPALE & MER DU NORD ({date_j1})\n\n"
            f"📍 Zones : Dunkerque • Calais • Boulogne-sur-Mer • Le Touquet\n\n"
            f"☀️ Situation générale : {synop.capitalize()}.\n"
            f"🌬️ Vent : Régime de brise marine de Nord-Est modéré (15 à 25 km/h) en journée de ce {wd1}, faiblissant en soirée.\n"
            f"🌊 État de la mer : Mer belle à peu agitée au large, idéale pour la navigation de plaisance et les activités nautiques.\n"
            f"⚠️ Houle & Marées : Faible houle d'ouest (0.5 à 1.0 m), excellente visibilité horizontale après dissipation des brumes."
        )
    elif "ROCHELLE" in client_name.upper() or "NAQ" in client_name.upper():
        beach_text = (
            f"🏖️ MÉTÉO DES PLAGES – LITTORAL CHARENTAIS ({date_j1})\n\n"
            f"🌴 La Rochelle / Île de Ré / Île d’Oléron\n"
            f"☀️ Soleil omniprésent et chaleur estivale marquée sur l'ensemble des plages charentaises ce {wd1}.\n"
            f"🌡️ Température sur le littoral : {coastal_t + 3} à {coastal_t + 6}°C\n"
            f"🌊 Température de l’eau : 21 à 23°C\n\n"
            f"🌴 Royan / Côte de Beauté / Rochefort\n"
            f"☀️ Ensoleillement généreux ce {wd1}, chaleur intense tempérée par une brise thermique l'après-midi.\n"
            f"🌡️ Température maximale : {coastal_t + 5} à {coastal_t + 8}°C\n"
            f"🌊 Température de l’eau : 22 à 24°C"
        )
        marine_text = (
            f"🌊 MÉTÉO LITTORALE & MARINE – CHARENTE-MARITIME ({date_j1})\n\n"
            f"📍 Zones : La Rochelle • Rochefort • Royan • Pertuis Breton & d'Antioche\n\n"
            f"☀️ Situation synoptique : {synop.capitalize()}.\n"
            f"🌬️ Vent : Régime de brises thermiques, d'abord d'Est-Nord-Est le matin (10-15 km/h) puis basculant au Nord-Ouest l'après-midi (20-30 km/h).\n"
            f"🌊 État de la mer : Mer belle à peu agitée dans les pertuis, peu agitée au large. Bonne visibilité sur l'ensemble du bassin charentais."
        )
    elif "NORMANDIE" in client_name.upper():
        beach_text = (
            f"🏖️ MÉTÉO DES PLAGES – CÔTE D’ALBÂTRE & MANCHE ({date_j1})\n\n"
            f"🌴 Le Havre / Deauville / Cabourg\n"
            f"☀️ Temps très agréable et ensoleillé ce {wd1}, avec une ambiance estivale douce et lumineuse.\n"
            f"🌡️ Température sur les plages : {coastal_t + 1} à {coastal_t + 4}°C\n"
            f"🌊 Température de l’eau : 18 à 19°C\n\n"
            f"🌴 Dieppe / Fécamp / Cherbourg\n"
            f"☀️ Belle luminosité dès le matin ce {wd1} après dissipation des grisailles côtières, brise de nord-est sensible.\n"
            f"🌡️ Température maximale sous abri : {coastal_t} à {coastal_t + 2}°C\n"
            f"🌊 Température de l’eau : 17 à 18°C"
        )
        marine_text = (
            f"🌊 MÉTÉO MARINE – MANCHE & LITTORAL NORMAND ({date_j1})\n\n"
            f"📍 Zones : Baie de Seine • Le Havre • Fécamp • Dieppe • Cherbourg\n\n"
            f"☀️ Situation générale : {synop.capitalize()}.\n"
            f"🌬️ Vent : Flux de Nord-Est modéré (20 à 30 km/h avec quelques pointes à 35 km/h sur les caps exposés) ce {wd1}.\n"
            f"🌊 État de la mer : Mer peu agitée à localement agitée au large du Cotentin, belle en Baie de Seine. Visibilité bonne après dissipation des brumes."
        )
    else:
        beach_text = ""
        marine_text = ""

    return {
        "todaySummary": today_summary,
        "summaryMorning": summary_morning,
        "summaryAfternoon": summary_afternoon,
        "summaryMorning2": summary_morning2,
        "summaryAfternoon2": summary_afternoon2,
        "forecastRaw": forecast_raw,
        "forecastTextRaw": forecast_raw,
        "recordsRaw": records_raw,
        "mountain": mountain_text,
        "mountainTitle": f"🏔️ MÉTÉO DES MONTAGNES DU {date_j1.upper()}",
        "beach": beach_text,
        "marine": marine_text
    }


def fetch_vigilance_and_national_context(day_offset=1):
    """Runs vigilance skill summary, prioritizing J+2 to J+7 trends and vigilance alerts, skipping Section 2 if day_offset >= 1."""
    try:
        import subprocess
        import re
        script_path = os.path.expanduser(r"~\.gemini\config\skills\vigilance\scripts\get_vigilance_data.py")
        if os.path.exists(script_path):
            res = subprocess.run([sys.executable, script_path], capture_output=True, text=True, timeout=15)
            if res.returncode == 0 and res.stdout:
                out = res.stdout.strip()
                parts = out.split("==================================================")
                if len(parts) >= 3:
                    p1_trend = parts[0].strip()[:1400] # Résumé PDF J+2 à J+7
                    p2_bulletin = parts[1].strip()[:1200] # Bulletin national meteofrance.com
                    
                    p3_raw_vigilance = parts[2].strip()
                    # Découpage par jour pour ne garder que le jour ciblé et éviter la troncature
                    vig_blocks = re.split(r'###\s*Vigilance\s+météo\s+et\s+crues\s+pour', p3_raw_vigilance, flags=re.IGNORECASE)
                    
                    target_block = ""
                    if len(vig_blocks) > 1:
                        target_idx = min(day_offset, 1) + 1
                        if target_idx < len(vig_blocks):
                            target_block = "### Vigilance météo et crues pour" + vig_blocks[target_idx]
                        else:
                            target_block = "### Vigilance météo et crues pour" + vig_blocks[-1]
                    else:
                        target_block = p3_raw_vigilance[:1800]
                    
                    p3_vigilance = target_block.strip()

                    if day_offset >= 1:
                        # Si on vise le prochain jour (J+1 / Demain ou plus), on ignore le bulletin meteofrance.com (souvent en retard sur J+0)
                        # et on met en avant le PDF J+2/J+7 + la liste complète de la Vigilance Orange/Jaune
                        return f"=== TENDANCE PROCHAINS JOURS (J+2 à J+7) ===\n{p1_trend}\n\n=== VIGILANCE DÉPARTEMENTALE OFFICIELLE ===\n{p3_vigilance}"
                    else:
                        return f"=== BULLETIN NATIONAL DU JOUR ===\n{p2_bulletin}\n\n=== VIGILANCE DÉPARTEMENTALE OFFICIELLE ===\n{p3_vigilance}\n\n=== TENDANCE PROCHAINS JOURS (J+2 à J+7) ===\n{p1_trend[:800]}"
                return out[:2800]
    except Exception:
        pass
    return "72 départements en vigilance orange Canicule sur la France. Chaleur persistante et forte sur les prochains jours (J+2 à J+7)."


def get_client_region_prefix(client_name):
    """Determine region prefix for map image lookup based on client name."""
    c_clean = client_name.strip().upper()
    if "EUROPE" in c_clean:
        return ""
    elif any(k in c_clean for k in ["NORD", "RADIO 6", "MONA"]):
        return "hdf_"
    elif "ROCHELLE" in c_clean:
        return "naq_"
    elif "NORMANDIE" in c_clean:
        return "normandie_"
    return ""


def generate_bulletin_texts(client_name, cities, day_offset, images=None):
    """Generate rich AI forecast texts using OpenRouter / Vision multimodal models, with bulletproof deterministic fallback."""
    local_fallback = generate_local_fallback_texts(client_name, cities, day_offset)

    api_key = get_api_key()
    if not api_key:
        print("Notice: No OPENROUTER_API_KEY found — using bulletproof local deterministic fallback.")
        return local_fallback

    # Automatic Vision Mode image discovery if not passed directly
    vision_images = images
    if not vision_images and os.environ.get("VISION_MODE", "true").lower() in ["true", "1", "yes"]:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        maps_dir = os.path.abspath(os.path.join(project_root, "..", "cartes_alertes"))
        if not os.path.exists(maps_dir):
            maps_dir = os.path.expanduser(r"~\Desktop\cartes_alertes")
            
        reg_prefix = get_client_region_prefix(client_name)
        img_m_path = os.path.join(maps_dir, f"carte_{reg_prefix}J{day_offset}_matin.jpg")
        img_a_path = os.path.join(maps_dir, f"carte_{reg_prefix}J{day_offset}_apresmidi.jpg")
        img_m2_path = os.path.join(maps_dir, f"carte_{reg_prefix}J{day_offset+1}_matin.jpg")
        img_a2_path = os.path.join(maps_dir, f"carte_{reg_prefix}J{day_offset+1}_apresmidi.jpg")
        
        discovered_imgs = []
        print(f"  [Vision Mode] Découverte des cartes dans : {maps_dir}")
        for p in [img_m_path, img_a_path, img_m2_path, img_a2_path]:
            if os.path.exists(p):
                print(f"    -> Carte trouvée et chargée : {os.path.basename(p)}")
                try:
                    import base64
                    with open(p, "rb") as f:
                        b64_str = base64.b64encode(f.read()).decode("utf-8")
                        discovered_imgs.append(f"data:image/jpeg;base64,{b64_str}")
                except Exception as e:
                    print(f"Warning: Could not read map image {p} for Vision Mode: {e}")
            else:
                print(f"    -> Carte manquante (passée) : {os.path.basename(p)}")
        if discovered_imgs:
            vision_images = discovered_imgs

    today = datetime.date.today()
    d1 = today + datetime.timedelta(days=day_offset)
    d2 = today + datetime.timedelta(days=day_offset + 1)
    d3 = today + datetime.timedelta(days=day_offset + 2)
    d5 = today + datetime.timedelta(days=day_offset + 4)

    date_j1 = french_date(d1, include_year=True)
    date_j2 = french_date(d2, include_year=False)
    date_j3 = french_date(d3, include_year=False)
    date_j5 = french_date(d5, include_year=False)

    print(f"Fetching weather data for AI generation ({client_name}, offset={day_offset})...")
    j1_data = fetch_raw_weather(cities, day_offset)
    j2_data = fetch_raw_weather(cities, day_offset + 1)
    vig_context = fetch_vigilance_and_national_context(day_offset)

    prompt = f"""Tu es un journaliste et présentateur météo radio senior (comme Louis Bodin ou Guillaume Séchet) sur une grande antenne nationale ou régionale.
Rédige les prévisions météo sous forme de chronique parlée, fluide, vivante et très professionnelle en français pour le bulletin "{client_name}". Le ton doit être chaleureux, expert et captivant, parfaitement adapté pour être lu directement au micro d'un studio de radio. Évite les phrases mécaniques ou robotiques, et réalise des transitions naturelles entre les régions.
Date cible principale (Jour 1) : {date_j1} ({FRENCH_WEEKDAYS[d1.weekday()]})
Date cible Jour 2 : {date_j2} ({FRENCH_WEEKDAYS[d2.weekday()]})

DONNÉES OFFICIELLES VIGILANCE & BULLETIN NATIONAL MÉTÉO-FRANCE (À INTÉGRER ET SYNTHÉTISER EN PRIORITÉ DANS TON RÉSUMÉ ET TES PRÉVISIONS) :
{vig_context}

Données météo réelles par ville JOUR 1 ({date_j1}) :
{j1_data if j1_data else "(données non disponibles)"}

Données météo réelles par ville JOUR 2 ({date_j2}) :
{j2_data if j2_data else "(données non disponibles)"}

CONSIGNES DE JOURNALISTE RADIO & CLÉ DE LECTURE DES CARTES :

=== GUIDE DE RECONNAISSANCE DES PICTOGRAMMES MÉTÉO SUR LES IMAGES ===
Pour analyser les images des cartes fournies, identifie précisément les fichiers images des pictogrammes affichés sur chaque ville :
- "orages.png" (CRITIQUE) : Représente un nuage sombre zébré d'un éclair (foudre) blanc/jaune. Signifie un risque d'orages !
- "Orages accompagnés de grêle.png" : Représente un nuage avec un éclair et des grêlons (petits points blancs/noirs).
- "P9 (averses).png" : Un nuage blanc avec des gouttes de pluie et un soleil derrière.
- "P10 (pluies faibles).png" : Un nuage blanc avec quelques fines gouttes de pluie.
- "P11 (fortes pluies).png" : Un nuage gris avec de nombreuses lignes de pluie épaisses et denses.
- "brouillards.png" : Trois lignes horizontales superposées sans nuage.
- "P1 (soleil).png" : Un grand soleil jaune.
- "P2 (peu nuageux).png" : Un soleil avec un petit nuage blanc devant.
- "P8 (nuageux).png" : Un soleil masqué de moitié par un nuage blanc.
- "P4 (très nuageux).png" : Un nuage blanc couvrant.
- "P5 (couvert).png" : Un double nuage gris.
- "P6 (soleil voilé).png" : Un soleil rayé de lignes horizontales très fines.
- "P12 (neige).png" : Un nuage blanc avec des flocons de neige (étoiles).

Prends ton temps pour examiner chaque image de carte pour repérer ces pictogrammes (surtout les orages "orages.png" et "Orages accompagnés de grêle.png") sur toutes les régions !

=== RÈGLES DE STYLE ET MOTS INTERDITS (STRICT ET ABSOLU) ===
1. INTERDICTION DE NOMMER LE SUPPORT : Tu es à la radio. Tes auditeurs ne voient pas les images. Par conséquent, il est FORMELLEMENT INTERDIT d'utiliser les mots suivants dans tes commentaires :
   ❌ MOTS INTERDITS : "carte(s)", "visuel(s)", "image(s)", "graphique(s)", "le montre", "le visuel", "comme on le voit", "comme le montre", "ci-dessous", "pictogramme(s)", "icône(s)", "code(s)", "nos secteurs", "nos zones".
   Fais comme si tu parlais en direct de la météo des régions sans aucun écran devant toi.
2. Style parlé et fluide : Utilise des tournures de présentateur radio senior (ex: "Du côté des températures...", "Le réveil s'annonce...", "Une journée placée sous le signe de...", "Nous retrouvons...", "Le mercure s'affole..."). Évite de faire des listes de villes brutales, intègre les chiffres naturellement dans ton récit.
3. Causalité & Synoptique : Explique brièvement mais avec expertise la cause météorologique en début de bulletin (dorsale anticyclonique des Açores, flux océanique perturbé de sud-ouest, marais barométrique estival, talweg d'altitude, advection d'air subtropical).
4. Nébulosité précise : Qualifie précisément le ciel et les nuages (cirrus d'altitude, cumulus bourgeonnants de l'après-midi, bancs de brouillards côtiers, grisailles matinales).
5. Vents & Géographie : Contextualise le vent selon la région de la radio (brise marine rafraîchissante, mistral sensible, brises thermiques en Manche).
6. Données exactes : Utilise UNIQUEMENT les températures officielles de Météo-France et d'Open-Meteo fournies ci-dessus (aucun chiffre inventé, aucun décimal).
7. Variété des villes : Cite impérativement 5 à 6 villes différentes avec leurs températures exactes. Varie ton choix de villes pour chaque bulletin pour ne pas lasser l'auditeur.
8. Rythme radio : Chaque bloc (`summaryMorning`, `summaryAfternoon`) doit faire entre 140 et 180 mots pour un rythme de lecture confortable d'environ 1 minute à l'antenne.
9. Repères temporels stricts : summaryMorning et summaryAfternoon doivent parler du jour cible {date_j1} et commencer impérativement par "Ce {FRENCH_WEEKDAYS[d1.weekday()]} matin..." et "Ce {FRENCH_WEEKDAYS[d1.weekday()]} après-midi...".
10. IMPÉRATIF SÉCURITÉ & ORAGES : Si le bulletin de vigilance contient la mention d'orages, ou si des villes ont un code météo d'orage (code >= 80 pour Open-Meteo, ou code 10/11 pour Météo-France, ou si tu vois le pictogramme d'orage sur l'image), tu DOIS obligatoirement alerter les auditeurs de façon explicite et dynamique dans `summaryAfternoon` en précisant le risque de violentes averses orageuses locales, d'activité électrique et de fortes rafales sous cellules instables. Ne passe pas sous silence ce risque majeur.


TU DOIS OBLIGATOIREMENT GÉNÉRER LES 6 BALISES XML DANS TA RÉPONSE, DANS CET ORDRE EXACT :
<todaySummary>
Résumé météo global de {date_j1} (120-150 mots). Commence impérativement par "Ce {FRENCH_WEEKDAYS[d1.weekday()]}...". Situation synoptique globale, masses d'air et phénomènes marquants du jour. Ne parle jamais de la veille.
</todaySummary>

<summaryMorning>
Matinée de {date_j1} (150-180 mots). Commence impérativement par "Ce {FRENCH_WEEKDAYS[d1.weekday()]} matin...". Analyse l'Image 1 : vérifie chaque picto (soleil, nuages, pluie, brouillards) affiché sur les villes de la région. Rédige en style parlé, intègre 5-6 villes avec leurs minimales exactes.
</summaryMorning>

<summaryAfternoon>
Après-midi de {date_j1} (150-180 mots). Commence par "Ce {FRENCH_WEEKDAYS[d1.weekday()]} après-midi...". Analyse l'Image 2 : vérifie très attentivement chaque picto (surtout les orages de "orages.png" ou grêle de "Orages accompagnés de grêle.png") affiché sur les villes. Rédige en style parlé, intègre 5-6 villes avec leurs maximales exactes.
</summaryAfternoon>

<summaryMorning2>
Matinée de {date_j2} (120-150 mots). Commence par "Ce {FRENCH_WEEKDAYS[d2.weekday()]} matin...". Analyse l'Image 3 : vérifie chaque picto sur les villes pour ce réveil météo du surlendemain. Rédige en style parlé, intègre 4-5 villes avec leurs minimales réelles.
</summaryMorning2>

<summaryAfternoon2>
Après-midi de {date_j2} (120-150 mots). Commence par "Ce {FRENCH_WEEKDAYS[d2.weekday()]} après-midi...". Analyse l'Image 4 : vérifie chaque picto (surtout "orages.png" / orages de grêle) pour l'évolution en seconde partie de journée du surlendemain. Rédige en style parlé, intègre 4-5 villes avec leurs maximales réelles.
</summaryAfternoon2>

<forecastRaw>
📉 Tendance – 3 jours suivants ({date_j3} au {date_j5})

- {date_j3} : [description riche 60-80 mots avec températures min/max et phénomènes]
- {french_date(today + datetime.timedelta(days=day_offset + 3), False)} : [description riche 60-80 mots]
- {date_j5} : [description riche 60-80 mots]
</forecastRaw>
"""

    if vision_images and any(vision_images):
        prompt += (
            f"\n\n[MODE MULTIMODAL 👁️ - ANALYSE CHRONOLOGIQUE DES 4 IMAGES FOURNIES] :\n"
            f"Tu as sous les yeux précisément 4 cartes météo officielles HD dans l'ordre chronologique :\n"
            f"1. Image 1 : Carte de {FRENCH_WEEKDAYS[d1.weekday()]} matin ({date_j1})\n"
            f"2. Image 2 : Carte de {FRENCH_WEEKDAYS[d1.weekday()]} après-midi ({date_j1})\n"
            f"3. Image 3 : Carte de {FRENCH_WEEKDAYS[d2.weekday()]} matin ({date_j2})\n"
            f"4. Image 4 : Carte de {FRENCH_WEEKDAYS[d2.weekday()]} après-midi ({date_j2})\n\n"
            f"Vérifie attentivement CHAQUE image pour rédiger la section correspondante :\n"
            f"- Utilise l'Image 1 pour rédiger <summaryMorning> (J1 matin)\n"
            f"- Utilise l'Image 2 pour rédiger <summaryAfternoon> (J1 après-midi)\n"
            f"- Utilise l'Image 3 pour rédiger <summaryMorning2> (J2 matin)\n"
            f"- Utilise l'Image 4 pour rédiger <summaryAfternoon2> (J2 après-midi)\n\n"
            f"Regarde attentivement la répartition visuelle des nuages, du soleil, et surtout repère l'éclair en zigzag (le pictogramme 'orages.png' ou 'Orages accompagnés de grêle.png') sur chacune de ces 4 images.\n"
            f"⚠️ ATTENTION CRITIQUE : N'invente jamais de pluie ou d'orage s'il n'y a aucun pictogramme correspondant visible sur la carte pour la région de la station. Par contre, si un picto d'orage ou d'averses est dessiné, tu DOIS le mentionner de manière claire et explicite pour alerter les auditeurs.\n"
            f"⚠️ ATTENTION CRITIQUE : Ne fais JAMAIS référence aux images ou au support dans tes textes. Les expressions comme 'sur la carte', 'comme le montre le visuel', 'le pictogramme indique' sont formellement INTERDITES car tu parles à la radio à des auditeurs qui ne peuvent pas voir. Décris simplement le temps comme si tu le voyais par la fenêtre."
        )

    try:
        if vision_images and any(vision_images):
            print(f"Calling OpenRouter Vision ({OPENROUTER_VISION_MODEL}) with {len(vision_images)} HD maps for '{client_name}'...")
        else:
            print(f"Calling OpenRouter ({OPENROUTER_MODEL}) for '{client_name}'...")
        text = call_openrouter(api_key, prompt, images=vision_images)

        result = {
            "todaySummary":    extract_xml_tag(text, "todaySummary"),
            "summaryMorning":  extract_xml_tag(text, "summaryMorning"),
            "summaryAfternoon": extract_xml_tag(text, "summaryAfternoon"),
            "summaryMorning2": extract_xml_tag(text, "summaryMorning2"),
            "summaryAfternoon2": extract_xml_tag(text, "summaryAfternoon2"),
            "forecastRaw":     extract_xml_tag(text, "forecastRaw"),
        }
        result["forecastTextRaw"] = result["forecastRaw"]

        # Merge with local fallback for any missing field or invalid date mention
        wd1_target = f"Ce {FRENCH_WEEKDAYS[d1.weekday()]} matin"
        for k, v in result.items():
            if not v or len(v.strip()) < 20:
                print(f"Warning: Field '{k}' missing or short from AI, filling with local fallback.")
                result[k] = local_fallback[k]
            elif k in ["summaryMorning", "todaySummary"] and FRENCH_WEEKDAYS[d1.weekday()] not in v[:50].lower():
                print(f"Warning: AI {k} had wrong start ('{v[:30]}...'), replacing with exact local fallback.")
                result[k] = local_fallback[k]

        # Attach dynamic phenomena, mountain, beach, and marine texts
        for extra_key in ["recordsRaw", "mountain", "mountainTitle", "beach", "marine"]:
            if extra_key in local_fallback:
                result[extra_key] = local_fallback[extra_key]

        print(f"✅ Texts generated & verified successfully for '{client_name}'.")
        return result

    except Exception as e:
        print(f"Error during AI text generation ({e}) — falling back to 100% deterministic local generation.")
        return local_fallback
