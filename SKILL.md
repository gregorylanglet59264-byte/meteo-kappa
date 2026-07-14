---
name: meteo-cnews
description: Génère et met à jour automatiquement les cartes météo HD (Matin, Après-midi, Soirée) nationales (J+7) ou régionales (J+2) et les rapports CSV correspondants pour CNews à partir de l'API de Météo-France.
---

# 📺 Routine de Mise à jour des Cartes et CSV Météo CNews

Ce skill s'active dès que l'utilisateur demande de mettre à jour ses cartes météo (nationales ou régionales), d'actualiser les prévisions de communes, ou de lancer le script de génération.

## 🎛️ MENU INTERACTIF DE SÉLECTION (DÉCLENCHEMENT PRINCIPAL)

Si l'utilisateur mentionne la phrase "competence meteo cnews", "menu", "affiche le menu" ou "menu cartes", vous devez présenter un menu interactif en appelant l'outil `ask_question`.

### Flux d'interaction avec `ask_question` :
1. **Étape 1 : Appel de la Question 1 uniquement :**
   - **Question 1 :** "Quelle zone souhaitez-vous mettre a jour ?"
     - **Options :**
     - "Pack CNews (France & Hauts-de-France - 4 jours - Paysage & TikTok)"
     - "Pack CNews Patrick (France & Hauts-de-France - 5 jours - Paysage & TikTok)"
     - "Indicateur Thermique National (ITN)"
     - "France entiere"
     - "Hauts-de-France"
     - "Normandie"
     - "Ile-de-France"
     - "Grand Est"
     - "Auvergne-Rhone-Alpes"
     - "Nouvelle-Aquitaine"
     - "Occitanie"
     - "PACA"
     - "Bourgogne-Franche-Comte"
     - "Bretagne"
     - "Pays de la Loire"
     - "Centre-Val de Loire"
     - "Corse"

2. **Étape 2 : Branchement selon le choix :**
   *   **Si l'option "Pack CNews (France & Hauts-de-France - 4 jours - Paysage & TikTok)" est choisie :**
       Ne posez pas d'autres questions. Exécutez immédiatement la génération de cartes ET de vidéos (compilateur vidéo) pour la zone `france_pictos` (en format `landscape` et `portrait` sur 4 jours à partir de demain), puis pour la zone `hdf` (en format `landscape` et `portrait` sur 4 jours à partir de demain).
   *   **Si l'option "Pack CNews Patrick (France & Hauts-de-France - 5 jours - Paysage & TikTok)" est choisie :**
       Ne posez pas d'autres questions. Exécutez immédiatement la génération de cartes ET de vidéos pour la zone `france_pictos` (en format `landscape` et `portrait` sur 5 jours, avec option `--patrick`), puis pour la zone `hdf` (en format `landscape` et `portrait` sur 5 jours, avec option `--patrick`).
   *   **Si l'option "Indicateur Thermique National (ITN)" est choisie :**
       Ne posez pas d'autres questions. Exécutez immédiatement le script de l'Indicateur Thermique National (`generate_itn_forecast.py`) pour générer les images TV (paysage) et TikTok (portrait), le zoom, l'historique annuel, le dashboard HTML et le CSV. Confirmez que cet indicateur est complètement indépendant et n'est jamais incorporé dans les bulletins vidéos quotidiens standard ou Patrick.
   *   **Sinon (toute autre zone sélectionnée) :**
       Appelez une seconde fois `ask_question` avec les questions suivantes pour affiner la demande :
       - ... (garder le reste identique) ...
       - **Question 2 :** "Combien de jours de previsions souhaitez-vous generer ?"
         - **is_multi_select :** `false`
         - **Options :**
           - "Par defaut (8 jours pour la France, 3 pour les regions)"
           - "3 jours (J+2)"
           - "4 jours (J+3)"
           - "5 jours (J+4)"
           - "8 jours (J+7)"
       - **Question 3 :** "Quel format de rendu souhaitez-vous obtenir ?"
         - **is_multi_select :** `false`
         - **Options :**
           - "Cartes images uniquement (standard)"
           - "Video Bulletin Paysage (TV 16:9)"
           - "Video Bulletin Vertical (TikTok 9:16)"
           - "Bulletin Patrick - Paysage (TV 16:9)"
           - "Bulletin Patrick - Vertical (TikTok 9:16)"
       - **Question 4 :** "Activer la coloration specifique des temperatures (Bleu min / Rouge max / Noir reste) ?"
         - **is_multi_select :** `false`
         - **Options :**
           - "Non, garder le degrade standard"
           - "Oui, activer la coloration specifique (Option CNews)"

