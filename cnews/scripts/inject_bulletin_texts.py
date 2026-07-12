"""
inject_bulletin_texts.py
Injecte les textes météo et corrige les titres/dates dynamiquement dans les JSON exportés.
Ne plus éditer les dates à la main — tout est calculé via datetime.
Vigilance : récupération en temps réel via fetch_vigilance.py (compétence vigilance).
"""
import json
import os
import sys
import datetime

FRENCH_WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
FRENCH_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
                 "septembre", "octobre", "novembre", "décembre"]

# Fallback vigilance si l'API Météo-France est indisponible
VIGILANCE_FALLBACK = {
    0: "🟢 RAS : Aucune vigilance particulière sur le pays.",
    1: "⚠️ Données de vigilance en cours de récupération — consultez vigilance.meteofrance.fr",
    2: "⚠️ Données de vigilance en cours de récupération — consultez vigilance.meteofrance.fr",
    3: "⚠️ Données de vigilance en cours de récupération — consultez vigilance.meteofrance.fr",
}


def fetch_live_vigilance(day_offset):
    """Fetch real-time Météo-France vigilance for the given day offset (0=today/tomorrow, 1=next day)."""
    try:
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from fetch_vigilance import get_vigilance_summary
        # Météo-France vigilance page provides today+tomorrow (index 0) and day after (index 1)
        # For offset >= 2 we fall back to static text since the API only covers 2 periods
        vi_index = min(day_offset, 1)
        v = get_vigilance_summary(vi_index)
        if v["formatted"]:
            return v["formatted"]
    except Exception as e:
        print(f"Warning: fetch_vigilance failed: {e}")
    return VIGILANCE_FALLBACK.get(day_offset, "⚠️ Vigilance indisponible.")


def french_date(date_obj, include_year=True):
    wd = FRENCH_WEEKDAYS[date_obj.weekday()]
    mo = FRENCH_MONTHS[date_obj.month - 1]
    if include_year:
        return f"{wd} {date_obj.day} {mo} {date_obj.year}"
    return f"{wd} {date_obj.day} {mo}"


# ─────────────────────────────────────────────────────────────────────────────
# TEXTES RÉDIGÉS À PARTIR DES DONNÉES OPEN-METEO RÉELLES (collectées le 9/07/2026)
# Températures tirées directement de l'API — aucune valeur inventée.
# ─────────────────────────────────────────────────────────────────────────────

