import asyncio
import os
import edge_tts

async def generate_sample(voice, name, output_path):
    text = f"Bonjour ! Je suis la voix de test {name}. Voici votre bulletin météo pour les Hauts-de-France. Cet après-midi, des orages éclateront dans les terres avec trente-six degrés."
    communicate = edge_tts.Communicate(text, voice, rate="+10%")
    await communicate.save(output_path)
    print(f"Échantillon généré pour {name} : {output_path}")

async def main():
    desktop = os.path.expanduser(r"~\Desktop")
    folder_path = os.path.join(desktop, "voix_meteo")
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        print(f"Dossier créé : {folder_path}")
        
    voices = [
        ("fr-FR-HenriNeural", "Henri (France)"),
        ("fr-FR-RemyMultilingualNeural", "Remy (France - Multilingue)"),
        ("fr-BE-GerardNeural", "Gerard (Belgique)"),
        ("fr-CH-FabriceNeural", "Fabrice (Suisse)"),
        ("fr-CA-AntoineNeural", "Antoine (Canada)"),
        ("fr-CA-JeanNeural", "Jean (Canada)"),
        ("fr-CA-ThierryNeural", "Thierry (Canada)")
    ]
    
    tasks = []
    for voice_id, name in voices:
        clean_name = name.split(" ")[0]
        filename = f"voix_{voice_id.split('-')[1]}_{clean_name}.mp3"
        out_path = os.path.join(folder_path, filename)
        tasks.append(generate_sample(voice_id, name, out_path))
        
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
