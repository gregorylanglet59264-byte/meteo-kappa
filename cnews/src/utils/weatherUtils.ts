import type {
  WeatherClient,
  ParsedObservations,
  ParsedApiCities,
  ParsedForecastDay,
  ParsedPrecipitations,
  ParsedGusts,
  ParsedVigilance,
  VigilanceDepartment,
  ParsedTrend,
  ParsedTrendDay,
  VigilanceSection
} from '@/types/weather';

export function parseVigilance(text: string): ParsedVigilance | null {
  if (!text || text.trim().length === 0) return null;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let title = '';
  const sections: VigilanceSection[] = [];
  let currentSection: VigilanceSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('Vigilance météorologique')) {
      title = line.replace(/^⚠️\s*/, '');
      continue;
    }

    const levelMatchFull = line.match(/^(🟢|🟡|🟠|🔴)\s*Vigilance\s+(VERTE?|JAUNE|ORANGE|ROUGE)(.*)/i);
    if (levelMatchFull) {
      if (currentSection) sections.push(currentSection);

      const color = levelMatchFull[2].toUpperCase();
      let level: 'vert' | 'jaune' | 'orange' | 'rouge' = 'jaune';
      if (color === 'VERT' || color === 'VERTE') level = 'vert';
      else if (color === 'JAUNE') level = 'jaune';
      else if (color === 'ORANGE') level = 'orange';
      else if (color === 'ROUGE') level = 'rouge';

      const datePart = levelMatchFull[3].replace(/^[–-\s:]+/, '').trim();
      currentSection = {
        level,
        levelLabel: levelMatchFull[2],
        date: datePart,
        phenomena: '',
        description: '',
        departments: []
      };
      continue;
    }

    const levelMatchSimple = line.match(/^(VERTE?|JAUNE|ORANGE|ROUGE)\s*[–-]\s*(.+)/i);
    if (levelMatchSimple) {
      if (currentSection) sections.push(currentSection);
      const color = levelMatchSimple[1].toUpperCase();
      let level: 'vert' | 'jaune' | 'orange' | 'rouge' = 'jaune';
      if (color === 'VERT' || color === 'VERTE') level = 'vert';
      else if (color === 'JAUNE') level = 'jaune';
      else if (color === 'ORANGE') level = 'orange';
      else if (color === 'ROUGE') level = 'rouge';

      currentSection = {
        level,
        levelLabel: levelMatchSimple[1],
        date: levelMatchSimple[2].trim(),
        phenomena: '',
        description: '',
        departments: []
      };
      continue;
    }

    if (!currentSection) continue;

    if (line.toLowerCase().match(/^phénomène[s]?\s*concerné[s]?\s*:/i)) {
      currentSection.phenomena = line.replace(/^phénomène[s]?\s*concerné[s]?\s*:\s*/i, '');
      continue;
    }

    if (line.toLowerCase().includes('secteur concerné') || line.toLowerCase().includes('départements concernés')) continue;

    const deptMatch = line.match(/^(.+?)\s*\((\d{2}[AB]?)\)\s*[–-]\s*(.+)/);
    if (deptMatch) {
      currentSection.departments.push({
        name: deptMatch[1].trim(),
        code: deptMatch[2],
        phenomena: deptMatch[3].trim()
      });
      continue;
    }

    if (line.startsWith('→') || line.startsWith('➡️')) {
      const descText = line.replace(/^(→|➡️)\s*/, '');
      currentSection.description = currentSection.description ? currentSection.description + ' ' + descText : descText;
      continue;
    }

    if (line.length > 0) {
      currentSection.description = currentSection.description ? currentSection.description + '\n' + line : line;
    }
  }

  if (currentSection) sections.push(currentSection);
  return sections.length === 0 ? null : {
    title: title || 'Vigilance météorologique',
    sections
  };
}