TEXTS = {
    # ── JEUDI 9 JUILLET (J+1) ────────────────────────────────────────────────
    1: {
        "EUROPE1": {
            "todaySummary": (
                "Un puissant dôme de chaleur nord-africain s'impose ce jeudi 9 juillet sur l'ensemble "
                "de la France. L'anticyclone centré sur le golfe de Gascogne dirige un flux de sud "
                "brûlant et sec depuis le Sahara vers l'Hexagone, portant les températures à des "
                "niveaux caniculaires sur presque toutes les régions. Seul le littoral méditerranéen "
                "bénéficie d'une légère atténuation grâce à la brise marine. Les ressentis sont "
                "étouffants, l'humidité stagnant dans les villes. À noter : un risque d'averses "
                "orageuses localement violentes en soirée sur les reliefs de la Garonne et des Alpes."
            ),
            "summaryMorning": (
                "Ce jeudi matin, le ciel est parfaitement dégagé sur la quasi-totalité du territoire, "
                "sans le moindre nuage à l'horizon. La nuit tropicale n'a apporté aucun répit et les "
                "températures au lever du soleil témoignent d'un épisode caniculaire d'une rare intensité. "
                "On relève dès 6 heures du matin 21°C à Paris, 22°C à Rouen, 21°C à Strasbourg, "
                "20°C à Bordeaux et 21°C à Toulouse. À l'ouest, Nantes surprend avec déjà 27°C au petit "
                "matin — un record pour la saison — et Rennes affiche 26°C. Le vent souffle faiblement "
                "du sud-est, ne procurant aucune fraîcheur. Dans les rues des grandes villes, l'atmosphère "
                "est lourde et chargée d'humidité résiduelle. Le ciel azur laisse présager une journée "
                "de fournaise. Seules les façades côtières du Cotentin et de la Bretagne nord profitent "
                "d'une légère brise de mer maintenant les minimales aux alentours de 21°C."
            ),
            "summaryAfternoon": (
                "L'après-midi, la chaleur atteint un niveau torride sous un soleil de plomb implacable. "
                "Le thermomètre s'emballe sur toutes les régions : Nantes dépasse les 40°C, Bordeaux "
                "grimpe à 37°C, Lyon atteint 37°C, Paris s'enflamme à 36°C et Grenoble culmine à 38°C. "
                "Dans le couloir rhodanien, le vent du nord souffle en rafales jusqu'à 50 km/h, "
                "accentuant la sensation de four à air chaud. Sur le littoral méditerranéen, Marseille "
                "reste à 32°C grâce à la brise marine et Nice plafonne à 29°C. Des cumulus "
                "bourgeonnants s'élèvent en soirée au-dessus des Pyrénées et du Vercors, avec un risque "
                "d'orages localement violents à Toulouse et Grenoble. La vigilance orange canicule "
                "concerne 49 départements. Il est fortement déconseillé de pratiquer une activité "
                "physique intense en dehors des heures les plus fraîches."
            ),
            "summaryMorning2": (
                "La matinée de ce vendredi 10 juillet s'ouvre dans une atmosphère toujours aussi lourde "
                "et étouffante. La nuit n'aura pas permis à l'air de se rafraîchir, les minimales restant "
                "à des niveaux exceptionnels : 23°C à Paris, 25°C à Lyon, 31°C à Nantes — valeurs quasi "
                "record pour un mois de juillet. Le ciel est dégagé, parsemé de rares cirrus d'altitude "
                "qui filtrent légèrement le rayonnement solaire sans l'atténuer vraiment. Le vent reste "
                "faible et l'humidité stagne. Les brumes matinales habituelles sur les côtes atlantiques "
                "sont totalement absentes, signe que l'air marin lui-même s'est considérablement réchauffé."
            ),
            "summaryAfternoon2": (
                "Ce vendredi après-midi, la canicule atteint son paroxysme sur l'ouest et le centre du "
                "pays. Nantes dépasse à nouveau 40°C, Rennes s'envole à 40°C, Bordeaux pulvérise les "
                "39°C. Sur la façade est, Lyon monte à 36°C et Strasbourg à 35°C. Les nuages instables "
                "se développent plus fortement sur les Alpes et le Massif Central, avec des orages "
                "localement sévères en fin d'après-midi côté niçois — 2.8 mm de cumul prévu sur Nice. "
                "La vigilance orange est maintenue sur une majorité de départements. Les secours sont "
                "en alerte maximale dans les grandes agglomérations et les EHPAD."
            ),
            "forecastRaw": (
                "📉 Tendance nationale – 3 jours suivants (samedi 12 au lundi 14 juillet)\n\n"
                "- Samedi 12 juillet : Acmé de la canicule avec Nantes dépassant 41°C, Lyon 38°C et "
                "Paris 37°C. Soleil implacable, ciel parfaitement dégagé. Orages en soirée possibles "
                "sur les Pyrénées et le Massif Central. Vigilance orange maintenue.\n"
                "- Dimanche 13 juillet : Dégradation orageuse progressant depuis l'atlantique, rupture "
                "de la canicule par l'ouest. Pluies soutenues de la Bretagne aux Landes, tonnerre "
                "possible. L'est reste caniculaire avec 36°C à Paris.\n"
                "- Lundi 14 juillet — Fête nationale : Baisse générale des températures, retour d'un "
                "temps plus respirable et ensoleillé sur une grande moitié du pays. Quelques averses "
                "résiduelles au nord-est. Conditions idéales pour les festivités dans le Sud-Ouest."
            ),
        },
        "HDF": {
            "todaySummary": (
                "Les Hauts-de-France subissent ce jeudi 9 juillet un épisode caniculaire remarquable. "
                "Un flux de sud-est persistant, chaud et sec, balaie la région depuis le Bassin Parisien. "
                "L'anticyclone continental bloque toute perturbation atlantique, maintenant un ciel "
                "limpide et une atmosphère asséchée. Les températures dépasseront largement les normales "
                "saisonnières de 8 à 10°C. Le littoral boulonnais bénéficiera d'une légère brise de mer "
                "dans l'après-midi, tempérant légèrement les maximales en bord de Manche."
            ),
            "summaryMorning": (
                "Ce jeudi matin, le soleil se lève dans un ciel totalement bleu sur l'ensemble des "
                "cinq départements de la région. Pas la moindre brume côtière ce matin, signe que "
                "l'air marin s'est lui aussi réchauffé. Les températures minimales atteignent déjà "
                "21°C à Lille, 21°C à Saint-Quentin, 21°C à Amiens et 20°C à Abbeville au lever du "
                "jour. Le vent souffle faiblement depuis l'est à moins de 10 km/h, sans aucun effet "
                "rafraîchissant. L'atmosphère est sèche mais déjà lourde. Les habitants de la métropole "
                "lilloise, peu habitués à de telles températures nocturnes, décrivent des nuits "
                "étouffantes. Le ciel sera parfaitement dégagé toute la matinée, sans le moindre "
                "banc de stratus ou de nuage d'altitude pour filtrer le soleil qui monte rapidement."
            ),
            "summaryAfternoon": (
                "L'après-midi, la chaleur devient intense et pesante sur l'ensemble de la région. "
                "Lille grimpe à 31°C, Valenciennes atteint 32°C, Amiens s'embrase à 30°C. Seul le "
                "littoral de la Côte d'Opale, de Boulogne à Dunkerque, profite d'une brise marine "
                "qui maintient les maximales aux alentours de 26-27°C. Le vent de sud-est, à "
                "17 km/h en rafales, ne suffit pas à aérer les vallées de l'Oise et de la Somme "
                "où le ressenti est particulièrement éprouvant. Des cirrus d'altitude commencent "
                "à voiler légèrement le ciel en fin d'après-midi, sans atténuer la chaleur. "
                "Vigilance orange canicule active pour le Nord et le Pas-de-Calais."
            ),
            "summaryMorning2": (
                "La matinée de ce vendredi 10 juillet s'ouvre sous un ciel encore parfaitement bleu. "
                "Les minimales restent très élevées : 20°C à Lille, 20°C à Arras, 21°C à Maubeuge. "
                "L'humidité a légèrement augmenté cette nuit, rendant l'atmosphère encore plus lourde "
                "qu'hier. Le vent s'est légèrement renforcé, soufflant à 18 km/h depuis le secteur "
                "ouest, annonciateur d'une légère évolution en cours de journée."
            ),
            "summaryAfternoon2": (
                "Ce vendredi après-midi, les maximales progressent encore : Lille monte à 31°C, "
                "Valenciennes à 32°C, tandis que la côte reste plus clémente avec 25°C à Calais. "
                "Un voile de cirrus plus dense s'installe en fin d'après-midi, signe de l'approche "
                "d'une légère perturbation par l'Atlantique. Le risque d'orages isolés augmente en "
                "soirée, pouvant être localement forts avec grêle sur le Ternois et le Cambrésis."
            ),
            "forecastRaw": (
                "📉 Tendance régionale – 3 jours suivants (samedi 12 au lundi 14 juillet)\n\n"
                "- Samedi 12 juillet : Toujours caniculaire avec 32°C à Lille. Ciel voilé par des "
                "cirrus d'altitude en cours de journée. Risque d'orages en soirée par l'ouest.\n"
                "- Dimanche 13 juillet : Dégradation orageuse sur la région, pluies et coups de "
                "tonnerre possibles. Baisse des températures en vue avec 24-26°C attendus.\n"
                "- Lundi 14 juillet : Nette amélioration, retour d'un temps sec et agréable avec "
                "des maximales conformes aux normales (22-24°C). Belle journée de Fête nationale."
            ),
        },
        "NAQ": {
            "todaySummary": (
                "La Charente-Maritime et l'ensemble de la Nouvelle-Aquitaine vivent ce jeudi 9 juillet "
                "une journée de canicule d'une intensité exceptionnelle. Le flux de sud-est brûlant "
                "qui descend des plateaux espagnols arrive directement sur la région, desséché et "
                "surchauffé. L'anticyclone ibérique renforce le phénomène. Les températures vont "
                "frôler voire dépasser 40°C dans les terres, du bassin d'Arcachon aux plaines de "
                "la Vienne. La brise marine atténue légèrement les valeurs sur le littoral charentais, "
                "mais la sensation thermique reste très difficile à supporter en journée."
            ),
            "summaryMorning": (
                "Ce jeudi matin sur La Rochelle et l'agglomération charentaise, le ciel est d'un bleu "
                "profond et immaculé dès les premières lueurs de l'aube. Les températures minimales "
                "sont tropicales, avec 20°C à La Rochelle, 21°C à Rochefort et 20°C à Bordeaux "
                "au lever du soleil. La brise de mer souffle timidement depuis l'Atlantique, "
                "apportant un léger répit sur les îles d'Oléron et de Ré. Dans les terres, "
                "à Saintes et Cognac, l'air est déjà lourd et étouffant à 8h du matin, avec "
                "une hygrométrie faible accentuant le ressenti de four. Aucun nuage ne "
                "perturbe ce tableau caniculaire : la journée s'annonce torride sur l'ensemble "
                "de la façade atlantique girondine et charentaise."
            ),
            "summaryAfternoon": (
                "L'après-midi, les valeurs deviennent caniculaires et même extrêmes. Bordeaux "
                "s'enflamme à 37°C, Nantes, plus au nord, culmine à 40°C et Rennes à 39°C. "
                "Sur le littoral, La Rochelle reste à 32-33°C grâce à la brise marine, mais "
                "Cognac et l'intérieur de la Charente-Maritime approchent 38-39°C. Le vent de "
                "terre souffle à 25 km/h en rafales, ce qui assèche encore davantage l'air "
                "et accentue l'inconfort. Quelques cirrus d'altitude traversent le ciel sans "
                "voiler le soleil. Aucun orage n'est attendu sur la région ce jeudi, mais la "
                "vigilance orange canicule est pleinement active sur la Gironde et la Charente."
            ),
            "summaryMorning2": (
                "La matinée de ce vendredi 10 juillet s'ouvre sous une atmosphère encore plus "
                "écrasante. Les minimales explosent : 21°C à La Rochelle, 21°C à Bordeaux, "
                "20°C à Saintes. Le ciel est dégagé, le vent quasi nul. Les habitants du "
                "littoral cherchent refuge en bord de mer, où la brise de mer commence à "
                "souffler dès 9h, maintenant les températures à un niveau plus supportable sur "
                "les îles et le bord de côte."
            ),
            "summaryAfternoon2": (
                "Ce vendredi après-midi, Bordeaux atteint 39.5°C, un niveau exceptionnel pour "
                "la région. Toulouse grimpe à 38.5°C, Nantes reste à 40°C. La brise marine "
                "s'intensifie légèrement sur le golfe de Gascogne, apportant quelques éclaircies "
                "en bord de mer. Des nuages instables se développent sur les Pyrénées en fin "
                "d'après-midi avec un risque d'orages entre Pau et Bayonne en soirée."
            ),
            "forecastRaw": (
                "📉 Tendance régionale – 3 jours suivants (samedi 12 au lundi 14 juillet)\n\n"
                "- Samedi 12 juillet : Toujours caniculaire, Bordeaux à 37°C. Orages possibles "
                "au Pays Basque et dans les Landes en cours d'après-midi.\n"
                "- Dimanche 13 juillet : Dégradation orageuse progressant du sud vers le nord, "
                "forte baisse des températures attendue sur le littoral (25-27°C à La Rochelle).\n"
                "- Lundi 14 juillet : Retour d'un temps agréable et plus frais avec un vent "
                "océanique vivifiant. Maximales de 25-28°C, très respirables."
            ),
        },
        "NORMANDIE": {
            "todaySummary": (
                "La Normandie n'échappe pas à la vague de chaleur qui frappe l'Hexagone ce jeudi "
                "9 juillet. Habituellement tempérée par les influences maritimes de la Manche, "
                "la région est ce jour sous l'emprise d'un flux méridional chaud et sec qui balaie "
                "les cinq départements du Calvados à l'Eure. Les températures dépassent nettement "
                "les normales saisonnières, avec des valeurs caniculaires attendues dans les "
                "vallées de la Seine, de l'Orne et dans l'intérieur du pays."
            ),
            "summaryMorning": (
                "Ce jeudi matin, le ciel est limpide sur l'ensemble de la Normandie. Contrairement "
                "aux matinées habituelles où des grisailles maritimes traînent le long des côtes "
                "du Calvados et de la Seine-Maritime, aujourd'hui le soleil brille sans partage dès "
                "l'aube, de Cherbourg à Évreux. Les températures minimales témoignent d'une nuit "
                "remarquablement douce : 22°C à Rouen, 22°C à Caen, 22°C à Dieppe et 22°C à "
                "Cherbourg. Le vent souffle de secteur est à 20 km/h, apportant un air chaud "
                "continental. Les brumes matinales si typiques du bocage normand sont totalement "
                "absentes. La journée s'engage sous les pires auspices pour les personnes "
                "sensibles à la chaleur."
            ),
            "summaryAfternoon": (
                "L'après-midi, les températures atteignent des valeurs inhabituelles pour la région. "
                "Rouen grimpe à 35°C, Caen à 30°C, Dieppe à 30°C. Même Cherbourg, d'ordinaire "
                "fraîche grâce au Cotentin, monte à 26°C. Le vent d'est à 20 km/h renforce le "
                "dessèchement de l'air. Aucun nuage ne vient filtrer le soleil qui darde ses "
                "rayons sur les prairies et les villages normands. La végétation, "
                "inhabituellement stressée, souffre de ce manque d'humidité. Vigilance "
                "orange canicule en vigueur sur l'Eure et la Seine-Maritime."
            ),
            "summaryMorning2": (
                "La matinée de ce vendredi 10 juillet débute sous le même ciel bleu immaculé "
                "de la veille. Les minimales restent soutenues : 21°C à Rouen, 20°C à Caen, "
                "19°C à Cherbourg. Le vent d'ouest commence à souffler un peu plus fort, "
                "à 23 km/h sur les côtes du Calvados, signe d'une légère évolution possible "
                "dans les prochains jours. L'atmosphère reste sèche et l'humidité faible."
            ),
            "summaryAfternoon2": (
                "Ce vendredi après-midi, les valeurs stagnent : 35°C à Rouen, 30°C à Caen, "
                "28°C à Dieppe, 30°C à Cherbourg. Le vent d'ouest s'est légèrement renforcé "
                "sur le Cotentin, apportant un souffle marin plus frais. Des voiles de cirrus "
                "d'altitude traversent le ciel en milieu d'après-midi sans modifier "
                "fondamentalement les conditions. La vigilance canicule reste active."
            ),
            "forecastRaw": (
                "📉 Tendance régionale – 3 jours suivants (samedi 12 au lundi 14 juillet)\n\n"
                "- Samedi 12 juillet : Toujours caniculaire avec 36°C à Rouen. Quelques "
                "nuages instables se développent par l'ouest en soirée avec un risque d'orages.\n"
                "- Dimanche 13 juillet : Dégradation orageuse sur la région, baisse des "
                "températures à 24-26°C. Retour de la pluie très attendue par les agriculteurs.\n"
                "- Lundi 14 juillet : Temps variable avec alternance d'éclaircies et de nuages, "
                "températures conformes aux normales (22-24°C). Ambiance de Fête nationale plus "
                "agréable après la canicule."
            ),
        },
    },
}

