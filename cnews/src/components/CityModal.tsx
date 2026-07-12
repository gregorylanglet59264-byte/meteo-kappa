import React, { useState } from 'react';
import type { City, GeocodingResult } from '@/types/weather';

interface CityModalProps {
  isOpen: boolean;
  clientName: string;
  cities: City[];
  onClose: () => void;
  onAddCity: (city: City) => void;
  onRemoveCity: (index: number) => void;
}

const CityModal: React.FC<CityModalProps> = ({
  isOpen,
  clientName,
  cities,
  onClose,
  onAddCity,
  onRemoveCity
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchCity = async () => {
    if (searchQuery.length < 2) return;
    setIsSearching(true);
    try {
      // Check if search query is a postal code (French postal codes are 5 digits)
      const isPostalCode = /^\d{5}$/.test(searchQuery.trim());
      
      let url: string;
      if (isPostalCode) {
        // Use French government API for postal code search
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?codePostal=${searchQuery.trim()}&fields=nom,code,codesPostaux,centre&format=json`
        );
        const communes = await res.json();
        
        // Convert to GeocodingResult format
        const results: GeocodingResult[] = communes.map((c: any, idx: number) => ({
          id: idx,
          name: c.nom,
          latitude: c.centre?.coordinates?.[1] || 0,
          longitude: c.centre?.coordinates?.[0] || 0,
          admin1: c.codesPostaux?.[0] || '',
          country_code: 'FR'
        }));
        setSearchResults(results);
      } else {
        // Use Open-Meteo for name search
        url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchQuery
        )}&count=10&language=fr&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        const filtered = (data.results || []).filter((r: any) => r.country_code === 'FR');
        setSearchResults(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCity = (result: GeocodingResult) => {
    onAddCity({
      name: result.name,
      dept: result.admin1 || result.country_code,
      lat: result.latitude,
      lon: result.longitude
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[600px] flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-700">
            Gérer les villes de : <span className="text-blue-600">{clientName}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Selected cities */}
          <div className="w-1/2 border-r p-4 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-bold text-slate-400 uppercase">
                Villes sélectionnées ({cities.length})
              </div>
              {cities.length > 0 && (
                <button
                  onClick={() => {
                    const depts = [...new Set(cities.map(c => c.dept))];
                    const randomCities: typeof cities = [];
                    depts.forEach(dept => {
                      const deptCities = cities.filter(c => c.dept === dept);
                      if (deptCities.length > 0) {
                        const randomIndex = Math.floor(Math.random() * deptCities.length);
                        randomCities.push(deptCities[randomIndex]);
                      }
                    });
                    // Remove all and add only random ones
                    for (let i = cities.length - 1; i >= 0; i--) {
                      onRemoveCity(i);
                    }
                    randomCities.forEach(city => onAddCity(city));
                  }}
                  className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded border border-purple-300 flex items-center gap-1"
                  title="Garder une ville aléatoire par département"
                >
                  <i className="fas fa-random"></i> Aléatoire
                </button>
              )}
            </div>
            {cities.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic">Aucune ville</div>
            ) : (
              cities.map((city, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 border rounded mb-2 bg-white shadow-sm"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-700">{city.name}</div>
                    <div className="text-[10px] text-slate-500">{city.dept}</div>
                  </div>
                  <button
                    onClick={() => onRemoveCity(idx)}
                    className="text-red-400 hover:text-red-600 px-2"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Search */}
          <div className="w-1/2 p-4 flex flex-col bg-slate-50">
            <div className="text-xs font-bold text-slate-400 uppercase mb-2">
              Ajouter une ville
            </div>
            <div className="flex gap-2 mb-4">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                className="flex-1 border rounded px-3 py-2 text-sm text-slate-800 bg-white focus:border-blue-500 outline-none"
                placeholder="Ex: Bordeaux ou 33000..."
              />
              <button
                onClick={searchCity}
                className="bg-blue-600 text-white px-3 rounded"
              >
                <i className="fas fa-search"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isSearching ? (
                <div className="text-center py-4">
                  <span className="loader border-slate-400 border-t-blue-500"></span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => handleAddCity(res)}
                      className="p-2 border bg-white rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-700">{res.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {res.admin1} ({res.country_code})
                        </div>
                      </div>
                      <i className="fas fa-plus text-blue-500"></i>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityModal;
