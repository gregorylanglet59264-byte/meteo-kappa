import sys
import argparse
import time
import json
import base64
import os
import subprocess
from playwright.sync_api import sync_playwright

def get_base64_image(path):
    if os.path.exists(path):
        try:
            with open(path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                return f"data:image/jpeg;base64,{encoded_string}"
        except Exception as e:
            print(f"Warning: Failed to read image {path}: {e}")
    return None

def run_map_generator(region, day_offset):
    zone = region if region else "france_pictos"
    days = 3 if region else 8
    script_path = r"C:\Users\grego\Documents\METEO_CLIMAT\meteo cnews 2\generate_meteofrance_maps.py"
    
    if not os.path.exists(script_path):
        print(f"Warning: Map generator script not found at {script_path}. Skipping generation.")
        return False
        
    print(f"Launching map generator for zone '{zone}' ({days} days)...")
    cmd = ["python", script_path, "--zone", zone, "--days", str(days), "--orientation", "landscape"]
    if day_offset == 1:
        cmd.append("--start-tomorrow")
        
    try:
        # Run using default python interpreter
        subprocess.run(cmd, check=True)
        print("Map generation completed successfully.")
        return True
    except Exception as e:
        print(f"Warning: Map generator failed: {e}")
        return False

import datetime

FRENCH_WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
FRENCH_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

def get_french_date_string(date_obj, include_year=True):
    weekday = FRENCH_WEEKDAYS[date_obj.weekday()]
    day = date_obj.day
    month = FRENCH_MONTHS[date_obj.month - 1]
    if include_year:
        return f"{weekday} {day} {month} {date_obj.year}"
    else:
        return f"{weekday} {day} {month}"

def update_form_dates_locally(form, day_offset):
    today = datetime.date.today()
    date_j1 = today + datetime.timedelta(days=day_offset)
    date_j2 = today + datetime.timedelta(days=day_offset + 1)
    
    day1_str = get_french_date_string(date_j1, include_year=True)
    day2_str = get_french_date_string(date_j2, include_year=False)
    
    form["bulletinDate"] = day1_str
    form["summaryTitle"] = f"Prévisions pour la journée du {day1_str.upper()}"
    form["summaryTitle2"] = f"Prévisions pour la journée du {day2_str.upper()}"
    form["alertTitle"] = f"Vigilance pour ce {day1_str}"

def main():
    parser = argparse.ArgumentParser(description="Automate weather bulletin generation and publication")
    parser.add_argument("--client", type=str, default="BULLETIN EUROPE1 à 6h", help="Name of the client bulletin")
    parser.add_argument("--day-offset", type=int, default=1, help="Day offset (0 for today, 1 for tomorrow, etc.)")
    parser.add_argument("--file", type=str, default="AUTOMATISATION.json", help="Path to the JSON data file")
    parser.add_argument("--url", type=str, default="http://localhost:8080", help="URL of the local development server")
    parser.add_argument("--generate-maps", action="store_true", help="Generate fresh maps using meteo-cnews skill before bulletin generation")
    
    args = parser.parse_args()
    
    print(f"Starting automation for client: {args.client}")
    print(f"Day offset: {args.day_offset}")
    print(f"Using server: {args.url}")
    print(f"Config file: {args.file}")
    
    # 1. Map client name to its region code for Météo-France maps
    region_mapping = {
        "BULLETIN EUROPE1 à 6h": "",
        "RADIO - ICI NORD": "hdf",
        "RADIO - ICI LA ROCHELLE": "naq",
        "RADIO 6": "hdf",
        "MONA FM": "hdf",
        "RADIO ICI NORMANDIE": "normandie",
        "RADIO ICI NORMANDIE ": "normandie"
    }
    
    region = region_mapping.get(args.client, "")
    print(f"Detected region code: '{region}'")
    
    if args.generate_maps:
        run_map_generator(region, args.day_offset)
    
    # 2. Path to maps directory on Desktop
    maps_dir = r"C:\Users\grego\Desktop\cartes_alertes"
    
    # Determine the day offsets for map 1 and map 2
    offset1 = args.day_offset
    offset2 = args.day_offset + 1
    
    # Define file patterns
    region_prefix = f"{region}_" if region else ""
    map_morning_1 = os.path.join(maps_dir, f"carte_{region_prefix}J{offset1}_matin.jpg")
    map_afternoon_1 = os.path.join(maps_dir, f"carte_{region_prefix}J{offset1}_apresmidi.jpg")
    map_morning_2 = os.path.join(maps_dir, f"carte_{region_prefix}J{offset2}_matin.jpg")
    map_afternoon_2 = os.path.join(maps_dir, f"carte_{region_prefix}J{offset2}_apresmidi.jpg")
    
    print("Checking for generated weather maps...")
    img_m1 = get_base64_image(map_morning_1)
    img_a1 = get_base64_image(map_afternoon_1)
    img_m2 = get_base64_image(map_morning_2)
    img_a2 = get_base64_image(map_afternoon_2)
    
    # 3. Read and update the JSON file dynamically
    temp_json_path = "AUTOMATISATION_TEMP.json"
    try:
        with open(args.file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        clients = data.get("clients", [])
        client_found = False
        
        # Import AI helper
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        try:
            from ai_helper import generate_bulletin_texts
        except ImportError:
            print("Warning: Could not import ai_helper. Skipping AI texts.")
            generate_bulletin_texts = lambda *args: None
        
        for c in clients:
            if c.get("name") == args.client:
                client_found = True
                form = c.setdefault("form", {})
                
                # Update form dates locally to avoid inconsistencies
                update_form_dates_locally(form, args.day_offset)
                
                # Generate and inject AI texts if available
                ai_texts = generate_bulletin_texts(args.client, c.get("cities", []), args.day_offset)
                if ai_texts:
                    print("Injecting AI-generated forecast texts...")
                    for key, val in ai_texts.items():
                        form[key] = val
                
                # Update maps if they exist
                if img_m1:
                    print(f"Injecting morning map 1: {os.path.basename(map_morning_1)}")
                    form["summaryMapMorningUrl1"] = img_m1
                if img_a1:
                    print(f"Injecting afternoon map 1: {os.path.basename(map_afternoon_1)}")
                    form["summaryMapAfternoonUrl1"] = img_a1
                if img_m2:
                    print(f"Injecting morning map 2: {os.path.basename(map_morning_2)}")
                    form["summaryMapMorningUrl2"] = img_m2
                if img_a2:
                    print(f"Injecting afternoon map 2: {os.path.basename(map_afternoon_2)}")
                    form["summaryMapAfternoonUrl2"] = img_a2
                break
                
        if not client_found:
            print(f"Warning: Client '{args.client}' not found in the JSON file.")
            
        with open(temp_json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
    except Exception as e:
        print(f"Error modifying config file with new maps: {e}")
        # Fall back to original file if modification fails
        temp_json_path = args.file
        
    # 4. Launch Playwright
    try:
        with sync_playwright() as p:
            # Launch browser in headless mode
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Listen for dialogs (alerts)
            published_url = None
            def handle_dialog(dialog):
                nonlocal published_url
                print(f"\n[ALERT DIALOG]: {dialog.message}")
                if "Lien court" in dialog.message:
                    for line in dialog.message.split("\n"):
                        if "Lien court" in line:
                            published_url = line.split(":", 1)[1].strip()
                dialog.accept()
                
            page.on("dialog", handle_dialog)
            
            # Open page
            page.goto(args.url)
            page.wait_for_load_state("networkidle")
            
            # Import updated JSON file
            print("Uploading data file...")
            file_input = page.locator('input[type="file"][accept=".json"]')
            file_input.set_input_files(temp_json_path)
            
            # Wait for client list to populate
            print("Waiting for client list to populate...")
            page.wait_for_selector(f"text={args.client}", timeout=5000)
            
            # Select the client
            print(f"Selecting client '{args.client}'...")
            page.get_by_text(args.client).first.click()
            
            # Select day offset
            print(f"Selecting day offset {args.day_offset}...")
            page.select_option('select[title*="date"]', value=str(args.day_offset))
            
            # Wait for the API load trigger to start and finish
            print("Waiting for API load to complete...")
            time.sleep(2) # Wait a bit for initial trigger
            page.wait_for_selector('button:has-text("API"):not([disabled])', timeout=15000)
            page.wait_for_selector('button:has-text("ECMWF"):not([disabled])', timeout=15000)
            
            # Sync vigilance
            print("Synchronizing vigilance...")
            page.locator('button:has-text("SYNCHRONISER")').click()
            time.sleep(2)
            page.wait_for_selector('button:has-text("SYNCHRONISER"):not([disabled])', timeout=15000)
            
            print("All data fetched and updated. Ready to publish.")
            
            # Click EN LIGNE to publish
            print("Publishing bulletin online...")
            page.locator('button:has-text("EN LIGNE")').click()
            
            # Wait for dialog to be intercepted
            timeout = 30 # seconds to wait for upload
            start_time = time.time()
            while published_url is None and (time.time() - start_time) < timeout:
                page.wait_for_timeout(500)
                
            if published_url:
                print(f"\n🎉 SUCCESS! Bulletin published at: {published_url}")
            else:
                print("\n❌ FAILED: Upload timed out or alert dialog was not received.")
                
            browser.close()
            
    finally:
        # Clean up temporary JSON file
        if temp_json_path == "AUTOMATISATION_TEMP.json" and os.path.exists(temp_json_path):
            try:
                os.remove(temp_json_path)
            except Exception as e:
                print(f"Warning: Failed to clean up temp file: {e}")

if __name__ == "__main__":
    main()
