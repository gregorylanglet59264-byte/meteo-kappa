import SunCalc from 'suncalc';

// Liste simplifiée des saints par jour de l'année (Mois: [Jour1, Jour2...])
const SAINTS: Record<number, string[]> = {
  1: ["Jour de l'An", "Basile", "Geneviève", "Odilon", "Edouard", "Melaine", "Raymond", "Lucien", "Alix", "Guillaume", "Pauline", "Tatiana", "Yvette", "Nina", "Rémi", "Marcel", "Roseline", "Prisca", "Marius", "Sébastien", "Agnès", "Vincent", "Barnard", "Fr. de Sales", "Conv. de Paul", "Paule", "Angèle", "Thomas d'A.", "Gildas", "Martine", "Marcelle"],
  2: ["Ella", "Présentation", "Blaise", "Véronique", "Agathe", "Gaston", "Eugénie", "Jacqueline", "Apolline", "Arnaud", "N-D de Lourdes", "Félix", "Béatrice", "Valentin", "Claude", "Julienne", "Alexis", "Bernadette", "Gabin", "Aimée", "Pierre-Dam.", "Isabelle", "Lazare", "Modeste", "Roméo", "Nestor", "Honorine", "Romain", "Auguste"],
  3: ["Aubin", "Charles le B.", "Guenolé", "Casimir", "Olive", "Colette", "Félicité", "Jean de Dieu", "Françoise", "Vivien", "Rosine", "Justine", "Rodrigue", "Mathilde", "Louise", "Bénédicte", "Patrice", "Cyrille", "Joseph", "Herbert", "Clémence", "Léa", "Victorien", "Catherine", "Annonciation", "Larissa", "Habib", "Gontran", "Gwladys", "Amédée", "Benjamin"],
  4: ["Hugues", "Sandrine", "Richard", "Isidore", "Irène", "Marcellin", "Jean-Baptiste", "Julie", "Gautier", "Fulbert", "Stanislas", "Jules", "Ida", "Maxime", "Paterne", "Benoit-Joseph", "Anicet", "Parfait", "Emma", "Odette", "Anselme", "Alexandre", "Georges", "Fidèle", "Marc", "Alida", "Zita", "Valérie", "Catherine de S.", "Robert"],
  5: ["Joseph Artisan", "Boris", "Philippe", "Sylvain", "Judith", "Prudence", "Gisèle", "Désiré", "Pacôme", "Solange", "Estelle", "Achille", "Rolande", "Matthias", "Denise", "Honoré", "Pascal", "Eric", "Yves", "Bernardin", "Constantin", "Emile", "Didier", "Donatien", "Sophie", "Bérenger", "Augustin", "Germain", "Aymar", "Ferdinand", "Visitation"],
  6: ["Justin", "Blandine", "Kévin", "Clotilde", "Igor", "Norbert", "Gilbert", "Médard", "Diane", "Landry", "Barnabé", "Guy", "Antoine", "Elisée", "Germaine", "Jean-François", "Hervé", "Léonce", "Romuald", "Silvère", "Rodolphe", "Alban", "Audrey", "Jean-Baptiste", "Prosper", "Anthelme", "Fernand", "Irenée", "Pierre/Paul", "Martial"],
  7: ["Thierry", "Martinien", "Thomas", "Florent", "Antoine", "Marietta", "Raoul", "Thibault", "Amandine", "Ulrich", "Benoît", "Olivier", "Henri/Joël", "Camille", "Donald", "N-D Mt-Carmel", "Charlotte", "Frédéric", "Arsène", "Marina", "Victor", "Marie-Mad.", "Brigitte", "Christine", "Jacques", "Anne/Joachim", "Nathalie", "Samson", "Marthe", "Juillette", "Ignace"],
  8: ["Alphonse", "Julien", "Lydie", "Jean-Marie V.", "Abel", "Transfiguration", "Gaétan", "Dominique", "Amour", "Laurent", "Claire", "Clarisse", "Hippolyte", "Evrard", "Assomption", "Armel", "Hyacinthe", "Hélène", "Jean Eudes", "Bernard", "Christophe", "Fabrice", "Rose", "Barthélémy", "Louis", "Natacha", "Monique", "Augustin", "Sabine", "Fiacre", "Aristide"],
  9: ["Gilles", "Ingrid", "Grégoire", "Rosalie", "Raïssa", "Bertrand", "Reine", "Nativité", "Alain", "Inès", "Adelphe", "Apollinaire", "Aimé", "Croix Glorieuse", "Roland", "Edith", "Renaud", "Nadège", "Emilie", "Davy", "Matthieu", "Maurice", "Constant", "Thecle", "Hermann", "Côme/Damien", "Vincent de P.", "Venceslas", "Michel/Gabr.", "Jérôme"],
  10: ["Thérèse de l'E.", "Léger", "Gérard", "Fr. d'Assise", "Fleur", "Bruno", "Serge", "Pélagie", "Denis", "Ghislain", "Firmin", "Wilfried", "Géraud", "Juste", "Thérèse d'A.", "Edwige", "Baudoin", "Luc", "René", "Adeline", "Céline", "Elodie", "Jean de C.", "Florentin", "Crépin", "Dimitri", "Emeline", "Jude", "Narcisse", "Bienvenu", "Quentin"],
  11: ["Toussaint", "Défunts", "Hubert", "Charles", "Sylvie", "Léon", "Carine", "Geoffroy", "Théodore", "Léon", "Martin", "Christian", "Brice", "Sidoine", "Albert", "Marguerite", "Elisabeth", "Aude", "Tanguy", "Edmond", "Présentation", "Cécile", "Clément", "Flora", "Catherine", "Delphine", "Séverin", "Jacques de la M.", "Saturnin", "André"],
  12: ["Florence", "Viviane", "François-X.", "Barbara", "Gérald", "Nicolas", "Ambroise", "Immaculée C.", "Pierre Fourier", "Romaric", "Daniel", "Jeanne-Fr.", "Lucie", "Odile", "Ninon", "Alice", "Gaël", "Gatien", "Urbain", "Théophile", "Pierre Can.", "Françoise-X.", "Armand", "Adèle", "Noël", "Etienne", "Jean", "Innocents", "David", "Roger", "Sylvestre"]
};