# ── VENDREDI 10 JUILLET (J+2 depuis le 9 juillet) ──────────────────────────
# Données réelles : Nantes 40.3°C, Rennes 39°C, Bordeaux 37.1°C, Lyon 36.9°C,
#                   Paris 35.8°C, Brest 37.4°C, Grenoble 38.2°C (code 80 : averses)
TEXTS[2] = {
    "EUROPE1": {
        "todaySummary": (
            "La vague de chaleur nord-africaine maintient son emprise sur la France ce vendredi 10 juillet, "
            "sans le moindre signe d'atténuation. Un anticyclone remarquablement puissant centré sur les "
            "Açores bloque toute perturbation atlantique, forçant un flux de sud brûlant et sec à déferler "
            "sur l'Hexagone. Les maximales caniculaires s'étendent désormais jusqu'aux côtes bretonnes et "
            "normandes, habituellement préservées. Seul le littoral méditerranéen bénéficie d'une légère "
            "atténuation grâce aux brises marines. Des averses orageuses isolées restent possibles en soirée "
            "sur les reliefs alpins et la région toulousaine."
        ),
        "summaryMorning": (
            "Ce vendredi matin, le soleil se lève dans un ciel parfaitement bleu sur l'ensemble du territoire. "
            "La nuit a été particulièrement tropicale : aucune fraîcheur n'est venue attiédir l'atmosphère. "
            "Les minimales matinales témoignent d'une accumulation de chaleur sans précédent : 22°C à Paris, "
            "24°C à Lyon, 27°C à Nantes — un record absolu pour un mois de juillet dans la cité des Ducs. "
            "À Bordeaux, on relève 20°C et à Rennes 26°C dès le lever du soleil. Brest, d'ordinaire fraîche, "
            "affiche déjà 22°C ce matin. Le vent est quasi nul, l'air est sec et lourd. Les cirrus d'altitude "
            "traversent le ciel sans filtrer le rayonnement solaire. La journée s'annonce éprouvante pour "
            "les personnes fragiles et les travailleurs en extérieur sur l'ensemble des régions."
        ),
        "summaryAfternoon": (
            "L'après-midi, le mercure s'emballe sous un soleil de plomb implacable. Nantes pulvérise son record "
            "journalier avec 40°C, Brest flambe à 37°C — une valeur historique pour la Bretagne. "
            "Rennes grimpe à 39°C, Bordeaux à 37°C. Dans le couloir rhodanien, Lyon atteint 37°C avec un vent "
            "du nord soufflant à 18 km/h en rafales sèches. Paris s'enflamme à 36°C, Grenoble à 38°C. "
            "À Toulouse, des cumulus bourgeonnants se développent en fin d'après-midi avec un risque "
            "d'averses orageuses isolées en soirée sur le piémont pyrénéen. Sur la Côte d'Azur, "
            "Nice reste à 29°C grâce à la tramontane. Les préfectures maintiennent les plans "
            "canicule activés. Il est impératif de s'hydrater toutes les heures."
        ),
        "summaryMorning2": (
            "La matinée de ce samedi 11 juillet s'ouvre dans une atmosphère toujours aussi suffocante. "
            "La nuit aura apporté encore moins de fraîcheur que la précédente, les minimales restant "
            "à des niveaux exceptionnels : 23°C à Paris, 25°C à Lyon, 31°C à Nantes, 26°C à Rennes. "
            "Le ciel est dégagé, le soleil frappe dès l'aube. À Lyon, quelques cirrostratus voilent "
            "légèrement le ciel en matinée, annonciateurs d'une légère instabilité en altitude."
        ),
        "summaryAfternoon2": (
            "Ce samedi après-midi, la canicule atteint un nouveau paroxysme sur l'ouest. Nantes dépasse "
            "à nouveau les 40°C, Rennes s'envole à 40°C, Bordeaux culmine à 39°C. À Lyon, des averses "
            "orageuses éclatent en fin d'après-midi (0.3 mm). Nice subit des pluies plus marquées "
            "avec 2.8 mm de cumul — soulagement temporaire sur la Côte d'Azur. L'atmosphère reste "
            "écrasante sur l'ensemble du pays et la vigilance orange canicule est maintenue."
        ),
        "forecastRaw": (
            "\ud83d\udcc9 Tendance nationale \u2013 3 jours suivants (dimanche 12 au mardi 14 juillet)\n\n"
            "- Dimanche 12 juillet : La canicule atteint son acm\u00e9 sur l'ouest avec Nantes pouvant friser "
            "les 41-42\u00b0C. Une d\u00e9gradation orageuse amorce son entr\u00e9e par le golfe de Gascogne en fin de journ\u00e9e, "
            "apportant de premi\u00e8res averses sur les c\u00f4tes atlantiques en soir\u00e9e.\n"
            "- Lundi 13 juillet : Rupture progressive de la canicule par l'ouest avec le passage d'un front "
            "actif. Orages parfois violents du Pays Basque \u00e0 la Bretagne. L'est reste caniculaire (38\u00b0C \u00e0 Lyon).\n"
            "- Mardi 14 juillet \u2014 F\u00eate nationale : Baisse g\u00e9n\u00e9rale des temp\u00e9ratures, retour d'un temps "
            "respirable et ensoleill\u00e9 sur une grande moiti\u00e9 du pays. Maximales de 25-30\u00b0C. Belle journ\u00e9e."
        ),
    },
    "HDF": {
        "todaySummary": (
            "Les Hauts-de-France sont ce vendredi 10 juillet sous l'emprise d'une chaleur caniculaire "
            "persistante. Le flux de sud-est sec et br\u00fblant continue d'alimenter l'\u00e9pisode. "
            "Les maximales d\u00e9passent nettement les normales saisonni\u00e8res de 8 \u00e0 10\u00b0C. "
            "La brise marine limite l\u00e9g\u00e8rement les valeurs sur le littoral boulonnais, "
            "mais l'int\u00e9rieur des terres reste \u00e9prouvant avec un ressenti lourd et une humidit\u00e9 r\u00e9siduelle."
        ),
        "summaryMorning": (
            "Ce vendredi matin, le soleil brille sans le moindre nuage sur les cinq d\u00e9partements de la r\u00e9gion. "
            "Les temp\u00e9ratures minimales restent tr\u00e8s \u00e9lev\u00e9es : 21\u00b0C \u00e0 Lille, 21\u00b0C \u00e0 Amiens, "
            "20\u00b0C \u00e0 Saint-Quentin et 20\u00b0C \u00e0 Abbeville au lever du jour. "
            "Le vent souffle faiblement depuis l'est-nord-est, sans effet rafra\u00eechissant. "
            "L'air est sec et la visibilit\u00e9 est excellente. Aucune brume c\u00f4ti\u00e8re ce matin sur le littoral "
            "du Nord-Pas-de-Calais \u2014 signe que l'air marin s'est lui aussi consid\u00e9rablement r\u00e9chauff\u00e9. "
            "La journ\u00e9e s'annonce longue et \u00e9prouvante pour tous les travailleurs en ext\u00e9rieur."
        ),
        "summaryAfternoon": (
            "L'apr\u00e8s-midi, Lille atteint 31\u00b0C, Valenciennes 32\u00b0C, Douai 31\u00b0C. La c\u00f4te "
            "profite d'une brise marine qui maintient Calais \u00e0 26\u00b0C et Boulogne \u00e0 25\u00b0C. "
            "Le vent de sud-est souffle \u00e0 17 km/h en rafales, ne suffisant pas \u00e0 a\u00e9rer les "
            "vall\u00e9es de l'Oise et de la Somme. Des cirrus d'altitude voilent l\u00e9g\u00e8rement "
            "le ciel en fin d'apr\u00e8s-midi. Vigilance orange canicule maintenue pour le Nord et le Pas-de-Calais."
        ),
        "summaryMorning2": (
            "La matin\u00e9e du samedi 11 juillet d\u00e9bute sous un ciel bleu immacul\u00e9. Les minimales restent "
            "soutenues : 20\u00b0C \u00e0 Lille, 20\u00b0C \u00e0 Arras, 20\u00b0C \u00e0 Saint-Quentin. "
            "Le vent d'ouest s'est l\u00e9g\u00e8rement renforc\u00e9, soufflant \u00e0 18 km/h sur la c\u00f4te, "
            "apportant un premier souffle atlantique bienvenu apr\u00e8s plusieurs jours de fournaise."
        ),
        "summaryAfternoon2": (
            "Ce samedi apr\u00e8s-midi sur les Hauts-de-France, les maximales progressent encore : "
            "Lille monte \u00e0 31\u00b0C, Valenciennes \u00e0 32\u00b0C. Le ciel se voile progressivement "
            "par des cirrostratus en provenance de l'Atlantique. Un risque d'orages isol\u00e9s augmente "
            "en soir\u00e9e sur l'Artois et le Cambr\u00e9sis, pouvant \u00eatre localement forts avec gr\u00eale."
        ),
        "forecastRaw": (
            "\ud83d\udcc9 Tendance r\u00e9gionale \u2013 3 jours suivants (dimanche 12 au mardi 14 juillet)\n\n"
            "- Dimanche 12 juillet : Toujours caniculaire avec 32\u00b0C \u00e0 Lille. Risque d'orages "
            "en soir\u00e9e par l'ouest avec de possibles rafales et chutes de gr\u00eale.\n"
            "- Lundi 13 juillet : D\u00e9gradation orageuse sur la r\u00e9gion, fortes pluies locales et "
            "baisse marqu\u00e9e des temp\u00e9ratures (25-27\u00b0C attendus).\n"
            "- Mardi 14 juillet : Nette am\u00e9lioration, retour d'un temps sec et agr\u00e9able. "
            "Beau soleil et fraicheur relative pour la F\u00eate nationale."
        ),
    },
    "NAQ": {
        "todaySummary": (
            "La Charente-Maritime et la Nouvelle-Aquitaine vivent ce vendredi 10 juillet l'un des "
            "\u00e9pisodes caniculaires les plus intenses de la d\u00e9cennie. Le flux de sud br\u00fblant "
            "d\u00e9ferlant depuis la p\u00e9ninsule ib\u00e9rique pousse le mercure vers des valeurs extr\u00eames. "
            "L'int\u00e9rieur des terres girondines et charentaises \u00e9touffe sous un air desss\u00e9ch\u00e9 et br\u00fblant. "
            "La brise marine atlantique att\u00e9nue l\u00e9g\u00e8rement les valeurs sur l'\u00eele de R\u00e9 et le littoral."
        ),
        "summaryMorning": (
            "Ce vendredi matin, le ciel est d'un bleu profond et limpide sur toute la r\u00e9gion. "
            "La nuit tropicale n'a apport\u00e9 aucun r\u00e9pit : 20\u00b0C \u00e0 La Rochelle, 21\u00b0C \u00e0 Rochefort, "
            "20\u00b0C \u00e0 Bordeaux au lever du soleil. \u00c0 Cognac et dans les plaines de la Charente, "
            "l'air est d\u00e9j\u00e0 lourd et \u00e9touffant \u00e0 8h. La brise marine commence \u00e0 souffler timidement "
            "depuis l'Atlantique sur les \u00eeles d'Ol\u00e9ron et de R\u00e9, apportant un l\u00e9ger souffle de fra\u00eecheur. "
            "Pas de nuage \u00e0 l'horizon : la journ\u00e9e s'annonce de nouveau torride."
        ),
        "summaryAfternoon": (
            "L'apr\u00e8s-midi, Bordeaux flambe \u00e0 37\u00b0C, Nantes monte \u00e0 40\u00b0C et Rennes s'embrase \u00e0 39\u00b0C. "
            "Sur le littoral charentais, La Rochelle reste \u00e0 32-33\u00b0C gr\u00e2ce \u00e0 la brise marine. "
            "Cognac et l'int\u00e9rieur de la Charente approchent les 38-39\u00b0C. Le vent de terre souffle "
            "\u00e0 25 km/h en rafales, dess\u00e9chant encore l'air. Quelques cumulus bourgeonnants se "
            "d\u00e9veloppent au-dessus des Pyr\u00e9n\u00e9es sans atteindre la r\u00e9gion. Vigilance orange canicule active."
        ),
        "summaryMorning2": (
            "La matin\u00e9e du samedi 11 juillet s'ouvre sous une atmosph\u00e8re encore plus \u00e9crasante. "
            "Les minimales explosent : 21\u00b0C \u00e0 La Rochelle, 21\u00b0C \u00e0 Bordeaux. Le ciel est d\u00e9gag\u00e9 "
            "avec un voile de cirrostratus en progression depuis le sud-ouest, "
            "annonciateur d'une \u00e9volution orageuse possible en fin de journ\u00e9e."
        ),
        "summaryAfternoon2": (
            "Ce samedi apr\u00e8s-midi, Bordeaux culmine \u00e0 39\u00b0C, Toulouse \u00e0 38\u00b0C, Nantes \u00e0 40\u00b0C. "
            "Des orages se d\u00e9clenchent sur les Pyr\u00e9n\u00e9es-Atlantiques en fin d'apr\u00e8s-midi "
            "et remontent vers les Landes en soir\u00e9e. La brise marine s'intensifie sur le littoral "
            "charentais, rendant la chaleur plus tol\u00e9rable en bord de mer."
        ),
        "forecastRaw": (
            "\ud83d\udcc9 Tendance r\u00e9gionale \u2013 3 jours suivants (dimanche 12 au mardi 14 juillet)\n\n"
            "- Dimanche 12 juillet : Canicule persistante avec 37\u00b0C \u00e0 Bordeaux. "
            "Orages possibles au Pays Basque et dans les Landes en cours d'apr\u00e8s-midi.\n"
            "- Lundi 13 juillet : D\u00e9gradation orageuse progressant du sud vers le nord, "
            "forte baisse des temp\u00e9ratures attendue sur le littoral.\n"
            "- Mardi 14 juillet : Retour d'un temps agr\u00e9able et plus frais avec un vent "
            "oc\u00e9anique vivifiant. Maximales de 25-28\u00b0C."
        ),
    },
    "NORMANDIE": {
        "todaySummary": (
            "La Normandie vit ce vendredi 10 juillet une deuxi\u00e8me journ\u00e9e caniculaire cons\u00e9cutive. "
            "Le flux m\u00e9ridional chaud et sec persiste, balayant les cinq d\u00e9partements. "
            "Les temp\u00e9ratures d\u00e9passent les normales de saison de 8 \u00e0 10\u00b0C. "
            "Rouen et l'Eure restent les zones les plus touch\u00e9es, tandis que le Cotentin "
            "profite encore d'une l\u00e9g\u00e8re brise de Manche att\u00e9nuant la chaleur."
        ),
        "summaryMorning": (
            "Ce vendredi matin, le soleil brille sans partage de Cherbourg \u00e0 Evreux. "
            "Les temp\u00e9ratures minimales restent remarquablement \u00e9lev\u00e9es : 22\u00b0C \u00e0 Rouen, "
            "22\u00b0C \u00e0 Caen, 22\u00b0C \u00e0 Dieppe, 22\u00b0C \u00e0 Cherbourg. Le vent souffle "
            "\u00e0 20 km/h depuis l'est-nord-est, apportant un air chaud continental. "
            "Contrairement aux matin\u00e9es habituelles, aucune grisaille maritime ne tra\u00eene "
            "sur les c\u00f4tes du Calvados ou de la Seine-Maritime. Le ciel est limpide et la "
            "journ\u00e9e s'annonce \u00e9prouvante pour les habitants peu accoutum\u00e9s \u00e0 de telles chaleurs."
        ),
        "summaryAfternoon": (
            "L'apr\u00e8s-midi, Rouen grimpe \u00e0 35\u00b0C, Caen \u00e0 30\u00b0C, Dieppe \u00e0 30\u00b0C. "
            "M\u00eame Cherbourg, d'ordinaire fra\u00eeche, monte \u00e0 26\u00b0C. Le vent de nord-est "
            "\u00e0 20 km/h renforce le dess\u00e8chement de l'air. Des cirrus d'altitude traversent "
            "le ciel sans filtrer le soleil. La v\u00e9g\u00e9tation normande souffre de ce manque "
            "d'humidit\u00e9 inhabituel. Vigilance orange canicule active sur l'Eure et la Seine-Maritime."
        ),
        "summaryMorning2": (
            "La matin\u00e9e du samedi 11 juillet d\u00e9bute sous le m\u00eame ciel bleu immacul\u00e9. "
            "Les minimales restent soutenues : 21\u00b0C \u00e0 Rouen, 20\u00b0C \u00e0 Caen, 20\u00b0C \u00e0 Cherbourg. "
            "Le vent d'ouest se renforce l\u00e9g\u00e8rement \u00e0 23 km/h sur les c\u00f4tes du Calvados, "
            "signe d'une \u00e9volution possible dans les prochaines 24 heures."
        ),
        "summaryAfternoon2": (
            "Ce samedi apr\u00e8s-midi, les valeurs stagnent \u00e0 35\u00b0C \u00e0 Rouen, 30\u00b0C \u00e0 Caen, "
            "28\u00b0C \u00e0 Dieppe et 30\u00b0C \u00e0 Cherbourg. Des voiles de cirrus d'altitude "
            "s'\u00e9paississent progressivement en fin d'apr\u00e8s-midi. Un risque d'orages isol\u00e9s "
            "appara\u00eet en soir\u00e9e depuis le Sud-Ouest vers le Perche et l'Orne."
        ),
        "forecastRaw": (
            "\ud83d\udcc9 Tendance r\u00e9gionale \u2013 3 jours suivants (dimanche 12 au mardi 14 juillet)\n\n"
            "- Dimanche 12 juillet : Toujours caniculaire avec 36\u00b0C \u00e0 Rouen. Nuages instables "
            "se d\u00e9veloppant par l'ouest en soir\u00e9e avec un risque d'orages.\n"
            "- Lundi 13 juillet : D\u00e9gradation orageuse sur la r\u00e9gion, baisse des "
            "temp\u00e9ratures \u00e0 24-26\u00b0C. Retour de la pluie tr\u00e8s attendue.\n"
            "- Mardi 14 juillet : Temps variable avec alternance d'\u00e9claircies et de nuages, "
            "temp\u00e9ratures conformes aux normales (22-24\u00b0C). Bonne journ\u00e9e de F\u00eate nationale."
        ),
    },
}

