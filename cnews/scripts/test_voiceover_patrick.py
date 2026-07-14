#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Météo CNews — Générateur de Bulletin Vidéo avec Voix Off (Test Local)
Génère les voix off neuronales Edge TTS (fr-FR-HenriNeural) pour chaque carte
du bulletin vidéo de Patrick (Hauts-de-France) et les assemble with FFmpeg.
"""

import os
import sys
import argparse
import subprocess
import datetime
import shutil
import json
import re
import asyncio
import edge_tts
from PIL import Image, ImageDraw, ImageFont
import time

def safe_rmtree(path):
    if not os.path.exists(path):
        return
    for i in range(5):
        try:
            for root, dirs, files in os.walk(path, topdown=False):
                for name in files:
                    try:
                        os.remove(os.path.join(root, name))
                    except Exception:
                        pass
                for name in dirs:
                    try:
                        os.rmdir(os.path.join(root, name))
                    except Exception:
                        pass
            shutil.rmtree(path)
            return
        except Exception:
            time.sleep(0.2)
    shutil.rmtree(path)

def log(msg):
    print(f"[VOICEOVER-TEST] {msg}")

def get_font_path(prefer_bold=False):
    paths = []
    if prefer_bold:
        paths = [
            r"C:\Windows\Fonts\ARIALNB.TTF",
            r"C:\Windows\Fonts\arialbd.ttf",
            r"C:\Windows\Fonts\arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
    else:
        paths = [
            r"C:\Windows\Fonts\ARIALN.TTF",
            r"C:\Windows\Fonts\arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    for p in paths:
        if os.path.exists(p):
            return p
    return None

def get_video_duration(path):
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def create_transition_frames(day_str, sub_str, width, height, logo_path, output_dir, prefix):
    font_path = get_font_path(prefer_bold=True)
    font_sub_path = get_font_path(prefer_bold=False)
    
    # Charger les polices
    try:
        font_day = ImageFont.truetype(font_path, 70) if font_path else ImageFont.load_default()
        font_sub = ImageFont.truetype(font_sub_path, 40) if font_sub_path else ImageFont.load_default()
    except Exception:
        font_day = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    logo = None
    if logo_path and os.path.exists(logo_path):
        try:
            logo = Image.open(logo_path).convert("RGBA")
        except Exception as e:
            log(f"Impossible de charger le logo : {e}")

    # Dessiner les frames (transition de 3 secondes = 72 frames à 24 fps)
    frames_count = 72
    base_color = (2, 7, 18) # Bleu nuit sombre
    
    for frame_idx in range(frames_count):
        # Création de l'image de fond
        img = Image.new("RGBA", (width, height), base_color + (255,))
        draw = ImageDraw.Draw(img)
        
        # Opacité progressive pour le fondu entrant/sortant
        opacity = 1.0
        if frame_idx < 12:  # Fondu entrant de 0.5s
            opacity = frame_idx / 12.0
        elif frame_idx > 60: # Fondu sortant de 0.5s
            opacity = (frames_count - frame_idx) / 12.0
            
        alpha_val = int(255 * opacity)
        
        # Superposer le logo au centre supérieur
        if logo:
            # Redimensionner le logo proprement
            logo_w = int(width * 0.18)
            logo_h = int(logo.height * (logo_w / logo.width))
            logo_scaled = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            
            logo_x = (width - logo_w) // 2
            logo_y = height // 4 - logo_h // 2
            
            # Créer un masque d'opacité pour le logo
            logo_mask = logo_scaled.split()[3].point(lambda x: int(x * opacity))
            img.paste(logo_scaled, (logo_x, logo_y), logo_mask)
            
        # Dessiner le texte du jour
        day_w = draw.textlength(day_str, font=font_day)
        day_x = (width - day_w) // 2
        day_y = height // 2 - 20
        draw.text((day_x, day_y), day_str, fill=(255, 255, 255, alpha_val), font=font_day)
        
        # Dessiner le sous-titre
        sub_w = draw.textlength(sub_str, font=font_sub)
        sub_x = (width - sub_w) // 2
        sub_y = height // 2 + 80
        draw.text((sub_x, sub_y), sub_str, fill=(255, 223, 0, alpha_val), font=font_sub) # Jaune météo
        
        # Sauvegarde de la frame
        frame_name = f"{prefix}_frame_{frame_idx:03d}.jpg"
        img.convert("RGB").save(os.path.join(output_dir, frame_name), "JPEG", quality=90)

async def generate_single_tts(text, output_path):
    log(f"Génération audio pour : '{text[:60]}...'")
    communicate = edge_tts.Communicate(text, "fr-FR-HenriNeural", rate="+10%")
    await communicate.save(output_path)

async def generate_all_tts(texts_list, temp_dir):
    tasks = []
    audio_paths = []
    for idx, text in enumerate(texts_list):
        path = os.path.join(temp_dir, f"voice_{idx}.mp3")
        tasks.append(generate_single_tts(text, path))
        audio_paths.append(path)
    await asyncio.gather(*tasks)
    return audio_paths

def format_time_for_speech(time_str):
    if not time_str or ":" not in time_str:
        return ""
    h, m = time_str.split(":")
    h_int = int(h)
    return f"{h_int} heures {m}"

def parse_ephemeris_text(eph_text):
    if not eph_text:
        return "Bonne journée à tous."
    saint_match = re.search(r"SAINT DU JOUR\s*:\s*([^\n\r]*)", eph_text)
    coucher_match = re.search(r"Coucher\s*(\d{2}:\d{2})", eph_text)
    saint = saint_match.group(1).strip() if saint_match else "Ulrich"
    coucher = format_time_for_speech(coucher_match.group(1)) if coucher_match else "21 heures 55"
    return f"Mardi, bonne fête aux Saint {saint}. Coucher du soleil à {coucher}. Excellente journée."

def parse_temperatures(raw_text):
    temps = {}
    if not raw_text:
        return temps
    for line in raw_text.split('\n'):
        line = line.strip()
        if not line:
            continue
        match = re.search(r"^(.*?)\s*\(\d{2}\)\s*(\d+)$", line)
        if match:
            city_name = match.group(1).strip()
            temp_val = int(match.group(2))
            temps[city_name] = temp_val
    return temps

def get_custom_temps(raw_text, is_morning=True):
    temps = parse_temperatures(raw_text)
    coast_cities = ["Dunkerque", "Calais / Marck", "Le Touquet", "Cap Gris-Nez", "Boulogne", "Attin"]
    inland_cities = ["Lille", "Douai", "Roubaix", "Valenciennes", "Arras", "Cambrai / Epinoy", "Maubeuge"]
    
    coast_vals = [temps[c] for c in coast_cities if c in temps]
    inland_vals = [temps[c] for c in inland_cities if c in temps]
    
    if is_morning:
        c_val = min(coast_vals) if coast_vals else 17
        i_val = max(inland_vals) if inland_vals else 20
    else:
        c_val = min(coast_vals) if coast_vals else 22
        i_val = max(inland_vals) if inland_vals else 30
        
    return c_val, i_val

import urllib.request
import base64

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

def call_openrouter_vision(api_key, image_path, prompt):
    """Appelle l'API Vision d'OpenRouter avec l'image spécifiée et le prompt."""
    if not api_key or not os.path.exists(image_path):
        return None
    try:
        with open(image_path, "rb") as f:
            b64_str = base64.b64encode(f.read()).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64_str}"
        
        payload = json.dumps({
            "model": "google/gemini-2.5-pro",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url}}
                    ]
                }
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        }).encode("utf-8")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://cnews.weather.local",
            "X-Title": "CNews Bulletin Voiceover"
        }
        
        req = urllib.request.Request(OPENROUTER_API_URL, data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"].strip()
    except Exception as e:
        log(f"Erreur Vision OpenRouter pour {os.path.basename(image_path)} : {e}")
        return None

def keep_first_sentence(text):
    if not text:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    if sentences:
        s = sentences[0].strip()
        if s.startswith("e ") or s.startswith("é "):
            s = "C" + s
        return s
    return text

def clean_degrees(text):
    if not text:
        return ""
    text = text.replace("°C", " degrés").replace("°c", " degrés").replace("°", " degrés")
    text = re.sub(r"(\d+)\s*Celsius", r"\1 degrés", text, flags=re.IGNORECASE)
    return text

def test_compile_voiceover(zone="hdf", patrick=True, orientation="landscape"):
    log("Démarrage du test local de compilation vidéo avec voix off...")
    
    # Chemins
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    
    json_path = os.path.join(project_root, "cnews", "BULLETINS_AUTOMATIQUES_DEMAIN.json")
    if not os.path.exists(json_path):
        # Essayer chemin relatif direct
        json_path = os.path.join(project_root, "BULLETINS_AUTOMATIQUES_DEMAIN.json")
        if not os.path.exists(json_path):
            log(f"Erreur : Impossible de localiser {json_path}")
            return
            
    cartes_dir = os.path.join(project_root, "cartes_alertes")
    if not os.path.exists(cartes_dir):
        cartes_dir = os.path.expanduser(r"~\Desktop\cartes_alertes")
        
    assets_dir = os.path.join(project_root, "meteo_cnews_2", "A_CONSERVER_ABSOLUMENT")
    if not os.path.exists(assets_dir):
        assets_dir = os.path.join(cartes_dir, "A_CONSERVER_ABSOLUMENT")
        
    jingle_path = os.path.join(assets_dir, "jingle_facebook.mp4" if orientation == "landscape" else "jingle_tiktok.mp4")
    music_path = os.path.join(assets_dir, "musique de fond.mp3")
    logo_path = os.path.join(assets_dir, "logo meteo climat pro 3.png")
    
    output_filename = f"test_bulletin_{zone}_patrick_landscape_voix.mp4"
    output_path = os.path.join(cartes_dir, output_filename)
    
    # Vérifications des fichiers de base
    for p in [jingle_path, music_path, logo_path]:
        if not os.path.exists(p):
            log(f"Erreur : Fichier requis introuvable à {p}")
            return

    # 1. Charger les données météo du JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    client_name = 'RADIO - ICI NORD' if zone == "hdf" else 'BULLETIN EUROPE1 à 6h'
    client_data = [c for c in data['clients'] if c['name'] == client_name]
    if not client_data:
        log(f"Erreur : Client {client_name} introuvable dans le JSON.")
        return
    client = client_data[0]
    form = client.get('form', {})
    # Charger la clé API
    import dotenv
    dotenv.load_dotenv(os.path.join(project_root, "cnews", ".env"))
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if api_key:
        log("Clé API OpenRouter chargée pour l'analyse Vision.")
    else:
        log("Warning : Clé API introuvable dans cnews/.env, utilisation des fallbacks.")
        
    # Extraire les textes de prévision (Fallbacks)
    min_obs = form.get('minObservationsRaw', '')
    obs = form.get('observationsRaw', '')
    
    min_coast_morn, max_inland_morn = get_custom_temps(min_obs, is_morning=True)
    min_coast_aft, max_inland_aft = get_custom_temps(obs, is_morning=False)
    
    fallback_morning = f"ciel bien dégagé ce mardi matin. Comptez {min_coast_morn} degrés sur les côtes et {max_inland_morn} degrés dans l'intérieur."
    fallback_afternoon = f"soleil éclatant cet après-midi. Il fera {min_coast_aft} degrés sur les côtes et jusqu'à {max_inland_aft} degrés dans les terres."
    
    ephemeris_raw = form.get('ephemeris', "")
    ephemeris_spoken = parse_ephemeris_text(ephemeris_raw)
    
    # 2. Configurer le répertoire temporaire pour les transitions et les audios
    temp_dir = os.path.join(cartes_dir, f"temp_voiceover_test_{os.getpid()}")
    if os.path.exists(temp_dir):
        safe_rmtree(temp_dir)
    os.makedirs(temp_dir)
    
    # 3. Préparer les textes des voix off pour CHAQUE carte existante
    today = datetime.date.today() + datetime.timedelta(days=1)
    months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
    days_of_week = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
    
    # Déterminer la durée du jingle
    jingle_duration = get_video_duration(jingle_path)
    jingle_to_slide_offset = jingle_duration - 1.0 # Le diaporama commence 1.0s avant la fin du jingle
    
    width, height = 1920, 1080
    suffix = ""
    
    inputs_list = []
    voice_texts = []
    
    # == CARTE 1 : Vigilance ==
    vig_file = f"carte_vigilance_{zone}{suffix}.jpg"
    vig_path = os.path.join(cartes_dir, vig_file)
    if os.path.exists(vig_path):
        prefix_trans = f"trans_vigilance{suffix}"
        create_transition_frames("VIGILANCE RÉGIONALE", "MÉTÉO-FRANCE", width, height, logo_path, temp_dir, prefix_trans)
        trans_pattern = os.path.join(temp_dir, f"{prefix_trans}_frame_%03d.jpg")
        inputs_list.append((trans_pattern, 3.0, True, None)) # Pas de voix sur la transition
        
        vig_text = "Débutons avec la carte de vigilance. Pas de vigilance particulière sur les Hauts-de-France."
        if api_key:
            prompt_vig = (
                "Tu es un présentateur météo. Décris très rapidement les vigilances sur cette carte régionale HDF. "
                "Rédige une phrase de présentateur météo TV de 12 à 15 mots maximum. Pas de Celsius."
            )
            vision_res = call_openrouter_vision(api_key, vig_path, prompt_vig)
            if vision_res:
                vision_res = clean_degrees(keep_first_sentence(vision_res))
                vig_text = vision_res
                
        inputs_list.append((vig_path, None, False, vig_text)) # Durée calculée dynamiquement plus tard
        voice_texts.append(vig_text)
 
    # Appel de la vision pour le Matin et l'Après-midi
    summary_morning = f"Ce mardi matin, {fallback_morning}"
    map_morning_path = os.path.join(cartes_dir, f"carte_hdf_J1_matin.jpg")
    if os.path.exists(map_morning_path) and api_key:
        prompt_morn = (
            "Tu es un présentateur météo. Décris le temps et cite le min/max des températures littoral/terres "
            "pour ce mardi matin. Rédige une phrase de présentateur météo TV de 12 à 15 mots maximum. Pas de Celsius."
        )
        vision_res = call_openrouter_vision(api_key, map_morning_path, prompt_morn)
        if vision_res:
            vision_res = clean_degrees(keep_first_sentence(vision_res))
            summary_morning = vision_res
            
    summary_afternoon = f"Cet après-midi, {fallback_afternoon}"
    map_afternoon_path = os.path.join(cartes_dir, f"carte_hdf_J1_apresmidi.jpg")
    if os.path.exists(map_afternoon_path) and api_key:
        prompt_aft = (
            "Tu es un présentateur météo. Décris le temps cet après-midi en repérant très attentivement les pictogrammes d'orages "
            "ou de pluie, et cite le min/max littoral/terres. Rédige une phrase de présentateur météo TV de 12 à 15 mots maximum. Pas de Celsius."
        )
        vision_res = call_openrouter_vision(api_key, map_afternoon_path, prompt_aft)
        if vision_res:
            vision_res = clean_degrees(keep_first_sentence(vision_res))
            summary_afternoon = vision_res

    log(f"Texte Matin : '{summary_morning}'")
    log(f"Texte Après-midi : '{summary_afternoon}'")
    log(f"Texte Éphéméride oral : '{ephemeris_spoken}'")

    # == CARTES : Prévisions journalières ==
    patrick_slides = [
        (0, 'matin', 'MATIN', summary_morning),
        (0, 'apresmidi', 'APRÈS-MIDI', summary_afternoon),
        (0, 'precip', 'CUMULS DE PRÉCIPITATIONS', "Aucun cumul de pluie n'est attendu aujourd'hui sur la région."),
        (0, 'gusts', 'RAFALES MAXIMALES', "Le vent restera calme avec de faibles rafales sur les caps."),
        (1, 'apresmidi', 'APRÈS-MIDI', "Mercredi, le soleil domine avec des températures très chaudes."),
        (2, 'apresmidi', 'APRÈS-MIDI', "Jeudi, le ciel se voile par l'ouest mais le temps reste sec."),
        (3, 'apresmidi', 'APRÈS-MIDI', "Vendredi, maintien des conditions estivales sous un ciel tout bleu."),
        (4, 'apresmidi', 'APRÈS-MIDI', "Samedi, le temps se gâte avec le retour des nuages.")
    ]
    
    for d, period_key, period_label, custom_text in patrick_slides:
        target_date = today + datetime.timedelta(days=d)
        day_name = days_of_week[target_date.weekday()].upper()
        date_str = f"{day_name} {target_date.day} {months[target_date.month - 1].upper()}"
        
        map_file_t1 = f"carte_{zone}_J{d+1}_{period_key}{suffix}.jpg"
        map_file_t0 = f"carte_{zone}_J{d}_{period_key}{suffix}.jpg"
        
        map_path_t1 = os.path.join(cartes_dir, map_file_t1)
        map_path_t0 = os.path.join(cartes_dir, map_file_t0)
        
        map_path = None
        actual_day_str = None
        
        if os.path.exists(map_path_t1):
            map_path = map_path_t1
            actual_day_str = f"J{d+1}"
        elif os.path.exists(map_path_t0):
            map_path = map_path_t0
            actual_day_str = f"J{d}"
        elif d == 4:  # Fallback J+5 vers J+4
            fallback_file_t1 = f"carte_{zone}_J4_{period_key}{suffix}.jpg"
            fallback_file_t0 = f"carte_{zone}_J3_{period_key}{suffix}.jpg"
            fb_path_t1 = os.path.join(cartes_dir, fallback_file_t1)
            fb_path_t0 = os.path.join(cartes_dir, fallback_file_t0)
            if os.path.exists(fb_path_t1):
                map_path = fb_path_t1
                actual_day_str = "J4"
                target_date = today + datetime.timedelta(days=3)
                day_name = days_of_week[target_date.weekday()].upper()
                date_str = f"{day_name} {target_date.day} {months[target_date.month - 1].upper()}"
            elif os.path.exists(fb_path_t0):
                map_path = fb_path_t0
                actual_day_str = "J3"
                target_date = today + datetime.timedelta(days=2)
                day_name = days_of_week[target_date.weekday()].upper()
                date_str = f"{day_name} {target_date.day} {months[target_date.month - 1].upper()}"
        
        if map_path:
            prefix = f"trans_{actual_day_str}_{period_key}{suffix}"
            create_transition_frames(date_str, period_label, width, height, logo_path, temp_dir, prefix)
            trans_pattern = os.path.join(temp_dir, f"{prefix}_frame_%03d.jpg")
            
            inputs_list.append((trans_pattern, 3.0, True, None))
            inputs_list.append((map_path, None, False, custom_text))
            voice_texts.append(custom_text)
            
    # == CARTE 9 : Éphéméride ==
    eph_file = f"carte_{zone}_ephemeride{suffix}.jpg"
    eph_path = os.path.join(cartes_dir, eph_file)
    if os.path.exists(eph_path):
        day_name = days_of_week[today.weekday()].upper()
        date_str = f"{day_name} {today.day} {months[today.month - 1].upper()}"
        prefix = f"trans_ephemeride{suffix}"
        create_transition_frames(date_str, "L'ÉPHÉMÉRIDE", width, height, logo_path, temp_dir, prefix)
        trans_pattern = os.path.join(temp_dir, f"{prefix}_frame_%03d.jpg")
        
        inputs_list.append((trans_pattern, 3.0, True, None))
        inputs_list.append((eph_path, None, False, ephemeris_spoken))
        voice_texts.append(ephemeris_spoken)

    log(f"Nombre de voix off à générer : {len(voice_texts)}")
    
    # 4. Lancer la génération des audios par TTS (Asynchrone)
    audio_paths = asyncio.run(generate_all_tts(voice_texts, temp_dir))
    log("Génération de tous les fichiers audio TTS terminée.")
    
    # 5. Calculer les durées de chaque voix off et mettre à jour inputs_list
    updated_inputs_list = []
    voice_idx_in_inputs = []
    voice_durations = []
    
    audio_idx = 0
    for idx, (path, duration, is_seq, text) in enumerate(inputs_list):
        if not is_seq and text is not None:
            # C'est une carte de prévision avec voix off
            mp3_path = audio_paths[audio_idx]
            d = get_video_duration(mp3_path)
            voice_durations.append(d)
            # Durée de la carte = fixée à 5.0s maximum par carte
            card_duration = 5.0
            updated_inputs_list.append((path, card_duration, is_seq))
            voice_idx_in_inputs.append((idx, audio_idx))
            audio_idx += 1
        else:
            # C'est une plaque de transition (durée fixe 3.0s)
            updated_inputs_list.append((path, duration, is_seq))

    # 6. Calculer la timeline de début de chaque carte pour le delay audio
    current_offset = 0.0
    slide_start_times = []
    for path, duration, is_seq in updated_inputs_list:
        slide_start_times.append(current_offset)
        current_offset += duration - 0.4 # xfade_duration = 0.4s
        
    # Calculer le décalage de la voix dans le fichier final (début à la transition + 2.2s pour démarrer lors de l'apparition de la carte)
    voice_start_times = []
    for slide_idx, audio_idx in voice_idx_in_inputs:
        start_final = jingle_to_slide_offset + slide_start_times[slide_idx - 1] + 2.2
        voice_start_times.append(start_final)
        log(f"Voix off {audio_idx} démarrera à {start_final:.2f}s (durée : {voice_durations[audio_idx]:.2f}s)")
        
    # 7. Construire les entrées FFmpeg
    inputs_cmd = []
    # 0. Jingle
    inputs_cmd.extend(["-i", jingle_path])
    # 1..N. Diaporama (Alternance transition / carte)
    for path, duration, is_seq in updated_inputs_list:
        if is_seq:
            inputs_cmd.extend(["-f", "image2", "-framerate", "24", "-i", path])
        else:
            inputs_cmd.extend(["-loop", "1", "-t", f"{duration:.2f}", "-i", path])
            
    # N+1. Musique de fond
    num_slides = len(updated_inputs_list)
    music_idx = num_slides + 1
    inputs_cmd.extend(["-i", music_path])
    
    # N+2..N+2+M. Fichiers audio voix off
    for mp3_path in audio_paths:
        inputs_cmd.extend(["-i", mp3_path])
        
    # 8. Construire le filter_complex
    # Jingle Video
    region_label = "BULLETIN PATRICK"
    max_width = width * 0.8
    font_size = min(85, int(max_width / (len(region_label) * 0.6)))
    drawtext = (
        f"drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':"
        f"text='{region_label}':"
        f"fontsize={font_size}:"
        f"fontcolor=white:"
        f"x=(w-text_w)/2:"
        f"y=130:"
        f"box=1:"
        f"boxcolor=0x050F2D@0.75:"
        f"boxborderw=30"
    )
    filter_jingle = (
        f"[0:v]trim=start=0:end={jingle_duration},setpts=PTS-STARTPTS,"
        f"scale={width}:{height},format=yuv420p,setsar=1,fps=fps=24,settb=1/24,"
        f"{drawtext}[jingle_v];"
        f"[0:a]atrim=start=0:end={jingle_duration},asetpts=PTS-STARTPTS,volume=1.0[jingle_a];"
    )
    
    # Scale des images du diaporama
    filter_scale = ""
    for i in range(1, num_slides + 1):
        filter_scale += f"[{i}:v]scale={width}:{height},format=yuv420p,setsar=1,fps=fps=24,settb=1/24[v{i}];"
        
    # XFades pour le diaporama
    xfade_duration = 0.4
    filter_xfade = ""
    last_label = "[v1]"
    current_xfade_offset = 0.0
    for i in range(num_slides - 1):
        current_xfade_offset += updated_inputs_list[i][1] - xfade_duration
        next_label = f"[x{i+1}]"
        if i == num_slides - 2:
            next_label = "[slideshow_v]"
        filter_xfade += f"{last_label}[v{i+2}]xfade=transition=fade:duration={xfade_duration}:offset={current_xfade_offset:.2f},settb=1/24{next_label};"
        last_label = next_label
        
    # Transition Jingle -> Diaporama
    filter_transition = f"[jingle_v][slideshow_v]xfade=transition=fade:duration=1.0:offset={jingle_to_slide_offset:.2f},settb=1/24[v];"
    
    # Volume et fade de la musique de fond (TRES faible volume car présence de voix off)
    music_fade_in_start = jingle_to_slide_offset
    music_fade_out_start = jingle_to_slide_offset + current_offset + updated_inputs_list[-1][1] - 4.0
    music_delay_ms = int(jingle_to_slide_offset * 1000)
    filter_music = (
        f"[{music_idx}:a]volume=0.03,adelay={music_delay_ms}|{music_delay_ms},"
        f"afade=t=in:st={music_fade_in_start:.2f}:d=0.5,"
        f"afade=t=out:st={music_fade_out_start:.2f}:d=3.0[music_ready];"
    )
    
    # Application du delay de chaque voix off
    filter_voice_delays = ""
    for k in range(len(audio_paths)):
        delay_ms = int(voice_start_times[k] * 1000)
        v_idx = music_idx + 1 + k
        filter_voice_delays += f"[{v_idx}:a]adelay={delay_ms}|{delay_ms}[voice_{k}];"
        
    # Mixage final des audios : Jingle (1.0) + Musique de fond (0.03) + Voix off (1.0)
    voice_labels = "".join([f"[voice_{k}]" for k in range(len(audio_paths))])
    num_inputs_audio = 2 + len(audio_paths)
    filter_audio_mix = f"[jingle_a][music_ready]{voice_labels}amix=inputs={num_inputs_audio}:duration=longest:dropout_transition=0:normalize=0[a]"
    
    # Assemblage
    filter_complex_str = filter_jingle + filter_scale + filter_xfade + filter_transition + filter_music + filter_voice_delays + filter_audio_mix
    
    filter_script_path = os.path.join(temp_dir, "filter_complex.txt")
    with open(filter_script_path, "w", encoding="utf-8") as f:
        f.write(filter_complex_str)
        
    ffmpeg_cmd = [
        "ffmpeg", "-y"
    ] + inputs_cmd + [
        "-filter_complex_script", filter_script_path,
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-r", "24",
        "-shortest",
        output_path
    ]
    
    log("Lancement de la compilation vidéo FFmpeg avec voix off intégrées...")
    try:
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        log(f"✅ Succès ! Vidéo avec voix off générée : {output_path}")
    except subprocess.CalledProcessError as e:
        log(f"Erreur FFmpeg : {e.stderr.decode('utf-8', errors='ignore')}")
    finally:
        # Nettoyer
        if os.path.exists(temp_dir):
            safe_rmtree(temp_dir)
            log("🧹 Répertoire temporaire nettoyé.")

if __name__ == "__main__":
    test_compile_voiceover()
