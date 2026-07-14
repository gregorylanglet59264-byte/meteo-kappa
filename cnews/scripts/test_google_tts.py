import os
import sys
from google.cloud import texttospeech

def test_google_tts():
    print("Démarrage du test Google Cloud Text-to-Speech...")
    
    # 1. Configurer le chemin vers les identifiants
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    credentials_path = os.path.join(project_root, "google-credentials.json")
    
    if not os.path.exists(credentials_path):
        print(f"\n❌ ERREUR : Fichier de clé introuvable à : {credentials_path}")
        print("Veuillez y placer le fichier JSON téléchargé depuis la console Google Cloud.")
        return
        
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
    
    try:
        # 2. Initialiser le client Google TTS
        client = texttospeech.TextToSpeechClient()
        
        # Texte à synthétiser
        text = (
            "Bonjour ! Voici vos prévisions météo pour les Hauts-de-France. "
            "Ce mardi après-midi, des averses orageuses éclateront dans l'intérieur des terres, "
            "avec des températures atteignant trente-six degrés."
        )
        
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # 3. Choisir la voix (fr-FR-Neural2-B est une voix masculine de très haute qualité)
        voice = texttospeech.VoiceSelectionParams(
            language_code="fr-FR",
            name="fr-FR-Neural2-B"
        )
        
        # 4. Configurer le format audio (MP3)
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.08  # Légèrement accéléré (+8%) pour dynamiser le journal TV
        )
        
        # 5. Lancer la requête
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        # 6. Écrire le résultat sur le Bureau de l'utilisateur
        desktop = os.path.expanduser(r"~\Desktop")
        output_filename = os.path.join(desktop, "test_google_tts.mp3")
        
        with open(output_filename, "wb") as out:
            out.write(response.audio_content)
            
        print(f"\n✅ SUCCÈS ! Échantillon de voix généré sur votre Bureau : {output_filename}")
        
    except Exception as e:
        print(f"\n❌ ERREUR lors de l'appel à l'API Google : {e}")

if __name__ == "__main__":
    test_google_tts()