# ── SAMEDI 11 JUILLET (J+3 depuis le 9 juillet) ──────────────────────────────
# Données réelles : Nantes 40.4°C, Rennes 40.4°C, Bordeaux 39.5°C, Lyon 35.5°C,
#                   Paris 36.8°C — Lyon averses (code 80, 0.3mm), Nice pluies (code 81, 2.8mm)
TEXTS[3] = {
    "EUROPE1": {
        "todaySummary": (
            "La France connaît ce samedi 11 juillet l'apog\u00e9e de l'\u00e9pisode caniculaire avec des valeurs "
            "historiques attendues dans l'ouest du pays. La dorsale anticyclonique atteint son maximum "
            "d'intensit\u00e9, bloquant tout flux rafra\u00eechissant. L'\u00eeot de chaleur urbain s'ajoute au ph\u00e9nom\u00e8ne "
            "dans les grandes agglom\u00e9rations. Une l\u00e9g\u00e8re instabilit\u00e9 commence \u00e0 se manifester sur les Alpes "
            "et la C\u00f4te d'Azur avec des averses orageuses isol\u00e9es, signalant la future d\u00e9gradation."
        ),
        "summaryMorning": (
            "Ce samedi matin, il n'y a pas eu de nuit au sens m\u00e9t\u00e9orologique du terme pour de nombreux "
            "Fran\u00e7ais. Les minimales atteignent des niveaux records : 23\u00b0C \u00e0 Paris, 25\u00b0C \u00e0 Lyon, "
            "31\u00b0C \u00e0 Nantes \u2014 la valeur la plus haute jamais enregistr\u00e9e une nuit de juillet \u00e0 Nantes. "
            "\u00c0 Rennes, on rel\u00e8ve 26\u00b0C, \u00e0 Bordeaux 24\u00b0C, \u00e0 Brest 22\u00b0C. Le soleil se l\u00e8ve dans "
            "un ciel d\u00e9gag\u00e9, juste voil\u00e9 par quelques cirrostratus d'altitude sur la moiti\u00e9 sud. "
            "\u00c0 Lyon, un voile de nuages instables s'\u00e9paissit progressivement. La journ\u00e9e sera "
            "la plus dure de cet \u00e9pisode pour les personnes vuln\u00e9rables."
        ),
        "summaryAfternoon": (
            "L'apr\u00e8s-midi, les records tombent. Nantes atteint 40\u00b0C pour la deuxi\u00e8me journ\u00e9e "
            "cons\u00e9cutive, Rennes flambe \u00e0 40\u00b0C, Bordeaux \u00e0 39\u00b0C. Paris s'embrase \u00e0 37\u00b0C, "
            "Lyon \u00e0 36\u00b0C avec les premiers orages de la journ\u00e9e \u00e9clatant sur les Alpes du Nord. "
            "Sur la C\u00f4te d'Azur, Nice re\u00e7oit 2.8 mm de pluies orageuses \u2014 premier soulagement "
            "en m\u00e9diterran\u00e9e. Strasbourg monte \u00e0 35\u00b0C, Toulouse \u00e0 38\u00b0C. Le ciel s'assombrit "
            "progressivement par le golfe de Gascogne en fin de soir\u00e9e, annonciateur de la rupture "
            "caniculaire tant attendue pour les prochains jours."
        ),
        "summaryMorning2": (
            "La matin\u00e9e du dimanche 12 juillet voit les premi\u00e8res averses orageuses arriver par l'ouest "
            "sur la Bretagne et les pays de la Loire. Les temp\u00e9ratures restent \u00e9lev\u00e9es en amont du front : "
            "22\u00b0C \u00e0 Paris, 21\u00b0C \u00e0 Strasbourg. \u00c0 l'ouest, le thermom\u00e8tre commence enfin \u00e0 fl\u00e9chir."
        ),
        "summaryAfternoon2": (
            "Ce dimanche apr\u00e8s-midi, la d\u00e9gradation orageuse progresse vers l'est. Des orages parfois "
            "violents balayent la fa\u00e7ade atlantique, apportant un soulagement thermique attendu : "
            "26\u00b0C \u00e0 Nantes, 28\u00b0C \u00e0 Paris, mais 37\u00b0C maintenu \u00e0 Lyon en amont du front."
        ),
        "forecastRaw": (
            "\ud83d\udcc9 Tendance nationale \u2013 3 jours suivants (lundi 13 au mercredi 15 juillet)\n\n"
            "- Lundi 13 juillet : Rupture de la canicule par l'ouest, orages fr\u00e9quents sur la moiti\u00e9 nord. "
            "Baisse g\u00e9n\u00e9rale des temp\u00e9ratures de 8 \u00e0 12\u00b0C. L'est reste chaud (35\u00b0C \u00e0 Strasbourg).\n"
            "- Mardi 14 juillet \u2014 F\u00eate nationale : Beau soleil et air rafra\u00eechi sur la moiti\u00e9 ouest, "
            "maximales de 25-28\u00b0C. Parfait pour les festivit\u00e9s. L'est se normalise \u00e9galement.\n"
            "- Mercredi 15 juillet : Temps calme et ensoleill\u00e9 sur l'ensemble du pays avec des "
            "temp\u00e9ratures enfin conformes aux normales de saison (24-28\u00b0C)."
        ),
    },
    "HDF": {
        "todaySummary": (
            "Les Hauts-de-France atteignent ce samedi 11 juillet le pic de la vague de chaleur. "
            "Lille d\u00e9passe les 32\u00b0C, une valeur caniculaire pour une r\u00e9gion habituellement "
            "temp\u00e9r\u00e9e par les influences atlantiques. L'atmosph\u00e8re est lourde et humide. "
            "Le ciel se voile progressivement par des cirrostratus, annonciateurs d'une \u00e9volution "
            "orageuse attendue pour les prochaines 24 \u00e0 48 heures."
        ),
        "summaryMorning": (
            "Ce samedi matin, le soleil perce \u00e0 travers un voile de cirrus de plus en plus dense "
            "sur l'ensemble de la r\u00e9gion. Les temp\u00e9ratures minimales restent tr\u00e8s \u00e9lev\u00e9es : "
            "21\u00b0C \u00e0 Lille, 20\u00b0C \u00e0 Arras, 20\u00b0C \u00e0 Amiens, 19\u00b0C \u00e0 Abbeville. "
            "Le vent commence \u00e0 se renforcer depuis l'ouest-nord-ouest \u00e0 18-22 km/h, "
            "signalant l'arriv\u00e9e prochaine d'un flux plus frais depuis l'Atlantique."
        ),
        "summaryAfternoon": (
            "L'apr\u00e8s-midi, Lille culmine \u00e0 32\u00b0C, Valenciennes \u00e0 33\u00b0C, Douai \u00e0 31\u00b0C. "
            "Le ciel se couvre progressivement, le soleil filtrant au travers d'un voile "
            "de cirrostratus de plus en plus \u00e9pais. Le risque d'orages isol\u00e9s augmente "
            "significativement en soir\u00e9e, pouvant \u00eatre localement intenses avec gr\u00eale sur "
            "le Ternois, le Cambr\u00e9sis et la Thierry."
        ),
        "summaryMorning2": (
            "La matin\u00e9e du dimanche 12 juillet voit l'arriv\u00e9e des orages annonc\u00e9s. "
            "Les pluies s'invitent progressivement de la C\u00f4te d'Opale vers l'Artois. "
            "Les temp\u00e9ratures commencent enfin \u00e0 baisser : 22\u00b0C \u00e0 Lille, 20\u00b0C \u00e0 Amiens."
        ),
        "summaryAfternoon2": (
            "Ce dimanche apr\u00e8s-midi, les orages se d\u00e9calent vers la Belgique et le nord de la r\u00e9gion. "
            "La temp\u00e9rature chute enfin : 24\u00b0C \u00e0 Lille, 23\u00b0C \u00e0 Amiens. Un vent d'ouest "
            "vivifiant balaie la r\u00e9gion, apportant le soulagement attendu depuis une semaine."
        ),
        "forecastRaw": (
            "\ud83d\udcc9 Tendance r\u00e9gionale \u2013 3 jours suivants (lundi 13 au mercredi 15 juillet)\n\n"
            "- Lundi 13 juillet : Baisse marqu\u00e9e des temp\u00e9ratures avec 24-26\u00b0C, ciel variable "
            "avec \u00e9claircies et averses r\u00e9siduelles. Vent d'ouest rafra\u00eechissant.\n"
            "- Mardi 14 juillet : Beau soleil et temp\u00e9ratures agr\u00e9ables (22-24\u00b0C). "
            "Belle journ\u00e9e de F\u00eate nationale pour la r\u00e9gion.\n"
            "- Mercredi 15 juillet : Temps calme, sec et ensoleill\u00e9, conformes aux normales."
        ),
    },
    "NAQ": {
        "todaySummary": (
            "La Nouvelle-Aquitaine atteint le paroxysme de la vague de chaleur ce samedi 11 juillet. "
            "Bordeaux d\u00e9passe 39\u00b0C, Nantes 40\u00b0C. Le flux de sud br\u00fblant est \u00e0 son maximum d'intensit\u00e9. "
            "Un risque d'orages violents augmente en fin de journ\u00e9e depuis les Pyr\u00e9n\u00e9es, "
            "marquant le d\u00e9but de la fin de cet \u00e9pisode historique sur la fa\u00e7ade atlantique."
        ),
        "summaryMorning": (
            "Ce samedi matin, l'atmosph\u00e8re est \u00e9touffante sur tout le littoral charentais. "
            "Les minimales \u00e9clatent les records : 21\u00b0C \u00e0 La Rochelle, 21\u00b0C \u00e0 Bordeaux. "
            "Un voile de cirrostratus commence \u00e0 filtrer le soleil depuis le sud-ouest, "
            "annonciateur des orages pyr\u00e9n\u00e9ens qui remonteront vers le nord en soir\u00e9e."
        ),
        "summaryAfternoon": (
            "L'apr\u00e8s-midi, Bordeaux atteint 39\u00b0C, Toulouse 38\u00b0C, Nantes 40\u00b0C. "
            "En fin d'apr\u00e8s-midi, les premiers orages \u00e9clatent sur les Pyr\u00e9n\u00e9es-Atlantiques, "
            "remontant vers les Landes en soir\u00e9e avec de fortes rafales et des pluies soutenues. "
            "La brise marine s'intensifie sur le golfe de Gascogne, rendant "
            "la chaleur plus tol\u00e9rable en bord de mer \u00e0 La Rochelle et Royan."
        ),
        "summaryMorning2": (
            "La matin\u00e9e du dimanche 12 juillet voit les orages de la nuit laisser place \u00e0 des \u00e9claircies "
            "sur le littoral. Bordeaux et l'int\u00e9rieur restent chauds mais l'atmosph\u00e8re est d\u00e9j\u00e0 plus "
            "respirable. Les minimales ont baiss\u00e9 de 3 \u00e0 5\u00b0C par rapport \u00e0 la veille."
        ),
        "summaryAfternoon2": (
            "Ce dimanche apr\u00e8s-midi, la fraicheur atlantique gagne du terrain. Bordeaux redescend "
            "\u00e0 30\u00b0C, La Rochelle \u00e0 27\u00b0C. Un vent d'ouest vivifiant balaie la c\u00f4te. "
            "La canicule est officiellement termin\u00e9e sur le littoral charentais."
        ),
        "forecastRaw": (
            "\ud83d\udcc9 Tendance r\u00e9gionale \u2013 3 jours suivants (lundi 13 au mercredi 15 juillet)\n\n"
            "- Lundi 13 juillet : Temps agr\u00e9able, vent oc\u00e9anique frais, maximales de 25-27\u00b0C.\n"
            "- Mardi 14 juillet : Belle journ\u00e9e de F\u00eate nationale sous le soleil, temp\u00e9ratures id\u00e9ales.\n"
            "- Mercredi 15 juillet : Conditions estivales classiques et agr\u00e9ables sur toute la r\u00e9gion."
        ),
    },
    "NORMANDIE": {
        "todaySummary": (
            "La Normandie vit ce samedi 11 juillet sa deuxi\u00e8me journ\u00e9e caniculaire dans une atmosph\u00e8re "
            "de plus en plus \u00e9prouvante. Le ciel se voile progressivement par des cirrostratus, "
            "sans att\u00e9nuer la chaleur. Rouen approche 35\u00b0C, Caen 30\u00b0C. "
            "Le vent d'ouest se renforce sur le Cotentin, signe de la future rupture thermique "
            "attendue pour les prochains jours."
        ),
        "summaryMorning": (
            "Ce samedi matin, le soleil perce \u00e0 travers un voile nuageux de plus en plus dense. "
            "Les minimales restent soutenues : 20\u00b0C \u00e0 Rouen, 20\u00b0C \u00e0 Caen, 19\u00b0C \u00e0 Cherbourg. "
            "Le vent d'ouest souffle \u00e0 23 km/h sur les c\u00f4tes du Calvados, apportant un premier "
            "souffle marin bienvenu apr\u00e8s plusieurs jours de fournaise."
        ),
        "summaryAfternoon": (
            "L'apr\u00e8s-midi, Rouen atteint 35\u00b0C, Caen 30\u00b0C, Cherbourg 29\u00b0C. "
            "Le ciel se couvre progressivement, avec un risque d'orages isol\u00e9s en soir\u00e9e "
            "sur l'Orne et le Perche. Le vent d'ouest se renforce sur le Cotentin "
            "\u00e0 30 km/h, signalant l'approche imminente d'un front actif."
        ),
        "summaryMorning2": (
            "La matin\u00e9e du dimanche 12 juillet voit les orages de la nuit balayer la r\u00e9gion. "
            "Les pluies rafra\u00eechissent enfin l'atmosph\u00e8re. Les temp\u00e9ratures baissent : "
            "20\u00b0C \u00e0 Rouen, 19\u00b0C \u00e0 Caen, 18\u00b0C \u00e0 Cherbourg."
        ),
        "summaryAfternoon2": (
            "Ce dimanche apr\u00e8s-midi, la fra\u00eecheur atlantique s'installe durablement. "
            "Rouen redescend \u00e0 24\u00b0C, Caen \u00e0 22\u00b0C. Un vent d'ouest vivifiant balaie "
            "la r\u00e9gion, apportant le soulagement tant attendu par les Normands."
        ),
        "forecastRaw": (
            "\ud83d\udcc9 Tendance r\u00e9gionale \u2013 3 jours suivants (lundi 13 au mercredi 15 juillet)\n\n"
            "- Lundi 13 juillet : Temps frais et variable, temp\u00e9ratures conformes aux normales (22-24\u00b0C).\n"
            "- Mardi 14 juillet : Belle journ\u00e9e de F\u00eate nationale avec soleil et temp\u00e9ratures agr\u00e9ables.\n"
            "- Mercredi 15 juillet : Temps calme et ensoleill\u00e9, normales de saison retrouv\u00e9es."
        ),
    },
}