Une fois les choix soumis, exécutez les scripts Python avec les arguments correspondants :
*   Si **Pack CNews standard** : générez `france_pictos` puis `hdf` (chaque zone en 4 jours, format `landscape` et `portrait`).
*   Si **Pack CNews Patrick** : générez `france_pictos` puis `hdf` (chaque zone en 5 jours, format `landscape` et `portrait`, option `--patrick`). **Dès que ces 4 bulletins vidéo sont générés, compressez-les impérativement ensemble dans un fichier ZIP nommé `bulletins_cnews_patrick_YYYY_MM_DD.zip` dans `C:\Users\grego\Desktop\cartes_alertes\` (où YYYY_MM_DD correspond à la date du lendemain, cible du bulletin).**
*   Si **Indicateur Thermique National (ITN)** : exécutez uniquement `generate_itn_forecast.py`.
*   Sinon, exécutez pour la zone choisie :
    *   Si **Images uniquement** : exécutez uniquement le script de rendu d'images (`generate_meteofrance_maps.py`). Ajoutez `--temp-highlight` si l'utilisateur a choisi l'option à la Question 4.
    *   Si **Vidéo standard** ("Video Bulletin Paysage" ou "Vertical") : exécutez le compilateur vidéo (`generate_video_bulletin.py`). Ajoutez `--temp-highlight` si l'utilisateur a choisi l'option à la Question 4.
    *   Si **Bulletin Patrick** ("Bulletin Patrick - Paysage" ou "Vertical") : exécutez le compilateur vidéo (`generate_video_bulletin.py`) avec l'argument `--patrick` (et l'orientation correspondante). L'option `--patrick` active automatiquement la coloration spécifique des températures (Bleu min / Rouge max / Noir reste) et le rendu des cartes de précipitations et rafales J+1.

## 💡 LOGIQUE D'AFFICHAGE DES PICTOGRAMMES (OPTION 3 : FENÊTRE DE 3 HEURES)

L'application `index.html` est configurée pour utiliser la méthode d'évaluation par **fenêtre de 3 heures** (Option 3) :

### 1. Sélection temporelle (Fenêtre de 3 heures)
On analyse le créneau d'activité clé de chaque période :
*   **Matin (8h - 10h) :** Évaluation des créneaux de 8h, 9h et 10h.
*   **Après-midi (14h - 16h) :** Évaluation des créneaux de 14h, 15h et 16h.
*   **Soirée (19h - 21h) :** Évaluation des créneaux de 19h, 20h et 21h.

**Règle de choix :**
*   S'il y a un **phénomène marquant/sévère (code >= 6 : Orage, Neige, Pluie forte, Pluie faible, Averses, Brouillard)** pendant au moins une heure dans cette fenêtre, il est prioritaire et affiché (en choisissant le plus intense en cas de cumul).
*   S'il n'y a aucun phénomène marquant (seulement Soleil, Soleil voilé, Peu nuageux et Nuageux), c'est la **météo majoritaire** (mode) qui est affichée.

### 2. Lissage spatial (Cohérence de voisinage) - SUPPRIMÉ
*   **NOTE :** Le lissage spatial automatique de 150 km a été supprimé à la demande de l'utilisateur afin de préserver la précision exacte des prévisions par ville sans perturbation visuelle induite par les cellules voisines.

### 3. Correspondance des pictogrammes Météo-France → CNews
Les correspondances clés suivantes ont été validées pour l'antenne :
*   **Météo-France "Peu nuageux" (`p1bis`)** ➡️ Mappé sur le pictogramme **`P2` (Peu nuageux)** (code `1`).
*   **Météo-France "Éclaircies" (`p2`)** ➡️ Mappé sur le pictogramme **`P8` (Nuageux)** (code `2`).
*   **Météo-France "Ciel voilé" (`p4`)** ➡️ Mappé sur le pictogramme **`P6` (Soleil voilé)** (code `5`).

## 🧭 ÉTAPE 1 : EXÉCUTION DU SCRIPT DE GÉNÉRATION

Exécutez le script Python autonome en passant les paramètres adéquats en fonction de la demande de l'utilisateur :

*   **Options globales importantes :**
    *   `--start-tomorrow` : Commence les prévisions à partir de demain (J+1) au lieu d'aujourd'hui (J0). **Activée TOUJOURS par défaut** (valeur permanente). Les bulletins sont systématiquement préparés pour le lendemain.
    *   `--orientation` : Définit le format d'image de sortie. Valeurs possibles :
        *   `landscape` (par défaut) : Format TV classique **16:9** (1920x1080).
        *   `portrait` : Format vertical de story **9:16** (1080x1920). Les fichiers sont suffixés par `_portrait.jpg`.
        *   `square` : Format carré **1:1** pour les réseaux sociaux type Facebook (1080x1080). Les fichiers sont suffixés par `_square.jpg`.
    *   `--patrick` : Génère le **Bulletin Patrick** (option alternative incluant les cartes de cumuls de précipitations et de rafales maximales de vent pour J+1, suivies des après-midi de J+2 à J+4, et de l'éphéméride).
    *   **Anti-Cache (Cache-Buster)** : Le script intègre automatiquement un paramètre timestamp (`&_=<timestamp>`) à chaque requête API pour contourner le cache CDN de Météo-France et garantir la récupération des prévisions les plus fraîches et à jour du site officiel.

*   **Pour la France entière (National, par défaut) - Durée : 8 jours (J+7) :**
    *   **Images Paysage (TV) :**
        ```powershell
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py" --zone france_pictos --days 8 --orientation landscape
        ```
    *   **Images Portrait (TikTok) :**
        ```powershell
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py" --zone france_pictos --days 8 --orientation portrait
        ```
    *   **Vidéo Paysage (TV) :**
        ```powershell
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py" --zone france_pictos --days 8 --orientation landscape
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_video_bulletin.py" --zone france_pictos --days 8 --orientation landscape
        ```
    *   **Vidéo Portrait (TikTok) :**
        ```powershell
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py" --zone france_pictos --days 8 --orientation portrait
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_video_bulletin.py" --zone france_pictos --days 8 --orientation portrait
        ```

*   **Pour une région (ex: Hauts-de-France, Normandie, PACA...) - Durée : 3 jours par défaut (J+2) :**
    Identifiez le code de la zone (ex: `hdf` pour Hauts-de-France, `normandie`, `paca`, etc.) et lancez les scripts correspondants :
    *   **Images Paysage (TV) :**
        ```powershell
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py" --zone hdf --days 3 --orientation landscape
        ```
    *   **Images Portrait (TikTok) :**
        ```powershell
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py" --zone hdf --days 3 --orientation portrait
        ```
    *   **Vidéo Paysage (TV) :**
        ```powershell
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py" --zone hdf --days 3 --orientation landscape
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_video_bulletin.py" --zone hdf --days 3 --orientation landscape
        ```
    *   **Vidéo Portrait (TikTok) :**
        ```powershell
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py" --zone hdf --days 3 --orientation portrait
        python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_video_bulletin.py" --zone hdf --days 3 --orientation portrait
        ```

## 🎬 PARAMÈTRES DU COMPILATEUR VIDÉO (generate_video_bulletin.py)

### 🎙️ MODE BULLETIN PATRICK (`--patrick`)

Le mode **Bulletin Patrick** est une option spéciale destinée aux présentations antenne. Il s'active en passant `--patrick` au compilateur vidéo (ou au script de cartes).

**Ce que `--patrick` active automatiquement :**
1. **Coloration spécifique des températures** : fond de carte **noir** (au lieu du dégradé standard), températures minimales en **bleu**, températures maximales en **rouge**, autres valeurs en **blanc**. Inutile d'ajouter `--temp-highlight` séparément.
2. **Cartes supplémentaires J+1** : génération automatique de deux cartes additionnelles :
   - `carte_J1_precip.jpg` (régionale : `carte_{zone}_J1_precip.jpg`) : cumuls de précipitations.
   - `carte_J1_gusts.jpg` (régionale : `carte_{zone}_J1_gusts.jpg`) : rafales maximales de vent.
3. **Séquence de diapositives** :
   - J+1 Matin → J+1 Après-midi → J+1 Précipitations → J+1 Rafales → J+2 Après-midi → J+3 Après-midi → J+4 Après-midi → Éphéméride.
4. **Vigilance intégrée** (voir section précédente).

**Commandes Patrick :**
```powershell
# National France - Bulletin Patrick Paysage
python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_video_bulletin.py" --zone france_pictos --patrick

