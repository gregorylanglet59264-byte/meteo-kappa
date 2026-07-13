---
name: meteo-kappa
description: >
  Génère et publie automatiquement les bulletins météo radio/TV (CNews, Europe 1, radios régionales)
  avec cartes HD, vigilance temps réel Météo-France, et textes rédigés directement par l'assistant.
  Anciennement "bulletin-cnews-auto". Se déclenche proactivement chaque jour — l'utilisateur n'a
  PAS à le demander à chaque fois.
---

# 🌤️ Météo Kappa — Compétence Bulletins Radio/TV

Génération quotidienne automatique des bulletins météo pour tous les clients CNews/Europe 1/radios régionales.
**L'utilisateur ne demande pas manuellement chaque jour — la compétence s'active proactivement.**

> 🚨 **COMPAGNON OBLIGATOIRE** : Cette compétence est indissociable de la compétence `visio-prevision`. Lorsque vous exécutez `meteo-kappa`, vous devez également ouvrir, lire et appliquer en même temps les directives de rédaction journalistique et d'analyse visuelle de [visio-prevision/SKILL.md](file:///C:/Users/grego/.gemini/config/skills/visio-prevision/SKILL.md).

---

## ⚡ COMPORTEMENT LORS DE L'ACTIVATION DE LA COMPÉTENCE — RÈGLE FONDAMENTALE