export function parseTrendText(text: string): ParsedTrend | null {
  if (!text || text.trim().length === 0) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;

  let title = "Tendance nationale";
  const days: ParsedTrendDay[] = [];
  let startIndex = 0;

  if (lines[0].includes('Tendance') || lines[0].includes('📉')) {
    title = lines[0].replace(/^📉\s*/, '');
    startIndex = 1;
  }

  let currentDay = "";
  let currentDesc = "";

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const dayMatch = line.match(/^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+([^:]+)\s*:\s*(.*)/i);

    if (dayMatch) {
      if (currentDay) {
        days.push({ day: currentDay, description: currentDesc.trim() });
      }
      currentDay = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() + " " + dayMatch[2].trim();
      currentDesc = dayMatch[3].trim();
    } else if (currentDay) {
      currentDesc += (currentDesc ? '\n' : '') + line;
    }
  }

  if (currentDay) {
    days.push({ day: currentDay, description: currentDesc.trim() });
  }

  return days.length === 0 ? null : { title, days };
}

export function parseFormattedText(text: string): any {
  if (!text) return null;
  return text;
}

export const DEFAULT_CITIES = [
  { name: "St-Hilaire-sur-Helpe", dept: "59", lat: 50.1167, lon: 3.9167, selected: true },
  { name: "Valenciennes", dept: "59", lat: 50.3500, lon: 3.5167, selected: true },
  { name: "Troisvilles", dept: "59", lat: 50.1000, lon: 3.4600, selected: true },
  { name: "Maubeuge", dept: "59", lat: 50.2833, lon: 3.9667, selected: true },
  { name: "Douai", dept: "59", lat: 50.3667, lon: 3.0833, selected: true },
  { name: "Lille", dept: "59", lat: 50.6292, lon: 3.0573, selected: true },
  { name: "Roubaix", dept: "59", lat: 50.6942, lon: 3.1746, selected: true },
  { name: "Steenvoorde", dept: "59", lat: 50.8000, lon: 2.5833, selected: true },
  { name: "Watten", dept: "59", lat: 50.8333, lon: 2.2167, selected: true },
  { name: "Dunkerque", dept: "59", lat: 51.0343, lon: 2.3768, selected: true },
  { name: "Saulty", dept: "62", lat: 50.2100, lon: 2.5300, selected: true },
  { name: "Arras", dept: "62", lat: 50.2833, lon: 2.7833, selected: true },
  { name: "Fiefs", dept: "62", lat: 50.5000, lon: 2.3300, selected: true },
  { name: "Humières", dept: "62", lat: 50.3833, lon: 2.1800, selected: true },
  { name: "Cambrai / Epinoy", dept: "62", lat: 50.2300, lon: 3.1500, selected: true },
  { name: "Radinghem", dept: "62", lat: 50.5500, lon: 2.1167, selected: true },
  { name: "Attin", dept: "62", lat: 50.4833, lon: 1.7500, selected: true },
  { name: "Nielles-lès-Bléquin", dept: "62", lat: 50.6700, lon: 2.0200, selected: true },
  { name: "Bainghen", dept: "62", lat: 50.7500, lon: 1.9000, selected: true },
  { name: "Boulogne", dept: "62", lat: 50.7263, lon: 1.6147, selected: true },
  { name: "Calais / Marck", dept: "62", lat: 50.9500, lon: 1.8500, selected: true },
  { name: "Cap Gris-Nez", dept: "62", lat: 50.8667, lon: 1.5833, selected: true },
  { name: "Le Touquet", dept: "62", lat: 50.5167, lon: 1.5833, selected: true }
];

