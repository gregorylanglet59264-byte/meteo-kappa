export interface City {
  name: string;
  dept: string;
  lat: number;
  lon: number;
  selected?: boolean;
}

export interface Section {
  id: 'observations' | 'vigilance' | 'surveillance' | 'summary' | 'forecast' | 'apiCities' | 'coastal' | 'forests';
  title: string;
  icon: string;
  visible: boolean;
}

export interface ClientOptions {
  showIcons: boolean;
  showFeelsLike: boolean;
  logoLeftUrl: string;
  showLogoLeft: boolean;
  logoRightUrl: string;
  showLogoRight: boolean;
  showCardLogo: boolean;
  cardLogoPosition: 'left' | 'right';
  vigilanceScope?: 'national' | 'regional';
  vigilanceRegionId?: string;
  marineCityId?: number | null;
  marineCity?: City | null;
  isSoireeMode?: boolean;
}

export interface ClientDisplay {
  marine: boolean;
  beach: boolean;
  mountain: boolean;
  precipitation: boolean;
  gusts: boolean;
  summaryImage: boolean;
  records: boolean;
  minObservations: boolean;
  showVigilanceMap: boolean;
  showForestMap: boolean;
  ephemeris: boolean;
  marineTable: boolean;
  showSurveillance: boolean;
  showVideo: boolean;
}

export interface SummaryImage {
  id: string;
  url: string;
  title: string;
}

export interface ClientForm {
  observationsRaw: string;
  alert: string;
  alertImageUrl: string;
  todaySummary: string;
  summaryLancement: string;
  summaryTitle: string;
  summaryMorning: string;
  summaryAfternoon: string;
  summaryTitle2: string;
  summaryMorning2: string;
  summaryAfternoon2: string;
  summaryMapUrl1: string;
  summaryMapUrl2: string;
  forecastRaw: string;
  forecastLancement: string;
  forecastMode: 'table' | 'text';
  forecastTextRaw: string;
  apiCityRaw: string;
  marine: string;
  marineStats?: { 
    waves: string; 
    wind: string; 
    temp: string; 
    vis: string; 
    sector: string;
  };
  beach: string;
  mountain: string;
  precipitationRaw: string;
  precipitationTitle: string;
  gustsRaw: string;
  gustsTitle: string;
  summaryImages: SummaryImage[];
  recordsRaw: string;
  recordsTitle: string;
  alertTitle: string;
  minObservationsRaw: string;
  minObservationsTitle: string;
  bulletinDate: string;
  observationsTitle: string;
  summaryMapTitle1: string;
  summaryMapMorningUrl1: string;
  summaryMapAfternoonUrl1: string;
  summaryMapTitle2: string;
  summaryMapMorningUrl2: string;
  summaryMapAfternoonUrl2: string;
  mountainTitle: string;
  ephemeris: string;
  surveillanceTitle: string;
  surveillanceItems: { id: string; type: 'text' | 'image'; content: string; title?: string }[];
  videoModuleTitle: string;
  videoSource: 'url' | 'upload';
  videoUrl: string;
  videoUploadUrl: string;
  videoThumbnailUrl: string;
  forestAlert: string;
  forestAlertImageUrl: string;
  forestAlertTitle: string;
  forestAlertSource: string;
}

export interface WeatherClient {
  name: string;
  brandColor: string;
  cities: City[];
  options: ClientOptions;
  display: ClientDisplay;
  form: ClientForm;
  sections: Section[];
}

export interface ParsedObservation {
  name: string;
  dept: string;
  temp: string;
}

export interface ParsedObservations {
  intro: string;
  cities: ParsedObservation[];
  col1: ParsedObservation[];
  col2: ParsedObservation[];
}

export interface ParsedPrecipitation {
  name: string;
  dept: string;
  value: string;
}

export interface ParsedPrecipitations {
  cities: ParsedPrecipitation[];
  col1: ParsedPrecipitation[];
  col2: ParsedPrecipitation[];
}

export interface ParsedGust {
  name: string;
  dept: string;
  value: string;
}

export interface ParsedGusts {
  cities: ParsedGust[];
  col1: ParsedGust[];
  col2: ParsedGust[];
}

export interface ParsedApiCity {
  name: string;
  dept: string;
  min: string;
  max: string;
  wind: string;
  feelsLike: string | null;
  icon: string | null;
}

export interface ParsedApiCities {
  cities: ParsedApiCity[];
  col1: ParsedApiCity[];
  col2: ParsedApiCity[];
}

export interface ParsedForecastDay {
  date: string;
  weather: string;
  wind: string;
  temp: string;
}

export interface VigilanceDepartment {
  name: string;
  code: string;
  phenomena: string;
}

export interface VigilanceSection {
  level: 'vert' | 'jaune' | 'orange' | 'rouge';
  levelLabel: string;
  date: string;
  phenomena: string;
  description: string;
  departments: VigilanceDepartment[];
}

export interface ParsedVigilance {
  title: string;
  sections: VigilanceSection[];
}

export interface ParsedTrendDay {
  day: string;
  description: string;
}

export interface ParsedTrend {
  title: string;
  days: ParsedTrendDay[];
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country_code: string;
}