# Hauts-de-France - Bulletin Patrick Paysage
python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_video_bulletin.py" --zone hdf --patrick

# Avec --skip-maps (si les cartes viennent d'être générées)
python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_video_bulletin.py" --zone france_pictos --patrick --skip-maps
```

**Fichiers produits (Bulletin Patrick) :**
- `C:\Users\grego\Desktop\cartes_alertes\bulletin_france_pictos_patrick_landscape_YYYY_MM_DD.mp4`
- `C:\Users\grego\Desktop\cartes_alertes\bulletin_hdf_patrick_landscape_YYYY_MM_DD.mp4`

> ⚠️ **Executions simultanées** : Les répertoires temporaires de transitions sont isolés par PID (`temp_transitions_period_{PID}/`) pour éviter tout conflit de verrouillage Chrome si plusieurs compilations sont lancées en parallèle.

---

Le script `generate_video_bulletin.py` assemble automatiquement le bulletin :

### Structure du bulletin vidéo
1. **Jingle d'introduction** : `jingle_facebook.mp4` (paysage) ou `jingle_tiktok.mp4` (portrait)
   - Le noir de départ (0.5s) est coupé automatiquement.
   - **Démarrage instantané** : aucun fondu entrant vidéo/audio au début (le bulletin s'ouvre directement sur le jingle net à 0.0s).
   - Volume a 100 % du fichier original (`volume=1.0`) avec mixeur `normalize=0` pour empêcher l'atténuation.
   - **Pour les bulletins régionaux** : le nom de la région s'affiche automatiquement en haut du jingle (à `Y=130` en paysage, et `Y=80` en portrait pour éviter de chevaucher le logo flouté d'arrière-plan). Écrit en grand via `drawtext` FFmpeg avec fond bleu opaque à 75 % (`boxcolor=0x050F2D@0.75` et `boxborderw=30`).
   - **Pour le bulletin national** (`france_pictos`) : le texte `"BULLETIN NATIONAL"` s'affiche automatiquement en haut du jingle (mêmes coordonnées et styles que pour les régions).
2. **Carte de vigilance météo (J+1)** (7.0s) : **Placée obligatoirement juste après le jingle d'introduction et juste avant la première plaque de transition de prévision** (pour la France et chaque région). Composée sur le fond officiel `VIGILANCE PAYSAGE.png` ou `VIGILANCE PORTRAIT.png` avec fondu de transition.
   - **IMPORTANT** : Les fonds officiels de vigilance sont **impérativement** `VIGILANCE PAYSAGE.png` (16:9) et `VIGILANCE PORTRAIT.png` (9:16), situés dans `C:\Users\grego\Desktop\cartes_alertes\A_CONSERVER_ABSOLUMENT\`. Ne jamais substituer d'autres images pour ces deux fichiers.
   - **Vigilance nationale** (zone `france_pictos`) : titre de la plaque de transition = `"VIGILANCE MÉTÉO"` / sous-titre = `"MÉTÉO-FRANCE"`. URL : `https://minisite-douai.vercel.app/vigilance?period=1`
   - **Vigilance régionale** (toute autre zone, ex: `hdf`) : titre = `"VIGILANCE RÉGIONALE"` / sous-titre = nom de la région (ex: `"HAUTS-DE-FRANCE"`). URL : `https://minisite-douai.vercel.app/vigilance?period=1&region=<CODE_REGION>` (ex: `region=HDF`)
   - La vigilance est capturée **systématiquement à chaque exécution**, même si `--skip-maps` est actif. Elle n'est donc jamais périmée dans la vidéo finale.