export function createDefaultClient(name: string): WeatherClient {
  return {
    name,
    brandColor: "#1e3a8a",
    cities: [...DEFAULT_CITIES],
    options: {
      showIcons: false,
      showFeelsLike: false,
      logoLeftUrl: "",
      showLogoLeft: false,
      logoRightUrl: "",
      showLogoRight: false,
      showCardLogo: false,
      cardLogoPosition: 'right',
      marineCityId: null
    },
    display: {
      marine: true,
      beach: true,
      mountain: false,
      precipitation: false,
      gusts: false,
      summaryImage: false,
      records: false,
      minObservations: true,
      showVigilanceMap: true,
      showForestMap: false,
      ephemeris: false,
      marineTable: true,
      showSurveillance: false,
      showVideo: false
    },
    form: {
      observationsRaw: `Le temps sera changeant.\nLille (59) Min 10 / Max 18 Rafales 45\nParis (75) Min 12 / Max 20`,
      alert: "⚠️ Pas de vigilance particulière.",
      alertImageUrl: "https://ubdevaemtwbzxksjlhjg.supabase.co/storage/v1/object/public/vigilance-captures/vigilance_france_latest.png",
      forestAlert: "",
      forestAlertImageUrl: "",
      forestAlertTitle: "Météo des forêts",
      forestAlertSource: "Météo-France — meteofrance.com/meteo-des-forets",
      todaySummary: "Temps calme.",
      summaryLancement: "",
      summaryTitle: "RÉSUMÉ DU JOUR",
      summaryMorning: "",
      summaryAfternoon: "",
      summaryTitle2: "",
      summaryMorning2: "",
      summaryAfternoon2: "",
      summaryMapUrl1: "https://ubdevaemtwbzxksjlhjg.supabase.co/storage/v1/object/public/vigilance-captures/arhome_max_france.png",
      summaryMapUrl2: "https://ubdevaemtwbzxksjlhjg.supabase.co/storage/v1/object/public/vigilance-captures/arhome_min_france.png",
      forecastRaw: "",
      forecastLancement: "",
      forecastMode: 'table' as const,
      forecastTextRaw: "",
      apiCityRaw: "",
      marine: "Mer agitée.",
      beach: "Drapeau vert.",
      mountain: "",
      mountainTitle: "🏔️ Météo des Montagnes",
      precipitationRaw: "",
      precipitationTitle: "CUMULS DE PRÉCIPITATIONS",
      gustsRaw: "",
      gustsTitle: "RAFALES MAXIMALES",
      summaryImages: [],
      recordsRaw: "",
      recordsTitle: "Phénomènes marquants et zones les plus exposées",
      alertTitle: "Phénomènes marquants et zones les plus exposées",
      minObservationsRaw: "",
      minObservationsTitle: "TEMPÉRATURES MINIMALES",
      bulletinDate: (() => {
        const t = new Date();
        t.setDate(t.getDate() + 1);
        return t.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      })(),
      observationsTitle: "TEMPÉRATURES MAXIMALES",
      summaryMapTitle1: "Carte des températures maximales",
      summaryMapMorningUrl1: "",
      summaryMapAfternoonUrl1: "",
      summaryMapTitle2: "Carte des températures minimales",
      summaryMapMorningUrl2: "",
      summaryMapAfternoonUrl2: "",
      ephemeris: "Lever: 07h00 - Coucher: 19h00 - Saint: Jean",
      surveillanceTitle: "SURVEILLANCE DES PHÉNOMÈNES IMPORTANTS",
      surveillanceItems: [],
      videoModuleTitle: "MÉTÉO EN VIDÉO",
      videoSource: 'url' as const,
      videoUrl: "",
      videoUploadUrl: "",
      videoThumbnailUrl: ""
    },
    sections: [
      { id: 'observations', title: 'Observations', icon: 'fa-eye', visible: true },
      { id: 'vigilance', title: 'Vigilance', icon: 'fa-exclamation-triangle', visible: true },
      { id: 'forests', title: 'Météo des Forêts', icon: 'fa-tree', visible: true },
      { id: 'surveillance', title: 'Surveillance', icon: 'fa-search-plus', visible: true },
      { id: 'summary', title: 'Résumé Journée', icon: 'fa-calendar-day', visible: true },
      { id: 'forecast', title: 'Tendance', icon: 'fa-chart-line', visible: true },
      { id: 'apiCities', title: 'Prévisions API', icon: 'fa-server', visible: true },
      { id: 'coastal', title: 'Infos Côtières', icon: 'fa-water', visible: true }
    ]
  };
}

