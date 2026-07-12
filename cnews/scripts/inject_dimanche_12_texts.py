import json
import os

def update_bulletins(json_path):
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    clients = data.get("clients", [])
    
    # 1. EUROPE 1
    e1_texts = {
        "todaySummary": (
            "Un puissant anticyclone centré sur les îles Britanniques s'associe à une dorsale de haute pression "
            "s'étendant vers l'Europe centrale, maintenant des conditions exceptionnellement calmes et sèches sur "
            "l'ensemble de la France pour ce dimanche 12 juillet. Cette configuration synoptique favorise un flux de "
            "secteur sud-est particulièrement chaud et sec, avec une masse d'air continental brûlant d'origine saharienne "
            "qui engendre des ressentis étouffants et un air lourd sur la majorité des régions françaises. L'ensoleillement "
            "est généralisé sous un ciel bleu azur limpide à peine perturbé par de rares cirrus de haute altitude. Les brises "
            "marines peinent à s'installer sur la façade Atlantique en raison du flux de terre dominant, tandis que le mistral "
            "souffle modérément dans la vallée du Rhône à 30 km/h en rafales, apportant une ventilation bienvenue mais asséchante."
        ),
        "summaryMorning": (
            "Ce dimanche matin, la France s'éveille sous des conditions remarquablement ensoleillées et déjà très douces. "
            "Le ciel est d'un bleu pur et sans nuages sur la quasi-totalité du territoire, à l'exception de quelques bancs "
            "de nuages bas sur le littoral de la Manche et vers la frontière belge, ainsi qu'un voile nuageux inoffensif "
            "sur la pointe bretonne et le Pays Basque. La nuit tropicale n'a apporté que peu de répit avec des minimales très "
            "élevées pour un début de matinée. On relève ainsi 21°C à Paris, 22°C à Lille, 16°C à Rouen sous une relative fraîcheur, "
            "24°C à Brest et 25°C à Nantes. Dans la moitié sud, la tiédeur est également marquée avec 26°C à Bordeaux, 24°C à Lyon "
            "et 25°C à Nice et Marseille. Le vent reste généralement faible, ce qui accentue la sensation de lourdeur dans les grandes agglomérations."
        ),
        "summaryAfternoon": (
            "Dans l'après-midi de ce dimanche, l'Hexagone se transforme en une véritable fournaise sous un soleil de plomb. "
            "La chaleur devient caniculaire et écrasante avec des valeurs exceptionnelles sous abri. Le thermomètre s'emballe et "
            "atteint 37°C à Paris, 33°C à Lille, 30°C à Rouen et 37°C à Brest. Dans l'Ouest et le Sud-Ouest, les maximales s'envolent "
            "pour atteindre 40°C à Nantes, 40°C à Bourges et Limoges, et jusqu'à 42°C à Bordeaux sous un ciel à peine voilé par des "
            "nuages élevés en provenance du golfe de Gascogne. Le ressenti est lourd et étouffant. Sur la côte méditerranéenne, "
            "les brises marines limitent la hausse des températures à 31°C à Marseille et Nice, tandis que Lyon affiche 38°C sous "
            "une atmosphère étouffante. La vigilance canicule concerne de très nombreux départements."
        ),
        "summaryMorning2": (
            "Ce lundi matin, la transition météorologique s'amorce par l'ouest avec l'arrivée d'une perturbation active. "
            "Le ciel se charge de nuages menaçants et des averses orageuses parfois accompagnées de coups de tonnerre éclatent "
            "déjà sur la Bretagne, notamment du côté de Rennes. Ailleurs, les conditions restent calmes mais l'atmosphère est "
            "particulièrement lourde et étouffante après une nuit étouffante. Les températures minimales au lever du jour sont tropicales "
            "avec 23°C à Paris, 20°C à Lille, 21°C à Rennes, 25°C à Brest et 27°C à Nantes. Dans le sud et l'est, le soleil continue de "
            "briller généreusement avec des températures élevées atteignant 24°C à Bordeaux, 25°C à Lyon et Nice. Le vent s'oriente "
            "progressivement à l'ouest sur la façade atlantique."
        ),
        "summaryAfternoon2": (
            "Dans l'après-midi de ce lundi, l'instabilité orageuse progresse vers l'intérieur des terres de l'ouest, avec des averses "
            "orageuses parfois fortes et accompagnées de fortes rafales de vent à Rennes et Nantes sous un ciel très chaotique. "
            "Cette dégradation apporte un rafraîchissement appréciable sur le littoral atlantique, avec 29°C à La Rochelle et 35°C à "
            "Bordeaux. En revanche, l'est et le centre restent sous une chaleur accablante sous un ciel voilé avec 36°C à Paris, "
            "34°C à Lille, 39°C à Lyon et encore 40°C à Bourges. Le contraste thermique est saisissant entre la fraîcheur océanique "
            "qui gagne du terrain à l'ouest, où le thermomètre chute sous les grains, et la fournaise qui résiste à l'est. Le vent "
            "d'ouest se renforce sensiblement le long des côtes bretonnes et vendéennes."
        ),
        "forecastRaw": (
            "Pour la journée du mardi 14 juillet, jour de la Fête Nationale, les conditions s'annoncent plus respirables mais très "
            "contrastées à l'échelle du pays. Le front orageux de la veille s'évacue lentement par les frontières de l'est, laissant "
            "à l'arrière un ciel de traîne partagé entre belles éclaircies et nuages inoffensifs. Concernant le thermomètre de ce mardi, "
            "les minimales oscillent entre 17°C à Rennes et 23°C à Bordeaux dans la matinée, tandis que les maximales fléchissent nettement "
            "par l'ouest avec 27°C à Rennes, 35°C à Bordeaux, 33°C à Lille, 35°C à Paris et encore 40°C à Lyon où la chaleur restera encore "
            "lourde et étouffante en cours d'après-midi.\n\n"
            "Le mercredi 15 juillet verra l'installation d'une masse d'air océanique beaucoup plus fraîche et agréable sur l'ensemble "
            "du territoire national. Le ciel sera le plus souvent partagé entre de larges éclaircies lumineuses et de petits passages nuageux "
            "inoffensifs, principalement le long des côtes de la Manche et sur le Nord-Pas-de-Calais. Au niveau du thermomètre de ce mercredi, "
            "les températures minimales s'échiolent de 17°C à Rennes à 23°C à Bordeaux, tandis que les maximales affichent des valeurs "
            "confortables de 28°C à Rennes, 33°C à Bordeaux, 33°C à Lille, 34°C à Paris et 38°C à Lyon.\n\n"
            "Enfin, pour le jeudi 16 juillet, les conditions anticycloniques de saison s'imposent à nouveau avec un grand soleil généreux "
            "et des températures agréables. Le ciel sera totalement dégagé sur la majeure partie du pays, offrant d'excellentes conditions "
            "estivales sans chaleur excessive. Pour le thermomètre de ce jeudi, les minimales baissent d'un cran pour afficher 18°C à Rennes "
            "et 22°C à Bordeaux au lever du jour, tandis que les maximales de l'après-midi seront agréablement respirables avec 28°C à Rennes, "
            "32°C à Bordeaux, 31°C à Lille, 32°C à Paris et 35°C à Lyon."
        ),
        "recordsRaw": (
            "Une vigilance canicule de niveau orange ou rouge est en cours sur une grande partie du pays en raison d'un épisode de "
            "fortes chaleurs particulièrement intenses et durables, avec des températures atteignant localement 40 à 42°C dans l'ouest "
            "et le sud-ouest."
        ),
        "mountain": (
            "🏔️ Météo montagne\n\n"
            "Alpes : Conditions très ensoleillées ce dimanche avec une chaleur marquée dans les vallées. Risque d'orages de chaleur "
            "localisés sur les sommets du sud en fin de journée.\n\n"
            "Pyrénées : Soleil dominant en matinée ce dimanche, avant le développement de cumulus bourgeonnants et un risque d'averses "
            "orageuses isolées sur les crêtes l'après-midi."
        )
    }
    
    # 2. HDF (ICI NORD, RADIO 6, MONA FM)
    hdf_texts = {
        "todaySummary": (
            "L'anticyclone positionné sur les îles Britanniques et s'étendant vers le nord de l'Europe protège les Hauts-de-France pour "
            "ce dimanche 12 juillet. Le flux continental de secteur sud-est draine de l'air particulièrement chaud et sec sur l'ensemble "
            "des départements de la région. Le soleil brille de manière continue et sans partage du matin au soir sous un ciel immaculé, "
            "garantissant un fort rayonnement solaire. Le ressenti est de plus en plus chaud et estival au fil des heures. Une légère bise "
            "d'est souffle modérément à 20 km/h sur les collines de l'Artois et les plaines de la Flandre, apportant une ventilation "
            "bienvenue mais insuffisante pour empêcher la chaleur de s'installer durablement dans les terres."
        ),
        "summaryMorning": (
            "Ce dimanche matin, les conditions sont optimales et extrêmement ensoleillées dès le réveil sur l'ensemble de la région des "
            "Hauts-de-France. Le soleil brille sans l'ombre d'un nuage sur la Flandre, le Hainaut et le Cambrésis, bien que quelques "
            "légers voiles nuageux inoffensifs puissent transiter dans le sud de la région vers l'Oise et le long de la vallée de la Somme. "
            "L'atmosphère est particulièrement douce et agréable au lever du jour après une nuit très calme. Les températures minimales "
            "s'élèvent à des niveaux élevés de 19°C à Lille, 20°C à Amiens, 20°C à Dunkerque, 19°C à Valenciennes, 19°C à Arras et 20°C "
            "à Abbeville. Le vent de secteur est est faible à modéré, ce qui permet à la douceur de s'installer rapidement et de donner "
            "une ambiance estivale sur tous nos départements."
        ),
        "summaryAfternoon": (
            "Dans l'après-midi de ce dimanche, la chaleur s'accentue sur l'ensemble du territoire régional sous un ciel largement bleu "
            "et ensoleillé. Le thermomètre affiche des valeurs caniculaires et éprouvantes dans l'intérieur des terres, avec des maximales "
            "atteignant 34°C à Lille, 35°C à Amiens, 34°C à Abbeville et Valenciennes, 34°C à Arras et jusqu'à 37°C à Château-Thierry dans "
            "l'Aisne. Sur le littoral de la Côte d'Opale, la brise marine modère l'atmosphère en limitant la hausse des températures à "
            "27°C à Calais et 29°C à Boulogne-sur-Mer, offrant un répit appréciable pour les estivants. Le vent de secteur est souffle à "
            "20 km/h en rafales dans l'intérieur, ce qui limite légèrement la sensation de lourdeur sous cette chape de chaleur."
        ),
        "summaryMorning2": (
            "Ce lundi matin, la région s'éveille sous des conditions toujours chaudes et calmes, avec un soleil dominant malgré l'arrivée "
            "progressive de voiles nuageux par l'ouest. Quelques nuages d'altitude et cumulus inoffensifs commencent à décorer le ciel sur "
            "le Pas-de-Calais, la Somme et l'Oise, sans altérer l'impression générale de beau temps. L'atmosphère reste très douce dès l'aube "
            "à la faveur d'une nuit calme et tiède. Les températures minimales au réveil affichent des valeurs élevées avec 19°C à Lille, "
            "20°C à Amiens, 20°C à Dunkerque, 20°C à Abbeville, 19°C à Valenciennes et 18°C à Arras. Le vent souffle faiblement du secteur "
            "est-sud-est, maintenant une atmosphère un peu lourde dans les centres urbains."
        ),
        "summaryAfternoon2": (
            "Dans l'après-midi de ce lundi, la chaleur s'intensifie de nouveau pour atteindre des valeurs torrides et particulièrement "
            "éprouvantes sur notre région. Le ciel se voile de nuages de plus en plus denses par l'ouest, mais le soleil continue de briller "
            "généreusement sur la Flandre, l'Artois et le Hainaut. Les maximales atteignent des sommets avec 36°C à Lille, 36°C à Amiens, "
            "36°C à Valenciennes, 35°C à Dunkerque et Abbeville, tandis que la Côte d'Opale respire un peu mieux avec 25°C à Calais et 28°C "
            "à Boulogne-sur-Mer sous l'effet bénéfique des brises marines de nord-est. Le vent de secteur sud-est souffle faiblement à 15 km/h, "
            "ce qui rend le ressenti lourd et de plus en plus orageux en fin de journée."
        ),
        "forecastRaw": (
            "Pour la journée du mardi 14 juillet, jour de la Fête Nationale, les conditions restent très chaudes et ensoleillées sur l'ensemble "
            "de la région des Hauts-de-France. Le ciel sera lumineux avec seulement quelques nuages d'altitude décoratifs qui n'altéreront "
            "pas l'ensoleillement. Concernant le thermomètre de ce mardi, les températures minimales s'éveillent sous une grande douceur à "
            "21°C à Amiens et 19°C à Lille, tandis que les maximales de l'après-midi restent élevées pour la saison, atteignant 33°C à Amiens, "
            "32°C à Lille, 33°C à Abbeville and 34°C à Valenciennes.\n\n"
            "Le mercredi 15 juillet s'annonce tout aussi ensoleillé et agréable sur tous nos départements sous un ciel bleu peu nuageux. "
            "Les brises marines de nord-est viendront tempérer le littoral tandis que l'intérieur des terres conservera une ambiance estivale "
            "classique. Au niveau du thermomètre de ce mercredi, les minimales matinales restent très douces, s'élevant à 21°C à Amiens et "
            "19°C à Lille, tandis que les maximales affichent 32°C à Amiens, 32°C à Lille, 32°C à Abbeville et 33°C à Valenciennes.\n\n"
            "Enfin, pour le jeudi 16 juillet, les conditions restent dominées par un temps sec, calme et largement ensoleillé sur toute la "
            "région après la dissipation de rares brumes matinales. Pour le thermomètre de ce jeudi, les minimales en matinée fraîchissent "
            "légèrement pour s'établir à 20°C à Amiens et 21°C à Lille, tandis que les maximales de l'après-midi seront agréablement "
            "respirables avec 32°C à Amiens, 31°C à Lille, 31°C à Abbeville et 32°C à Valenciennes."
        ),
        "beach": (
            "🏖️ MÉTÉO DES PLAGES – CÔTE D’OPALE & MER DU NORD (dimanche 12 juillet 2026)\n\n"
            "🌴 Dunkerque / Malo-les-Bains\n"
            "☀️ Très belle journée ensoleillée et chaude ce dimanche sur le sable dunkerquois.\n"
            "🌡️ Température sous abri : 34°C (ressenti chaud mais tempéré par une légère brise)\n"
            "🌊 Température de l’eau : 19 à 20°C\n\n"
            "🌴 Calais / Boulogne-sur-Mer / Le Touquet\n"
            "☀️ Soleil radieux sur toutes les plages ce dimanche, avec des conditions idéales pour la baignade.\n"
            "🌡️ Température maximale : 27 à 29°C\n"
            "🌊 Température de l’eau : 18 à 19°C"
        ),
        "marine": (
            "🌊 MÉTÉO MARINE – CÔTE D’OPALE & MER DU NORD (dimanche 12 juillet 2026)\n\n"
            "📍 Zones : Dunkerque • Calais • Boulogne-sur-Mer • Le Touquet\n\n"
            "☀️ Situation générale : Poussée d'une puissante dorsale anticyclonique d'altitude advectant une masse d'air subtropicale particulièrement brûlante sur la région.\n"
            "🌬️ Vent : Régime de brise marine de Nord-Est modéré à 20 km/h en cours de journée ce dimanche, faiblissant en soirée.\n"
            "🌊 État de la mer : Mer belle à peu agitée au large, idéale pour la navigation de plaisance et les activités nautiques.\n"
            "⚠️ Houle & Marées : Faible houle d'ouest (0.5 à 1.0 m), excellente visibilité horizontale pour la navigation."
        ),
        "recordsRaw": (
            "Pluies : Aucune précipitation n'est attendue ce dimanche, accentuant la sécheresse de surface.\n\n"
            "Vent : Vent d'Est faible à modéré atteignant 20 km/h en rafales, limitant peu l'accumulation de la chaleur.\n\n"
            "Orages : Risque nul sur l'ensemble de la région pour cette journée de dimanche.\n\n"
            "Brouillards : Dissipation rapide de rares brumes matinales sur les plaines de l'Artois."
        ),
        "mountain": (
            "🏔️ Météo montagne\n\n"
            "Vosges : Temps très chaud et généreusement ensoleillé ce dimanche avec quelques nuages de beau temps l'après-midi."
        )
    }
    
    # 3. NAQ (RADIO - ICI LA ROCHELLE)
    naq_texts = {
        "todaySummary": (
            "L'anticyclone positionné sur le golfe de Gascogne draine un flux continental de secteur sud-est particulièrement chaud et sec "
            "sur la Nouvelle-Aquitaine pour ce dimanche 12 juillet. Cette configuration synoptique favorise une advection d'air tropical "
            "d'origine saharienne extrêmement brûlant, provoquant des températures caniculaires exceptionnelles sur l'ensemble de la "
            "région. Le soleil règne en maître absolu sur la côte charentaise et les plaines de l'ouest, bien que des voiles nuageux "
            "inoffensifs commencent à remonter par le sud en fin d'après-midi sous l'effet de l'instabilité thermique accumulée. Le ressenti "
            "est extrêmement lourd et étouffant, avec des brises de mer de nord-est qui peinent à s'installer sur le littoral charentais."
        ),
        "summaryMorning": (
            "Ce dimanche matin, les conditions sont claires, limpides et extrêmement douces dès le lever du soleil sur l'ensemble de la "
            "région Nouvelle-Aquitaine. Le ciel est d'un bleu pur et totalement dégagé de la Charente-Maritime aux plaines girondines, à "
            "l'exception de quelques entrées maritimes inoffensives et brumes de surface localisées sur le Pays Basque vers Hendaye et "
            "Bayonne. La douceur matinale est remarquable et s'apparente à une véritable nuit tropicale sur les côtes. Les minimales "
            "s'élèvent à des niveaux exceptionnellement hauts de 21°C à La Rochelle, 25°C à Bordeaux, 19°C à Limoges, 26°C à Angoulême "
            "et 20°C à Brive. Le vent de secteur sud-est est calme, laissant une atmosphère lourde s'installer rapidement."
        ),
        "summaryAfternoon": (
            "Dans l'après-midi de ce dimanche, la chaleur devient torride et historique sur notre région sous un soleil implacable. Des "
            "voiles nuageux d'altitude de type cirrus remontent du golfe de Gascogne et du Pays Basque mais n'atténuent en rien la fournaise. "
            "Les températures maximales s'envolent pour atteindre des niveaux exceptionnels avec 42°C à La Rochelle, 42°C à Bordeaux, 41°C "
            "à Limoges, 42°C à Angoulême, tandis que Brive, Niort et Poitiers affichent 40°C et Tulle culmine à 43°C. Le littoral basque "
            "respire légèrement mieux avec 35°C à Biarritz. Le vent d'est-sud-est souffle faiblement à 15 km/h, ce qui renforce la sensation "
            "de four sec en limitant les brises marines."
        ),
        "summaryMorning2": (
            "Ce lundi matin, les conditions météorologiques évoluent progressivement avec l'approche d'une perturbation océanique par le "
            "golfe de Gascogne. Le ciel se voile de nuages de plus en plus denses le long du littoral atlantique et sur la Charente, tandis "
            "que l'est de la région vers le Limousin conserve un ciel dégagé et plus lumineux. La nuit a été suffocante et le réveil se "
            "fait sous une atmosphère très lourde et orageuse. Les températures minimales au lever du jour sont particulièrement élevées, "
            "s'établissant à des valeurs de 24°C à La Rochelle, 24°C à Bordeaux, 20°C à Limoges, 24°C à Angoulême et 20°C à Brive. Le vent "
            "s'oriente progressivement au secteur ouest-sud-ouest sur la côte."
        ),
        "summaryAfternoon2": (
            "Dans l'après-midi de ce lundi, l'instabilité se renforce avec de nombreux passages nuageux sur la Nouvelle-Aquitaine, bien "
            "que le soleil fasse de belles apparitions sur la Charente vers Pons qui affiche 29°C. Le littoral et l'ouest de la région "
            "profitent d'une baisse des températures très appréciable grâce à l'orientation des vents à l'océan, avec 37°C à La Rochelle "
            "et 35°C à Bordeaux. En revanche, l'intérieur des terres et le Limousin restent sous une chaleur étouffante avec 39°C à Limoges, "
            "36°C à Angoulême et 33°C à Brive. Le vent de secteur ouest-sud-ouest souffle à 20 km/h sur les côtes charentaises, apportant "
            "une fraîcheur bienvenue après la fournaise."
        ),
        "forecastRaw": (
            "Pour la journée du mardi 14 juillet, jour de la Fête Nationale, les conditions s'annoncent plus changeantes et respirables "
            "sur la Nouvelle-Aquitaine. Le ciel sera partagé entre de larges éclaircies et des passages nuageux plus denses dans l'intérieur. "
            "Concernant le thermomètre de ce mardi, les minimales matinales oscillent autour de 22°C à La Rochelle et 22°C à Bordeaux, tandis "
            "que les maximales de l'après-midi fléchissent nettement avec 37°C à La Rochelle, 36°C à Bordeaux et 35°C à Limoges.\n\n"
            "Le mercredi 15 juillet, les conditions s'améliorent avec le retour d'un soleil généreux sur l'ensemble de nos départements. "
            "L'atmosphère sera agréable et estivale sans chaleur excessive grâce à un flux d'ouest modéré. Au niveau du thermomètre de ce "
            "mercredi, les températures minimales s'éveillent sous une grande douceur avec 22°C à La Rochelle et 22°C à Bordeaux, tandis "
            "que les maximales affichent des valeurs de 35°C à La Rochelle, 36°C à Bordeaux et 35°C à Limoges.\n\n"
            "Enfin, pour la journée du jeudi 16 juillet, le grand beau temps sec et très ensoleillé s'impose à nouveau sous de légères brises "
            "marines. Pour le thermomètre de ce jeudi, les minimales en matinée fraîchissent légèrement pour s'établir à 23°C à La Rochelle "
            "et 22°C à Bordeaux, tandis que les maximales de l'après-midi seront tout à fait agréables avec 29°C à La Rochelle, 31°C à "
            "Bordeaux et 33°C à Limoges."
        ),
        "beach": (
            "🏖️ MÉTÉO DES PLAGES – LITTORAL CHARENTAIS (dimanche 12 juillet 2026)\n\n"
            "🌴 La Rochelle / Île de Ré / Île d’Oléron\n"
            "☀️ Grand soleil et chaleur caniculaire extrême sur toutes les plages charentaises ce dimanche.\n"
            "🌡️ Température sur le littoral : 38 à 40°C (atmosphère étouffante sur le sable)\n"
            "🌊 Température de l’eau : 21 à 23°C (conditions de baignade exceptionnelles)"
        ),
        "marine": (
            "🌊 MÉTÉO MARINE – LITTORAL CHARENTAIS (dimanche 12 juillet 2026)\n\n"
            "📍 Zones : La Rochelle • Île de Ré • Île d'Oléron • Royan\n\n"
            "☀️ Situation générale : Flux continental de sud-est particulièrement brûlant sous l'influence d'un puissant anticyclone s'étendant sur le golfe de Gascogne.\n"
            "🌬️ Vent : Vent d'Est-Sud-Est faible à 15 km/h ce dimanche, avec de rares brises côtières très localisées.\n"
            "🌊 État de la mer : Mer belle et calme, visibilité parfaite sur tout le bassin maritime charentais."
        ),
        "recordsRaw": (
            "Canicule & Vigilance : De nombreux départements de la Nouvelle-Aquitaine sont placés en vigilance orange Canicule avec des températures exceptionnelles atteignant 40 à 42°C.\n\n"
            "Pluies : Temps totalement sec ce dimanche, aucune averse n'est attendue.\n\n"
            "Vent : Vent faible d'Est-Sud-Est à 15 km/h limitant l'installation des brises marines.\n\n"
            "Orages : Activité orageuse isolée possible uniquement sur les crêtes pyrénéennes en fin d'après-midi."
        ),
        "mountain": (
            "🏔️ Météo montagne\n\n"
            "Pyrénées : Soleil dominant en matinée ce dimanche, avant le développement de cumulus bourgeonnants et un risque d'averses orageuses isolées sur les crêtes l'après-midi."
        )
    }
    
    # 4. NORMANDIE (RADIO ICI NORMANDIE)
    normandie_texts = {
        "todaySummary": (
            "Une dorsale anticyclonique s'étend des îles Britanniques vers le bassin parisien et protège la Normandie pour ce dimanche "
            "12 juillet. Le flux continental de secteur sud-est draine de l'air très sec et chaud, garantissant un ciel globalement "
            "lumineux et ensoleillé du matin au soir sur l'ensemble de la région. Le ressenti est chaud et sec dans les terres, tandis "
            "que les côtes de la Manche profitent de brises de nord-est à 20 km/h apportant un peu de fraîcheur l'après-midi en bord de mer, "
            "alors que de légers voiles nuageux apparaissent vers le sud de la région en fin de journée sous l'effet du réchauffement diurne marqué."
        ),
        "summaryMorning": (
            "Ce dimanche matin, les conditions sont optimales et extrêmement ensoleillées dès le réveil sur les cinq départements normands "
            "sous un ciel bleu immaculé. Le soleil brille sans partage de Cherbourg à Évreux, bien que de rares nuages bas locaux ou "
            "brumes de surface puissent temporairement traîner sur le littoral de la côte d'Albâtre vers Dieppe avant de se dissiper sous "
            "les premiers rayons. Les températures minimales sont douces pour la saison au lever du jour, s'élevant à des valeurs de "
            "19°C à Rouen, 18°C à Caen, 18°C à Le Havre, 20°C à Cherbourg, 20°C à Évreux, 21°C à Alençon et 18°C à Lisieux. La bise de secteur "
            "est souffle faiblement, garantissant une matinée calme et limpide."
        ),
        "summaryAfternoon": (
            "Dans l'après-midi de ce dimanche, le soleil brille généreusement sur toute la région dans une ambiance très chaude et estivale. "
            "Le thermomètre grimpe à des valeurs élevées et éprouvantes dans l'intérieur des terres, avec des maximales atteignant "
            "36°C à Rouen, 36°C à Évreux, 36°C à Dieppe et 36°C à Lisieux, tandis qu'Alençon affiche 32°C. Sur le littoral du Calvados et de "
            "la Seine-Maritime, les brises côtières modérées de nord-est à 20 km/h tempèrent l'atmosphère en limitant la hausse des "
            "températures à 28°C à Caen et 26°C à Le Havre, tandis que le Cotentin subit une forte chaleur de 35°C à Cherbourg sous un ciel peu nuageux."
        ),
        "summaryMorning2": (
            "Ce lundi matin, le temps évolue avec l'arrivée progressive de nombreux passages nuageux par l'ouest. Le ciel se couvre de "
            "voiles nuageux d'altitude et de cumulus sur l'ensemble de la région, bien que de belles éclaircies résistent temporairement vers "
            "l'est de l'Eure et de la Seine-Maritime. L'atmosphère est très douce dès l'aube après une nuit tiède et calme. Les températures "
            "minimales au réveil affichent des valeurs élevées avec 20°C à Rouen, 19°C à Caen, 19°C à Le Havre, 21°C à Cherbourg, 21°C à "
            "Évreux, 18°C à Alençon et 20°C à Lisieux. Le vent de secteur sud-est souffle faiblement, maintenant un ressenti lourd."
        ),
        "summaryAfternoon2": (
            "Dans l'après-midi de ce lundi, l'instabilité se développe avec un ciel variable à très nuageux sur l'ensemble de la Normandie, "
            "apportant un risque d'averses localement orageuses en fin de journée dans l'intérieur. Les températures maximales restent "
            "élevées et lourdes dans les terres avec 35°C à Rouen, 35°C à Évreux, 35°C à Dieppe et 35°C à Lisieux, tandis qu'Alençon affiche "
            "30°C. Les brises marines de secteur ouest-nord-ouest se lèvent sur le littoral, apportant une baisse sensible des températures "
            "avec 25°C à Caen, 25°C à Le Havre, et 33°C à Cherbourg sous un vent de 20 km/h."
        ),
        "forecastRaw": (
            "Pour la journée du mardi 14 juillet, jour de la Fête Nationale, les conditions restent agréables et ensoleillées sur l'ensemble "
            "de la Normandie. Le ciel sera lumineux avec seulement quelques passages nuageux inoffensifs en matinée qui se dissiperont rapidement. "
            "Concernant le thermomètre de ce mardi, les températures minimales s'éveillent sous une grande douceur avec 19°C à Caen et 19°C "
            "à Rouen, tandis que les maximales affichent 28°C à Caen, 33°C à Rouen, 26°C à Le Havre et 32°C à Lisieux.\n\n"
            "Le mercredi 15 juillet s'annonce tout aussi agréable et lumineux sous un soleil généreux sur nos cinq départements. Les brises "
            "côtières tempéreront le littoral tandis que l'intérieur des terres conservera une ambiance estivale très agréable. Au niveau "
            "du thermomètre de ce mercredi, les minimales matinales restent stables à 18°C à Caen et 19°C à Rouen, tandis que les maximales "
            "de l'après-midi affichent 27°C à Caen, 33°C à Rouen, 26°C à Le Havre et 31°C à Lisieux.\n\n"
            "Enfin, pour le jeudi 16 juillet, les conditions se rafraîchissent sensiblement par le nord-ouest avec l'arrivée d'une masse "
            "d'air océanique plus fraîche sous un ciel variable. Pour le thermomètre de ce jeudi, les minimales en matinée s'établissent à "
            "23°C à Caen et 18°C à Rouen, tandis que les maximales fléchissent nettement avec 23°C à Caen, 23°C à Rouen, 26°C à Le Havre "
            "et 30°C à Cherbourg."
        ),
        "beach": (
            "🏖️ MÉTÉO DES PLAGES – LITTORAL NORMAND (dimanche 12 juillet 2026)\n\n"
            "🌴 Cabourg / Deauville / Le Havre / Dieppe\n"
            "☀️ Superbe ensoleillement estival sur toutes les plages normandes ce dimanche.\n"
            "🌡️ Température sur le littoral : 26 à 28°C sur les plages de Seine-Maritime et du Calvados.\n"
            "🌊 Température de l’eau : 17 à 18°C (baignade vivifiante)"
        ),
        "marine": (
            "🌊 MÉTÉO MARINE – MANCHE (dimanche 12 juillet 2026)\n\n"
            "📍 Zones : Le Havre • Fécamp • Dieppe • Cherbourg\n\n"
            "☀️ Situation générale : Protection anticyclonique solide avec advection d'air sec et chaud continental sur le bassin de la Manche.\n"
            "🌬️ Vent : Brises thermiques de secteur Nord-Est soufflant modérément à 20 km/h en journée ce dimanche.\n"
            "🌊 État de la mer : Mer peu agitée, excellente visibilité pour toutes les activités nautiques."
        ),
        "recordsRaw": (
            "Pluies : Temps sec et ensoleillé sur les cinq départements, aucune pluie à signaler ce dimanche.\n\n"
            "Vent : Brises marines de secteur Nord-Est soufflant jusqu'à 20 km/h le long des plages de la Manche en cours d'après-midi.\n\n"
            "Orages : Risque orageux nul ce dimanche sur toute la Normandie.\n\n"
            "Brouillards : Rares grisailles maritimes locales se dissipant rapidement en matinée."
        ),
        "mountain": (
            "🏔️ Météo montagne\n\n"
            "Massif Central : Soleil dominant et chaleur marquée ce dimanche, évolution nuageuse inoffensive l'après-midi."
        )
    }

    for c in clients:
        name = c.get("name", "")
        form = c.setdefault("form", {})
        
        # Select texts
        if "EUROPE1" in name:
            texts = e1_texts
        elif any(x in name for x in ["NORD", "RADIO 6", "MONA"]):
            texts = hdf_texts
        elif "ROCHELLE" in name:
            texts = naq_texts
        elif "NORMANDIE" in name:
            texts = normandie_texts
        else:
            print(f"Skipping unknown client: {name}")
            continue
            
        for k, v in texts.items():
            form[k] = v
            if k == "forecastRaw":
                form["forecastTextRaw"] = v
                
        print(f"Updated client texts for: {name}")
        
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved: {json_path}")

update_bulletins("AUTOMATISATION.json")
update_bulletins("BULLETINS_AUTOMATIQUES_DIMANCHE_12.json")