> **Lorsque l'utilisateur active ou invoque la compétence Kappa en chat (ex: "active Kappa", "lance la météo Kappa", "fais les bulletins", etc.), l'assistant DOIT IMPÉRATIVEMENT LUI POSER LA QUESTION DU JOUR CIBLE ET DES OPTIONS AVANT D'EXÉCUTER.**
>
> **Questions obligatoires à poser à l'utilisateur dès l'activation :**
> 1. **Pour quel jour cible souhaitez-vous générer les bulletins ?**
>    - *Aujourd'hui (`--day-offset 0`, ex : Jeudi)*
>    - *Demain (`--day-offset 1`, ex : Vendredi)*
>    - *Après-demain (`--day-offset 2`, ex : Samedi)*
> 2. **Souhaitez-vous que je génère également les cartes HD Météo-France (`--generate-maps` via `meteo-cnews`) avant de rédiger, ou devons-nous utiliser les cartes déjà présentes sur votre bureau (`cartes_alertes`) ?**
>
> *(Rappel : Le Mode Visio en plateau est activé par défaut et un rapport de vérification `.txt` sera automatiquement déposé sur le Bureau à l'issue de la génération).*
>
> **Exception (Mode Autonome Nocturne / Task Scheduler) :**  
> Si la compétence est lancée par un cron nocturne en arrière-plan sans présence de l'utilisateur, elle exécute directement la commande par défaut avec `--day-offset 1 --generate-maps`.

---

## ✍️ RÉDACTION DES TEXTES — RÈGLE FONDAMENTALE

> **En chat (présence de l'assistant) → rédiger soi-même, JAMAIS appeler une API externe.**
> **En mode autonome (Task Scheduler la nuit) → OpenRouter/DeepSeek via `ai_helper.py`.**

### Protocole de rédaction en chat :
1. **Récupérer les données réelles** Open-Meteo via one-liner Python pour les offsets demandés
2. **Rédiger directement** les 6 sections (voir structure) basées sur les températures réelles
3. **Injecter** dans `inject_bulletin_texts.py` en mettant à jour le dictionnaire `TEXTS`

### Structure des 6 sections texte par client (minimum 120-180 mots chacune) :
| Champ | Contenu |
|---|---|
| `todaySummary` | Résumé synoptique national (120-150 mots) — situation de pression, masses d'air |
| `summaryMorning` | Matinée J+1 (150-180 mots) — commence par "Ce [jour] matin..." — 5-6 villes avec minimales réelles |
| `summaryAfternoon` | Après-midi J+1 (150-180 mots) — 5-6 villes avec maximales réelles |
| `summaryMorning2` | Matinée J+2 (120-150 mots) — 4-5 villes avec minimales réelles |
| `summaryAfternoon2` | Après-midi J+2 (120-150 mots) — 4-5 villes avec maximales réelles |
| `forecastRaw` | Tendance 3 jours suivants — format `- Jour date : description 60-80 mots` |

### Critères de qualité obligatoires :
- Citer les **types de nuages** (cirrus, cumulus bourgeonnants, stratus, cumulonimbus)
- Citer les **vents locaux** (mistral, bise, tramontane, brise marine, vent océanique)
- **Vents arrondis** : Toujours arrondir les vitesses de vent (moyen et rafales) de 5 en 5 km/h (ex: 28 → 30 km/h, 22 → 20 km/h).
- Décrire les **ressentis** (lourd, étouffant, vivifiant, fraîcheur océanique, nuit tropicale)
- Mentionner la **situation synoptique** (anticyclone, dorsale, front, perturbation, dépression)
- Utiliser **uniquement les températures réelles** issues de l'API (texte de contexte) — jamais inventer de chiffres, et **ne jamais tenter de lire les chiffres sur la carte** en mode Visio (risque d'erreur OCR).

---

## 🛠️ ARCHITECTURE DU DOUBLE-MOTEUR & SÉCURITÉS (CORRECTIONS 9 JUILLET 2026)

1. **Extraction stricte des Températures Météo-France (Bug d'index résolu)** :
   - Le script `ai_helper.py` parse désormais les fichiers CSV `meteofrance_daily_forecast_*.csv` en cherchant la **date exacte** (`DD/MM/YYYY`) au lieu d'utiliser un décalage d'index (`day_offset`). Cela garantit que les températures envoyées à l'IA sont mathématiquement 100% identiques à celles imprimées sur les cartes HD, et empêche tout repli accidentel sur Open-Meteo.

Suite aux audits de cohérence, 4 sécurités strictes sont intégrées directement dans [`scripts/ai_helper.py`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/scripts/ai_helper.py) et [`scripts/export_all_bulletins.py`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/scripts/export_all_bulletins.py) :

1. **Générateur de Secours Déterministe Local (`generate_local_fallback_texts`)** :
   - Fonctionne 100% en local en < 1 seconde grâce à l'API Open-Meteo sans dépendre d'OpenRouter.
   - Construit automatiquement et rigoureusement les 6 balises XML (`todaySummary`, `summaryMorning`, `summaryAfternoon`, `summaryMorning2`, `summaryAfternoon2`, `forecastRaw`) avec les températures réelles, les tendances exactes (`📉 Tendance – 3 jours suivants (dimanche 12 juillet au mardi 14 juillet)`), et le bon jour de la semaine (`Ce vendredi matin...`).
   - Si OpenRouter échoue, manque une balise ou hallucine un jour de la semaine, ce générateur prend instantanément le relais. **Il est mathématiquement impossible d'avoir un champ vide ou une date incohérente (comme "24 Juin" ou "24 Mars").**

2. **Vérification Stricte du Jour (`summaryMorning`)** :
   - `ai_helper.py` vérifie que la réponse générée commence exactement par le bon jour (ex: `Ce vendredi matin`). Si l'IA écrit "Ce lundi matin" alors que `day_offset=1` (vendredi), le paragraphe est immédiatement remplacé par le fallback déterministe.

3. **Correction des Villes de Normandie (`RADIO ICI NORMANDIE`)** :
   - Le client `RADIO ICI NORMANDIE` est dorénavant mappé sur ses vraies villes (`Rouen`, `Caen`, `Le Havre`, `Cherbourg`, `Evreux`, `Alençon`, `Dieppe`, `Lisieux`) dans `AUTOMATISATION.json` au lieu d'avoir hérité des villes du Nord (`Valenciennes`, `Douai`).

4. **Tolérance des Espaces et Clés Régionales** :
   - `region_mapping` dans `auto_bulletin.py` et `export_all_bulletins.py` accepte à la fois `"RADIO ICI NORMANDIE"` et `"RADIO ICI NORMANDIE "` (avec espace final) pour correspondre au code région `normandie`.

5. **Priorité aux Données Officielles Météo-France (Hybride CSV / Open-Meteo & Triple Vérification)** :
   - Pour garantir la **cohérence parfaite à 100%** entre les chiffres des textes (`summaryMorning`, `summaryAfternoon`) et les cartes HD, `ai_helper.py` charge les fichiers CSV de Météo-France.
   - **Sécurité Anti-Décalage (Coordonnées GPS) :** Si une ville est nommée différemment dans la config et chez Météo-France ("Boulogne" vs "Boulogne-sur-Mer"), `ai_helper.py` lit la Latitude/Longitude (arrondies) pour l'attribuer.
   - **Sécurité de Proximité Spatiale (Nearest Neighbor) :** Si la ville du client n'est pas dessinée sur la carte Météo-France (ex: `St-Hilaire-sur-Helpe`), l'algorithme calcule mathématiquement la ville Météo-France la plus proche dans un rayon de 15km (ex: `Avesnes-sur-Helpe`) et hérite de sa température. Cela élimine toute disparité visuelle.
   - **Sécurité des Arrondis (Python vs JS) :** Le code Python de `ai_helper.py` utilise un arrondi mathématique imitant Javascript (`math.floor(val + 0.5)`) pour s'assurer que des valeurs comme "24.5°C" soient systématiquement arrondies à "25°C" dans le texte ET sur l'image, empêchant tout écart silencieux d'un degré.
   - **Sécurité d'Affichage des Cartes (`index.html`) :** Les cartes ont l'ordre absolu d'afficher la variable `temperature_2m_min` ou `temperature_2m_max` du CSV journalier de Météo-France, interdisant toute interpolation horaire qui créerait un décalage d'un degré avec le texte IA (ex: le "bug de Nantes" où l'horaire plafonnait à 38°C sur la carte, alors que la vraie maximale journalière Météo-France lue par le texte IA était bien de 39°C).

6. **Sélection Aléatoire des Villes (Dynamisme Radiophonique)** :
   - Pour éviter que le bulletin ne devienne répétitif, la consigne système de l'IA lui impose explicitement de varier sa sélection de villes chaque jour (mix côtes/terres). Le moteur de secours (Fallback) intègre également une fonction `random.sample()` pour sélectionner au hasard 5 villes dans la liste du client, garantissant une rotation permanente à l'antenne.

   **CORRECTION BUG (9 juillet 2026) — Vote WMO pour `forecastRaw` :**
   - Avant : `forecastRaw` lisait uniquement le code météo (`weathercode`) de la **première ville** du CSV pour qualifier le temps des jours de tendance. Si la première ville avait du beau temps mais d'autres des orages, la tendance disait "temps calme".
   - Fix appliqué : `max(s['code'] for s in struct)` — vote sur **toutes les villes** du CSV. Si une ville quelconque a un code orage (≥ 80), la tendance mentionne "passages d'averses orageuses".

7. **Dynamisation de Phénomènes Marquants et Météo des Montagnes** :
   - Pour le client `BULLETIN EUROPE1 à 6h`, les blocs `recordsRaw` (Phénomènes marquants) et `mountain` (Météo montagne) sont désormais générés dynamiquement par le moteur local/IA en fonction du jour cible (`ce vendredi`, `ce week-end`), éliminant définitivement les vieux textes statiques résiduels de l'ancienne version.

7. **Génération Dynamique Obligatoire de Météo des Plages (`beach`) et Météo Marine (`marine`)** :
   - Pour l'ensemble des clients régionaux (`RADIO - ICI NORD`, `RADIO - ICI LA ROCHELLE`, `RADIO 6`, `MONA FM`, `RADIO ICI NORMANDIE`), les champs `beach` et `marine` doivent impérativement être mis à jour à chaque run par `ai_helper.py` (via le dictionnaire `local_fallback` dans `generate_local_fallback_texts`).
   - Il est **formellement interdit de laisser un texte statique hérité** (mentionnant un vieux jour de la semaine ou des températures obsolètes). À chaque exécution, `export_all_bulletins.py` récupère les balises `"beach"` et `"marine"` générées dynamiquement (avec la date exacte `date_j1` et les températures côtières officielles du jour) et les écrase dans `form["beach"]` et `form["marine"]` pour garantir une uniformité totale sur toutes les radios.

8. **Mode Visio Multimodal en Plateau (`VISION_MODE = True` activé par défaut)** :
   - À chaque appel, `generate_bulletin_texts()` (`ai_helper.py`) vérifie si les cartes officielles Météo-France (`carte_{region_prefix}J{day_offset}_matin.jpg` et `_apresmidi.jpg`) sont présentes sur le bureau (`C:\Users\grego\Desktop\cartes_alertes`).
   - **Mode Visio et Greffe de la compétence Visio-Prévision (OBLIGATOIRE)** : 
     - **En mode autonome (nocturne)** : Les cartes HD sont transmises à l'API Vision d'OpenRouter via `ai_helper.py` avec les consignes rédactionnelles ci-dessous.
     - **En mode Chat (présence de l'assistant)** : L'assistant DOIT exécuter le script d'export avec l'option `--skip-ai`, puis ouvrir les cartes présentes sur le bureau (`C:\Users\grego\Desktop\cartes_alertes`), appliquer lui-même la compétence [Visio-Prévision](file:///C:/Users/grego/.gemini/config/skills/visio-prevision/SKILL.md) pour rédiger les paragraphes, et les injecter.
     - **Consignes rédactionnelles pour commenter chaque période** :
       - **Un paragraphe unique par carte/période** (Matin, Après-midi, Soirée) sans liste à puces ni sauts de ligne internes.
       - **Interdiction absolue** d'utiliser les mots *"carte"*, *"bulletin"*, *"plateau"* et *"plateau TV"*.
       - **Obligation** d'utiliser des expressions temporelles pour lier la prévision (ex : *"pour ce mardi"*, *"pour ce mercredi"*, *"dans l'après-midi"*, *"dans la soirée"*).
       - Les cartes HD sont transmises au modèle Vision avec ces consignes rédactionnelles précises pour commenter les conditions observées (pictogrammes, températures par villes clés) dans le style d'un présentateur météo TV/radio de façon naturelle et fluide.
       - **Règle stricte pour les tendances J+2 à J+4 (`forecastRaw`)** : Rédigez obligatoirement un paragraphe distinct pour chaque jour. Chaque jour doit comporter au moins 6 lignes complètes, dont au moins 2 lignes dédiées à la description détaillée des températures exactes des villes de la région.
       - Le module **Météo des forêts** (carte et texte) est intégré directement au sein de la section Vigilance. La synchronisation automatique charge la carte forêt depuis Supabase, tandis que le prévisionniste garde le contrôle sur la description textuelle.
   - ⚠️ **RÈGLE STRICTE ORAGES VISIBLES :** Si des pictogrammes d'orages ou d'averses orageuses (éclairs, nuages noirs pluvieux) sont dessinés visuellement sur les cartes (matin ou après-midi), l'IA **DOIT obligatoirement** les mentionner dans les textes principaux (`summaryMorning`, `summaryAfternoon`) et nommer les zones/départements touchés, même si la vigilance nationale officielle ne met pas ces départements en orange orages.
   - ⚠️ **VÉRIFICATION OBLIGATOIRE dans les logs :** Le Vision Mode n'est actif que si les `.jpg` sont présents au moment du run. Toujours contrôler que les logs affichent `[Mode Visio Actif 👁️]` pour chaque client. Si ce message est absent et que le log indique `Calling OpenRouter (deepseek...)` à la place, **les pictogrammes ne sont PAS lus**. Solution : relancer avec `--generate-maps`.

9. **Génération et Sauvegarde Automatique du Rapport de Prévisions (.txt)** :
   - Afin de garantir une totale traçabilité et de vérifier le respect des consignes visuelles par carte et par client, `export_all_bulletins.py` génère automatiquement à la fin de chaque run un fichier texte de contrôle.
   - Le rapport est sauvegardé sous le nom `BULLETINS_AUTOMATIQUES_{JOUR}.txt` dans le dossier projet **ET copie sur le Bureau sous `C:\Users\grego\Desktop\RAPPORT_PREVISIONS_VISIO_DERNIER_RUN.txt`**.
   - Ce rapport contient, pour chacun des 6 clients, l'intégralité des 6 paragraphes rédigés (`todaySummary`, `summaryMorning`, `summaryAfternoon`, `beach`, `marine`, `mountain`), prouvant au mot et à la température près ce qui a été produit et commenté pour chaque carte.

10. **Correction de l'Indexation des Cartes (Bug de décalage J+1 résolu)** :
    - Avant cette correction, l'argument `--start-tomorrow` décalait les données mais continuait de nommer la carte du lendemain `J0`, forçant le bulletin (qui attendait `J1`) à utiliser la carte du surlendemain (ex: carte de samedi pour un bulletin du vendredi).
    - Dorénavant, `generate_meteofrance_maps.py` aligne parfaitement le nommage des fichiers (`carte_..._J1.jpg` = lendemain) avec la demande de `export_all_bulletins.py`, garantissant que le modèle Vision commente toujours la carte exacte du jour visé.

---

## 🛡️ INTÉGRATION VIGILANCE & COMPÉTENCE VIGILANCE MÉTÉO-FRANCE

Pour que le rédacteur IA (`DeepSeek via OpenRouter`) et le générateur local déterministe disposent systématiquement de la **situation nationale Météo-France et des tendances à moyen terme (J+2 à J+7)**, `ai_helper.py` fait appel en direct aux outils de la compétence `vigilance` :

1. **Exécution de la compétence `vigilance` (`get_vigilance_data.py`)** :
   - `fetch_vigilance_and_national_context()` exécute `C:\Users\grego\.gemini\config\skills\vigilance\scripts\get_vigilance_data.py`.
   - Ce script extrait en temps réel :
     - Le **Bulletin National officiel de Météo-France** pour la journée et le lendemain.
     - Le **rapport PDF "jours suivants" (J+2 à J+7)** émis par Météo-France.
     - La liste complète des **départements en Vigilance Orange et Jaune** (`vigilance.meteofrance.fr`).
2. **Injection directe dans le Prompt et le Fallback** :
   - Cette synthèse officielle est transmise en bloc prioritaire au prompt (`DONNÉES OFFICIELLES VIGILANCE & BULLETIN NATIONAL MÉTÉO-FRANCE`).
   - L'IA intègre ainsi naturellement les alertes canicule / orages / vents violents et cite le bon nombre de départements en vigilance orange directement dans `todaySummary`, `summaryMorning` et `recordsRaw`.

> ⚠️ **CORRECTION BUG (9 juillet 2026) — Extraction ciblée par jour (anti-troncature) :**
> La section 3 de `get_vigilance_data.py` contient les alertes pour **aujourd'hui ET demain** dans le même bloc texte. Lorsque beaucoup de départements sont en alerte (ex: 72 dép. orange canicule un jeudi), le bloc de jeudi seul pouvait dépasser 1700 chars, coupant entièrement le bloc de vendredi.
> **Fix appliqué dans `ai_helper.py` :** `re.split()` sur le header `### Vigilance météo et crues pour` pour extraire **uniquement le bloc du jour cible** (`day_offset`). Plus aucune troncature aveugle. L'IA voit désormais systématiquement les orages, vents violents et autres phénomènes du jour cible, même si la veille avait de nombreuses alertes.

| Champ injecté | Source / Compétence |
|---|---|
| `alert` | Liste départements orange/jaune groupés par phénomène — `get_vigilance_summary` / `vigilance.meteofrance.fr` |
| `alertTitle` | Titre dynamique calculé via `datetime` |
| `alertSource` | `Météo-France — vigilance.meteofrance.fr` |
| `DONNÉES OFFICIELLES VIGILANCE` (Prompt AI) | Sortie du script `get_vigilance_data.py` (compétence `vigilance`) |

**Test rapide de la compétence vigilance :**
```powershell
python C:\Users\grego\.gemini\config\skills\vigilance\scripts\get_vigilance_data.py
```

---

## 🗺️ GÉNÉRATION DES CARTES (compétence meteo-cnews)

Les cartes sont générées via le script externe `generate_meteofrance_maps.py`.
**Toujours générer les cartes avant de lancer l'export.**

> ⚠️ **RÈGLE ABSOLUE — Couleurs des températures sur les cartes HD :**
> - **Températures minimales** → chiffres **noirs** sur fond **bleu**
> - **Températures maximales** → chiffres **noirs** sur fond **rouge**
> Cette règle s'applique à toutes les zones (`france_pictos`, `hdf`, `naq`, `normandie`). Toujours vérifier que ces paramètres sont bien passés à `generate_meteofrance_maps.py` (options `--min-color`, `--max-color` ou équivalent selon la version du script).

> 🔴 **VÉRIFICATION OBLIGATOIRE — Cohérence températures carte ↔ commentaire :**
> Après chaque génération, l'assistant **DOIT impérativement vérifier** que les températures citées dans les textes (`summaryMorning`, `summaryAfternoon`, etc.) correspondent **exactement** aux valeurs affichées sur les cartes HD.
> - La source de vérité est le CSV Météo-France (`meteofrance_daily_forecast_*.csv`) — jamais Open-Meteo seul, jamais une valeur lue visuellement sur une image.
> - Si un écart est détecté (même d'1°C), corriger **immédiatement** le texte pour aligner sur la carte avant toute publication.
> - Signaler à l'utilisateur tout écart constaté, même corrigé automatiquement, avec le détail ville/valeur carte/valeur texte.
> - Historique : des bugs de décalage ont été rencontrés par le passé (index CSV, arrondi JS/Python, bug de Nantes). Les sécurités intégrées dans `ai_helper.py` doivent les prévenir, mais la vérification finale reste **non négociable**.

### Correspondance clients → zones cartes :
| Client | Zone |
|---|---|
| BULLETIN EUROPE1 à 6h | `france_pictos` |
| RADIO - ICI NORD | `hdf` |
| RADIO - ICI LA ROCHELLE | `naq` |
| RADIO 6 | `hdf` |
| MONA FM | `hdf` |
| RADIO ICI NORMANDIE | `normandie` |
| RADIO ICI AUVERGNE-RHÔNE-ALPES | `ara` |
| RADIO ICI BOURGOGNE-FRANCHE-COMTÉ | `bfc` |
| RADIO ICI BRETAGNE | `bretagne` |
| RADIO ICI CENTRE-VAL DE LOIRE | `cvl` |
| RADIO ICI CORSE | `corse` |
| RADIO ICI GRAND EST | `grand-est` |
| RADIO ICI ÎLE-DE-FRANCE | `ile-de-france` |
| RADIO ICI OCCITANIE | `occitanie` |
| RADIO ICI PAYS DE LA LOIRE | `pdl` |
| RADIO ICI PROVENCE-ALPES-CÔTE D'AZUR | `paca` |

---

export_all_bulletins.py
    └── Lit carte_forets_{zone}.jpg → base64 → form["forestAlertImageUrl"]
        + form["forestAlertTitle"] = "🌲 Météo des forêts — Risque Feux"
        + form["showForestMap"] = True
```

### Correspondance zones → régions :
| Zone | Région sélectionnée |
|---|---|
| `france_pictos` | Toute la France |
| `hdf` | Hauts-de-France |
| `naq` | Nouvelle-Aquitaine |
| `normandie` | Normandie |

### Où le configurer manuellement :
Dans l'éditeur React → onglet **Vigilance** → bloc vert "🌲 Module Météo des forêts" en bas de section. Le texte `forestAlert` reste **manuel** (rédiger le commentaire du risque feu par le prévisionniste), seule la carte est automatique.

### Fichiers modifiés :
- [`generate_video_bulletin.py`](file:///c:/Users/grego/Documents/METEO_CLIMAT/meteo%20cnews%202/generate_video_bulletin.py) : fonction `capture_and_compose_forets()`
- [`generate_meteofrance_maps.py`](file:///c:/Users/grego/Documents/METEO_CLIMAT/meteo%20cnews%202/generate_meteofrance_maps.py) : étape 6 ajoutée
- [`export_all_bulletins.py`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/scripts/export_all_bulletins.py) : injection `forestAlertImageUrl`

## ⚠️ RÉSOLUTIONS DES CONFLITS & PORT BLOQUÉ (BUG DU HANG SILENCIEUX)

> [!WARNING]
> Si le script de génération de cartes `generate_meteofrance_maps.py` ou l'export global semble se figer (hang) indéfiniment après l'affichage de `Launching map generator for zone...` ou au premier rendu `[1/24] Rendering J1 - MATIN (weather_temp)...`, cela signifie que des processus Chrome (headless) ou Python orphelins bloquent le port **8001** (utilisé pour les captures de cartes).
> 
> **Procédure de déblocage rapide sous PowerShell :**
> ```powershell
> # Tuer tous les processus Python et Chrome orphelins pour libérer le port 8001
> Stop-Process -Name python -Force -ErrorAction SilentlyContinue
> Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
> ```

---

## 🚀 COMMANDES D'EXPORT TOUT-EN-UN (EXÉCUTION AUTONOME SANS REPÉRAGE)

Pour générer d'un seul coup **la totalité des 16 radios/clients** (Europe 1 + 15 stations régionales) avec **toutes les étapes unifiées (Vigilance J+2/J+7 filtrée + CSV Météo-France + Rédaction synoptique IA + Plages/Marine + Fallbacks infaillibles + Images HD)**, exécutez simplement cette commande souveraine :

**1. Génération complète des Textes ET des Cartes HD Météo-France via la compétence `meteo-cnews` (`--generate-maps`) :**
*À lancer lorsque les cartes du jour/lendemain ne sont pas encore générées sur le bureau (`C:\Users\grego\Desktop\cartes_alertes`). Le script va exécuter séquentiellement `generate_meteofrance_maps.py` pour les 14 zones (France + 13 régions métropolitaines, soit 56 cartes au total) avant d'injecter les images et les textes.*
```powershell
python -u C:\Users\grego\Documents\DEV_DIVERS\cnews\scripts\export_all_bulletins.py --day-offset 1 --generate-maps --output BULLETINS_AUTOMATIQUES_VENDREDI_10.json
```

**2. Génération complète et autonome des Textes (si les cartes sont déjà présentes sur le bureau) :**
```powershell
python -u C:\Users\grego\Documents\DEV_DIVERS\cnews\scripts\export_all_bulletins.py --day-offset 1 --output BULLETINS_AUTOMATIQUES_VENDREDI_10.json
```

**Génération en temps réel pour aujourd'hui (`day_offset = 0`) :**
```powershell
python -u C:\Users\grego\Documents\DEV_DIVERS\cnews\scripts\export_all_bulletins.py --day-offset 0 --output BULLETINS_AUTOMATIQUES_AUJOURDHUI.json
```

**Paramètres clés :**
- `--day-offset` : 0 = Aujourd'hui, 1 = Demain (J+1), etc.
- `--generate-maps` : Déclenche automatiquement le moteur de cartes Météo-France (`meteo-cnews`) pour chaque zone avant de produire le JSON.
- `--output` : Nom du fichier de destination (met également à jour `AUTOMATISATION.json`).
- Si Playwright est absent du terminal ou si on ne souhaite que générer/mettre à jour le JSON, le script enregistre directement et proprement le fichier prêt pour l'application sans erreur.

---

## 📋 FLUX COMPLET & ÉTAPES ENREGISTRÉES DU MOTEUR TOUT-EN-UN

Lors de l'appel à `export_all_bulletins.py --day-offset X`, le système exécute **automatiquement et sans intervention humaine** le pipeline en 6 étapes :

```
[Lancement export_all_bulletins.py --day-offset 1]
         │
         ├─ 1. CHARGEMENT CONFIG & CLIENTS
         │      └─ Lecture de `AUTOMATISATION.json` (6 clients avec leurs vraies villes mappées).
         │
         ├─ 2. COMPÉTENCE VIGILANCE (SCRAPING DYNAMIQUE FILTRÉ — EXTRACTION CIBLÉE PAR JOUR)
         │      ├─ Exécution de `get_vigilance_data.py` en coulisses (`fetch_vigilance_and_national_context`).
         │      ├─ Si `day_offset >= 1` : suppression automatique du bulletin national du jour de meteofrance.com (souvent en retard sur J+0).
         │      ├─ **Extraction ciblée** : `re.split()` sur `### Vigilance météo et crues pour` pour isoler uniquement le bloc du jour cible. Évite la troncature aveugle qui coupait les orages/phénomènes du lendemain quand la veille avait 70+ départements en alerte.
         │      └─ Isolation pure et réinjection au prompt IA du **rapport PDF J+2 à J+7** (`=== TENDANCE PROCHAINS JOURS ===`) et de la **liste officielle des départements en Vigilance Orange/Jaune** (`=== VIGILANCE DÉPARTEMENTALE OFFICIELLE ===`).
         │
         ├─ 3. PRIORITIZATION DES CSV MÉTÉO-FRANCE & ARRONDIS
         │      ├─ Lecture prioritaire de `C:\Users\grego\Desktop\cartes_alertes\meteofrance_daily_forecast*.csv`.
         │      └─ Températures officielles et arrondies à l'entier exact (`int(round(...))`). Fallback Open-Meteo pour les villes non Météo-France.
         │
         ├─ 4. RÉDACTION SYNOPTIQUE D'EXPERT (IA OU DÉTERMINISTE LOCAL)
         │      ├─ Application des `CONSIGNES ABSOLUES DE CHEF PRÉVISIONNISTE` (causalité synoptique, dorsale/talweg/marais barométrique, étage des nuages, brises côtières vs foehn/reliefs).
         │      ├─ Double vérification : si l'IA hallucine la date ou omet un champ, remplacement instantané par `generate_local_fallback_texts()`.
         │      └─ Dynamisation des blocs `recordsRaw` (Phénomènes marquants) et `mountain` (Météo montagne) pour Europe 1.
         │
         ├─ 5. INJECTION DES CARTES MÉTÉO HD (COMPÉTENCE METEO-CNEWS)
         │      └─ Assignation des cartes générées aux champs `summaryMapMorningUrl1` et `summaryMapAfternoonUrl1` selon `region_mapping` (`france_pictos`, `hdf`, `naq`, `normandie`).
         │
         ├─ 5bis. DÉCLENCHEMENT DE VISIO-PRÉVISION (TRANSITION IMMÉDIATE)
         │      ├─ Dès que le programme de génération de base de Kappa se termine, **la compétence Visio-Prévision prend immédiatement le relais**.
         │      ├─ Visio-Prévision analyse toutes les cartes du dossier `C:\Users\grego\Desktop\cartes_alertes` dans l'ordre chronologique.
         │      ├─ Elle rédige les prévisions textuelles (un paragraphe par période, pas de mot "carte", "bulletin", "plateau").
         │      └─ Ces commentaires sont réinjectés directement dans les fichiers de l'outil Kappa (ex: `inject_bulletin_texts.py` ou les JSON correspondants comme `BULLETINS_AUTOMATIQUES_SAMEDI_11.json`).
         │
         └─ 6. SAUVEGARDE ET SYNCHRONISATION DU JSON
                └─ Export final et synchronisation globale de `BULLETINS_AUTOMATIQUES_...json` et `AUTOMATISATION.json`.
```

---

## ⚙️ CONFIGURATION AUTOMATISATION NOCTURNE

```env
# c:\Users\grego\Documents\DEV_DIVERS\cnews\.env
OPENROUTER_API_KEY=sk-or-v1-...   # DeepSeek via OpenRouter pour les runs sans surveillance
```

Modèle : `deepseek/deepseek-v4-flash` via `ai_helper.py`.

---

## 🔑 FICHIERS CLÉS

| Fichier | Rôle |
|---|---|
| [`scripts/export_all_bulletins.py`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/scripts/export_all_bulletins.py) | Orchestrateur principal — tous les clients |
| [`scripts/inject_bulletin_texts.py`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/scripts/inject_bulletin_texts.py) | Textes météo rédigés par l'assistant |
| [`scripts/fetch_vigilance.py`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/scripts/fetch_vigilance.py) | Vigilance Météo-France temps réel |
| [`scripts/ai_helper.py`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/scripts/ai_helper.py) | IA autonome (OpenRouter/DeepSeek) |
| [`scripts/auto_bulletin.py`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/scripts/auto_bulletin.py) | Export client unique |
| [`.env`](file:///c:/Users/grego/Documents/DEV_DIVERS/cnews/.env) | Clé API OpenRouter |

---

## 📨 PROTOCOLE D'ENVOI D'E-MAIL & PACKAGING VIDÉO (CNEWS PATRICK)

Le script `cnews/scripts/send_cnews_email.py` gère l'assemblage final, le packaging des vidéos pour Patrick, la récupération des prévisions météo et l'envoi de l'e-mail avec des sécurités anti-spam.

### 1. Structure du Nommage des Fichiers (Date Cible J+1)
Afin d'éviter tout écrasement ou confusion, tous les livrables générés intègrent la date cible du bulletin (demain, au format `_YYYY_MM_DD`) dans leur nom de fichier :
- **Vidéos** : `bulletin_france_pictos_patrick_landscape_YYYY_MM_DD.mp4`, etc.
- **Archive ZIP** : `bulletins_cnews_patrick_YYYY_MM_DD.zip`

### 2. Contenu et Mise en Page de l'E-mail
L'e-mail est formaté en HTML épuré et s'organise en deux blocs géographiques distincts pour une lecture directe :
- **Bloc 1 : Hauts-de-France**
  - Le texte d'accompagnement pour les réseaux sociaux (généré dynamiquement avec la date de publication et la date cible).
  - Un résumé complet d'environ 3 à 4 lignes (80 à 100 mots) des prévisions régionales pour demain (rédigé par l'IA via OpenRouter/DeepSeek).
- **Bloc 2 : France**
  - Le texte d'accompagnement pour les réseaux sociaux.
  - Un résumé complet d'environ 3 à 4 lignes (80 à 100 mots) des prévisions nationales pour demain (rédigé par l'IA via OpenRouter/DeepSeek).

### 3. Pièces Jointes Automatiques
Pour accompagner l'envoi des vidéos, le script joint automatiquement les deux cartes de vigilance de la journée au format image dans le mail :
- `vigilance_france.jpg` (provenant de `carte_vigilance_france_pictos.jpg`)
- `vigilance_hauts_de_france.jpg` (provenant de `carte_vigilance_hdf.jpg`)

### 4. Configuration Anti-Spam
- **Expéditeur** : `Meteo Climat Pro`
- **Reply-To** : `gregory.langlet@sfr.fr`
- **Headers** : Ajout du header `X-Mailer: Python`
- **Sujets** : Format épuré du sujet pour éviter d'être bloqué (ex: `Dossier du mardi 14 juillet 2026`).

---

## ☁️ AUTOMATISATION CLOUD (GITHUB ACTIONS) - LEÇONS APPRISES & RETOURS D'EXPÉRIENCE

1. **Démarrage de Chrome Headless sur Linux (GHA)** :
   - Par défaut, Chrome Headless échoue à démarrer sous Linux GHA. Il est impératif de configurer les arguments de Chrome avec `--no-sandbox` et `--disable-dev-shm-usage` pour éviter les crashes silencieux et les timeouts de capture d'écran.
2. **Gestion Dynamique des Chemins (Windows / GHA)** :
   - Les dossiers comme `cartes_alertes` ou les fichiers CSV ne doivent jamais être codés en dur vers `~\Desktop\cartes_alertes` dans le code. Utiliser des chemins dynamiques qui cherchent en priorité dans le dossier relatif du dépôt, avec un fallback vers le Bureau local Windows de l'utilisateur.
3. **Limitation de Taux (Rate Limiting) de l'API Open-Meteo** :
   - Les adresses IP des serveurs cloud de GitHub Actions sont fortement bridées par l'API gratuite Open-Meteo. Faire des requêtes séquentielles dans une boucle pour 39 villes provoque systématiquement des échecs d'établissement de liaison SSL (`<urlopen error _ssl.c:999: The handshake operation timed out>`).
   - **Solution** : Toujours utiliser des requêtes groupées (Batch queries) en passant les latitudes et longitudes séparées par des virgules pour récupérer toutes les données en un seul appel HTTP. Cela élimine les erreurs et accélère l'exécution d'un facteur 10.
4. **Dépendances d'Image manquantes (Pillow)** :
   - L'environnement virtuel GHA requiert que toutes les bibliothèques d'imagerie (comme `pillow` pour l'appel de `capture_and_compose_forets` / `PIL`) soient spécifiées dans `requirements.txt`.
5. **Confidentialité et Visibilité des Dépôts** :
   - Si les destinataires des mails (comme Patrick ou Charlotte) ont besoin de télécharger le fichier ZIP via le lien direct sans posséder de compte GitHub ou sans y être connectés, le dépôt hébergeant le ZIP doit être configuré en **PUBLIC**. Les secrets sensibles (mots de passe, clés d'API) restent sécurisés dans les secrets d'action GitHub.