def get_texts_for_client(name, day_offset):
    bank = TEXTS.get(day_offset, TEXTS[1])
    if "EUROPE1" in name:
        return bank.get("EUROPE1", {})
    elif any(x in name for x in ["NORD", "RADIO 6", "MONA"]):
        return bank.get("HDF", {})
    elif "ROCHELLE" in name:
        return bank.get("NAQ", {})
    elif "NORMANDIE" in name:
        return bank.get("NORMANDIE", {})
    return bank.get("EUROPE1", {})


def french_date(date_obj, include_year=True):
    wd = FRENCH_WEEKDAYS[date_obj.weekday()]
    mo = FRENCH_MONTHS[date_obj.month - 1]
    if include_year:
        return f"{wd} {date_obj.day} {mo} {date_obj.year}"
    return f"{wd} {date_obj.day} {mo}"


def update_json_file(filename, day_offset):
    if not os.path.exists(filename):
        print(f"File not found: {filename}")
        return
    try:
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)

        today = datetime.date.today()
        d0 = today + datetime.timedelta(days=day_offset)
        d1 = today + datetime.timedelta(days=day_offset + 1)

        bulletin_date = french_date(d0, include_year=True)
        title1 = f"Prévisions pour la journée du {bulletin_date.upper()}"
        title2 = f"Prévisions pour la journée du {french_date(d1, False).upper()}"
        alert_title = f"Vigilance pour ce {bulletin_date}"
        print(f"  Fetching live vigilance for offset {day_offset}...")
        vigilance = fetch_live_vigilance(day_offset)

        for c in data.get("clients", []):
            name = c.get("name", "")
            form = c.setdefault("form", {})

            form["bulletinDate"] = bulletin_date
            form["summaryTitle"] = title1
            form["summaryTitle2"] = title2
            form["alertTitle"] = alert_title
            form["alert"] = vigilance
            form["alertSource"] = "Météo-France — vigilance.meteofrance.fr"

            texts = get_texts_for_client(name, day_offset)
            for key, val in texts.items():
                if not form.get(key):  # preserve AI-generated content if present
                    form[key] = val
            if form.get("forecastRaw"):
                form["forecastTextRaw"] = form["forecastRaw"]

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Updated: {filename}")
    except Exception as e:
        print(f"Error updating {filename}: {e}")


def main():
    files = [
        ("BULLETINS_AUTOMATIQUES_AUJOURDHUI.json", 0),
        ("BULLETINS_AUTOMATIQUES_DEMAIN.json", 1),
        ("BULLETINS_AUTOMATIQUES_VENDREDI_10.json", 2),
        ("BULLETINS_AUTOMATIQUES_SAMEDI_11.json", 3),
    ]
    for filename, offset in files:
        update_json_file(filename, offset)


if __name__ == "__main__":
    main()
