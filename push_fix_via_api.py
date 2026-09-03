"""
Commit the map_mf_icon bug fix directly to GitHub via the API,
without any git push from the local PC.
"""
import subprocess
import base64
import json
import urllib.request
import urllib.error
import os

REPO = "gregorylanglet59264-byte/meteo-kappa"
BRANCH = "main"
FILES_TO_UPDATE = [
    "meteo_cnews_2/generate_meteofrance_maps.py"
]

# Get token via gh CLI
result = subprocess.run(
    ["gh", "auth", "token", "--hostname", "github.com", "--user", "gregorylanglet59264-byte"],
    capture_output=True, text=True
)
TOKEN = result.stdout.strip()
if not TOKEN:
    # Fallback: try active account token
    result2 = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True)
    TOKEN = result2.stdout.strip()

print("Token retrieved:", bool(TOKEN), "length:", len(TOKEN))

def gh_api(path, method="GET", body=None):
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"HTTP {e.code} error: {err_body[:500]}")
        return None

for filepath in FILES_TO_UPDATE:
    local_path = os.path.join(r"C:\Users\grego\Documents\METEO_CLIMAT\meteo-kappa", filepath)
    print(f"\n--- Processing: {filepath} ---")
    
    # Read local file
    with open(local_path, "r", encoding="utf-8") as f:
        new_content = f.read()
    
    encoded_content = base64.b64encode(new_content.encode("utf-8")).decode()
    
    # Get current SHA of the file on GitHub
    file_info = gh_api(f"/repos/{REPO}/contents/{filepath}?ref={BRANCH}")
    if not file_info:
        print("Could not fetch file info from GitHub")
        continue
    
    current_sha = file_info.get("sha")
    print(f"Current file SHA: {current_sha}")
    
    # Commit the updated file
    commit_message = "fix: picto neige en été — map_mf_icon p12/p14 -> pluie, p18-p23 -> neige"
    body = {
        "message": commit_message,
        "content": encoded_content,
        "sha": current_sha,
        "branch": BRANCH
    }
    
    result = gh_api(f"/repos/{REPO}/contents/{filepath}", method="PUT", body=body)
    if result and result.get("commit"):
        print(f"✅ Committed: {result['commit']['sha'][:8]} — {commit_message}")
    else:
        print("❌ Commit failed")
