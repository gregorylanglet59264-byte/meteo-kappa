import React from 'react';
import type { WeatherClient } from '@/types/weather';

interface ClientListProps {
  clients: WeatherClient[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ClientList: React.FC<ClientListProps> = ({
  clients,
  currentIndex,
  onSelect,
  onAdd,
  onDelete,
  onExport,
  onImport
}) => {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-700 shadow-2xl z-20">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <h2 className="font-bold text-white uppercase text-xs tracking-wider">Mes Bulletins</h2>
        <button
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-500 text-white w-6 h-6 rounded flex items-center justify-center transition shadow-lg border border-green-500"
          title="Ajouter un bulletin avec villes par défaut"
        >
          <i className="fas fa-plus text-xs"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {clients.map((client, index) => (
          <div
            key={index}
            onClick={() => onSelect(index)}
            className={`group flex items-center justify-between p-3 rounded cursor-pointer border border-transparent transition-all duration-200 relative ${
              currentIndex === index
                ? 'bg-slate-800 border-slate-600 text-white shadow-lg'
                : 'hover:bg-slate-800/50 hover:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: client.brandColor || '#1e3a8a' }}
              ></div>
              <div className="flex flex-col truncate">
                <span className="font-bold text-xs truncate">{client.name}</span>
                <span className="text-[9px] text-slate-500 truncate">{client.cities.length} villes</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition px-1"
            >
              <i className="fas fa-times"></i>
            </button>
            {currentIndex === index && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l"></div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
        <button
          onClick={onExport}
          className="w-full bg-slate-800 hover:bg-blue-700 text-slate-300 hover:text-white py-2 rounded text-xs flex justify-center items-center gap-2 border border-slate-700 transition"
        >
          <i className="fas fa-download"></i> Sauvegarder (JSON)
        </button>
        <label className="w-full bg-slate-800 hover:bg-orange-700 text-slate-300 hover:text-white py-2 rounded text-xs flex justify-center items-center gap-2 border border-slate-700 cursor-pointer transition">
          <i className="fas fa-upload"></i> Importer (JSON)
          <input type="file" accept=".json" onChange={onImport} className="hidden" />
        </label>
      </div>
    </div>
  );
};

export default ClientList;
