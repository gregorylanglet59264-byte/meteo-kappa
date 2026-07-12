import React, { useState, useEffect } from 'react';
import type { WeatherClient, City } from '@/types/weather';
import { REGIONS } from '@/utils/vigilanceSync';


interface EditorProps {
  client: WeatherClient;
  selectedDayOffset: number;
  isLoading: boolean;
  onClientChange: (client: WeatherClient) => void;
  onFetchApi: () => void;
  onShowCityModal: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => void;
  onRandomCities: () => void;
  onAromeFetch: () => void;
  onSmartFetch: (dayOffset: number) => void;
  onSyncVigilance?: (offset?: number) => void;
  onSyncForests?: (scope: 'national' | 'regional', regionId: string) => void;
  onVideoUpload?: (file: File) => void;
  onVideoThumbnailUpload?: (file: File) => void;
}

// Helper: build day options for the smart selector
function buildDayOptions() {
  const options = [];
  for (let i = 0; i <= 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const model = 'ECMWF';
    const modelColor = '#059669'; // Emerald-600 color for ECMWF
    options.push({ offset: i, label, model, modelColor });
  }
  return options;
}

const DAY_OPTIONS = buildDayOptions();

const Editor: React.FC<EditorProps> = ({
  client,
  selectedDayOffset,
  isLoading,
  onClientChange,
  onFetchApi,
  onShowCityModal,
  onLogoUpload,
  onRandomCities,
  onAromeFetch,
  onSmartFetch,
  onSyncVigilance,
  onSyncForests,
  onVideoUpload,
  onVideoThumbnailUpload,
}) => {


  const moveSection = (index: number, direction: number) => {
    const arr = [...client.sections];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < arr.length) {
      const item = arr.splice(index, 1)[0];
      arr.splice(newIndex, 0, item);
      onClientChange({ ...client, sections: arr });
    }
  };

  const updateForm = (key: keyof typeof client.form, value: any) => {
    onClientChange({
      ...client,
      form: { ...client.form, [key]: value }
    });
  };

  const updateOptions = (key: keyof typeof client.options, value: boolean | string | number | null | City) => {
    onClientChange({
      ...client,
      options: { ...client.options, [key]: value }
    });
  };

  const updateDisplay = (key: keyof typeof client.display, value: boolean) => {
    onClientChange({
      ...client,
      display: { ...client.display, [key]: value }
    });
  };

  const updateSectionVisibility = (idx: number, visible: boolean) => {
    const sections = [...client.sections];
    sections[idx] = { ...sections[idx], visible };
    onClientChange({ ...client, sections });
  };

  const currentModel = 'ECMWF';
  const modelBadgeColor = 'bg-emerald-600';

  return (
    <div className="w-[480px] bg-white flex flex-col border-r border-slate-200 z-10 shadow-xl">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        {/* Row 1: nom + couleur */}
        <div className="h-10 flex items-center gap-3 px-4 border-b border-slate-100">
          <input
            type="color"
            value={client.brandColor}
            onChange={(e) => onClientChange({ ...client, brandColor: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer border-none bg-transparent p-0"
            title="Couleur Titre"
          />
          <input
            type="text"
            value={client.name}
            onChange={(e) => onClientChange({ ...client, name: e.target.value })}
            className="font-bold text-slate-800 text-sm border-b border-transparent focus:border-blue-500 outline-none w-full bg-transparent placeholder-slate-400"
            placeholder="Nom du bulletin..."
          />
        </div>
        {/* Row 2: date selector */}
        <div className="flex items-center gap-2 px-4 py-2">
          <select
            value={selectedDayOffset}
            onChange={(e) => onSmartFetch(Number(e.target.value))}
            className="flex-1 bg-slate-50 text-slate-700 text-xs px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            title="Choisir la date — le bon modèle sera utilisé automatiquement"
          >
            {DAY_OPTIONS.map(opt => (
              <option key={opt.offset} value={opt.offset}>
                {opt.offset === 0 ? `Aujourd'hui` : opt.offset === 1 ? `Demain` : opt.offset === 2 ? `Après-demain` : `Dans ${opt.offset} jours`} — {opt.label} [{opt.model}]
              </option>
            ))}
          </select>
          <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${modelBadgeColor}`}>
            {currentModel}
          </span>
          <input
            type="text"
            value={client.form.bulletinDate || ''}
            onChange={(e) => onClientChange({ ...client, form: { ...client.form, bulletinDate: e.target.value } })}
            className="w-32 bg-slate-50 text-slate-600 text-[10px] px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-blue-500 text-center"
            title="Date affichée dans le bulletin (modifiée automatiquement via ECMWF)"
            placeholder="Date libre..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto light-scrollbar p-4 space-y-4 bg-slate-50">
        {/* Logos & En-tête */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
              <i className="fas fa-image text-purple-500"></i> Logos & En-tête
            </label>
          </div>

          <div className="space-y-3">
            {/* Logo Gauche */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={client.options.showLogoLeft}
                onChange={(e) => updateOptions('showLogoLeft', e.target.checked)}
                className="accent-blue-600"
              />
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-1">Logo Gauche</label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-600 flex items-center justify-center gap-2 transition">
                    <i className="fas fa-upload"></i> Choisir image...
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onLogoUpload(e, 'left')}
                      className="hidden"
                    />
                  </label>
                  {client.options.logoLeftUrl && (
                    <button
                      onClick={() => updateOptions('logoLeftUrl', '')}
                      className="text-red-500 hover:bg-red-50 px-3 rounded border border-red-200 transition"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 border rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                {client.options.logoLeftUrl ? (
                  <img src={client.options.logoLeftUrl} className="w-full h-full object-contain" alt="Logo" />
                ) : (
                  <i className="fas fa-image text-slate-300"></i>
                )}
              </div>
            </div>

            {/* Logo Droit */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={client.options.showLogoRight}
                onChange={(e) => updateOptions('showLogoRight', e.target.checked)}
                className="accent-blue-600"
              />
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-1">Logo Droit</label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-600 flex items-center justify-center gap-2 transition">
                    <i className="fas fa-upload"></i> Choisir image...
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onLogoUpload(e, 'right')}
                      className="hidden"
                    />
                  </label>
                  {client.options.logoRightUrl && (
                    <button
                      onClick={() => updateOptions('logoRightUrl', '')}
                      className="text-red-500 hover:bg-red-50 px-3 rounded border border-red-200 transition"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 border rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                {client.options.logoRightUrl ? (
                  <img src={client.options.logoRightUrl} className="w-full h-full object-contain" alt="Logo" />
                ) : (
                  <i className="fas fa-image text-slate-300"></i>
                )}
              </div>
            </div>


          </div>
        </div>

        {/* Villes & Météo */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
              <i className="fas fa-map-marker-alt text-red-500"></i> Villes & Météo
            </label>
            <div className="flex gap-2">
              <button
                onClick={onShowCityModal}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-300"
              >
                Gérer ({client.cities.length})
              </button>
              <button
                onClick={onRandomCities}
                disabled={client.cities.length === 0}
                className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200 flex items-center gap-1 transition disabled:opacity-50"
                title="Sélectionner une ville aléatoire par département"
              >
                <i className="fas fa-random"></i> Aléatoire
              </button>
              <button
                onClick={onAromeFetch}
                disabled={isLoading || client.cities.length === 0}
                className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded border border-blue-700 font-bold flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                title="MAJ Automatique J+1 via Modèle ECMWF"
              >
                {isLoading ? (
                  <span className="loader border-white border-t-transparent"></span>
                ) : (
                  <>
                    <i className="fas fa-bolt"></i> ECMWF J+1
                  </>
                )}
              </button>
              <button
                onClick={onFetchApi}
                disabled={isLoading}
                className="text-[10px] bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 font-bold flex items-center gap-1 transition"
              >
                {isLoading ? (
                  <span className="loader border-green-600 border-t-transparent"></span>
                ) : (
                  <>
                    <i className="fas fa-sync-alt"></i> API
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-2 px-1">
            <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={client.options.showIcons}
                onChange={(e) => updateOptions('showIcons', e.target.checked)}
                className="accent-blue-600 rounded"
              />
              Afficher Icones
            </label>
            <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={client.options.showFeelsLike}
                onChange={(e) => updateOptions('showFeelsLike', e.target.checked)}
                className="accent-blue-600 rounded"
              />
              T° Ressentie
            </label>
          </div>

          <textarea
            value={client.form.apiCityRaw}
            onChange={(e) => updateForm('apiCityRaw', e.target.value)}
            className="w-full p-2 text-[10px] font-mono border border-slate-200 rounded bg-slate-50 h-24 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="Données API..."
          ></textarea>

          <div className="mt-3">
            <label className="text-[10px] text-slate-500 font-bold block mb-1">🌅 ÉPHÉMÉRIDES (Lever, Coucher, Saint...)</label>
            <textarea
              value={client.form.ephemeris}
              onChange={(e) => updateForm('ephemeris', e.target.value)}
              className="w-full p-2 text-[10px] font-mono border border-slate-200 rounded bg-slate-50 h-16 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="Éphémérides..."
            ></textarea>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-bold px-1">Contenu du bulletin</div>

          {client.sections.map((section, idx) => (
            <div
              key={section.id}
              className="bg-white p-3 rounded border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col transition-opacity">
                    <button
                      onClick={() => moveSection(idx, -1)}
                      className="h-4 leading-4 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <i className="fas fa-caret-up"></i>
                    </button>
                    <button
                      onClick={() => moveSection(idx, 1)}
                      className="h-4 leading-4 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <i className="fas fa-caret-down"></i>
                    </button>
                  </div>
                  <i className={`fas ${section.icon} text-slate-400 text-xs w-4 text-center`}></i>
                  <span className="text-xs font-bold text-slate-700">{section.title}</span>
                </div>
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={(e) => updateSectionVisibility(idx, e.target.checked)}
                  className="section-check accent-blue-600"
                />
              </div>

              {section.id === 'observations' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={client.form.observationsTitle}
                    onChange={(e) => updateForm('observationsTitle', e.target.value)}
                    className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white font-bold"
                    placeholder="Titre Températures Maximales..."
                  />
                  <textarea
                    value={client.form.observationsRaw}
                    onChange={(e) => updateForm('observationsRaw', e.target.value)}
                    className={`w-full p-2 border rounded text-xs h-20 outline-none focus:border-blue-400 transition text-slate-800 ${!section.visible ? 'opacity-50 bg-slate-50' : 'bg-white'
                      }`}
                    placeholder="Lille (59) 18"
                  ></textarea>

                  {/* Températures Minimales */}
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={client.display.minObservations}
                        onChange={(e) => updateDisplay('minObservations', e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span className="text-[10px] text-slate-600 font-medium">Températures Minimales</span>
                    </div>
                    {client.display.minObservations && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={client.form.minObservationsTitle}
                          onChange={(e) => updateForm('minObservationsTitle', e.target.value)}
                          className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white font-bold"
                          placeholder="Titre Températures Minimales..."
                        />
                        <textarea
                          value={client.form.minObservationsRaw}
                          onChange={(e) => updateForm('minObservationsRaw', e.target.value)}
                          className="w-full p-2 border rounded text-xs h-20 outline-none focus:border-blue-400 transition text-slate-800 bg-white"
                          placeholder="Lille (59) 10"
                        ></textarea>
                      </div>
                    )}
                  </div>

                  {/* Précipitations */}
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={client.display.precipitation}
                        onChange={(e) => updateDisplay('precipitation', e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span className="text-[10px] text-slate-600 font-medium">Précipitations (mm)</span>
                    </div>
                    {client.display.precipitation && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={client.form.precipitationTitle}
                          onChange={(e) => updateForm('precipitationTitle', e.target.value)}
                          className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white font-bold"
                          placeholder="Titre du tableau précipitations..."
                        />
                        <textarea
                          value={client.form.precipitationRaw}
                          onChange={(e) => updateForm('precipitationRaw', e.target.value)}
                          className="w-full p-2 border rounded text-xs h-20 outline-none focus:border-blue-400 transition text-slate-800 bg-white"
                          placeholder="Lille (59) 2"
                        ></textarea>
                      </div>
                    )}
                  </div>

                  {/* Rafales */}
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={client.display.gusts}
                        onChange={(e) => updateDisplay('gusts', e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span className="text-[10px] text-slate-600 font-medium">Rafales (km/h)</span>
                    </div>
                    {client.display.gusts && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={client.form.gustsTitle}
                          onChange={(e) => updateForm('gustsTitle', e.target.value)}
                          className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white font-bold"
                          placeholder="Titre du tableau rafales..."
                        />
                        <textarea
                          value={client.form.gustsRaw}
                          onChange={(e) => updateForm('gustsRaw', e.target.value)}
                          className="w-full p-2 border rounded text-xs h-20 outline-none focus:border-blue-400 transition text-slate-800 bg-white"
                          placeholder="Lille (59) 60"
                        ></textarea>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {section.id === 'vigilance' && (
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={client.form.alertTitle}
                      onChange={(e) => updateForm('alertTitle', e.target.value)}
                      className="w-full p-1.5 border border-amber-300 rounded text-xs text-amber-900 bg-white font-bold mb-2"
                      placeholder="Titre de la vigilance..."
                    />
                    <p className="text-[9px] text-slate-400 mb-1 italic">
                      Format structuré: Collez la synthèse complète avec niveaux et départements
                    </p>
                    <textarea
                      value={client.form.alert}
                      onChange={(e) => updateForm('alert', e.target.value)}
                      className={`w-full p-2 border rounded text-xs h-40 outline-none focus:border-amber-400 bg-amber-50/50 text-slate-800 ${!section.visible ? 'opacity-50' : ''
                        }`}
                      placeholder="⚠️ Vigilance météorologique – Synthèse départementale&#10;&#10;🟡 Vigilance JAUNE – Vendredi 30 janvier&#10;&#10;Phénomènes concernés : pluie, vent, orages...&#10;&#10;Départements concernés :&#10;Ain (01) – Neige-verglas&#10;Alpes-Maritimes (06) – Avalanches"
                    ></textarea>

                    {/* Bloc Vigilance Automatisé - Direct Sync */}
                    <div className="mt-3 p-3 bg-white border-2 border-dashed border-amber-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">Sync Vigilance Automatisée</span>
                        </div>
                        <button
                          onClick={() => onSyncVigilance?.()}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-lg text-[10px] font-bold transition shadow-sm active:scale-95"
                        >
                          {isLoading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-sync-alt"></i>
                          )}
                          SYNCHRONISER
                        </button>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 w-16">Périmètre :</label>
                          <select
                            value={client.options.vigilanceScope || 'national'}
                            onChange={(e) => updateOptions('vigilanceScope', e.target.value)}
                            className="flex-1 text-[10px] p-1 border rounded bg-slate-50 text-slate-900 font-medium"
                          >
                            <option value="national">🇫🇷 National</option>
                            <option value="regional">📍 Régional</option>
                          </select>
                        </div>

                        {client.options.vigilanceScope === 'regional' && (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <label className="text-[10px] text-slate-500 w-16">Région :</label>
                            <select
                              value={client.options.vigilanceRegionId || ''}
                              onChange={(e) => updateOptions('vigilanceRegionId', e.target.value)}
                              className="flex-1 text-[10px] p-1 border rounded bg-slate-50 text-slate-900 font-medium"
                            >
                              <option value="">Choisir une région...</option>
                              {REGIONS.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={client.display.showVigilanceMap}
                          onChange={(e) => updateDisplay('showVigilanceMap', e.target.checked)}
                          className="accent-amber-600"
                        />
                        <span className="text-[10px] text-amber-800 font-medium">Afficher la carte de vigilance</span>
                      </div>
                      <p className="text-[10px] text-slate-400 italic text-center py-1">
                        La synchro récupère le texte {client.options.vigilanceScope === 'regional' ? 'de la région' : 'national'} et la carte {selectedDayOffset === 1 ? 'de demain' : `J+${selectedDayOffset}`}.
                      </p>
                    </div>
                  </div>

                  {/* Image Vigilance */}
                  <div className="border-t border-slate-200 pt-2">
                    <label className="text-[10px] text-slate-600 font-medium block mb-1">
                      📷 Image carte vigilance (optionnel)
                    </label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded px-2 py-1.5 text-xs text-amber-700 flex items-center justify-center gap-2 transition">
                        <i className="fas fa-upload"></i> Choisir image...
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              updateForm('alertImageUrl', ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => onSyncVigilance?.(0)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold transition shadow-sm"
                        title="Synchroniser le bulletin et la carte du jour (J+0)"
                      >
                        <i className="fas fa-calendar-day mr-1"></i>
                        CARTE JOUR
                      </button>
                      <button
                        onClick={() => onSyncVigilance?.(1)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition shadow-sm"
                        title="Synchroniser le bulletin et la carte de demain (J+1)"
                      >
                        <i className="fas fa-link mr-1"></i>
                        CARTE J+1
                      </button>
                      {client.form.alertImageUrl && (
                        <button
                          onClick={() => updateForm('alertImageUrl', '')}
                          className="text-red-500 hover:bg-red-50 px-3 rounded border border-red-200 transition"
                          title="Supprimer"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    {client.form.alertImageUrl && (
                      <div className="mt-2 border rounded overflow-hidden bg-slate-50">
                        <img
                          src={client.form.alertImageUrl}
                          alt="Carte vigilance"
                          className="w-full h-auto max-h-32 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Module Météo des forêts (intégré sous la vigilance) */}
                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 uppercase">
                      <i className="fas fa-tree text-emerald-600"></i> Météo des forêts
                    </div>
                    <input
                      type="text"
                      value={client.form.forestAlertTitle || 'Météo des forêts'}
                      onChange={(e) => updateForm('forestAlertTitle', e.target.value)}
                      className="w-full p-1.5 border border-emerald-300 rounded text-xs text-emerald-900 bg-white font-bold"
                      placeholder="Titre de la météo des forêts..."
                    />
                    <textarea
                      value={client.form.forestAlert || ''}
                      onChange={(e) => updateForm('forestAlert', e.target.value)}
                      className="w-full p-2 border rounded text-xs h-20 outline-none focus:border-emerald-400 bg-white text-slate-800"
                      placeholder="Détails du danger météo des forêts par zone ou département..."
                    ></textarea>

                    <div className="bg-emerald-50/30 p-3 border border-emerald-100 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-tight">Sync Météo des Forêts</span>
                        <button
                          onClick={() => {
                            const scope = (client.options as any).forestsScope || (client.options.vigilanceScope === 'regional' ? 'regional' : 'national');
                            const regId = (client.options as any).forestsRegionId || client.options.vigilanceRegionId || '';
                            onSyncForests?.(scope, regId);
                          }}
                          disabled={isLoading}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded text-[10px] font-bold transition shadow-sm"
                        >
                          SYNCHRONISER FORETS
                        </button>
                      </div>
                      <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="forestsScope"
                            checked={(client.options as any).forestsScope !== 'regional'}
                            onChange={() => updateOptions('forestsScope' as any, 'national')}
                            className="accent-emerald-600"
                          />
                          National
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="forestsScope"
                            checked={(client.options as any).forestsScope === 'regional'}
                            onChange={() => updateOptions('forestsScope' as any, 'regional')}
                            className="accent-emerald-600"
                          />
                          Régional
                        </label>
                      </div>
                      {(client.options as any).forestsScope === 'regional' && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 w-12">Région :</label>
                          <select
                            value={(client.options as any).forestsRegionId || ''}
                            onChange={(e) => updateOptions('forestsRegionId' as any, e.target.value)}
                            className="flex-1 text-[10px] p-1 border rounded bg-white text-slate-900 font-medium"
                          >
                            <option value="">Choisir une région...</option>
                            {REGIONS.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={client.display.showForestMap}
                        onChange={(e) => updateDisplay('showForestMap', e.target.checked)}
                        className="accent-emerald-600"
                        id="showForestMap"
                      />
                      <label htmlFor="showForestMap" className="text-[10px] text-emerald-800 font-bold cursor-pointer select-none">
                        Afficher la carte forêts
                      </label>
                    </div>

                    {client.form.forestAlertImageUrl && (
                      <div className="mt-2 border rounded overflow-hidden bg-slate-50 relative group">
                        <img
                          src={client.form.forestAlertImageUrl}
                          alt="Carte forêts"
                          className="w-full h-auto max-h-32 object-contain"
                        />
                        <button
                          onClick={() => updateForm('forestAlertImageUrl', '')}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded p-1 text-xs transition shadow"
                          title="Supprimer la carte"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {section.id === 'summary' && (
                <div className="space-y-3">
                  {/* Titre modifiable du résumé */}
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={client.form.summaryTitle}
                        onChange={(e) => updateForm('summaryTitle', e.target.value)}
                        className="flex-1 p-1.5 border rounded text-xs text-slate-800 bg-white font-bold"
                        placeholder="Titre (ex: Prévisions pour ce jeudi 12 février 2025)"
                      />
                      <label className="flex items-center gap-1.5 ml-3 cursor-pointer select-none whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={!!client.options.isSoireeMode}
                          onChange={(e) => updateOptions('isSoireeMode', e.target.checked)}
                          className="accent-emerald-600 rounded"
                        />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Soirée</span>
                      </label>
                    </div>
                  <div className="border border-blue-200 rounded bg-blue-50/30 p-2">
                    <input
                      type="text"
                      value={client.form.summaryMapTitle1}
                      onChange={(e) => updateForm('summaryMapTitle1', e.target.value)}
                      className="w-full p-1.5 border border-blue-200 rounded text-xs text-blue-800 bg-white font-bold mb-2"
                      placeholder="Titre de la carte (ex: Carte du jour)"
                    />
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded px-2 py-1.5 text-xs text-blue-700 flex items-center justify-center gap-2 transition">
                        <i className="fas fa-upload"></i> Choisir carte...
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => updateForm('summaryMapUrl1', ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {client.form.summaryMapUrl1 && (
                        <button
                          onClick={() => updateForm('summaryMapUrl1', '')}
                          className="text-red-500 hover:bg-red-50 px-3 rounded border border-red-200 transition"
                          title="Supprimer"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    {client.form.summaryMapUrl1 && (
                      <div className="mt-2 border rounded overflow-hidden bg-white max-h-24 flex items-center justify-center">
                        <img src={client.form.summaryMapUrl1} alt="Aperçu carte" className="max-w-full max-h-24 object-contain" />
                      </div>
                    )}
                  </div>
                  <textarea
                    value={client.form.todaySummary}
                    onChange={(e) => updateForm('todaySummary', e.target.value)}
                    placeholder="Situation générale..."
                    className={`w-full p-2 border rounded text-xs h-24 outline-none focus:border-blue-400 transition text-slate-800 resize-y min-h-[60px] ${(client.form.todaySummary?.length ?? 0) >= 600 ? 'border-red-400' : (client.form.todaySummary?.length ?? 0) >= 510 ? 'border-orange-400' : ''} ${!section.visible ? 'opacity-50 bg-slate-50' : 'bg-white'
                      }`}
                  ></textarea>

                  {/* Matin */}
                  <div className="border border-emerald-200 rounded bg-emerald-50/30 p-2">
                    <label className="text-[10px] text-emerald-700 font-bold block mb-1">
                      {client.options.isSoireeMode ? '🌤️ APRÈS-MIDI' : '☀️ MATIN'}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <label className="flex-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded px-2 py-1 text-[10px] text-emerald-700 flex items-center justify-center gap-2 transition">
                        <i className="fas fa-image"></i> Carte Matin
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => updateForm('summaryMapMorningUrl1', ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {client.form.summaryMapMorningUrl1 && (
                        <button
                          onClick={() => updateForm('summaryMapMorningUrl1', '')}
                          className="text-red-500 hover:bg-red-50 px-2 rounded border border-red-200 transition"
                          title="Supprimer la carte du matin"
                        >
                          <i className="fas fa-trash text-[10px]"></i>
                        </button>
                      )}
                    </div>
                    {client.form.summaryMapMorningUrl1 && (
                      <div className="mb-2 border rounded overflow-hidden bg-white max-h-16 flex items-center justify-center">
                        <img src={client.form.summaryMapMorningUrl1} alt="Aperçu matin" className="max-w-full max-h-16 object-contain" />
                      </div>
                    )}
                    <textarea
                      value={client.form.summaryMorning}
                      onChange={(e) => updateForm('summaryMorning', e.target.value)}
                      placeholder="Prévisions du matin..."
                      className={`w-full p-2 border rounded text-xs h-20 outline-none focus:border-emerald-400 transition text-slate-800 bg-white resize-y ${(client.form.summaryMorning?.length ?? 0) >= 400 ? 'border-red-400' : (client.form.summaryMorning?.length ?? 0) >= 340 ? 'border-orange-400' : 'border-emerald-200'}`}
                    ></textarea>
                  </div>

                  {/* Après-midi */}
                  <div className="border border-emerald-200 rounded bg-emerald-50/30 p-2">
                    <label className="text-[10px] text-emerald-700 font-bold block mb-1">
                      {client.options.isSoireeMode ? '🌆 SOIRÉE' : '🌤️ APRÈS-MIDI'}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <label className="flex-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded px-2 py-1 text-[10px] text-emerald-700 flex items-center justify-center gap-2 transition">
                        <i className="fas fa-image"></i> Carte Après-Midi
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => updateForm('summaryMapAfternoonUrl1', ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {client.form.summaryMapAfternoonUrl1 && (
                        <button
                          onClick={() => updateForm('summaryMapAfternoonUrl1', '')}
                          className="text-red-500 hover:bg-red-50 px-2 rounded border border-red-200 transition"
                          title="Supprimer la carte de l'après-midi"
                        >
                          <i className="fas fa-trash text-[10px]"></i>
                        </button>
                      )}
                    </div>
                    {client.form.summaryMapAfternoonUrl1 && (
                      <div className="mb-2 border rounded overflow-hidden bg-white max-h-16 flex items-center justify-center">
                        <img src={client.form.summaryMapAfternoonUrl1} alt="Aperçu après-midi" className="max-w-full max-h-16 object-contain" />
                      </div>
                    )}
                    <textarea
                      value={client.form.summaryAfternoon}
                      onChange={(e) => updateForm('summaryAfternoon', e.target.value)}
                      placeholder="Prévisions de l'après-midi..."
                      className={`w-full p-2 border rounded text-xs h-20 outline-none focus:border-emerald-400 transition text-slate-800 bg-white resize-y ${(client.form.summaryAfternoon?.length ?? 0) >= 400 ? 'border-red-400' : (client.form.summaryAfternoon?.length ?? 0) >= 340 ? 'border-orange-400' : 'border-emerald-200'}`}
                    ></textarea>
                  </div>

                  {/* Deuxième jour */}
                  <div className="border-t border-slate-300 pt-3 mt-3">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">📅 DEUXIÈME JOUR (optionnel)</label>
                    <input
                      type="text"
                      value={client.form.summaryTitle2}
                      onChange={(e) => updateForm('summaryTitle2', e.target.value)}
                      className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white font-bold mb-2"
                      placeholder="Titre (ex: Prévisions pour la journée du vendredi 13 février 2025)"
                    />
                    <div className="border border-blue-200 rounded bg-blue-50/30 p-2 mb-2">
                      <input
                        type="text"
                        value={client.form.summaryMapTitle2}
                        onChange={(e) => updateForm('summaryMapTitle2', e.target.value)}
                        className="w-full p-1.5 border border-blue-200 rounded text-xs text-blue-800 bg-white font-bold mb-2"
                        placeholder="Titre de la carte J2 (ex: Carte de demain)"
                      />
                      <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded px-2 py-1.5 text-xs text-blue-700 flex items-center justify-center gap-2 transition">
                          <i className="fas fa-upload"></i> Choisir carte J2...
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => updateForm('summaryMapUrl2', ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {client.form.summaryMapUrl2 && (
                          <button
                            onClick={() => updateForm('summaryMapUrl2', '')}
                            className="text-red-500 hover:bg-red-50 px-3 rounded border border-red-200 transition"
                            title="Supprimer"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                      {client.form.summaryMapUrl2 && (
                        <div className="mt-2 border rounded overflow-hidden bg-white max-h-24 flex items-center justify-center">
                          <img src={client.form.summaryMapUrl2} alt="Aperçu carte J2" className="max-w-full max-h-24 object-contain" />
                        </div>
                      )}
                    </div>

                    <div className="border border-emerald-200 rounded bg-emerald-50/30 p-2 mb-2">
                      <label className="text-[10px] text-emerald-700 font-bold block mb-1">
                        ☀️ MATIN
                      </label>
                      <div className="flex gap-2 mb-2">
                        <label className="flex-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded px-2 py-1 text-[10px] text-emerald-700 flex items-center justify-center gap-2 transition">
                          <i className="fas fa-image"></i> Carte Matin J2
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => updateForm('summaryMapMorningUrl2', ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {client.form.summaryMapMorningUrl2 && (
                          <button
                            onClick={() => updateForm('summaryMapMorningUrl2', '')}
                            className="text-red-500 hover:bg-red-50 px-2 rounded border border-red-200 transition"
                            title="Supprimer la carte matin J2"
                          >
                            <i className="fas fa-trash text-[10px]"></i>
                          </button>
                        )}
                      </div>
                      {client.form.summaryMapMorningUrl2 && (
                        <div className="mb-2 border rounded overflow-hidden bg-white max-h-16 flex items-center justify-center">
                          <img src={client.form.summaryMapMorningUrl2} alt="Aperçu matin J2" className="max-w-full max-h-16 object-contain" />
                        </div>
                      )}
                      <textarea
                        value={client.form.summaryMorning2}
                        onChange={(e) => updateForm('summaryMorning2', e.target.value)}
                        placeholder="Prévisions du matin (jour 2)..."
                        className={`w-full p-2 border rounded text-xs h-20 outline-none focus:border-emerald-400 transition text-slate-800 bg-white resize-y ${(client.form.summaryMorning2?.length ?? 0) >= 400 ? 'border-red-400' : (client.form.summaryMorning2?.length ?? 0) >= 340 ? 'border-orange-400' : 'border-emerald-200'}`}
                      ></textarea>
                    </div>

                    <div className="border border-emerald-200 rounded bg-emerald-50/30 p-2">
                      <label className="text-[10px] text-emerald-700 font-bold block mb-1">
                        🌤️ APRÈS-MIDI (J2)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <label className="flex-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded px-2 py-1 text-[10px] text-emerald-700 flex items-center justify-center gap-2 transition">
                          <i className="fas fa-image"></i> Carte Après-Midi J2
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => updateForm('summaryMapAfternoonUrl2', ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {client.form.summaryMapAfternoonUrl2 && (
                          <button
                            onClick={() => updateForm('summaryMapAfternoonUrl2', '')}
                            className="text-red-500 hover:bg-red-50 px-2 rounded border border-red-200 transition"
                            title="Supprimer la carte après-midi J2"
                          >
                            <i className="fas fa-trash text-[10px]"></i>
                          </button>
                        )}
                      </div>
                      {client.form.summaryMapAfternoonUrl2 && (
                        <div className="mb-2 border rounded overflow-hidden bg-white max-h-16 flex items-center justify-center">
                          <img src={client.form.summaryMapAfternoonUrl2} alt="Aperçu après-midi J2" className="max-w-full max-h-16 object-contain" />
                        </div>
                      )}
                      <textarea
                        value={client.form.summaryAfternoon2}
                        onChange={(e) => updateForm('summaryAfternoon2', e.target.value)}
                        placeholder="Prévisions de l'après-midi (jour 2)..."
                        className={`w-full p-2 border rounded text-xs h-20 outline-none focus:border-emerald-400 transition text-slate-800 bg-white resize-y ${(client.form.summaryAfternoon2?.length ?? 0) >= 400 ? 'border-red-400' : (client.form.summaryAfternoon2?.length ?? 0) >= 340 ? 'border-orange-400' : 'border-emerald-200'}`}
                      ></textarea>
                    </div>
                  </div>

                  {/* Images du résumé */}
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={client.display.summaryImage}
                        onChange={(e) => updateDisplay('summaryImage', e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span className="text-[10px] text-slate-600 font-medium">Images ({client.form.summaryImages.length})</span>
                    </div>
                    {client.display.summaryImage && (
                      <>
                        <label className="w-full cursor-pointer bg-green-50 hover:bg-green-100 border border-green-300 rounded px-2 py-1.5 text-xs text-green-700 flex items-center justify-center gap-2 transition mb-2">
                          <i className="fas fa-plus"></i> Ajouter une image...
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const newImage = {
                                    id: Date.now().toString(),
                                    url: reader.result as string,
                                    title: ''
                                  };
                                  onClientChange({
                                    ...client,
                                    form: {
                                      ...client.form,
                                      summaryImages: [...client.form.summaryImages, newImage]
                                    }
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>

                        <div className="space-y-2">
                          {client.form.summaryImages.map((img, idx) => (
                            <div key={img.id} className="border rounded p-2 bg-slate-50 group">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex flex-col">
                                  <button
                                    onClick={() => {
                                      if (idx === 0) return;
                                      const images = [...client.form.summaryImages];
                                      [images[idx - 1], images[idx]] = [images[idx], images[idx - 1]];
                                      onClientChange({
                                        ...client,
                                        form: { ...client.form, summaryImages: images }
                                      });
                                    }}
                                    disabled={idx === 0}
                                    className="h-4 leading-4 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                    title="Monter"
                                  >
                                    <i className="fas fa-caret-up"></i>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (idx === client.form.summaryImages.length - 1) return;
                                      const images = [...client.form.summaryImages];
                                      [images[idx], images[idx + 1]] = [images[idx + 1], images[idx]];
                                      onClientChange({
                                        ...client,
                                        form: { ...client.form, summaryImages: images }
                                      });
                                    }}
                                    disabled={idx === client.form.summaryImages.length - 1}
                                    className="h-4 leading-4 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                    title="Descendre"
                                  >
                                    <i className="fas fa-caret-down"></i>
                                  </button>
                                </div>

                                <div className="w-12 h-12 border rounded overflow-hidden bg-white flex-shrink-0">
                                  <img src={img.url} className="w-full h-full object-cover" alt="Aperçu" />
                                </div>

                                <input
                                  type="text"
                                  value={img.title}
                                  onChange={(e) => {
                                    const images = [...client.form.summaryImages];
                                    images[idx] = { ...img, title: e.target.value };
                                    onClientChange({
                                      ...client,
                                      form: { ...client.form, summaryImages: images }
                                    });
                                  }}
                                  className="flex-1 p-1.5 border rounded text-xs text-slate-800 bg-white"
                                  placeholder="Titre de l'image..."
                                />

                                <button
                                  onClick={() => {
                                    const images = client.form.summaryImages.filter((_, i) => i !== idx);
                                    onClientChange({
                                      ...client,
                                      form: { ...client.form, summaryImages: images }
                                    });
                                  }}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded border border-red-200 transition"
                                  title="Supprimer"
                                >
                                  <i className="fas fa-trash text-xs"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {client.form.summaryImages.length === 0 && (
                          <div className="text-[10px] text-slate-400 text-center py-2">
                            Aucune image ajoutée
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {section.id === 'forecast' && (
                <div className="space-y-3">
                  {/* Mode toggle */}
                  <div className="flex items-center gap-3 px-1">
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`forecastMode-${client.name}`}
                        checked={(client.form.forecastMode || 'table') === 'table'}
                        onChange={() => onClientChange({ ...client, form: { ...client.form, forecastMode: 'table' } })}
                        className="accent-blue-600"
                      />
                      📊 Tableau
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`forecastMode-${client.name}`}
                        checked={client.form.forecastMode === 'text'}
                        onChange={() => onClientChange({ ...client, form: { ...client.form, forecastMode: 'text' } })}
                        className="accent-blue-600"
                      />
                      📝 Texte / Paragraphe
                    </label>
                  </div>

                  {(client.form.forecastMode || 'table') === 'table' ? (
                    <>
                      <textarea
                        value={client.form.forecastRaw}
                        onChange={(e) => updateForm('forecastRaw', e.target.value)}
                        placeholder="Collez les prévisions semaine (ex: Lundi 06 Nuageux Nord 20km/h Min 8° Max 15°)..."
                        className={`w-full p-2 border rounded text-xs font-mono h-32 outline-none focus:border-blue-400 transition text-slate-800 resize-y min-h-[80px] ${!section.visible ? 'opacity-50 bg-slate-50' : 'bg-white'
                          }`}
                      ></textarea>
                    </>
                  ) : (
                    <>
                      <textarea
                        value={client.form.forecastTextRaw || ''}
                        onChange={(e) => updateForm('forecastTextRaw', e.target.value)}
                        placeholder="📉 Tendance nationale – 3 jours suivants&#10;&#10;Dimanche 22 Juin 2026 : Votre texte ici...&#10;Lundi 23 Juin 2026 : Suite du texte...&#10;&#10;(Format requis : Jour de la semaine + Date + : )"
                        className={`w-full p-2 border rounded text-xs h-48 outline-none focus:border-blue-400 transition text-slate-800 resize-y min-h-[120px] ${(client.form.forecastTextRaw?.length ?? 0) >= 1200 ? 'border-red-400' : (client.form.forecastTextRaw?.length ?? 0) >= 1020 ? 'border-orange-400' : ''} ${!section.visible ? 'opacity-50 bg-slate-50' : 'bg-white'
                          }`}
                      ></textarea>
                    </>
                  )}

                  {/* Records / Phénomènes exceptionnels */}
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={client.display.records}
                        onChange={(e) => updateDisplay('records', e.target.checked)}
                        className="accent-amber-600"
                      />
                      <span className="text-[10px] text-slate-600 font-medium">🏆 Records / Phénomènes exceptionnels</span>
                    </div>
                    {client.display.records && (
                      <>
                        <input
                          type="text"
                          value={client.form.recordsTitle}
                          onChange={(e) => updateForm('recordsTitle', e.target.value)}
                          className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white mb-2"
                          placeholder="Titre de la section..."
                        />
                        <textarea
                          value={client.form.recordsRaw}
                          onChange={(e) => updateForm('recordsRaw', e.target.value)}
                          className={`w-full p-2 border rounded text-xs h-24 outline-none focus:border-amber-400 transition text-slate-800 bg-amber-50/30 ${(client.form.recordsRaw?.length ?? 0) >= 400 ? 'border-red-400' : (client.form.recordsRaw?.length ?? 0) >= 340 ? 'border-orange-400' : ''}`}
                          placeholder="Ex: Record de froid battu à Lille avec -12°C&#10;Phénomène rare : neige en plaine au mois de mai"
                        ></textarea>
                      </>
                    )}
                  </div>
                </div>
              )}

              {section.id === 'surveillance' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={client.display.showSurveillance}
                        onChange={(e) => updateDisplay('showSurveillance', e.target.checked)}
                        className="accent-red-600"
                      />
                      <span className="text-[10px] text-slate-600 font-bold uppercase">🔍 Surveillance des phénomènes</span>
                    </div>
                    {client.display.showSurveillance && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newItems = [...client.form.surveillanceItems, { id: Date.now().toString(), type: 'text' as const, content: '' }];
                            onClientChange({ ...client, form: { ...client.form, surveillanceItems: newItems } });
                          }}
                          className="text-[9px] bg-slate-700 hover:bg-slate-800 text-white px-2 py-0.5 rounded border border-slate-600 flex items-center gap-1 transition-colors"
                        >
                          <i className="fas fa-plus"></i> Texte
                        </button>
                        <label className="text-[9px] bg-slate-700 hover:bg-slate-800 text-white px-2 py-0.5 rounded border border-slate-600 flex items-center gap-1 cursor-pointer transition-colors">
                          <i className="fas fa-image"></i> Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const newItems = [...client.form.surveillanceItems, { id: Date.now().toString(), type: 'image' as const, content: ev.target?.result as string }];
                                  onClientChange({ ...client, form: { ...client.form, surveillanceItems: newItems } });
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {client.display.showSurveillance && (
                    <div className="space-y-3 mt-2">
                      <input
                        type="text"
                        value={client.form.surveillanceTitle}
                        onChange={(e) => updateForm('surveillanceTitle', e.target.value)}
                        className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white font-bold"
                        placeholder="Titre de la surveillance..."
                      />
                      
                      <div className="space-y-2">
                        {client.form.surveillanceItems.map((item, idx) => (
                          <div key={item.id} className="border rounded p-2 bg-slate-50 relative group">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex flex-col">
                                <button
                                  onClick={() => {
                                    if (idx === 0) return;
                                    const items = [...client.form.surveillanceItems];
                                    [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
                                    onClientChange({ ...client, form: { ...client.form, surveillanceItems: items } });
                                  }}
                                  disabled={idx === 0}
                                  className="h-3 leading-3 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                >
                                  <i className="fas fa-caret-up text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    if (idx === client.form.surveillanceItems.length - 1) return;
                                    const items = [...client.form.surveillanceItems];
                                    [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
                                    onClientChange({ ...client, form: { ...client.form, surveillanceItems: items } });
                                  }}
                                  disabled={idx === client.form.surveillanceItems.length - 1}
                                  className="h-3 leading-3 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                >
                                  <i className="fas fa-caret-down text-[10px]"></i>
                                </button>
                              </div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                {item.type === 'text' ? 'Texte' : 'Image'}
                              </span>
                              <button
                                onClick={() => {
                                  const items = client.form.surveillanceItems.filter((_, i) => i !== idx);
                                  onClientChange({ ...client, form: { ...client.form, surveillanceItems: items } });
                                }}
                                className="ml-auto text-red-500 hover:text-red-600"
                                title="Supprimer ce bloc"
                              >
                                <i className="fas fa-trash text-[10px]"></i>
                              </button>
                            </div>

                            {item.type === 'text' ? (
                              <textarea
                                value={item.content}
                                onChange={(e) => {
                                  const items = [...client.form.surveillanceItems];
                                  items[idx] = { ...item, content: e.target.value };
                                  onClientChange({ ...client, form: { ...client.form, surveillanceItems: items } });
                                }}
                                className="w-full p-2 border rounded text-xs h-16 outline-none focus:border-blue-400 transition text-slate-800 bg-white"
                                placeholder="Contenu du texte..."
                              ></textarea>
                            ) : (
                              <div className="w-full h-32 border rounded overflow-hidden bg-white flex items-center justify-center">
                                <img src={item.content} className="max-w-full max-h-full object-contain" alt="Aperçu" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {section.id === 'coastal' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 px-1">
                    <label className="flex items-center gap-2 text-[10px] cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={client.display.marine}
                        onChange={(e) => updateDisplay('marine', e.target.checked)}
                        className="accent-blue-500"
                      />
                      <span className="font-medium text-blue-700">🚢 Marine</span>
                      <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition">(Météo des mers, houle, vent du large)</span>
                    </label>
                    <label className="flex items-center gap-2 text-[10px] cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={client.display.beach}
                        onChange={(e) => updateDisplay('beach', e.target.checked)}
                        className="accent-orange-500"
                      />
                      <span className="font-medium text-orange-700">🏖️ Plages</span>
                      <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition">(Eau, pavillon, état de la mer)</span>
                    </label>
                    <label className="flex items-center gap-2 text-[10px] cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={client.display.mountain}
                        onChange={(e) => updateDisplay('mountain', e.target.checked)}
                        className="accent-emerald-600"
                      />
                      <span className="font-medium text-emerald-700">🏔️ Montagnes</span>
                      <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition">(Isotherme, enneigement, altitude)</span>
                    </label>
                    <label className="flex items-center gap-2 text-[10px] cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={client.display.ephemeris}
                        onChange={(e) => updateDisplay('ephemeris', e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span className="font-medium text-amber-700">🌓 Éphémérides</span>
                      <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition">(Lever/coucher soleil & lune, durée du jour, saint)</span>
                    </label>
                  </div>
                  {client.display.marine && (
                    <div className="space-y-1 mt-2 pt-2 border-t border-blue-100">
                      <div className="text-[10px] font-bold text-blue-700 flex items-center gap-1">🚢 Météo Marine</div>
                      <textarea
                        value={client.form.marine}
                        onChange={(e) => updateForm('marine', e.target.value)}
                        placeholder="Info Marine (Houle, vent large...)"
                        className={`w-full p-2 border rounded text-xs h-20 outline-none focus:border-blue-400 transition text-slate-800 bg-white ${(client.form.marine?.length ?? 0) >= 300 ? 'border-red-400' : (client.form.marine?.length ?? 0) >= 255 ? 'border-orange-400' : ''}`}
                      ></textarea>
                    </div>
                  )}

                  {client.display.beach && (
                    <div className="space-y-1 mt-2 pt-2 border-t border-orange-100">
                      <div className="text-[10px] font-bold text-orange-700 flex items-center gap-1">🏖️ Plages & Baignade</div>
                      <textarea
                        value={client.form.beach}
                        onChange={(e) => updateForm('beach', e.target.value)}
                        placeholder="Info Plages (Eau, drapeaux...)"
                        className={`w-full p-2 border rounded text-xs h-20 outline-none focus:border-orange-400 transition text-slate-800 bg-white ${(client.form.beach?.length ?? 0) >= 300 ? 'border-red-400' : (client.form.beach?.length ?? 0) >= 255 ? 'border-orange-400' : ''}`}
                      ></textarea>
                    </div>
                  )}
                  {client.display.mountain && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-emerald-100">
                      <input
                        type="text"
                        value={client.form.mountainTitle}
                        onChange={(e) => updateForm('mountainTitle', e.target.value)}
                        placeholder="Titre Montagnes..."
                        className="w-full p-1.5 border border-emerald-200 rounded text-xs text-emerald-900 bg-white font-bold"
                      />
                      <textarea
                        value={client.form.mountain}
                        onChange={(e) => updateForm('mountain', e.target.value)}
                        placeholder="Ex: Risque d'avalanche 3/5&#10;Enneigement à 1500m : 80cm&#10;Conditions de ski : bonnes"
                        className={`w-full p-2 border rounded text-xs h-24 outline-none focus:border-emerald-400 transition text-slate-800 bg-emerald-50/30 ${(client.form.mountain?.length ?? 0) >= 300 ? 'border-red-400' : (client.form.mountain?.length ?? 0) >= 255 ? 'border-orange-400' : ''}`}
                      ></textarea>
                    </div>
                  )}

                  {client.display.ephemeris && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-amber-100">
                      <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1">🌓 Éphémérides & Astro</div>
                      <textarea
                        value={client.form.ephemeris}
                        onChange={(e) => updateForm('ephemeris', e.target.value)}
                        placeholder="Éphémérides détaillées..."
                        className="w-full p-2 border border-amber-200 rounded text-[10px] h-20 outline-none focus:border-amber-400 transition text-slate-800 bg-amber-50/20 font-mono"
                      ></textarea>
                    </div>
                  )}
                </div>
              )}

              {section.id === 'apiCities' && (
                <div className="text-[10px] text-slate-400 italic text-center py-1 bg-slate-50 rounded">
                  Bloc "Prévisions par commune" (Géré en haut)
                </div>
              )}
            </div>
          ))}

          {/* Module Vidéo */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={client.display.showVideo}
                  onChange={(e) => updateDisplay('showVideo', e.target.checked)}
                  className="accent-indigo-600"
                />
                <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                  <i className="fas fa-video text-indigo-500"></i> Module Vidéo
                </label>
              </div>
            </div>

            {client.display.showVideo && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={client.form.videoModuleTitle}
                  onChange={(e) => updateForm('videoModuleTitle', e.target.value)}
                  className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white font-bold"
                  placeholder="Titre du module (ex: MÉTÉO EN VIDÉO)"
                />

                <div className="flex items-center gap-3 px-1">
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
                    <input
                      type="radio"
                      name={`videoSource-${client.name}`}
                      checked={client.form.videoSource === 'url'}
                      onChange={() => onClientChange({ ...client, form: { ...client.form, videoSource: 'url' } })}
                      className="accent-indigo-600"
                    />
                    🔗 Lien URL
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
                    <input
                      type="radio"
                      name={`videoSource-${client.name}`}
                      checked={client.form.videoSource === 'upload'}
                      onChange={() => onClientChange({ ...client, form: { ...client.form, videoSource: 'upload' } })}
                      className="accent-indigo-600"
                    />
                    ⬆️ Téléverser
                  </label>
                </div>

                {client.form.videoSource === 'url' ? (
                  <input
                    type="text"
                    value={client.form.videoUrl}
                    onChange={(e) => updateForm('videoUrl', e.target.value)}
                    className="w-full p-1.5 border rounded text-xs text-slate-800 bg-white"
                    placeholder="Lien de la vidéo (MP4, YouTube, etc.)"
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer bg-slate-700 hover:bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white flex items-center justify-center gap-2 transition-colors shadow-sm">
                        <i className="fas fa-upload"></i> Choisir vidéo...
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && onVideoUpload) {
                              onVideoUpload(file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {client.form.videoUploadUrl && (
                        <button
                          onClick={() => updateForm('videoUploadUrl', '')}
                          className="text-red-500 hover:bg-red-50 px-3 rounded border border-red-200 transition"
                          title="Supprimer"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    {client.form.videoUploadUrl && (
                      <div className="text-[10px] text-emerald-600 font-medium">
                        <i className="fas fa-check-circle mr-1"></i> Vidéo disponible sur Supabase
                        <div className="mt-1 text-[9px] text-slate-400 break-all">{client.form.videoUploadUrl}</div>
                      </div>
                    )}

                    {/* Miniature */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <label className="text-[10px] text-slate-500 block mb-1">Vignette pour l'email (recommandé)</label>
                      <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded px-2 py-1.5 text-[10px] text-amber-700 flex items-center justify-center gap-2 transition shadow-sm">
                          <i className="fas fa-image"></i> Choisir vignette...
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && onVideoThumbnailUpload) {
                                onVideoThumbnailUpload(file);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {client.form.videoThumbnailUrl && (
                          <button
                            onClick={() => updateForm('videoThumbnailUrl', '')}
                            className="text-red-500 hover:bg-red-50 px-2 rounded border border-red-200 transition"
                            title="Supprimer la vignette"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                      {client.form.videoThumbnailUrl && (
                        <div className="mt-2 text-center bg-slate-100 rounded p-1">
                          <img src={client.form.videoThumbnailUrl} alt="Thumbnail preview" className="max-h-20 mx-auto rounded border border-white shadow-sm" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default Editor;