3. **Plaques de transition** (3.0s par plaque) : fonds propres d'antenne sans texte pré-enregistré (`avant previ 16.png` pour le format paysage 1448x1086, et `avant previ 17.png` pour le format portrait 1086x1448).
   - **Textes dynamiques et taille dynamique** : date écrite en blanc (Arial Narrow Bold, taille 60 en paysage / 50 en portrait) et période écrite en jaune/doré (taille dynamique basée sur la longueur de la chaîne pour éviter tout débordement, par ex. "APRÈS-MIDI" ou "L'ÉPHÉMÉRIDE").
   - **Gestion du décalage temporel (J+1)** : Le compilateur recherche en priorité la carte nommée en `J{d+1}` (mode `--start-tomorrow` par défaut) pour l'associer à la date correcte de ce jour (ex: la date de demain J+1 pour le premier jour de prévisions). En l'absence de `J{d+1}`, il se replie sur `J{d}`. Cela garantit une synchronisation parfaite et élimine tout décalage d'une journée entre la plaque de transition et la carte de prévisions.
   - **Effet zoom propre sur le texte uniquement** : pour éliminer toute micro-vibration ou scintillement induit par le filtre zoompan FFmpeg sur les lignes géographiques de fond, le compilateur génère une séquence d'images (72 frames à 24 fps) en zoomant exclusivement le calque de texte PIL (zoom de 1.0 à 1.04 en 3.0s) posé sur l'image de fond statique.
4. **Cartes de prévision** (7.0s par carte) : 1s fondu entrée + 5s affichage stable + 1s fondu sortie.
   - **Optimisations Portrait (TikTok)** :
     - Marges de calcul Leaflet réduites à `[60, 10, 60, 10]` pour toutes les zones et régions afin de zoomer au maximum sur la carte en format vertical (portrait).
     - Logo "Météo Climat Pro" conservé en haut à gauche mais taille réduite à `80px` pour ne pas obstruer le nord de la région.
     - Pictogrammes agrandis (échelle `1.4` / `1.45`) et températures agrandies (`48px` / `68px`) pour une lisibilité maximale.
5. **Carte d'éphéméride** (toujours en dernier, 7.0s)
6. **Musique de fond** : `musique de fond.mp3`
   - Volume a **25 %** (`volume=0.25`) — bulletin automatique sans voix off.
   - Démarre en crossfade avec la fin du jingle.
   - Fondu sortant de 3.0s en fin de bulletin.

### Transitions entre elements
- Entre jingle et diaporama : fondu (`fade`) de 1.0s
- Entre chaque element du diaporama : fondu (`fade`) de 1.0s

