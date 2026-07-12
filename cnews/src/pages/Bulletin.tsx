import React, { useEffect } from 'react';

const Bulletin = () => {
  useEffect(() => {
    // Redirection directe vers le PDF hébergé sur Supabase
    // On ajoute un paramètre de temps pour éviter le cache navigateur si nécessaire
    const pdfUrl = `https://ubdevaemtwbzxksjlhjg.supabase.co/storage/v1/object/public/vigilance-captures/bulletin.pdf?t=${Date.now()}`;
    window.location.href = pdfUrl;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-lg font-medium">Chargement du bulletin météo...</p>
      <p className="text-sm text-slate-400 mt-2">Veuillez patienter, vous allez être redirigé vers le PDF.</p>
    </div>
  );
};

export default Bulletin;
