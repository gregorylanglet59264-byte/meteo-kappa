# -*- coding: utf-8 -*-
"""
send_cnews_obs_email.py
───────────────────────
Orchestrateur pour l'automatisation des observations climatologiques CNews.
1. Lance update_daily_obs.py (Scraping Météociel -> SQLite).
2. Lance generate_meteociel_obs_maps.py pour la France et toutes les régions.
3. Compresse toutes les cartes d'observations dans un ZIP.
4. Publie le ZIP sur GitHub Releases (tag observations-latest).
5. Envoie l'e-mail de téléchargement à Grégory (pas à Patrick pour l'instant).
"""

import os
import sys
import subprocess
import smtplib
import base64
import uuid
import datetime
from email.utils import formatdate
import unicodedata

def get_french_date_string(date_obj):
    months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    weekdays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
    return f"{weekdays[date_obj.weekday()]} {date_obj.day} {months[date_obj.month - 1]} {date_obj.year}"

def send_email(body_text, subject, recipients_str):
    gmail_email = os.environ.get("GMAIL_EMAIL", "langlet.gregory@gmail.com")
    gmail_password = os.environ.get("GMAIL_APP_PASSWORD")
    if not gmail_password:
        print("[SMTP] ERREUR : GMAIL_APP_PASSWORD non configuré. Annulation envoi.")
        return False
        
    gmail_email = gmail_email.replace('\ufeff', '').replace('\ufffe', '').strip()
    gmail_password = gmail_password.replace('\ufeff', '').replace('\ufffe', '').strip()
    
    recipients = [r.strip() for r in recipients_str.split(",") if r.strip()]
    sender = gmail_email
    
    clean_subj = unicodedata.normalize('NFKD', subject).encode('ASCII', 'ignore').decode('ASCII')
    body_text = body_text.replace('\ufeff', '').replace('\ufffe', '')
    text_b64 = base64.b64encode(body_text.encode('utf-8')).decode('ascii')
    
    boundary = uuid.uuid4().hex
    
    raw_message = (
        f'From: Gregory LANGLET <{sender}>\r\n'
        f'To: {", ".join(recipients)}\r\n'
        f'Subject: {clean_subj}\r\n'
        f'Date: {formatdate(localtime=True)}\r\n'
        f'MIME-Version: 1.0\r\n'
        f'Content-Type: multipart/mixed; boundary="{boundary}"\r\n'
        f'\r\n'
        f'--{boundary}\r\n'
        f'Content-Type: text/html; charset=utf-8\r\n'
        f'Content-Transfer-Encoding: base64\r\n'
        f'\r\n'
        f'{text_b64}\r\n'
        f'\r\n'
        f'--{boundary}--\r\n'
    )
    
    print(f"[SMTP] Envoi via Gmail à {', '.join(recipients)}...")
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(gmail_email, gmail_password)
            server.sendmail(gmail_email, recipients, raw_message.encode('ascii'))
        print("[SMTP] E-mail d'observations envoyé avec succès !")
        return True
    except Exception as e:
        print(f"[SMTP] Erreur d'envoi du mail d'observations : {e}")
        return False