export function getWeatherIcon(code: number): string {
  // Open-Meteo uses WMO weather codes
  if (code === 0) return "☀️";
  if (code >= 1 && code <= 3) return "⛅";
  if (code >= 45 && code <= 48) return "🌫️";

  // Drizzle / rain
  if (code >= 51 && code <= 57) return "🌧️";
  if (code >= 61 && code <= 67) return "🌧️";

  // Snow
  if (code >= 71 && code <= 77) return "🌨️";

  // Showers
  if (code >= 80 && code <= 84) return "🌦️";
  if (code >= 85 && code <= 86) return "🌨️"; // snow showers

  // Thunderstorm
  if (code >= 95 && code <= 99) return "⛈️";

  // Fallback: ensure we ALWAYS show something (prevents missing pictograms)
  return "☁️";
}

export function parseObservations(text: string): ParsedObservations {
  const regex = /([^\n()]+?)(?:\s*\(([^()]+)\))?\s*(-?\d+(?:[.,]\d+)?)/g;
  const cities: ParsedObservations['cities'] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    cities.push({ name: match[1].trim(), dept: match[2] || "", temp: match[3] });
  }

  // Sort cities by temperature from highest to lowest
  cities.sort((a, b) => parseInt(b.temp) - parseInt(a.temp));

  const introLine = text.split('\n')[0].includes("relève") ? text.split('\n')[0] : "";
  const mid = Math.ceil(cities.length / 2);
  return { intro: introLine, cities, col1: cities.slice(0, mid), col2: cities.slice(mid) };
}

export function parsePrecipitations(text: string): ParsedPrecipitations {
  const regex = /([^\n()]+?)(?:\s*\(([^()]+)\))?\s*(-?\d+(?:[.,]\d+)?)/g;
  const cities: ParsedPrecipitations['cities'] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    cities.push({ name: match[1].trim(), dept: match[2] || "", value: match[3] });
  }

  // Sort by value descending
  cities.sort((a, b) => parseFloat(b.value.replace(',', '.')) - parseFloat(a.value.replace(',', '.')));

  const mid = Math.ceil(cities.length / 2);
  return { cities, col1: cities.slice(0, mid), col2: cities.slice(mid) };
}

export function parseGusts(text: string): ParsedGusts {
  const regex = /([^\n()]+?)(?:\s*\(([^()]+)\))?\s*(-?\d+(?:[.,]\d+)?)/g;
  const cities: ParsedGusts['cities'] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    cities.push({ name: match[1].trim(), dept: match[2] || "", value: match[3] });
  }

  // Sort by value descending
  cities.sort((a, b) => parseFloat(b.value.replace(',', '.')) - parseFloat(a.value.replace(',', '.')));

  const mid = Math.ceil(cities.length / 2);
  return { cities, col1: cities.slice(0, mid), col2: cities.slice(mid) };
}

