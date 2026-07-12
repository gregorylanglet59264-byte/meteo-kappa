import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { uploadPdfToStorage, uploadVideoToStorage, uploadImageToStorage } from '@/utils/storage';
import ClientList from '@/components/ClientList';
import Editor from '@/components/Editor';
import Preview from '@/components/Preview';
import CityModal from '@/components/CityModal';
import type { WeatherClient, City } from '@/types/weather';
import {
  createDefaultClient,
  getWeatherIcon,
  parseObservations,
  parseApiCities,
  parseForecast,
  parsePrecipitations,
  parseGusts,
  getApiDateLabel,
  loadClientsFromStorage,
  saveClientsToStorage,
  processHtmlImages
} from '@/utils/weatherUtils';
import { fetchVigilanceBulletin } from '@/utils/vigilanceSync';
import { saveClientsAsync, loadClientsAsync } from '@/utils/db';
import { getEphemeris, getTides } from '@/utils/ephemerisUtils';
import { getDicton } from '@/utils/dictons';

const API_CITY_COUNT = 30;

function pickRandomSubset<T>(items: T[], count: number): T[] {
  const arr = [...items];
  // Fisher–Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}

const Index = () => {
  const [savedClients, setSavedClients] = useState<WeatherClient[]>([]);
  const [currentClientIndex, setCurrentClientIndex] = useState(0);
  const [showCityModal, setShowCityModal] = useState(false);
  const [hasDoneInitialSync, setHasDoneInitialSync] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);

  // Selection currently used by the API block (so day changes can refresh values for the same communes)
  const [apiCitiesSelection, setApiCitiesSelection] = useState<City[]>([]);


  const migrateClient = useCallback((client: any): WeatherClient => {
    if (!client || typeof client !== 'object') return createDefaultClient("Nouveau Bulletin");

    // Deep clone to avoid mutating the source
    const newClient = JSON.parse(JSON.stringify(client));

    if (!newClient.options) newClient.options = {};
    if (!newClient.form) newClient.form = {};
    if (!newClient.display) newClient.display = {};
    const defaultSections: any[] = [
      { id: 'observations', title: 'Observations', icon: 'fa-eye', visible: true },
      { id: 'vigilance', title: 'Vigilance', icon: 'fa-exclamation-triangle', visible: true },
      { id: 'forests', title: 'Météo des Forêts', icon: 'fa-tree', visible: true },
      { id: 'surveillance', title: 'Surveillance', icon: 'fa-search-plus', visible: true },
      { id: 'summary', title: 'Résumé Journée', icon: 'fa-calendar-day', visible: true },
      { id: 'forecast', title: 'Tendance', icon: 'fa-chart-line', visible: true },
      { id: 'apiCities', title: 'Prévisions API', icon: 'fa-server', visible: true },
      { id: 'coastal', title: 'Infos Côtières', icon: 'fa-water', visible: true }
    ];

    if (!newClient.sections || !Array.isArray(newClient.sections) || newClient.sections.length === 0) {
      newClient.sections = defaultSections;
    } else {
      // Ensure all required sections exist even if some are present
      defaultSections.forEach(ds => {
        if (!newClient.sections.find((s: any) => s.id === ds.id)) {
          newClient.sections.push(ds);
        }
      });
    }

    if (!newClient.cities) newClient.cities = [];

    // Migrate options
    if (typeof newClient.options.showIcons === 'undefined') newClient.options.showIcons = false;
    if (typeof newClient.options.showFeelsLike === 'undefined') newClient.options.showFeelsLike = false;
    if (typeof newClient.options.logoLeftUrl === 'undefined') newClient.options.logoLeftUrl = "";
    if (typeof newClient.options.logoRightUrl === 'undefined') newClient.options.logoRightUrl = "";
    if (typeof newClient.options.showLogoLeft === 'undefined') newClient.options.showLogoLeft = false;
    if (typeof newClient.options.showLogoRight === 'undefined') newClient.options.showLogoRight = false;
    if (typeof newClient.options.showCardLogo === 'undefined') newClient.options.showCardLogo = false;
    if (typeof newClient.options.cardLogoPosition === 'undefined') newClient.options.cardLogoPosition = 'right';

    // Migrate form
    if (typeof newClient.form.observationsTitle === 'undefined' || newClient.form.observationsTitle?.includes(" Observations") || newClient.form.observationsTitle?.includes(" Prévisions")) {
      newClient.form.observationsTitle = "TEMPÉRATURES MAXIMALES";
    }
    if (typeof newClient.form.alertTitle === 'undefined') newClient.form.alertTitle = "Vigilance météorologique";
    if (typeof newClient.form.summaryMapTitle1 === 'undefined') newClient.form.summaryMapTitle1 = "Carte du jour";
    if (typeof newClient.form.summaryMapTitle2 === 'undefined') newClient.form.summaryMapTitle2 = "Carte du lendemain";
    if (typeof newClient.form.summaryMapMorningUrl1 === 'undefined') newClient.form.summaryMapMorningUrl1 = "";
    if (typeof newClient.form.summaryMapAfternoonUrl1 === 'undefined') newClient.form.summaryMapAfternoonUrl1 = "";
    if (typeof newClient.form.summaryMapMorningUrl2 === 'undefined') newClient.form.summaryMapMorningUrl2 = "";
    if (typeof newClient.form.summaryMapAfternoonUrl2 === 'undefined') newClient.form.summaryMapAfternoonUrl2 = "";
    if (typeof newClient.form.mountainTitle === 'undefined') newClient.form.mountainTitle = "🏔️ Météo des Montagnes";
    if (typeof newClient.form.minObservationsRaw === 'undefined') newClient.form.minObservationsRaw = "";
    if (typeof newClient.form.minObservationsTitle === 'undefined') newClient.form.minObservationsTitle = "TEMPÉRATURES MINIMALES";
    if (typeof newClient.form.precipitationRaw === 'undefined') newClient.form.precipitationRaw = "";
    if (typeof newClient.form.gustsRaw === 'undefined') newClient.form.gustsRaw = "";
    if (typeof newClient.form.forecastRaw === 'undefined') newClient.form.forecastRaw = "";
    if (typeof newClient.form.apiCityRaw === 'undefined') newClient.form.apiCityRaw = "";

    // Migrate display booleans
    const displayDefaults: Record<string, boolean> = {
      marine: true,
      beach: false,
      mountain: true,
      precipitation: true,
      gusts: true,
      summaryImage: true,
      records: true,
      minObservations: true,
      ephemeris: false,
      marineTable: true,
      showSurveillance: false,
      showVideo: false
    };

    Object.keys(displayDefaults).forEach(key => {
      if (typeof newClient.display[key] === 'undefined') {
        newClient.display[key] = displayDefaults[key];
      }
    });

    // Éphéméride doit être désactivée par défaut
    if (typeof newClient.display.ephemeris === 'undefined') {
      newClient.display.ephemeris = false;
    }

    if (!newClient.form.bulletinDate) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      newClient.form.bulletinDate = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Migrate vigilance options
    if (typeof newClient.options.vigilanceScope === 'undefined') newClient.options.vigilanceScope = 'national';
    if (typeof newClient.options.vigilanceRegionId === 'undefined') newClient.options.vigilanceRegionId = '';
    if (typeof newClient.options.marineCityId === 'undefined') newClient.options.marineCityId = null;
    if (typeof newClient.options.marineCity === 'undefined') newClient.options.marineCity = null;

    // Migrate new fields
    if (typeof newClient.form.ephemeris === 'undefined') newClient.form.ephemeris = "";
    if (typeof newClient.form.surveillanceTitle === 'undefined') newClient.form.surveillanceTitle = "SURVEILLANCE DES PHÉNOMÈNES IMPORTANTS";
    if (typeof newClient.form.surveillanceItems === 'undefined') newClient.form.surveillanceItems = [];
    if (typeof newClient.form.videoModuleTitle === 'undefined') newClient.form.videoModuleTitle = "MÉTÉO EN VIDÉO";
    if (typeof newClient.form.videoSource === 'undefined') newClient.form.videoSource = 'url';
    if (typeof newClient.form.videoUrl === 'undefined') newClient.form.videoUrl = "";
    if (typeof newClient.form.videoUploadUrl === 'undefined') newClient.form.videoUploadUrl = "";
    if (typeof newClient.form.videoThumbnailUrl === 'undefined') newClient.form.videoThumbnailUrl = "";

    return newClient as WeatherClient;
  }, []);

  const activeClient = useMemo(() => {
    if (savedClients.length === 0) return null;
    const idx = Math.min(Math.max(0, currentClientIndex), savedClients.length - 1);
    return savedClients[idx] || null;
  }, [savedClients, currentClientIndex]);

  const activeClientRef = useRef<WeatherClient | null>(null);
  const apiCitiesSelectionRef = useRef<City[]>([]);
  const savedClientsRef = useRef<WeatherClient[]>([]);
  const aromeRequestRef = useRef<boolean>(false);

  useEffect(() => {
    activeClientRef.current = activeClient;
  }, [activeClient]);

  useEffect(() => {
    apiCitiesSelectionRef.current = apiCitiesSelection;
  }, [apiCitiesSelection]);

  useEffect(() => {
    savedClientsRef.current = savedClients;
  }, [savedClients]);

  /* 
     DESACTIVATION DU CHARGEMENT AUTOMATIQUE
     Pour répondre à votre demande : l'application démarre maintenant VIDE.
     Les bulletins ne "restent plus en mémoire" au démarrage.
     Utilisez le bouton IMPORT pour charger vos données.
  */
  /*
  useEffect(() => {
    async function initStorage() {
      try {
        let clients = await loadClientsAsync();
        if (clients.length === 0) {
          const oldClients = loadClientsFromStorage();
          if (oldClients.length > 0) {
            localStorage.removeItem('weatherAppV17_Logos');
            localStorage.removeItem('weatherAppV16');
          }
        }
        if (clients.length > 0) {
          setSavedClients(clients.map(c => migrateClient(c)));
        } else {
          setSavedClients([]);
        }
      } catch (err) {
        console.error("Storage initialization error:", err);
      }
    }
    initStorage();
  }, [migrateClient]);
  */

  useEffect(() => {
    // MUST save even if empty, otherwise deleting the last client is never persisted!
    saveClientsAsync(savedClients).catch(e => {
      console.error("Failed to save to IndexedDB:", e);
    });
  }, [savedClients]);

  const apiDateLabel = useMemo(() => getApiDateLabel(selectedDayOffset), [selectedDayOffset]);

  const parsedObservations = useMemo(() => {
    try {
      if (!activeClient) return { intro: '', cities: [], col1: [], col2: [] };
      return parseObservations(activeClient.form.observationsRaw || '');
    } catch (e) {
      console.error("Error parsing observations:", e);
      return { intro: '', cities: [], col1: [], col2: [] };
    }
  }, [activeClient?.form.observationsRaw]);

  const parsedApiCities = useMemo(() => {
    try {
      if (!activeClient) return { cities: [], col1: [], col2: [] };
      return parseApiCities(activeClient.form.apiCityRaw || '');
    } catch (e) {
      console.error("Error parsing API cities:", e);
      return { cities: [], col1: [], col2: [] };
    }
  }, [activeClient?.form.apiCityRaw]);

  const parsedForecastData = useMemo(() => {
    try {
      if (!activeClient) return [];
      return parseForecast(activeClient.form.forecastRaw || '');
    } catch (e) {
      console.error("Error parsing forecast:", e);
      return [];
    }
  }, [activeClient?.form.forecastRaw]);

  const parsedPrecipitations = useMemo(() => {
    const empty = { cities: [], col1: [], col2: [], morning: [], afternoon: [] };
    try {
      if (!activeClient) return empty;
      const res = parsePrecipitations(activeClient.form.precipitationRaw || '');
      return { ...empty, ...res };
    } catch (e) {
      console.error("Error parsing precipitations:", e);
      return empty;
    }
  }, [activeClient?.form.precipitationRaw]);

  const parsedGusts = useMemo(() => {
    const empty = { cities: [], col1: [], col2: [], morning: [], afternoon: [] };
    try {
      if (!activeClient) return empty;
      const res = parseGusts(activeClient.form.gustsRaw || '');
      return { ...empty, ...res };
    } catch (e) {
      console.error("Error parsing gusts:", e);
      return empty;
    }
  }, [activeClient?.form.gustsRaw]);

  const parsedMinObservations = useMemo(() => {
    try {
      if (!activeClient) return { intro: '', cities: [], col1: [], col2: [] };
      return parseObservations(activeClient.form.minObservationsRaw || '');
    } catch (e) {
      console.error("Error parsing min observations:", e);
      return { intro: '', cities: [], col1: [], col2: [] };
    }
  }, [activeClient?.form.minObservationsRaw]);

  const addNewClient = useCallback(() => {
    const name = prompt("Nom du nouveau bulletin :", `Bulletin ${savedClients.length + 1}`);
    if (!name) return;
    setSavedClients(prev => [...prev, createDefaultClient(name)]);
    setCurrentClientIndex(savedClients.length);
  }, [savedClients.length]);

  const deleteClient = useCallback((index: number) => {
    if (confirm("Supprimer ce bulletin ?")) {
      setSavedClients(prev => {
        const updated = prev.filter((_, i) => i !== index);
        return updated;
      });

      setCurrentClientIndex(prev => {
        if (prev >= savedClients.length - 1) {
          return Math.max(0, savedClients.length - 2);
        }
        return prev;
      });
    }
  }, [savedClients.length]);

  const selectClient = useCallback((index: number) => {
    setCurrentClientIndex(index);
  }, []);

  const updateActiveClient = useCallback((updatedClient: WeatherClient) => {
    setSavedClients(prev => {
      const newClients = [...prev];
      newClients[currentClientIndex] = updatedClient;
      return newClients;
    });
  }, [currentClientIndex]);

  const exportAllClients = useCallback(() => {
    const data = { version: "v17_logos", clients: savedClients };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MES_BULLETINS_V17_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }, [savedClients]);

  const importAllClients = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mode remplacement direct par défaut
    const mode = 'replace';

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target?.result as string);
        const incomingClients = Array.isArray(d) ? d : (d.clients || []);

        if (Array.isArray(incomingClients) && incomingClients.length > 0) {
          const migratedClients = incomingClients
            .filter((c: any) => c && typeof c === 'object')
            .map((client: any) => migrateClient(client));

          setSavedClients(migratedClients);
          setCurrentClientIndex(0);
        } else {
          alert("Le fichier JSON ne contient pas de bulletins valides.");
        }
      } catch (err) {
        console.error('Import error:', err);
        alert("Fichier JSON invalide");
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  }, []);

  // Clear API selection when switching bulletin
  useEffect(() => {
    setApiCitiesSelection([]);
  }, [currentClientIndex]);

  const fetchOpenMeteoForCities = useCallback(
    async (citiesForApi: City[], dayOffset: number, clientIndex: number, useArome: boolean = false) => {
      // Read client from ref to avoid depending on savedClients
      const allClients = savedClientsRef.current;
      const client = allClients[clientIndex];
      if (!client || citiesForApi.length === 0) {
        alert("Ajoutez des villes d'abord !");
        return;
      }

      setIsLoading(true);

      const lats = citiesForApi.map(x => x.lat).join(',');
      const lons = citiesForApi.map(x => x.lon).join(',');
      const idx = dayOffset;

      // Use ECMWF model (IFS 0.25°) for all days
      const models = useArome ? "&models=ecmwf_ifs025" : "";
      const modelLabel = 'ecmwf_ifs025';

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,weather_code,apparent_temperature_max,precipitation_sum&timezone=Europe%2FParis&forecast_days=8${models}`;

      try {
        const res = await fetch(url);
        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error(`Erreur serveur (${res.status})`);
        }
        const data = await res.json();

        if (data.error) {
          throw new Error(data.reason || "Erreur API");
        }

        const results = Array.isArray(data) ? data : [data];

        let apiCityText = "";
        let rainText = "";
        let gustsText = "";
        let obsMaxText = "";
        let obsMinText = "";

        const clientSnapshot = savedClientsRef.current[clientIndex];

        results.forEach((r, i) => {
          const city = citiesForApi[i];
          if (!city || !r.daily) return;

          const d = r.daily;

          // Helper to get value for a property, trying best models first
          const getVal = (prop: string) => {
            const searchOrder = useArome
              ? [`${prop}_ecmwf_ifs025`, prop]
              : [prop];

            for (const key of searchOrder) {
              if (d[key] !== undefined && d[key][idx] !== null && d[key][idx] !== undefined) {
                return d[key][idx];
              }
            }
            return 0; // Fallback
          };

          const min = Math.round(getVal('temperature_2m_min'));
          const max = Math.round(getVal('temperature_2m_max'));
          const wind = Math.round(getVal('wind_speed_10m_max'));
          const gust = Math.round(getVal('wind_gusts_10m_max'));
          const feels = Math.round(getVal('apparent_temperature_max'));
          const code = getVal('weather_code');
          const rainVal = getVal('precipitation_sum');
          const rain = rainVal !== undefined ? Number(rainVal).toFixed(1) : "0.0";


          // Clean dept: only if it's a number (avoid region names)
          const dept = city.dept && /^\d{1,3}[AB]?$/.test(city.dept) ? city.dept : "";
          const deptStr = dept ? ` (${dept})` : "";

          // Line for apiCityRaw (Detailed Table) - Clean format: City [Icon] (Metrics)
          let line = city.name;
          const icon = getWeatherIcon(code);
          if (icon) line += ` [${icon}]`;

          line += ` (Min ${min} / Max ${max} Vent ${wind} km/h`;
          if (gust > wind) line += ` (Rafales ${gust} km/h)`;
          if (clientSnapshot?.options.showFeelsLike && Math.abs(feels - max) >= 2) {
            line += ` Ressenti ${feels}`;
          }
          line += `)`;

          apiCityText += line + "\n";

          // Line for precipitationRaw (Include all cities, even if 0mm)
          const roundedRain = Math.round(Number(rainVal || 0));
          rainText += `${city.name}${deptStr} ${roundedRain}mm\n`;

          // Line for gustsRaw (Round to nearest 5, include all cities)
          const roundedGust = Math.round(gust / 5) * 5;
          gustsText += `${city.name}${deptStr} ${roundedGust}\n`;

          // Line for observationsRaw (Max)
          obsMaxText += `${city.name}${deptStr} ${max}\n`;
          // Line for observationsRaw (Min)
          obsMinText += `${city.name}${deptStr} ${min}\n`;
        });

        // Automatisation des Ephémérides et Marées pour le premier lieu sélectionné (référence)
        let ephText = "";
        let tideText = "";
        let refCityName = "";
        if (citiesForApi.length > 0) {
          const options = savedClientsRef.current[clientIndex].options;
          const refCity = options.marineCity || (options.marineCityId !== null && options.marineCityId !== undefined && citiesForApi[options.marineCityId]) || citiesForApi[0];
            
          refCityName = refCity.name;
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + idx);
          
          const ephemeris = getEphemeris(refCity.lat, refCity.lon, targetDate);
          const dicton = getDicton(targetDate);
          ephText = `📅 ÉPHÉMÉRIDE DU ${targetDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}\n` +
                    `☀️ SOLEIL : Lever ${ephemeris.sunrise} • Coucher ${ephemeris.sunset} • Zénith ${ephemeris.solarNoon}\n` +
                    `⏱️ JOUR : Durée ${ephemeris.dayLength} (${ephemeris.dayLengthDiff})\n` +
                    `🌙 LUNE : Lever ${ephemeris.moonRise} • Coucher ${ephemeris.moonSet}\n` +
                    `😇 SAINT DU JOUR : ${ephemeris.saint}\n` +
                    `💬 DICTON : "${dicton}"`;
          
          const stats = await getTides(refCity.lat, refCity.lon, targetDate);
          tideText = stats.fullText;
          const marineStats = { ...stats, sector: refCityName.toUpperCase() };

          setSavedClients(prev => {
            if (clientIndex >= prev.length) return prev;
            const newClients = [...prev];
            const currentForm = prev[clientIndex].form;

            const marineText = currentForm.marine;

            newClients[clientIndex] = {
              ...prev[clientIndex],
              form: {
                ...currentForm,
                apiCityRaw: apiCityText,
                ...(useArome ? {
                  precipitationRaw: rainText || currentForm.precipitationRaw,
                  precipitationTitle: `CUMULS DE PRÉCIPITATIONS PRÉVUS POUR CE ${getApiDateLabel(idx).toUpperCase()}`,
                  gustsRaw: gustsText || currentForm.gustsRaw,
                  gustsTitle: `RAFALES MAXIMALES PRÉVUES POUR CE ${getApiDateLabel(idx).toUpperCase()}`,
                  observationsRaw: obsMaxText || currentForm.observationsRaw,
                  observationsTitle: `TEMPÉRATURES MAXIMALES PRÉVUES POUR CE ${getApiDateLabel(idx).toUpperCase()}`,
                  minObservationsRaw: obsMinText || currentForm.minObservationsRaw,
                  minObservationsTitle: `TEMPÉRATURES MINIMALES PRÉVUES POUR CE ${getApiDateLabel(idx).toUpperCase()}`,
                  mountainTitle: `🏔️ MÉTÉO DES MONTAGNES DU ${getApiDateLabel(idx).toUpperCase()}`,
                  bulletinDate: getApiDateLabel(idx),
                  ephemeris: ephText || currentForm.ephemeris,
                  marine: tideText || currentForm.marine
                } : {
                  ephemeris: ephText || currentForm.ephemeris,
                  marine: tideText || currentForm.marine
                })
              },
              display: {
                ...prev[clientIndex].display,
                marine: !!tideText, // Auto-toggle marine only if we have data (coastal)
                ...(useArome ? {
                  precipitation: false,
                  gusts: false,
                  minObservations: true,
                  observations: true
                } : {})
              }
            };
            return newClients;
          });
        }
      } catch (e: any) {
        console.error(e);
        alert(`Erreur API : ${e.message || "Problème de connexion"}`);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const selection = apiCitiesSelectionRef.current;
    if (selection.length === 0) return;

    // Check if we requested AROME (J+1 automated update)
    const useArome = aromeRequestRef.current;
    aromeRequestRef.current = false; // Reset for next time

    fetchOpenMeteoForCities(selection, selectedDayOffset, currentClientIndex, useArome);
  }, [selectedDayOffset, fetchOpenMeteoForCities]);

  const handleFetchApi = useCallback(() => {
    const client = savedClientsRef.current[currentClientIndex];
    if (!client) return;

    const selection = pickRandomSubset(client.cities, API_CITY_COUNT);
    setApiCitiesSelection(selection);
    fetchOpenMeteoForCities(selection, selectedDayOffset, currentClientIndex);
  }, [fetchOpenMeteoForCities, selectedDayOffset, currentClientIndex]);

  const handleAromeFetch = useCallback(() => {
    handleSmartFetch(1);
  }, []);

  // Smart fetch: uses ECMWF
  const handleSmartFetch = useCallback((dayOffset: number) => {
    const client = savedClientsRef.current[currentClientIndex];
    if (!client) return;
    const selection = client.cities.slice(0, 30);
    setApiCitiesSelection(selection);

    // Set ref to ensure the useEffect (which handles date changes) uses useArome=true
    aromeRequestRef.current = true;

    if (dayOffset === selectedDayOffset) {
      // If date hasn't changed, the useEffect won't trigger, so call directly
      fetchOpenMeteoForCities(selection, dayOffset, currentClientIndex, true);
      aromeRequestRef.current = false;
    } else {
      // If date changes, the useEffect will trigger and use the ref we just set
      setSelectedDayOffset(dayOffset);
    }
  }, [fetchOpenMeteoForCities, currentClientIndex, selectedDayOffset]);

  const handleSyncVigilance = useCallback(async (overrideOffset?: number) => {
    setIsLoading(true);
    try {
      const client = activeClientRef.current;
      if (!client) return;

      const offset = overrideOffset !== undefined ? overrideOffset : selectedDayOffset;
      const scope = client.options.vigilanceScope || 'national';
      const regionId = scope === 'regional' ? client.options.vigilanceRegionId : null;

      // Utiliser l'offset (0 pour aujourd'hui, 1 pour demain)
      const bulletin = await fetchVigilanceBulletin(offset, regionId || null);

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + offset);
      const dateStr = targetDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const fixedTitle = `Vigilance pour ce ${dateStr}`;

      let fileName = "";
      if (offset === 0) {
        fileName = scope === 'regional' && regionId ? `vigilance_region_${regionId}_today.png` : `vigilance_france_today.png`;
      } else if (offset === 1) {
        fileName = scope === 'regional' && regionId ? `vigilance_region_${regionId}_tomorrow.png` : `vigilance_france_tomorrow.png`;
      } else {
        fileName = scope === 'regional' && regionId ? `vigilance_region_${regionId}_latest.png` : `vigilance_france_latest.png`;
      }

      const imageUrl = `https://ubdevaemtwbzxksjlhjg.supabase.co/storage/v1/object/public/vigilance-captures/${fileName}?t=${Date.now()}`;

      updateActiveClient({
        ...client,
        form: {
          ...client.form,
          alert: bulletin,
          alertTitle: fixedTitle,
          alertImageUrl: imageUrl
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [updateActiveClient, selectedDayOffset]);
 
  const handleSyncForests = useCallback((scope: 'national' | 'regional', regionId: string) => {
    const client = activeClientRef.current;
    if (!client) return;

    let fileName = "";
    if (scope === 'regional' && regionId) {
      fileName = `vigilance_foret_region_${regionId}_tomorrow.png`;
    } else {
      fileName = `vigilance_foret_tomorrow.png`;
    }

    const imageUrl = `https://ubdevaemtwbzxksjlhjg.supabase.co/storage/v1/object/public/vigilance-captures/${fileName}?t=${Date.now()}`;

    updateActiveClient({
      ...client,
      form: {
        ...client.form,
        forestAlertImageUrl: imageUrl
      }
    });
  }, [updateActiveClient]);



  const handleVideoUpload = useCallback(async (file: File) => {
    const client = activeClientRef.current;
    if (!client || !file) return;

    setIsLoading(true);
    try {
      const filename = `videohdf`;
      const url = await uploadVideoToStorage(file, filename);

      updateActiveClient({
        ...client,
        form: {
          ...client.form,
          videoUploadUrl: url,
          videoSource: 'upload'
        }
      });
      alert("Vidéo mise en ligne avec succès !");
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'upload de la vidéo : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateActiveClient]);

  const handleVideoThumbnailUpload = useCallback(async (file: File) => {
    const client = activeClientRef.current;
    if (!client || !file) return;

    setIsLoading(true);
    try {
      const filename = `video-thumbnail-${Date.now()}.png`;
      const url = await uploadImageToStorage(file, filename);

      updateActiveClient({
        ...client,
        form: {
          ...client.form,
          videoThumbnailUrl: url
        }
      });
      alert("Miniature mise en ligne !");
    } catch (err: any) {
      console.error(err);
      alert("Erreur upload miniature : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateActiveClient]);

  // Initial sync on startup
  useEffect(() => {
    if (!hasDoneInitialSync && activeClient && !isLoading) {
      setHasDoneInitialSync(true);
      // Small delay to ensure state is ready
      setTimeout(() => {
        // Au démarrage, on initialise tout sur J+1 par défaut
        handleSyncVigilance(1);
        handleSmartFetch(1);
      }, 800);
    }
  }, [activeClient, hasDoneInitialSync, isLoading, handleSyncVigilance, handleSmartFetch]);


  const handleRandomCities = useCallback(() => {
    // Same behavior as refresh: new random selection + API refresh
    handleFetchApi();
  }, [handleFetchApi]);

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = event.target.files?.[0];
    const client = activeClientRef.current;
    if (!file || !client) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Attention : L'image est volumineuse (> 2Mo). Cela peut ralentir la sauvegarde.");
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (side === 'left') {
        updateActiveClient({
          ...client,
          options: {
            ...client.options,
            logoLeftUrl: result,
            showLogoLeft: true
          }
        });
      } else {
        updateActiveClient({
          ...client,
          options: {
            ...client.options,
            logoRightUrl: result,
            showLogoRight: true
          }
        });
      }
    };
    reader.readAsDataURL(file);
  }, [updateActiveClient]);

  const addCity = useCallback((city: City) => {
    if (!activeClient) return;
    updateActiveClient({
      ...activeClient,
      cities: [...activeClient.cities, city]
    });
  }, [activeClient, updateActiveClient]);

  const removeCity = useCallback((idx: number) => {
    if (!activeClient) return;
    updateActiveClient({
      ...activeClient,
      cities: activeClient.cities.filter((_, i) => i !== idx)
    });
  }, [activeClient, updateActiveClient]);

  const copyToClipboard = useCallback(async () => {
    const el = document.getElementById('email-content');
    if (!el) return;

    setIsLoading(true);
    try {
      // Intégrer les images en Base64 pour que la copie soit complète
      const htmlWithImages = await processHtmlImages(el);
      
      // Utiliser un élément temporaire pour ne pas polluer l'UI mais permettre la sélection
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.innerHTML = htmlWithImages;
      document.body.appendChild(tempDiv);

      const range = document.createRange();
      range.selectNode(tempDiv);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand('copy');
      
      document.body.removeChild(tempDiv);
      window.getSelection()?.removeAllRanges();
      
      alert('Bulletin Copié (images intégrées) !');
    } catch (err) {
      console.error("Erreur copie visuelle:", err);
      alert("Erreur lors de la préparation des images. Copie standard effectuée.");
      // Fallback simple
      const range = document.createRange();
      range.selectNode(el);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand('copy');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const copySourceCode = useCallback(async () => {
    const el = document.getElementById('email-content');
    if (!el) return;

    setIsLoading(true);
    try {
      const htmlWithImages = await processHtmlImages(el);
      await navigator.clipboard.writeText(htmlWithImages);
      alert('Code Source HTML Copié (images intégrées) !');
    } catch (err) {
      console.error("Erreur copie code:", err);
      const html = el.outerHTML;
      await navigator.clipboard.writeText(html);
      alert('Code Source HTML Copié (images non intégrées)');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportToPDF = useCallback(() => {
    if (!activeClient) return;
    const element = document.getElementById('email-content');
    if (!element) return;

    // --- Injection temporaire de styles anti-coupure pour l'export PDF ---
    // On cible tous les blocs de contenu afin d'éviter les coupures de page
    // en plein milieu d'une section (espace blanc ou chevauchement).
    const styleId = '__pdf_export_style__';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      /* Chaque section majeure commence sur une nouvelle page pour éviter les coupures */
      .pdf-section {
        page-break-before: always !important;
        break-before: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 12px !important;
      }
      /* La première section ne doit pas commencer par une page blanche */
      .pdf-section:first-child {
        page-break-before: auto !important;
        break-before: auto !important;
      }

      /* Le Résumé global peut être coupé s'il est trop long, 
         mais il doit commencer sur une nouvelle page */
      .pdf-summary-block {
        page-break-before: always !important;
        break-before: page !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }

      /* Empêcher les lignes de texte de se chevaucher ou de se couper */
      #email-content p, 
      #email-content div,
      #email-content td {
        line-height: normal !important;
        word-break: break-word !important;
      }

      /* Empêcher les cellules de tableau de se couper en plein milieu */
      #email-content tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      /* Titres : rester avec le contenu qui suit */
      #email-content h2,
      #email-content h3 {
        page-break-after: avoid !important;
        break-after: avoid !important;
        margin-top: 15px !important;
      }

      #email-content {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }

      /* Nettoyage fin de document */
      #email-content > div:last-child,
      #email-content > table:last-child {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
      }
    `;

    const opt = {
      margin: [10, 5, 10, 5] as [number, number, number, number],
      filename: `Bulletin_${activeClient.name}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.85 },
      html2canvas: {
        scale: 1.6,
        useCORS: true,
        scrollY: 0,
        windowWidth: 700,
        logging: false,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4',
        orientation: 'portrait' as const,
        compress: true,
      },
      pagebreak: {
        mode: ['css', 'legacy'] as string[],
      }
    };

    setTimeout(() => {
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          // Nettoyage : on retire le style injecté après l'export
          if (styleEl) styleEl.textContent = '';
        });
    }, 1000);
  }, [activeClient]);

  const uploadToOnline = useCallback(async () => {
    if (!activeClient) return;
    const element = document.getElementById('email-content');
    if (!element) return;

    // --- Injection temporaire de styles anti-coupure pour l'export PDF (idem exportToPDF) ---
    const styleId = '__pdf_export_style__';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .pdf-section { page-break-inside: avoid !important; break-inside: avoid !important; margin-bottom: 12px !important; }
      .pdf-summary-block { page-break-before: always !important; break-before: page !important; page-break-inside: auto !important; break-inside: auto !important; }
      #email-content p, #email-content div, #email-content td { line-height: normal !important; word-break: break-word !important; }
      #email-content tr { page-break-inside: avoid !important; break-inside: avoid !important; }
      #email-content h2, #email-content h3 { page-break-after: avoid !important; break-after: avoid !important; margin-top: 15px !important; }
      #email-content { page-break-inside: auto !important; break-inside: auto !important; }
      #email-content > div:last-child, #email-content > table:last-child { margin-bottom: 0 !important; padding-bottom: 0 !important; }
    `;

    const opt = {
      margin: [10, 5, 10, 5] as [number, number, number, number],
      filename: `Bulletin_${activeClient.name}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.85 },
      html2canvas: { scale: 1.6, useCORS: true, scrollY: 0, windowWidth: 700, logging: false, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const, compress: true },
      pagebreak: { mode: ['css', 'legacy'] as string[] }
    };

    setIsLoading(true);
    try {
      // Petite attente pour laisser le navigateur stabiliser le layout après setIsLoading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 1. Générer le blob en mémoire
      const worker = html2pdf().set(opt).from(element);
      const pdfBlob = await worker.output('blob');

      try {
        // 2. Tenter l'upload sur Supabase
        const cleanFileName = `bulletin.pdf`;
        const publicUrl = await uploadPdfToStorage(pdfBlob, cleanFileName);

        // Succès : Lien court Vercel
        const shortUrl = `${window.location.origin}/bulletin`;
        try {
          await navigator.clipboard.writeText(shortUrl);
        } catch (clipErr) {
          console.warn("Clipboard copy blocked by environment:", clipErr);
        }
        alert(`✅ BULLETIN EN LIGNE ET COPIÉ !\n\nLien court : ${shortUrl}`);
        
        // On ouvre aussi le PDF pour vérification
        window.open(URL.createObjectURL(pdfBlob), '_blank');

      } catch (uploadErr: any) {
        console.error("Upload failed details:", uploadErr);
        
        // ÉCHEC UPLOAD (Sécurité Supabase) -> Fallback Ouverture directe
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        
        alert(`⚠️ LE PDF A ÉTÉ GÉNÉRÉ MAIS L'UPLOAD A ÉCHOUÉ.\n\nDétails de l'erreur : ${uploadErr.message || JSON.stringify(uploadErr)}\n\nLe bulletin s'est ouvert dans un nouvel onglet.`);
      }

    } catch (err: any) {
      console.error(err);
      alert(`Erreur de génération : ${err.message || 'Problème technique'}`);
    } finally {
      setIsLoading(false);
      if (styleEl) styleEl.textContent = '';
    }
  }, [activeClient]);

  return (
    <div className="w-full h-screen flex text-sm overflow-hidden">
      <ClientList
        clients={savedClients}
        currentIndex={currentClientIndex}
        onSelect={selectClient}
        onAdd={addNewClient}
        onDelete={deleteClient}
        onExport={exportAllClients}
        onImport={importAllClients}
      />

      {activeClient ? (
        <>
          <Editor
            client={activeClient}
            selectedDayOffset={selectedDayOffset}
            isLoading={isLoading}
            onClientChange={updateActiveClient}
            onFetchApi={handleFetchApi}
            onShowCityModal={() => setShowCityModal(true)}
            onLogoUpload={handleLogoUpload}
            onRandomCities={handleRandomCities}
            onAromeFetch={handleAromeFetch}
            onSmartFetch={handleSmartFetch}
            onSyncVigilance={handleSyncVigilance}
            onSyncForests={handleSyncForests}
            onVideoUpload={handleVideoUpload}
            onVideoThumbnailUpload={handleVideoThumbnailUpload}
          />
          <Preview
            client={activeClient}
            apiDateLabel={activeClient.form.bulletinDate || apiDateLabel}
            parsedObservations={parsedObservations}
            parsedApiCities={parsedApiCities}
            parsedForecast={parsedForecastData}
            parsedPrecipitations={parsedPrecipitations}
            parsedGusts={parsedGusts}
            parsedMinObservations={parsedMinObservations}
            onCopyVisual={copyToClipboard}
            onCopyCode={copySourceCode}
            onExportPdf={exportToPDF}
            onUploadToOnline={uploadToOnline}
            onClientChange={updateActiveClient}
          />
          <CityModal
            isOpen={showCityModal}
            clientName={activeClient.name}
            cities={activeClient.cities}
            onClose={() => setShowCityModal(false)}
            onAddCity={addCity}
            onRemoveCity={removeCity}
          />
        </>
      ) : (
        <>
          <div className="w-[480px] bg-slate-50 flex items-center justify-center border-r border-slate-200">
            <div className="text-slate-400 text-center">
              <i className="fas fa-arrow-left text-2xl mb-2"></i>
              <p>
                Sélectionnez un client
                <br />ou créez-en un nouveau.
              </p>
            </div>
          </div>
          <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center">
            <i className="fas fa-arrow-left text-4xl mb-4 animate-bounce text-slate-400"></i>
            <p className="text-lg text-slate-400">Sélectionnez un bulletin à gauche</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;