def run_command(cmd, cwd):
    print(f"\nExécution : {' '.join(cmd)}")
    try:
        subprocess.run(cmd, cwd=cwd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'exécution de la commande : {e}")
        return False

def main():
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(scripts_dir, "..", ".."))
    cnews_dir = os.path.join(repo_root, "meteo_cnews_2")
    cartes_dir = os.path.join(repo_root, "cartes_alertes")
    
    if os.environ.get("GITHUB_ACTIONS"):
        os.makedirs(cartes_dir, exist_ok=True)
    else:
        if not os.path.exists(cartes_dir):
            cartes_dir = os.path.expanduser(r"~\Desktop\cartes_alertes")
            os.makedirs(cartes_dir, exist_ok=True)

    # 1. ÉTAPE 1 : Scraping et alimentation SQLite (update_daily_obs.py)
    # On scrape les données d'aujourd'hui (date courante)
    today = datetime.date.today()
    date_str = today.strftime("%Y%m%d")
    
    print(f"\n=== ÉTAPE 1 : Collecte des observations Météociel pour le {date_str} ===")
    cmd_scrape = ["python", "update_daily_obs.py", "--date", date_str]
    if not run_command(cmd_scrape, cnews_dir):
        print("Erreur critique lors de la collecte. Arrêt.")
        sys.exit(1)

    # 2. ÉTAPE 2 : Génération des cartes pour la France et toutes les régions (generate_meteociel_obs_maps.py)
    zones = ["france", "hdf", "npdc", "59", "62", "normandie", "idf", "ges", "ara", "naq", "occ", "paca", "bfc", "bre", "pdl", "cvl", "cor"]
    params = "bilan_jour,tmax,tmin,precip,gust"
    
    print(f"\n=== ÉTAPE 2 : Génération des cartes d'observations ===")
    for zone in zones:
        print(f"\n👉 Génération pour la zone : {zone.upper()}")
        cmd_maps = [
            "python", "generate_meteociel_obs_maps.py",
            "--date", date_str,
            "--zone", zone,
            "--param", params,
            "--orientation", "both"
        ]
        if not run_command(cmd_maps, cnews_dir):
            print(f"Avertissement : échec pour la zone {zone}, on continue...")

    # 3. ÉTAPE 3 : Compression ZIP des cartes générées
    print("\n=== ÉTAPE 3 : Compression ZIP des cartes d'observations ===")
    zip_name = "cartes_observations_cnews.zip"
    zip_path = os.path.join(cartes_dir, zip_name)
    
    import zipfile
    print(f"Création de l'archive {zip_path}...")
    try:
        if os.path.exists(zip_path):
            os.remove(zip_path)
            
        obs_count = 0
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(cartes_dir):
                for file in files:
                    if file.endswith(".jpg") and date_str in file:
                        f_path = os.path.join(root, file)
                        is_obs_file = any(p in file for p in ["tmax", "tmin", "precip", "gust", "bilan_jour", "anomalie", "amplitude", "secheresse"])
                        if is_obs_file:
                            # Déterminer le sous-dossier par région
                            parts = file.split("_")
                            folder_name = "Autres"
                            if len(parts) >= 3:
                                # Le nom de la région est en clair (ex: Hauts-de-France)
                                folder_name = parts[2]
                                if folder_name.lower() == "france":
                                    folder_name = "France entière"
                            
                            arcname = f"{folder_name}/{file}"
                            zipf.write(f_path, arcname=arcname)
                            obs_count += 1
                            
        print(f"Archive ZIP créée avec succès contenant {obs_count} cartes d'observations classées par dossier.")
        if obs_count == 0:
            print("⚠️ Attention : Aucune carte d'observation trouvée pour le ZIP !")
    except Exception as e:
        print(f"Erreur lors de la compression ZIP : {e}")
        sys.exit(1)

    # 4. ÉTAPE 4 : Publication du ZIP sur GitHub Releases
    print("\n=== ÉTAPE 4 : Publication du ZIP sur GitHub Releases ===")
    download_url = f"https://github.com/gregorylanglet59264-byte/meteo-kappa/releases/download/observations-latest/{zip_name}"
    
    if os.environ.get("GITHUB_ACTIONS"):
        try:
            tag = "observations-latest"
            # Supprimer le release existant
            subprocess.run(["gh", "release", "delete", tag, "--yes"], check=False)
            # Créer un nouveau release avec le ZIP
            subprocess.run([
                "gh", "release", "create", tag, zip_path,
                "--title", "Cartes Observations CNews - Dernière mise à jour",
                "--notes", f"Pack d'observations climatologiques Météociel du {get_french_date_string(today)}.",
                "--latest"
            ], check=True)
            print("ZIP publié sur GitHub Releases avec succès.")
        except Exception as e:
            print(f"Erreur lors de la publication sur GitHub Releases : {e}")
    else:
        print("Exécution locale : publication GitHub Releases ignorée.")

    # 5. ÉTAPE 5 : Envoi de l'e-mail (uniquement à Grégory pour l'instant)
    print("\n=== ÉTAPE 5 : Envoi de l'e-mail ===")
    date_label = get_french_date_string(today)
    subject = f"cartes d'observations du {date_label}"
    
    email_body = (
        f"<html><body style='font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #333; line-height: 1.6;'>"
        f"Bonjour,<br><br>"
        f"Veuillez trouver ci-joint les cartes d'observations climatologiques CNews Météociel du <b>{date_label}</b> (France et 13 régions).<br><br>"
        f"👉 <a href='{download_url}' style='color: #1a73e8; font-weight: bold; text-decoration: underline;'>Cliquer sur ce lien pour télécharger vos cartes d'observations (ZIP)</a><br><br>"
        f"Cordialement,<br>"
        f"L'automatisation Observations CNews"
        f"</body></html>"
    )
    
    recipients = "gregory.langlet@sfr.fr, langlet.gregory@gmail.com"
    print("[SMTP] Envoi uniquement à Grégory (Patrick Wanadoo exclu pour l'instant).")
    
    send_email(email_body, subject, recipients)

if __name__ == "__main__":
    main()