export function parseApiCities(text: string): ParsedApiCities {
  const lines = text.split('\n');
  const cities: ParsedApiCities['cities'] = [];

  lines.forEach(line => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    // On cherche d'abord les mots-clés pour être sûr que c'est une ligne de ville
    const minMatch = cleanLine.match(/Min\s*(-?\d+)/i);
    const maxMatch = cleanLine.match(/Max\s*(-?\d+)/i);
    const windMatch = cleanLine.match(/(Vent\s.+)$/i);
    
    // Si on n'a ni températures ni vent, ce n'est probablement pas une ville
    if (!minMatch && !maxMatch && !windMatch) return;

    // Le nom est ce qui se trouve avant la première parenthèse, crochet ou mot-clé
    // On utilise une recherche plus précise pour ne pas couper au milieu du nom
    const namePart = cleanLine.split(/\s*(?:[([/]|Min|Max|Vent)/i)[0].trim();
    if (!namePart) return;

    const deptMatch = cleanLine.match(/\(([^()]+)\)/);
    const iconMatch = cleanLine.match(/\[([^\]]+)\]/);
    const feelsMatch = cleanLine.match(/Ressenti\s*(-?\d+)/i);

    let windDisplay = windMatch ? windMatch[1] : '-';
    // Nettoyage du vent pour retirer les parties icon/ressenti qui pourraient être collées
    windDisplay = windDisplay.split(/Ressenti|\[/i)[0].trim();

    cities.push({
      name: namePart,
      dept: deptMatch ? deptMatch[1] : "",
      min: minMatch ? minMatch[1] : '?',
      max: maxMatch ? maxMatch[1] : '?',
      wind: windDisplay,
      feelsLike: feelsMatch ? feelsMatch[1] : null,
      icon: iconMatch ? iconMatch[1].trim() : null
    });
  });

  const mid = Math.ceil(cities.length / 2);
  return { cities, col1: cities.slice(0, mid), col2: cities.slice(mid) };
}

export function parseForecast(rawText: string): ParsedForecastDay[] {
  if (!rawText) return [];

  let cleanText = rawText.replace(/\t/g, '   ');
  const lines = cleanText.split('\n');
  const mergedDays: string[] = [];
  let currentEntry: string | null = null;
  const dayRegex = /^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+\d{1,2}/i;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    if (dayRegex.test(line)) {
      if (currentEntry) mergedDays.push(currentEntry);
      currentEntry = line;
    } else {
      if (currentEntry) currentEntry += " " + line;
    }
  });
  if (currentEntry) mergedDays.push(currentEntry);

  return mergedDays.map(fullLine => {
    const dateMatch = fullLine.match(dayRegex);
    const date = dateMatch ? dateMatch[0] : "J";
    let rest = fullLine.substring(date.length).trim();
    let temp = "";
    const tempMatch = rest.match(/(Min\s.*|Min\s?-?\d+.*)/i);
    if (tempMatch) {
      temp = tempMatch[0];
      rest = rest.substring(0, tempMatch.index).trim();
    } else {
      const numMatch = rest.match(/(-?\d+°.*)$/);
      if (numMatch) {
        temp = numMatch[0];
        rest = rest.substring(0, numMatch.index).trim();
      }
    }
    let wind = "-";
    let weather = rest;
    const windMatch = rest.match(/(Sud|Nord|Est|Ouest|Vent\s).*/i);
    if (windMatch) {
      wind = windMatch[0];
      weather = rest.substring(0, windMatch.index).trim();
    }
    return { date, weather, wind, temp };
  });
}

export function getApiDateLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

const STORAGE_KEY = 'weatherAppV17_Logos';

export function loadClientsFromStorage(): WeatherClient[] {
  const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('weatherAppV16');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : (parsed.clients || []);
    } catch (e) {
      console.error("Erreur lecture sauvegarde", e);
      return [];
    }
  }
  return [];
}

export function saveClientsToStorage(clients: WeatherClient[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

/**
 * Convertit une URL d'image distante en Data URL (Base64).
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erreur lors de la conversion de l'image en Base64 :", url, error);
    return url; // Retourne l'URL originale en cas d'échec
  }
}

/**
 * Parcourt un élément HTML, trouve toutes les images distantes et les remplace par leur version Base64.
 */
export async function processHtmlImages(element: HTMLElement): Promise<string> {
  // Cloner l'élément pour ne pas modifier le DOM réel
  const clone = element.cloneNode(true) as HTMLElement;
  const images = Array.from(clone.getElementsByTagName('img'));
  
  const promises = images.map(async (img) => {
    let src = img.getAttribute('src');
    if (src) {
      // If relative path, prefix with current origin to make it fetchable
      if (src.startsWith('/')) {
        src = window.location.origin + src;
      }

      if (src.startsWith('http')) {
        const base64 = await imageUrlToBase64(src);
        img.setAttribute('src', base64);
      }
    }
  });
  
  await Promise.all(promises);
  return clone.outerHTML;
}