### Fichiers produits
- `C:\Users\grego\Desktop\cartes_alertes\bulletin_{zone}_landscape.mp4`
- `C:\Users\grego\Desktop\cartes_alertes\bulletin_{zone}_portrait.mp4`
- Bulletin Patrick : `C:\Users\grego\Desktop\cartes_alertes\bulletin_{zone}_patrick_landscape_YYYY_MM_DD.mp4` et `bulletin_{zone}_patrick_portrait_YYYY_MM_DD.mp4`
- **Archive ZIP Patrick** : `C:\Users\grego\Desktop\cartes_alertes\bulletins_cnews_patrick_YYYY_MM_DD.zip` (regroupe impérativement les 4 bulletins vidéo générés lors de l'exécution du Pack Patrick avec la date cible J+1).

## 🔍 ÉTAPE 2 : VÉRIFICATION ET VALIDATION DES LIVRABLES

Une fois l'exécution terminée, vérifiez la présence et la taille des fichiers générés dans le dossier de destination de l'utilisateur :
*   **Dossier cible :** `C:\Users\grego\Desktop\cartes_alertes\`
*   **Fichiers attendus :**
    - Pour la France : `carte_J0_matin{suffix}.jpg` à `carte_J7_soiree{suffix}.jpg` (où suffixe est vide, `_portrait` ou `_square`) et les CSV standards.
    - Pour une région (ex: `hdf`) : `carte_hdf_J0_matin{suffix}.jpg` à `carte_hdf_J2_soiree{suffix}.jpg` (9 cartes au total) et les CSV suffixés.

## ✍️ ÉTAPE 3 : CONFIRMATION À L'UTILISATEUR

Rédigez un court message de confirmation en français pour indiquer que les cartes régionales ou nationales ont été générées avec succès dans le dossier `cartes_alertes` sur le Bureau.

## ✅ VISUELS ET CONVERSIONS VALIDÉS (RÉFÉRENCE DÉFINITIVE)

Tous les bulletins vidéo (nationaux et régionaux) et cartes images associés sont validés avec la charte graphique suivante :
1. **Plaques de transition et ressources** : 
   - Toutes les ressources indispensables (templates `007` / `008`, logo, jingles, musique) sont centralisées dans le sous-dossier **`cartes_alertes/A_CONSERVER_ABSOLUMENT/`**. Les fichiers générés sont exportés à la racine de `cartes_alertes/`.
   - **Paysage** : Utilisation de **`AVANT PREVI 008.png`** avec effacement automatique de la ligne jaune en Python.
   - **Portrait (TikTok)** : Utilisation de **`AVANT PREVI 007.png`** avec effacement automatique de la ligne jaune en Python (ce qui évite tout recadrage tronquant la Bretagne ou l'Est de la France).
2. **Animation de zoom** : Zoom doux sur le texte seul (de 1.0 à 1.04 en 72 images) réalisé par composition d'un calque texte PIL transparent au-dessus de l'image de fond statique (sans aucun tremblement sub-pixel de FFmpeg zoompan).
3. **Fondu de transition (xfade)** : Durée calée sur **0,4 seconde** pour assurer un enchaînement rythmé et éliminer les chevauchements de textes prolongés au-dessus des cartes de prévisions.
4. **Dimensionnement dynamique** : Fontes Arial Narrow Bold adaptées automatiquement pour éviter les débordements des noms de zones ou de périodes longues ("APRÈS-MIDI").

## 🛠️ RÉSOLUTION DES ANOMALIES TECHNIQUES

1. **Erreur de capture de la vigilance (dateTitle ReferenceError)** :
   - **Problème** : Lors de l'injection JS via Playwright dans `generate_video_bulletin.py` pour capturer la carte de vigilance (J+1), l'utilisation directe de la variable globale `dateTitle` (absente de la page) levait une exception `ReferenceError: dateTitle is not defined`, annulant le screenshot.
   - **Solution** : Extraire la date du bulletin directement depuis la première ligne du texte de vigilance (`lines[0]` qui commence par `📋 VIGILANCE MÉTÉOROLOGIQUE DU ...`), ce qui évite la dépendance à une variable globale externe.

2. **Absence de vigilance en format Paysage (Responsive Design) et Corse verte/noire** :
   - **Problème** : Le site de vigilance (sur Vercel) utilise des media queries réactives. Sur écran large (1920x1080), le bloc texte descriptif des alertes (`.bulletin-auto-card`) est retiré du DOM, ce qui retournait une chaîne vide et affichait par défaut « Situation calme » à l'antenne. De plus, Corsica étant décalée géographiquement dans l'application Vercel par rapport au template de fond, les départements corses n'ayant pas de vigilance (verts) devenaient transparents et apparaissaient noirs (sur fond de mer).
   - **Solution** : 
     1. Forcer Playwright à charger la page en format Portrait (1080x1920) pour lire le texte, puis redimensionner le viewport à 1920x1080 juste avant la capture Paysage.
     2. Identifier les départements via React Fiber (`__reactFiber` ou `__reactInternalInstance` dans le DOM) pour injecter un attribut `data-dep` (ex: `2A`, `2B`) sur les paths.
     3. Appliquer une règle CSS spécifique pour que les départements `2A` et `2B` verts conservent leur couleur verte d'origine (`#22c55e`) avec contours nets (`#1e293b`), au lieu de devenir transparents.


3. **Verrou et timeout Chrome lors des rendus parallèles (ProcessSingleton) / premier rendu bloqué** :
   - **Problème** : L'utilisation d'un profil Chrome partagé unique (`.chrome_profile`) provoquait des erreurs `ProcessSingleton` (Lock file error 32) si plusieurs rendus s'exécutaient en même temps ou si un processus se fermait lentement. De plus, la création d'un nouveau profil Chrome isolé de zéro ralentissait le premier rendu (J1 matin) à cause de requêtes de fond (GCM, Sync, extensions) provoquant des timeouts (25s) si le serveur local HTTP n'était pas encore pleinement prêt.
   - **Solution** : 
     1. Utiliser un dossier de profil isolé par identifiant de processus (`.chrome_profile_{PID}`) avec nettoyage automatique en fin d'exécution.
     2. Ajouter une pause de sécurité `time.sleep(2.0)` juste après le lancement du serveur HTTP local pour lui donner le temps de se lier au port.
     3. Optimiser les arguments de lancement de Chrome Headless en ajoutant les paramètres de performance : `--disable-background-networking`, `--disable-default-apps`, `--disable-sync`, `--no-first-run`, et `--disable-extensions`.


4. **Horaires d'éphémérides décalés (Heure UTC)** :
   - **Problème** : Météo-France fournit les heures de lever/coucher du soleil en heure UTC (ex: 03:55 au lieu de 05:55 en heure d'été française).
   - **Solution** : Ajout d'une routine de conversion locale automatique `utc_to_paris_local()` via la bibliothèque standard `zoneinfo` de Python 3.9+.

5. **Coordonnées bloquées sur Paris dans le mock de données** :
   - **Problème** : La latitude/longitude dans le mock de données Open-Meteo pour l'application Web était cherchée dans `properties.latitude` (inexistant), ce qui faisait retomber toutes les villes sur Paris. L'identification du chef-lieu régional de l'éphéméride échouait.
   - **Solution** : Extraire les coordonnées depuis le champ racine `geometry.coordinates` (`[longitude, latitude]`) de l'API Météo-France.

## 📊 PHASE 2 : CARTES D'OBSERVATIONS MÉTÉOCIEL (sqlite DB local)

En plus des prévisions Météo-France (Phase 1), le dossier contient la chaîne de production d'observations basées sur la SQLite de MétéoCiel.

### 🧭 Exécution de la Phase 2

```powershell
# Générer le bilan du jour (Landscape & Portrait)
python generate_meteociel_obs_maps.py --date 20260711 --zone france --param bilan_jour --orientation both

# Filtrer par seuil de valeur minimale (ex: Tmax >= 38°C)
python generate_meteociel_obs_maps.py --date 20260711 --zone france --param tmax --min-value 38 --orientation both

# Sélection de période mensuelle (ex: Juillet 2026 complet)
python generate_meteociel_obs_maps.py --month 202607 --zone france --param tmax --orientation both
```

### 🎨 Design Calibré et Validé (Observations)
- **Filtres de carte** : luminosité à `1.25`, contraste à `1.48`, saturation à `1.20` pour un tracé net.
- **Séparateurs** : `2px solid rgba(0, 150, 255, 0.44)`.
- **Alignements** : Ellipsis sur les noms longs de stations (`max-width: 460px` en paysage / `320px` en portrait).
- **Date Pic Période** : affichée sous forme `08/07` à côté de la station pour situer l'événement.
- **Bilan du jour (4 quadrants)** : structure en grille `.bilan-grid` (CSS Grid 2x2 en paysage, 1 colonne en portrait). Les badges `ABS` ou `MENS` s'affichent en haut à droite sans chevaucher les icônes de paramètres.
- **Textes des quadrants (Bilan du jour)** : Remplacement de "Plus fort cumul de pluie" par `CUMUL DE PRÉCIPITATIONS` et de "Plus forte rafale" par `RAFALES MAXIMALES`.
- **Centrage & Auto-fit des stations** : Alignement vertical et horizontal parfait au centre de chaque quadrant. La taille de la police de la ville s'ajuste dynamiquement via JavaScript pour s'afficher entièrement sur une seule ligne.
- **Icônes thermomètres** : Utilisation d'un thermomètre rouge (`#ff1a1a`) pour la température maximale et d'un thermomètre bleu (`#00eaff`) pour la température minimale.
- **Nom de zone géant (haut-droite)** : Affiché à `top: 150px` avec une taille maximale de base de `110px` (adaptée de 65px à 95px selon la longueur, ex: `NORD (59)` ou `NORD-PAS-DE-CALAIS`) pour ne pas mordre sur le titre principal.
- **Taille de police du titre principal (`.header-title`)** : Réduite de `100px` à `80px` en paysage (et de `80px` à `65px` en portrait) pour éliminer tout chevauchement avec la table de droite.
- **Largeur du tableau en paysage (`.rows-container-wrapper`)** : Réduite de `1000px` à `950px` pour laisser plus de marge horizontale pour les titres longs.
- **Libellé de vent fixe** : Le paramètre de vent (`gust`) affiche toujours uniformément **`RAFALES MAXIMALES`** en en-tête de carte (la logique de modification dynamique *"Coup de vent"* ou *"Violentes rafales"* a été retirée).
- **Pas de bannière de records** : La ligne comptabilisant les records en bas des images est entièrement masquée/supprimée.
- **Organisation du ZIP (4 dossiers)** : Les fichiers sont classés tous les soirs dans 4 sous-dossiers : `France/`, `Regions/`, `Nord-Pas-de-Calais/` et `Departements/` (contenant les 95 départements).
- **Optimisation de volume** : Pour les 95 départements, seule la carte `bilan_jour` (extrêmes) est générée. Les cartes individuelles de Tmax, Tmin, Pluie et Vent ne sont calculées que pour la France entière, les 13 régions et le Nord-Pas-de-Calais, ce qui limite le pack à **340 cartes** au lieu de 1 090.

### 📱 Tableaux de bord de secours (GitHub Pages)
Pour piloter manuellement et déclencher les workflows en direct :
*   **Dashboard Grégory (toutes les automatisations) :** `https://gregorylanglet59264-byte.github.io/meteo-kappa/dashboard_declencheur.html`
*   **Dashboard Patrick (uniquement les 6 partagées) :** `https://gregorylanglet59264-byte.github.io/meteo-kappa/dashboard_patrick.html`
*   **Auto-sauvegarde :** Le champ texte enregistre et applique automatiquement la clé d'accès (PAT) lors de l'appui sur "Lancer". Les dashboards utilisent les en-têtes standardisés `Authorization: Bearer`.

## 🌡️ PHASE 3 : INDICATEUR THERMIQUE NATIONAL (ITN)

Le script autonome `generate_itn_forecast.py` calcule et trace les prévisions quotidiennes de l'Indicateur Thermique National — la **température moyenne** (Tm = (Tmin + Tmax) / 2) calculée sur **30 stations synoptiques officielles de Météo-France**.

> [!IMPORTANT]
> Cet indicateur est **100 % indépendant** des bulletins vidéo quotidiens (standard ou Patrick). Il ne doit jamais figurer dans les vidéos TV ou TikTok générées pour CNews.

---

### ⚙️ CHAÎNE DE DONNÉES (Sources vérifiées)

#### 1. 📡 Prévisions de températures → **API Météo-France (token mfsession)**
Les prévisions des 10 à 14 prochains jours sont récupérées via le **même token Météo-France** (`mfsession`) que celui utilisé par les bulletins vidéo (`generate_meteofrance_maps.py`) :
- Token obtenu automatiquement depuis `https://vigilance.meteofrance.fr/fr`
- Les **30 stations ITN** sont interrogées une à une sur `https://rwg.meteofrance.com/internet2018client/2.0/forecast`
- La réponse fournit `properties.daily_forecast[].T_min` et `T_max` pour chaque jour
- **Open-Meteo n'est pas utilisé** — toutes les prévisions viennent de Météo-France

#### 2. 🌡️ Normales 1991-2020 et observations → **Infoclimat**
Les normales de référence et les observations réelles de l'année en cours proviennent d'Infoclimat :
```
https://www.infoclimat.fr/climato/indicateur_national_xhr.php?years[]=ANNEE&normes=1991-2020&indic=mf
```
- Champs utilisés : `tm8110` (moyenne), `tn8110` (minimale), `tx8110` (maximale) — **à 2 décimales impérativement**
- Sauvegardés localement dans `normales_indicateur_national.json` via `download_normals.py`
- **Exemple vérifié** : 14 octobre → Normale Tm = **14,18°C** (soit 14 dix-huit)

#### 3. 📊 Calcul de l'anomalie
```
ITN prévu (jour J)  = Moyenne de (T_min + T_max) / 2  sur les 30 stations (Météo-France)
Anomalie            = ITN prévu − Normale tm8110 Infoclimat 1991-2020
```

#### 4. 🗺️ Périmètre des 30 stations officielles
Abbeville, Bâle-Mulhouse, Bordeaux, Boulogne-sur-Mer, Bourges, Bourg-Saint-Maurice, Brest, Caen, Clermont-Ferrand, Dijon, Le Luc, Lille, Limoges, Lyon, Marseille, Montpellier, Nancy, Nantes, Nice, Nîmes, Orléans, Paris, Perpignan, Poitiers, Reims, Rennes, Strasbourg, Tarbes, Toulouse et Tours.

---

### 📦 LIVRABLES GÉNÉRÉS À CHAQUE EXÉCUTION

| Fichier | Emplacement | Description |
|---|---|---|
| `indicateur_thermique_tv.png` | `Desktop/cartes_alertes/` | Graphique TV Paysage 1920×1080 (fond ITN PAYSAGE.png) |
| `indicateur_thermique_tv_YYYY_MM_DD.png` | `Desktop/` | Copie datée du graphique TV → **sauvegarde quotidienne automatique** |
| `indicateur_thermique_tiktok.png` | `Desktop/cartes_alertes/` | Graphique Portrait TikTok 1080×1920 (fond ITN TIKTOK.png) |
| `indicateur_thermique_national.png` | `Desktop/cartes_alertes/` | Graphique zoom 14 jours (style standard) |
| `indicateur_thermique_national_annuel.png` | `Desktop/cartes_alertes/` | Suivi annuel 366 jours avec anomalies colorées |
| `indicateur_thermique.html` | `Desktop/cartes_alertes/` | Dashboard HTML interactif Highcharts (glassmorphism) |
| `indicateur_thermique_2026.csv` | `Desktop/` | Export annuel complet (séparateur `;`, décimales `,`, Excel-compatible) |
| `post_indicateur_thermique_YYYY_MM_DD.txt` | `Desktop/` | Article réseaux sociaux rédigé automatiquement (voir ci-dessous) |

> [!NOTE]
> Le fichier CSV `indicateur_thermique_2026.csv` est également conservé précieusement dans :
> - `Desktop/cartes_alertes/A_CONSERVER_ABSOLUMENT/indicateur_thermique_2026.csv`
> - `Documents/METEO_CLIMAT/meteo cnews 2/indicateur_thermique_2026.csv`

---

### 📺 CHARTES GRAPHIQUES TV & TIKTOK

1. **Fonds d'écran officiels** (dans `Desktop/cartes_alertes/A_CONSERVER_ABSOLUMENT/`) :
   - **`ITN PAYSAGE.png`** → format paysage 16:9
   - **`ITN TIKTOK.png`** → format portrait 9:16
   - Ces visuels sont épurés : **aucune carte de France**, fond ciel d'orage et isobares.

2. **Titrage** :
   - Titre : `INDICATEUR THERMIQUE NATIONAL` en jaune `#ffcc00` (Arial Narrow Bold, 62px paysage / 48px portrait), contour noir 3px
   - Sous-titre : `ÉVOLUTION POUR LA PÉRIODE DU [JJ] AU [JJ] [MOIS] [ANNÉE]` en blanc (38px / 30px), contour noir 2px
   - ❌ Aucun rectangle d'arrière-plan · ❌ Aucune étiquette "Canicule Durable" ou "Forte Chaleur"
   - Libellé `"moyenne"` en gris à gauche, calé sur la ligne des normales

3. **Palette d'anomalies** (aire entre courbe prévue et ligne des normales, 70% opacité) :
   - 🔴 **Rouge corail** `#f45b69` → prévision au-dessus de la normale
   - 🔵 **Bleu cobalt** `#3b82f6` → prévision en dessous de la normale
   - Bulles : pic chaud et dernier point en rouge corail, minimum en bleu cobalt

---

### 📝 ARTICLE RÉSEAUX SOCIAUX — BASÉ SUR LA COMPÉTENCE VIGILANCE

> [!IMPORTANT]
> Le texte de l'article d'accompagnement est **entièrement rédigé à partir de la compétence vigilance** (`get_vigilance_data.py`). Ce n'est pas un texte générique fixe — il reprend les vrais bulletins officiels du jour.

La fonction `generate_social_post(itn_data)` dans `generate_itn_forecast.py` appelle automatiquement **3 sources de la compétence vigilance** :

| Source vigilance | Contenu récupéré | Utilisation dans l'article |
|---|---|---|
| `get_national_forecast()` | Titre + corps du bulletin national du jour | Accroche + section "Situation du jour" |
| `get_pdf_info_and_images()` | Commentaires PDF J+2/J+3 et J+4/J+7 | Sections évolution orageuse + tendance fin d'échéance |
| `get_departments_vigilance()` | Départements Orange/Rouge par phénomène | Bloc alerte ⚠️ avec comptage dynamique |

**Logique horaire de la vigilance** :
- Avant 16h30 → carte du **jour** (`aujourdhui`)
- Après 16h30 → carte du **lendemain** (`demain`)

**Fichier de sortie** : `Desktop/post_indicateur_thermique_YYYY_MM_DD.txt` (UTF-8, texte brut, sans Markdown)

#### Règles de rédaction (IMPORTANTES)
- ❌ Ne jamais répéter « indicateur thermique national » — varier : « prévisions de températures », « température moyenne nationale », « le thermomètre »
- ❌ Ne jamais citer « Météo-France » → remplacer par « les prévisionnistes »
- ✅ Hashtags dynamiques : `#Canicule` si vigilance canicule active, `#Orages` si orages détectés dans les textes

> [!NOTE]
> Si la compétence vigilance est indisponible (réseau coupé, erreur), la fonction continue silencieusement sans texte vigilance — les graphiques sont toujours générés.

---

### 🧭 COMMANDE D'EXÉCUTION

```powershell
python "C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_itn_forecast.py"
```

Ou depuis le menu interactif de la compétence → option **« Indicateur Thermique National (ITN) »**.

