"""
fetch_vigilance.py
Module autonome : récupère les données de vigilance Météo-France en temps réel
(bulletin national + départements en vigilance orange/jaune).
Utilise uniquement la stdlib Python — aucune dépendance externe requise.
Inspiré du script get_vigilance_data.py de la compétence vigilance.
"""
import urllib.request
import re
from html.parser import HTMLParser


def fix_encoding(text):
    if not text:
        return ""
    try:
        return text.encode('latin-1').decode('utf-8')
    except Exception:
        return text


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_content = []
        self.in_script = False
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.in_script = True
        elif tag == 'style':
            self.in_style = True

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
        elif tag == 'style':
            self.in_style = False

    def handle_data(self, data):
        if not self.in_script and not self.in_style:
            text = data.strip()
            if text:
                self.text_content.append(text)


def _fetch_html(url):
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.read().decode('utf-8', errors='ignore')


def get_national_forecast_text():
    """Retourne le texte officiel Météo-France des prévisions de demain."""
    try:
        html = _fetch_html("https://meteofrance.com/")
        bulletins = re.findall(r'<bulletin.*?</bulletin>', html, re.DOTALL)
        if not bulletins:
            return None
        b = bulletins[0]
        titre = re.search(r'<titre>(.*?)</titre>', b, re.DOTALL)
        temps = re.search(r'<temps>(.*?)</temps>', b, re.DOTALL)
        if titre and temps:
            return fix_encoding(titre.group(1).strip()), fix_encoding(temps.group(1).strip())
    except Exception as e:
        print(f"Warning: Could not fetch national forecast: {e}")
    return None, None


def get_vigilance_summary(day_index=0):
    """
    Retourne un résumé de la vigilance pour le jour demandé.
    day_index=0 → aujourd'hui/demain (premier bloc), day_index=1 → deuxième bloc.
    Retourne un dict avec : orange_count, jaune_count, orange_text, jaune_text, day_title
    """
    result = {
        "day_title": "",
        "orange_count": 0,
        "jaune_count": 0,
        "orange_text": "",
        "jaune_text": "",
        "formatted": "",
    }
    try:
        html = _fetch_html("https://vigilance.meteofrance.fr/fr/vigilance-accessible")
        parser = TextExtractor()
        parser.feed(html)
        lines = [l.strip() for l in parser.text_content]

        headers = [i for i, l in enumerate(lines) if "Vigilance météo et crues pour" in l]
        if day_index >= len(headers):
            return result

        idx = headers[day_index]
        end_idx = headers[day_index + 1] if day_index + 1 < len(headers) else len(lines)
        day_lines = lines[idx:end_idx]

        result["day_title"] = day_lines[0]

        colors = {"Orange": [], "Jaune": []}
        current_color = None

        j = 0
        while j < len(day_lines):
            line = day_lines[j]
            if "Nom des départements en vigilance orange" in line:
                current_color = "Orange"
            elif "Nom des départements en vigilance jaune" in line:
                current_color = "Jaune"
            elif any(t in line for t in ["Nom des", "Définition", "outre-mer", "Vigilance Accessible"]):
                current_color = None
            elif current_color and '(' in line and ')' in line:
                phenoms = []
                k = j + 1
                while k < len(day_lines):
                    nl = day_lines[k]
                    if '(' in nl and ')' in nl:
                        break
                    if any(t in nl for t in ["Nom des", "Définition", "outre-mer"]):
                        break
                    phenoms.append(nl)
                    k += 1
                colors[current_color].append((line, ", ".join(phenoms)))
                j = k - 1
            j += 1

        # Group by phenomenon
        def group_by_phenom(dept_list):
            phenom_map = {}
            for dept, p in dept_list:
                key = p if p else "Général"
                phenom_map.setdefault(key, []).append(dept)
            return phenom_map

        orange_map = group_by_phenom(colors["Orange"])
        jaune_map = group_by_phenom(colors["Jaune"])

        result["orange_count"] = len(colors["Orange"])
        result["jaune_count"] = len(colors["Jaune"])

        orange_lines = []
        for phenom, depts in orange_map.items():
            orange_lines.append(f"🟠 {phenom} : {', '.join(depts)}")
        result["orange_text"] = "\n".join(orange_lines)

        jaune_lines = []
        for phenom, depts in jaune_map.items():
            jaune_lines.append(f"🟡 {phenom} : {', '.join(depts)}")
        result["jaune_text"] = "\n".join(jaune_lines)

        # Build formatted alert string for bulletin injection
        parts = []
        if result["orange_count"]:
            parts.append(f"🟠 Vigilance ORANGE ({result['orange_count']} dép.) :\n{result['orange_text']}")
        if result["jaune_count"]:
            parts.append(f"🟡 Vigilance JAUNE ({result['jaune_count']} dép.) :\n{result['jaune_text']}")
        if not parts:
            parts.append("🟢 Aucune vigilance orange ou rouge en cours sur le pays.")

        result["formatted"] = "\n\n".join(parts)

    except Exception as e:
        print(f"Warning: Could not fetch vigilance data: {e}")
        result["formatted"] = "⚠️ Données de vigilance temporairement indisponibles."

    return result


if __name__ == "__main__":
    # Self-test
    print("=== TEST fetch_vigilance.py ===\n")
    v = get_vigilance_summary(0)
    print(f"Jour : {v['day_title']}")
    print(f"Orange : {v['orange_count']} dép., Jaune : {v['jaune_count']} dép.")
    print("\n--- Formatted alert ---")
    print(v["formatted"])
    t, txt = get_national_forecast_text()
    print(f"\n--- Prévisions nationales ---\nTitre : {t}\n{txt}")