export interface EphemerisData {
  sunrise: string;
  sunset: string;
  dayLength: string;
  dayLengthDiff: string;
  saint: string;
  solarNoon: string;
  moonRise: string;
  moonSet: string;
}

export function getEphemeris(lat: number, lon: number, date: Date = new Date()): EphemerisData {
  const times = SunCalc.getTimes(date, lat, lon);
  const moon = SunCalc.getMoonTimes(date, lat, lon);
  
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTimes = SunCalc.getTimes(yesterday, lat, lon);
  
  const formatTime = (d?: Date) => d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "--h--";
  
  const diffMs = times.sunset.getTime() - times.sunrise.getTime();
  const yesterdayDiffMs = yesterdayTimes.sunset.getTime() - yesterdayTimes.sunrise.getTime();
  
  const diffMinutes = Math.floor((diffMs - yesterdayDiffMs) / 60000);
  const diffText = diffMinutes > 0 
    ? `Gain de ${diffMinutes} min` 
    : diffMinutes < 0 
      ? `Perte de ${Math.abs(diffMinutes)} min` 
      : "Stable";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60).toString().padStart(1, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const saintName = (SAINTS[month] || [])[day - 1] || "Saint du jour";

  return {
    sunrise: formatTime(times.sunrise),
    sunset: formatTime(times.sunset),
    dayLength: `${hours}h${minutes}`,
    dayLengthDiff: diffText,
    saint: saintName,
    solarNoon: formatTime(times.solarNoon),
    moonRise: formatTime(moon.rise),
    moonSet: formatTime(moon.set)
  };
}

function getDirCardinal(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

export interface MarineStats {
  sector: string;
  waves: string;
  wind: string;
  temp: string;
  vis: string;
  fullText: string;
}

export async function getTides(lat: number, lon: number, date: Date = new Date()): Promise<MarineStats> {
  const dateStr = date.toISOString().split('T')[0];
  
  let waves = "Non disponible";
  let wind = "Non disponible";
  let temp = "--°C";
  let vis = "> 10 km";

  try {
    const marineRes = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,water_temperature&timezone=Europe%2FParis&start_date=${dateStr}&end_date=${dateStr}`);
    const forecastRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=windspeed_10m,windgusts_10m,visibility&timezone=Europe%2FParis&start_date=${dateStr}&end_date=${dateStr}`);

    if (marineRes.ok && forecastRes.ok) {
      const mData = await marineRes.json();
      const fData = await forecastRes.json();
      if (mData.hourly && fData.hourly) {
        const mv = mData.hourly;
        const fv = fData.hourly;
        const noon = 12;
        const wHeight = mv.wave_height?.[noon] || 0;
        temp = `${(mv.water_temperature?.[noon] || 0).toFixed(0)}°C`;
        vis = `${((fv.visibility?.[noon] || 20000) / 1000).toFixed(0)} km`;
        wind = `${(fv.windspeed_10m?.[noon] || 0).toFixed(0)} (Raf. ${(fv.windgusts_10m?.[noon] || 0).toFixed(0)}) km/h`;
        waves = `${wHeight.toFixed(1)}m de secteur ${getDirCardinal(mv.wave_direction?.[noon] || 0)} (${(mv.wave_period?.[noon] || 0).toFixed(1)}s)`;
      }
    }
  } catch (err) {
    console.warn("Marine data fetch error:", err);
  }

  const lines = [
    waves.includes("Non disponible") ? null : `Houle : ${waves}`,
    wind.includes("Non disponible") ? null : `Vent : ${wind}`,
    vis === "> 10 km" ? null : `Visibilité : ${vis}`,
    temp === "--°C" ? null : `Eau : ${temp}`
  ];

  return {
    sector: "",
    waves,
    wind,
    temp,
    vis,
    fullText: lines.filter(Boolean).join('\n')
  };
}
