import React, { useMemo } from 'react';
import type { WeatherClient, ParsedObservations, ParsedApiCities, ParsedForecastDay, ParsedPrecipitations, ParsedGusts } from '@/types/weather';
import { parseVigilance, parseTrendText } from '@/utils/weatherUtils';

interface PreviewProps {
  client: WeatherClient;
  apiDateLabel: string;
  parsedObservations: ParsedObservations;
  parsedApiCities: ParsedApiCities;
  parsedForecast: ParsedForecastDay[];
  parsedPrecipitations: ParsedPrecipitations;
  parsedGusts: ParsedGusts;
  parsedMinObservations: ParsedObservations;
  onCopyVisual: () => void;
  onCopyCode: () => void;
  onExportPdf: () => void;
  onUploadToOnline: () => void;
  onClientChange: (client: WeatherClient) => void;
}

// Fonction pour parser le formatage simple du texte
const parseFormattedText = (text: string): React.ReactNode => {
  if (!text) return null;

  // Parse **bold** et *italic*
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check for *italic*
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

    if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
      if (boldMatch.index! > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index! + boldMatch[0].length);
    } else if (italicMatch) {
      if (italicMatch.index! > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.substring(italicMatch.index! + italicMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

const Preview: React.FC<PreviewProps> = ({
  client,
  apiDateLabel,
  parsedObservations,
  parsedApiCities,
  parsedForecast,
  parsedPrecipitations,
  parsedGusts,
  parsedMinObservations,
  onCopyVisual,
  onCopyCode,
  onExportPdf,
  onUploadToOnline,
  onClientChange
}) => {
  const brandColor = client.brandColor || '#1e3a8a';

  // Parse vigilance data
  const parsedVigilanceData = useMemo(() => {
    return parseVigilance(client.form.alert);
  }, [client.form.alert]);

  const parsedTrend = useMemo(() => {
    return parseTrendText(client.form.forecastTextRaw);
  }, [client.form.forecastTextRaw]);

  const getSectionVisibility = (id: string) => {
    const section = client.sections.find(s => s.id === id);
    return section?.visible ?? false;
  };

  const updateForm = (key: keyof typeof client.form, value: string) => {
    onClientChange({
      ...client,
      form: { ...client.form, [key]: value }
    });
  };

  // Helper pour afficher une image (anciennement avec logo incrusté)
  const renderMediaWithLogo = (url: string, alt: string, imgStyle: React.CSSProperties = {}, containerStyle: React.CSSProperties = {}) => {
    if (!url) return null;

    const showLogo = client.options.showCardLogo;
    const position = client.options.cardLogoPosition || 'right';

    return (
      <div style={{
        position: 'relative',
        display: 'inline-block',
        ...containerStyle
      }}>
        <img
          src={url}
          alt={alt}
          style={imgStyle}
        />
        {/* Logo removed per user request */}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-slate-100 flex flex-col relative overflow-hidden">
      {/* Action buttons */}
      <div className="absolute top-4 right-6 z-30 flex gap-2">
        <button
          onClick={onExportPdf}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-lg font-bold text-xs flex items-center gap-2 transform active:scale-95 transition"
        >
          <i className="fas fa-file-pdf"></i> PDF
        </button>
        <button
          onClick={onCopyVisual}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-lg font-bold text-xs flex items-center gap-2 transform active:scale-95 transition"
        >
          <i className="fas fa-copy"></i> VISUEL
        </button>
        <button
          onClick={onCopyCode}
          className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded shadow-lg font-bold text-xs flex items-center gap-2 transform active:scale-95 transition border border-slate-600"
        >
          <i className="fas fa-code"></i> CODE
        </button>
        <button
          onClick={onUploadToOnline}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-lg font-bold text-xs flex items-center gap-2 transform active:scale-95 transition"
        >
          <i className="fas fa-globe"></i> EN LIGNE
        </button>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-[700px] bg-white shadow-xl min-h-[800px]">
          {/* Email content */}
          <table
            id="email-content"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}
          >
            <tbody>
              <tr>
                <td align="center">
                  <table
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    style={{
                      backgroundColor: '#ffffff',
                      maxWidth: '680px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <tbody>
                      {/* Header */}
                      <tr>
                        <td
                          align="center"
                          style={{
                            padding: '6px 20px',
                            borderBottom: `4px solid ${brandColor}`,
                            backgroundColor: '#f8fafc'
                          }}
                        >
                          <table width="100%" cellPadding={0} cellSpacing={0}>
                            <tbody>
                              <tr>
                                {/* Logo Left */}
                                <td width="20%" align="left" valign="middle">
                                  {client.options.showLogoLeft && client.options.logoLeftUrl && (
                                    <img
                                      src={client.options.logoLeftUrl}
                                      alt="Logo"
                                      style={{
                                        display: 'block',
                                        maxHeight: '60px',
                                        maxWidth: '100px',
                                        height: 'auto',
                                        width: 'auto'
                                      }}
                                    />
                                  )}
                                </td>

                                {/* Title and Date */}
                                <td align="center" valign="middle">
                                  <h1
                                    style={{
                                      margin: 0,
                                      fontSize: '23px',
                                      color: brandColor,
                                      textTransform: 'uppercase',
                                      fontWeight: 900
                                    }}
                                  >
                                    {client.name}
                                  </h1>
                                  <p
                                    style={{
                                      margin: '2px 0 0 0',
                                      fontSize: '13px',
                                      color: '#000000',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {apiDateLabel || 'Date'}
                                  </p>
                                </td>

                                {/* Logo Right */}
                                <td width="20%" align="right" valign="middle">
                                  {client.options.showLogoRight && client.options.logoRightUrl && (
                                    <img
                                      src={client.options.logoRightUrl}
                                      alt="Logo"
                                      style={{
                                        display: 'block',
                                        maxHeight: '60px',
                                        maxWidth: '100px',
                                        height: 'auto',
                                        width: 'auto'
                                      }}
                                    />
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      {/* Ephemeris Block */}
                      {client.display.ephemeris && client.form.ephemeris && (
                        <tr>
                          <td style={{ padding: '0 20px' }}>
                            <div style={{
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              marginTop: '15px',
                              marginBottom: '10px'
                            }}>
                              {(() => {
                                const lines = client.form.ephemeris.split('\n');
                                const hasDynamicTitle = lines[0].startsWith('📅');
                                const title = hasDynamicTitle ? lines[0] : '🌓 ÉPHÉMÉRIDE ET ASTRO';
                                const contentLines = hasDynamicTitle ? lines.slice(1) : lines;

                                return (
                                  <>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px', 
                                      marginBottom: '8px',
                                      color: '#92400e',
                                      fontWeight: 'bold',
                                      fontSize: '13px',
                                      textTransform: 'uppercase'
                                    }}>
                                      <span>{title}</span>
                                    </div>
                                    <div style={{
                                      fontSize: '12.5px',
                                      color: '#1e293b',
                                      lineHeight: '1.6',
                                      whiteSpace: 'pre-wrap'
                                    }}>
                                      {contentLines.join('\n')}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Content */}
                      <tr>
                        <td style={{ padding: '12px 20px', color: '#000000' }}>
                          {/* Sections loop */}
                          {client.sections.map((section) => (
                            <React.Fragment key={section.id + '_preview'}>
                              {/* Section: Prévisions (Observations et Records) - PAGE 1 */}
                              {section.id === 'observations' && (
                                <div className="pdf-section">
                                  {section.visible && parsedObservations.cities.length > 0 && (
                                    <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                                      <h2
                                        style={{
                                          fontSize: '15px',
                                          color: brandColor,
                                          borderBottom: `1px solid ${brandColor}`,
                                          margin: '0 0 10px 0',
                                          paddingBottom: '5px',
                                          textTransform: 'uppercase',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {client.form.observationsTitle || '📍 Températures Maximales'}
                                      </h2>
                                      {parsedObservations.intro && (
                                        <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#000000', marginBottom: '10px' }}>
                                          {parsedObservations.intro}
                                        </p>
                                      )}
                                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ color: '#000000' }}>
                                        <tbody>
                                          <tr>
                                            <td width="48%" valign="top">
                                              <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', color: '#000000' }}>
                                                <tbody>
                                                  {parsedObservations.col1.map((city, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                      <td style={{ color: '#000000' }}><strong>{city.name}</strong> {city.dept && ` ${city.dept}`}</td>
                                                      <td align="right"><span style={{ fontWeight: 'bold', color: '#000000' }}>{city.temp}°C</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                            <td width="4%"></td>
                                            <td width="48%" valign="top">
                                              <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', color: '#000000' }}>
                                                <tbody>
                                                  {parsedObservations.col2.map((city, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                      <td style={{ color: '#000000' }}><strong>{city.name}</strong> {city.dept && ` ${city.dept}`}</td>
                                                      <td align="right"><span style={{ fontWeight: 'bold', color: '#000000' }}>{city.temp}°C</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {/* Section: Températures Minimales */}
                                  {client.display.minObservations && parsedMinObservations.cities.length > 0 && (
                                    <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                                      <h2
                                        style={{
                                          fontSize: '15px',
                                          color: brandColor,
                                          borderBottom: `1px solid ${brandColor}`,
                                          margin: '0 0 10px 0',
                                          paddingBottom: '5px',
                                          textTransform: 'uppercase',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {client.form.minObservationsTitle || '📍 Températures Minimales'}
                                      </h2>
                                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ color: '#000000' }}>
                                        <tbody>
                                          <tr>
                                            <td width="48%" valign="top">
                                              <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', color: '#000000' }}>
                                                <tbody>
                                                  {parsedMinObservations.col1.map((city, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                      <td style={{ color: '#000000' }}><strong>{city.name}</strong> {city.dept && ` ${city.dept}`}</td>
                                                      <td align="right"><span style={{ fontWeight: 'bold', color: '#000000' }}>{city.temp}°C</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                            <td width="4%"></td>
                                            <td width="48%" valign="top">
                                              <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', color: '#000000' }}>
                                                <tbody>
                                                  {parsedMinObservations.col2.map((city, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                      <td style={{ color: '#000000' }}><strong>{city.name}</strong> {city.dept && ` ${city.dept}`}</td>
                                                      <td align="right"><span style={{ fontWeight: 'bold', color: '#000000' }}>{city.temp}°C</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {/* Section: Précipitations */}
                                  {client.display.precipitation && parsedPrecipitations.cities.length > 0 && (
                                    <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                                      <h2
                                        style={{
                                          fontSize: '15px',
                                          color: brandColor,
                                          borderBottom: `1px solid ${brandColor}`,
                                          margin: '0 0 10px 0',
                                          paddingBottom: '5px',
                                          textTransform: 'uppercase',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {client.form.precipitationTitle || '🌧️ CUMULS DE PRÉCIPITATIONS'}
                                      </h2>
                                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ color: '#000000' }}>
                                        <tbody>
                                          <tr>
                                            <td width="48%" valign="top">
                                              <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', color: '#000000' }}>
                                                <tbody>
                                                  {parsedPrecipitations.col1.map((city, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                      <td style={{ color: '#000000' }}><strong>{city.name}</strong> {city.dept && ` ${city.dept}`}</td>
                                                      <td align="right"><span style={{ fontWeight: 'bold', color: '#000000' }}>{city.value} mm</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                            <td width="4%"></td>
                                            <td width="48%" valign="top">
                                              <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', color: '#000000' }}>
                                                <tbody>
                                                  {parsedPrecipitations.col2.map((city, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                      <td style={{ color: '#000000' }}><strong>{city.name}</strong> {city.dept && ` ${city.dept}`}</td>
                                                      <td align="right"><span style={{ fontWeight: 'bold', color: '#000000' }}>{city.value} mm</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {/* Section: Rafales */}
                                  {client.display.gusts && parsedGusts.cities.length > 0 && (
                                    <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                                      <h2
                                        style={{
                                          fontSize: '15px',
                                          color: brandColor,
                                          borderBottom: `1px solid ${brandColor}`,
                                          margin: '0 0 10px 0',
                                          paddingBottom: '5px',
                                          textTransform: 'uppercase',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {client.form.gustsTitle || '💨 RAFALES MAXIMALES'}
                                      </h2>
                                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ color: '#000000' }}>
                                        <tbody>
                                          <tr>
                                            <td width="48%" valign="top">
                                              <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', color: '#000000' }}>
                                                <tbody>
                                                  {parsedGusts.col1.map((city, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                      <td style={{ color: '#000000' }}><strong>{city.name}</strong> {city.dept && ` ${city.dept}`}</td>
                                                      <td align="right"><span style={{ fontWeight: 'bold', color: '#000000' }}>{city.value} km/h</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                            <td width="4%"></td>
                                            <td width="48%" valign="top">
                                              <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', color: '#000000' }}>
                                                <tbody>
                                                  {parsedGusts.col2.map((city, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                      <td style={{ color: '#000000' }}><strong>{city.name}</strong> {city.dept && ` ${city.dept}`}</td>
                                                      <td align="right"><span style={{ fontWeight: 'bold', color: '#000000' }}>{city.value} km/h</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}


                              {/* Vigilance */}
                              {section.id === 'vigilance' && (
                                <>
                                  {/* Module Vidéo */}
                                  {client.display.showVideo && (
                                    <div style={{ marginTop: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                      <h2 style={{ fontSize: '15px', color: brandColor, borderBottom: `1px solid ${brandColor}`, margin: '0 0 15px 0', paddingBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                        🎬 {client.form.videoModuleTitle || 'MÉTÉO EN VIDÉO'}
                                      </h2>
                                      <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        {((client.form.videoSource === 'url' && client.form.videoUrl) || (client.form.videoSource === 'upload' && client.form.videoUploadUrl)) ? (
                                          <div style={{ maxWidth: '550px', margin: '0 auto', textAlign: 'center' }}>
                                            {/* 1. Main image link (The big visual) */}
                                            <a 
                                              href={client.form.videoSource === 'url' ? client.form.videoUrl : client.form.videoUploadUrl}
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              style={{ display: 'inline-block', textDecoration: 'none' }}
                                            >
                                              <img 
                                                src={client.form.videoThumbnailUrl || '/imagehdf.png'} 
                                                alt="Vidéo Météo" 
                                                style={{ width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'block' }} 
                                              />
                                            </a>

                                            {/* 2. Secondary text fallback link (Guaranteed to work in all clients) */}
                                            <div style={{ marginTop: '12px' }}>
                                              <a 
                                                href={client.form.videoSource === 'url' ? client.form.videoUrl : client.form.videoUploadUrl}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ 
                                                  color: brandColor, 
                                                  fontSize: '15px', 
                                                  fontWeight: 'bold', 
                                                  textDecoration: 'underline',
                                                  textTransform: 'uppercase'
                                                }}
                                              >
                                                ➡️ CLIQUEZ ICI POUR VOIR LA VIDÉO
                                              </a>
                                            </div>
                                          </div>
                                        ) : (
                                          <div style={{ padding: '20px', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Aucune vidéo configurée</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {section.visible &&
                                    (client.form.alert || client.form.alertImageUrl) && (
                                  parsedVigilanceData && parsedVigilanceData.sections.length > 0 ? (
                                    // Structured vigilance display with multiple sections
                                    <div className="pdf-section" style={{ marginBottom: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                      {/* Main title */}
                                      <h2
                                        style={{
                                          fontSize: '15px',
                                          color: '#000000',
                                          margin: '0 0 10px 0',
                                          textTransform: 'uppercase',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        ⚠️ {client.form.alertTitle || (parsedVigilanceData && parsedVigilanceData.title) || 'Vigilance'}
                                      </h2>

                                      {client.display.showVigilanceMap && client.form.alertImageUrl && (
                                        <div
                                          style={{
                                            textAlign: 'center',
                                            margin: '5px 0',
                                            backgroundColor: '#f9fafb',
                                            padding: '5px',
                                            border: '1px dashed #e5e7eb',
                                            borderRadius: '4px'
                                          }}
                                        >
                                          {renderMediaWithLogo(
                                            client.form.alertImageUrl,
                                            "Carte vigilance",
                                            {
                                              maxWidth: '100%',
                                              margin: '0 auto',
                                              display: 'block',
                                              height: 'auto',
                                              borderRadius: '4px',
                                              border: '1px solid #e5e7eb'
                                            },
                                            { maxWidth: '85%', margin: '0 auto' }
                                          )}
                                        </div>
                                      )}

                                      {/* Render each vigilance section */}
                                      {parsedVigilanceData.sections.map((vigSection, sectionIndex) => (
                                        <div key={sectionIndex} style={{ marginBottom: sectionIndex < parsedVigilanceData.sections.length - 1 ? '8px' : '0' }}>
                                          {/* Section header with level */}
                                          <div
                                            style={{
                                              backgroundColor: vigSection.level === 'rouge' ? '#fef2f2' :
                                                vigSection.level === 'orange' ? '#fff7ed' :
                                                  vigSection.level === 'jaune' ? '#fffbeb' : '#f0fdf4',
                                              border: `1px solid ${vigSection.level === 'rouge' ? '#fecaca' :
                                                vigSection.level === 'orange' ? '#fed7aa' :
                                                  vigSection.level === 'jaune' ? '#fcd34d' : '#86efac'
                                                }`,
                                              borderLeft: `5px solid ${vigSection.level === 'rouge' ? '#ef4444' :
                                                vigSection.level === 'orange' ? '#f97316' :
                                                  vigSection.level === 'jaune' ? '#f59e0b' : '#22c55e'
                                                }`,
                                              padding: '8px 12px',
                                              marginBottom: '0'
                                            }}
                                          >
                                            <p
                                              style={{
                                                fontSize: '14px',
                                                color: '#000000',
                                                margin: '0 0 8px 0',
                                                fontWeight: 'bold'
                                              }}
                                            >
                                              {vigSection.level === 'rouge' ? '🔴' :
                                                vigSection.level === 'orange' ? '🟠' :
                                                  vigSection.level === 'jaune' ? '🟡' : '🟢'}{' '}
                                              Vigilance {vigSection.levelLabel.toUpperCase()}{vigSection.date ? ` – ${vigSection.date}` : ''}
                                            </p>
                                            {vigSection.phenomena && (
                                              <p
                                                style={{
                                                  fontSize: '13px',
                                                  color: '#374151',
                                                  margin: '0',
                                                  fontStyle: 'italic'
                                                }}
                                              >
                                                <strong>Phénomène{vigSection.phenomena.includes(',') ? 's' : ''} concerné{vigSection.phenomena.includes(',') ? 's' : ''} :</strong> {vigSection.phenomena}
                                              </p>
                                            )}
                                            {vigSection.description && (
                                              <div
                                                style={{
                                                  fontSize: '13px',
                                                  color: '#374151',
                                                  margin: '8px 0 0 0'
                                                }}
                                              >
                                                {vigSection.description.split('\n').map((descLine, dIdx) => {
                                                  const isArrow = descLine.startsWith('→') || descLine.startsWith('➡️');
                                                  return (
                                                    <p key={dIdx} style={{ margin: '2px 0', fontStyle: isArrow ? 'italic' : 'normal' }}>
                                                      {isArrow ? descLine : descLine}
                                                    </p>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>

                                          {/* Departments list for this section */}

                                          {/* Departments list for this section */}
                                          {vigSection.departments.length > 0 && (
                                            <div
                                              style={{
                                                backgroundColor: '#f9fafb',
                                                border: '1px solid #e5e7eb',
                                                borderTop: 'none',
                                                padding: '12px 15px'
                                              }}
                                            >
                                              <p
                                                style={{
                                                  fontSize: '13px',
                                                  color: '#000000',
                                                  margin: '0 0 8px 0',
                                                  fontWeight: 'bold',
                                                  textTransform: 'uppercase'
                                                }}
                                              >
                                                Départements concernés :
                                              </p>
                                              <table
                                                width="100%"
                                                cellPadding={0}
                                                cellSpacing={0}
                                                style={{ color: '#000000' }}
                                              >
                                                <tbody>
                                                  <tr>
                                                    <td width="48%" valign="top">
                                                      <table
                                                        width="100%"
                                                        cellPadding={3}
                                                        cellSpacing={0}
                                                        style={{ fontSize: '11px', color: '#000000' }}
                                                      >
                                                        <tbody>
                                                          {vigSection.departments.slice(0, Math.ceil(vigSection.departments.length / 2)).map((dept, i) => (
                                                            <tr
                                                              key={i}
                                                              style={{ borderBottom: '1px solid #e5e7eb' }}
                                                            >
                                                              <td style={{ color: '#000000' }}>
                                                                <strong>{dept.name}</strong> ({dept.code})
                                                              </td>
                                                              <td align="right" style={{ color: '#6b7280', fontSize: '10px' }}>
                                                                {dept.phenomena}
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <td width="48%" valign="top">
                                                      <table
                                                        width="100%"
                                                        cellPadding={3}
                                                        cellSpacing={0}
                                                        style={{ fontSize: '11px', color: '#000000' }}
                                                      >
                                                        <tbody>
                                                          {vigSection.departments.slice(Math.ceil(vigSection.departments.length / 2)).map((dept, i) => (
                                                            <tr
                                                              key={i}
                                                              style={{ borderBottom: '1px solid #e5e7eb' }}
                                                            >
                                                              <td style={{ color: '#000000' }}>
                                                                <strong>{dept.name}</strong> ({dept.code})
                                                              </td>
                                                              <td align="right" style={{ color: '#6b7280', fontSize: '10px' }}>
                                                                {dept.phenomena}
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    // Simple vigilance display (fallback)
                                    <div
                                      style={{
                                        backgroundColor: '#fffbeb',
                                        border: '1px solid #fcd34d',
                                        borderLeft: '5px solid #f59e0b',
                                        padding: '8px 10px',
                                        marginBottom: '12px',
                                        pageBreakInside: 'avoid',
                                        breakInside: 'avoid'
                                      }}
                                    >
                                      <strong
                                        style={{
                                          color: '#000000',
                                          textTransform: 'uppercase',
                                          fontSize: '13px'
                                        }}
                                      >
                                        ⚠️ {client.form.alertTitle || 'Vigilance'} :
                                      </strong>
                                      {client.display.showVigilanceMap && client.form.alertImageUrl && (
                                        <div
                                          style={{
                                            textAlign: 'center',
                                            margin: '10px 0',
                                            backgroundColor: '#f9fafb',
                                            padding: '10px',
                                            border: '1px dashed #e5e7eb',
                                            borderRadius: '6px'
                                          }}
                                        >
                                          {renderMediaWithLogo(
                                            client.form.alertImageUrl,
                                            "Carte vigilance",
                                            {
                                              maxWidth: '100%',
                                              margin: '0 auto',
                                              display: 'block',
                                              height: 'auto',
                                              borderRadius: '4px',
                                              border: '1px solid #e5e7eb'
                                            },
                                            { maxWidth: '85%', margin: '0 auto' }
                                          )}
                                        </div>
                                      )}
                                      <span style={{ color: '#000000', fontSize: '13px', whiteSpace: 'pre-line' }}>
                                        {' '}
                                        {client.form.alert}
                                      </span>
                                    </div>
                                  )
                                )}

                              </>
                            )}

                            {/* Météo des forêts - STANDALONE SECTION */}
                            {section.id === 'forests' && section.visible && (client.form.forestAlert || client.form.forestAlertImageUrl) && (
                              <div 
                                className="pdf-section" 
                                style={{ 
                                  marginBottom: '12px', 
                                  pageBreakInside: 'avoid', 
                                  breakInside: 'avoid',
                                  backgroundColor: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  borderLeft: '5px solid #22c55e',
                                  padding: '10px 12px',
                                  borderRadius: '4px'
                                }}
                              >
                                <h2
                                  style={{
                                    fontSize: '15px',
                                    color: '#14532d',
                                    margin: '0 0 10px 0',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  🌲 {client.form.forestAlertTitle || 'Météo des forêts'}
                                </h2>

                                {client.display.showForestMap && client.form.forestAlertImageUrl && (
                                  <div
                                    style={{
                                      textAlign: 'center',
                                      margin: '5px 0',
                                      backgroundColor: '#ffffff',
                                      padding: '5px',
                                      border: '1px dashed #bbf7d0',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {renderMediaWithLogo(
                                      client.form.forestAlertImageUrl,
                                      "Carte météo des forêts",
                                      {
                                        maxWidth: '100%',
                                        margin: '0 auto',
                                        display: 'block',
                                        height: 'auto',
                                        borderRadius: '4px',
                                        border: '1px solid #bbf7d0'
                                      },
                                      { maxWidth: '85%', margin: '0 auto' }
                                    )}
                                  </div>
                                )}

                                {client.form.forestAlert && (
                                  <div style={{ color: '#14532d', fontSize: '13px', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                                    {client.form.forestAlert}
                                  </div>
                                )}
                                
                                {client.form.forestAlertSource && (
                                  <div style={{ color: '#166534', fontSize: '10px', marginTop: '10px', textAlign: 'right', fontStyle: 'italic' }}>
                                    Source : {client.form.forestAlertSource}
                                  </div>
                                )}
                              </div>
                            )}

                              {/* Surveillance des phénomènes importants - STANDALONE SECTION */}
                              {section.id === 'surveillance' && section.visible && client.display.showSurveillance && client.form.surveillanceItems.length > 0 && (
                                <div className="pdf-section" style={{ marginBottom: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                  <h2 style={{ fontSize: '15px', color: brandColor, borderBottom: `1px solid ${brandColor}`, margin: '0 0 11px 0', paddingBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                    🔍 {client.form.surveillanceTitle || 'Surveillance des phénomènes importants'}
                                  </h2>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {client.form.surveillanceItems.map((item) => (
                                      <div key={item.id}>
                                        {item.type === 'text' ? (
                                          <div style={{ fontSize: '14px', lineHeight: 1.65, color: '#000000', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                                            {item.content.split('\n').map((line, j, arr) => (
                                              <React.Fragment key={j}>
                                                {parseFormattedText(line)}
                                                {j < arr.length - 1 && <br />}
                                              </React.Fragment>
                                            ))}
                                          </div>
                                        ) : (
                                          <div style={{ textAlign: 'center' }}>
                                            {renderMediaWithLogo(
                                              item.content,
                                              'Image surveillance',
                                              { 
                                                borderRadius: '6px', 
                                                border: '1px solid #e5e7eb', 
                                                maxWidth: '90%', 
                                                height: 'auto',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                display: 'block',
                                                margin: '0 auto' 
                                              },
                                              { width: '100%' }
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {section.id === 'summary' &&
                                section.visible &&
                                (client.form.todaySummary || client.form.summaryMorning || client.form.summaryAfternoon) && (
                                  <>
                                  <div style={{ marginBottom: '10px' }} className="pdf-section">
                                    <h2
                                      style={{
                                        fontSize: '14px',
                                        color: brandColor,
                                        borderBottom: `1px solid ${brandColor}`,
                                        margin: '0 0 8px 0',
                                        paddingBottom: '3px',
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      📅 {client.form.summaryTitle || 'RÉSUMÉ DU JOUR'}
                                    </h2>
                                    {client.form.summaryMapUrl1 && (
                                      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                                        {client.form.summaryMapTitle1 && (
                                          <h3 style={{ fontSize: '13px', color: brandColor, margin: '5px 0 5px 0', fontWeight: 'bold' }}>
                                            📷 {client.form.summaryMapTitle1}
                                          </h3>
                                        )}
                                        {renderMediaWithLogo(
                                          client.form.summaryMapUrl1,
                                          client.form.summaryMapTitle1 || "Carte prévision J0",
                                          { borderRadius: '4px' },
                                          { maxWidth: '85%' }
                                        )}
                                      </div>
                                    )}
                                    {client.form.summaryLancement && (
                                      <div style={{ fontSize: '13px', color: '#000000', marginBottom: '8px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                        <strong>lancement</strong>
                                        <span
                                          contentEditable
                                          suppressContentEditableWarning
                                          onBlur={(e) => updateForm('summaryLancement', e.currentTarget.textContent || '')}
                                          style={{
                                            cursor: 'text',
                                            outline: 'none',
                                            minWidth: '100px',
                                            flex: 1,
                                            padding: '2px 4px',
                                            borderRadius: '2px',
                                            border: '1px dashed transparent'
                                          }}
                                          onFocus={(e) => {
                                            e.currentTarget.style.border = '1px dashed #3b82f6';
                                            e.currentTarget.style.backgroundColor = '#eff6ff';
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          title="Cliquez pour écrire à côté de lancement"
                                        >
                                          {client.form.summaryLancement}
                                        </span>
                                      </div>
                                    )}
                                    {client.form.todaySummary && (
                                      <div
                                        style={{
                                          fontSize: '13px',
                                          lineHeight: 1.3,
                                          color: '#000000',
                                          whiteSpace: 'pre-line',
                                          marginBottom: '5px'
                                        }}
                                      >
                                        {client.form.todaySummary}
                                      </div>
                                    )}

                                    {/* Matin - Day 1 */}
                                    {client.form.summaryMorning && (
                                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '5px', borderCollapse: 'collapse', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                        <tbody>
                                          <tr>
                                            <td
                                              style={{
                                                backgroundColor: '#ecfdf5',
                                                padding: '5px 10px',
                                                borderLeft: '4px solid #10b981'
                                              }}
                                            >
                                              <strong style={{ color: '#047857', textTransform: 'uppercase', fontSize: '13px' }}>
                                                 {client.options.isSoireeMode ? 'APRES-MIDI :' : 'MATIN :'}
                                              </strong>
                                              <div style={{ fontSize: '13px', lineHeight: 1.3, marginTop: '4px', whiteSpace: 'pre-line', color: '#000000' }}>
                                                {client.form.summaryMapMorningUrl1 && (
                                                  <div style={{ textAlign: 'center', margin: '5px 0' }}>
                                                    {renderMediaWithLogo(
                                                      client.form.summaryMapMorningUrl1,
                                                      "Carte matin",
                                                      { borderRadius: '4px', border: '1px solid #10b981' },
                                                      { maxWidth: '85%' }
                                                    )}
                                                  </div>
                                                )}
                                                {client.form.summaryMorning}
                                              </div>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    )}

                                    {/* Après-midi - Day 1 */}
                                    {client.form.summaryAfternoon && (
                                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '5px', borderCollapse: 'collapse', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                        <tbody>
                                          <tr>
                                            <td
                                              style={{
                                                backgroundColor: '#ecfdf5',
                                                padding: '5px 10px',
                                                borderLeft: '4px solid #10b981'
                                              }}
                                            >
                                              <strong style={{ color: '#047857', textTransform: 'uppercase', fontSize: '13px' }}>
                                                {client.options.isSoireeMode ? 'SOIRÉE :' : 'APRES-MIDI :'}
                                              </strong>
                                              <div style={{ fontSize: '13px', lineHeight: 1.3, marginTop: '4px', whiteSpace: 'pre-line', color: '#000000' }}>
                                                {client.form.summaryMapAfternoonUrl1 && (
                                                  <div style={{ textAlign: 'center', margin: '5px 0' }}>
                                                    {renderMediaWithLogo(
                                                      client.form.summaryMapAfternoonUrl1,
                                                      "Carte après-midi",
                                                      { borderRadius: '4px', border: '1px solid #10b981' },
                                                      { maxWidth: '85%' }
                                                    )}
                                                  </div>
                                                )}
                                                {client.form.summaryAfternoon}
                                              </div>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    )}
                                  </div>

                                    {/* Second day title + Matin/Après-midi - PAGE 4 */}
                                    {client.form.summaryTitle2 && (
                                      <div style={{ paddingTop: '10px' }} className="pdf-section">
                                        <h3
                                          style={{
                                            fontSize: '13px',
                                            color: brandColor,
                                            borderBottom: `1px solid ${brandColor}`,
                                            margin: '0 0 8px 0',
                                            paddingBottom: '3px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {client.form.summaryTitle2}
                                        </h3>
                                        {client.form.summaryMapUrl2 && (
                                          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                                            {client.form.summaryMapTitle2 && (
                                              <h3 style={{ fontSize: '13px', color: brandColor, margin: '5px 0 5px 0', fontWeight: 'bold' }}>
                                                📷 {client.form.summaryMapTitle2}
                                              </h3>
                                            )}
                                            {renderMediaWithLogo(
                                              client.form.summaryMapUrl2,
                                              client.form.summaryMapTitle2 || "Carte prévision J1",
                                              { borderRadius: '4px' },
                                              { maxWidth: '85%' }
                                            )}
                                          </div>
                                        )}

                                        {client.form.summaryMorning2 && (
                                          <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '5px', borderCollapse: 'collapse', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <tbody>
                                              <tr>
                                                <td
                                                  style={{
                                                    backgroundColor: '#ecfdf5',
                                                    padding: '5px 10px',
                                                    borderLeft: '4px solid #10b981'
                                                  }}
                                                >
                                                  <strong style={{ color: '#047857', textTransform: 'uppercase', fontSize: '13px' }}>
                                                    MATIN :
                                                  </strong>
                                                  <div style={{ fontSize: '13px', lineHeight: 1.3, marginTop: '4px', whiteSpace: 'pre-line', color: '#000000' }}>
                                                    {client.form.summaryMapMorningUrl2 && (
                                                      <div style={{ textAlign: 'center', margin: '5px 0' }}>
                                                        {renderMediaWithLogo(
                                                          client.form.summaryMapMorningUrl2,
                                                          "Carte matin J2",
                                                          { borderRadius: '4px', border: '1px solid #10b981' },
                                                          { maxWidth: '85%' }
                                                        )}
                                                      </div>
                                                    )}
                                                    {client.form.summaryMorning2}
                                                  </div>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        )}

                                        {client.form.summaryAfternoon2 && (
                                          <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '5px', borderCollapse: 'collapse', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <tbody>
                                              <tr>
                                                <td
                                                  style={{
                                                    backgroundColor: '#ecfdf5',
                                                    padding: '5px 10px',
                                                    borderLeft: '4px solid #10b981'
                                                  }}
                                                >
                                                  <strong style={{ color: '#047857', textTransform: 'uppercase', fontSize: '13px' }}>
                                                    APRES-MIDI :
                                                  </strong>
                                                  <div style={{ fontSize: '13px', lineHeight: 1.3, marginTop: '4px', whiteSpace: 'pre-line', color: '#000000' }}>
                                                    {client.form.summaryMapAfternoonUrl2 && (
                                                      <div style={{ textAlign: 'center', margin: '5px 0' }}>
                                                        {renderMediaWithLogo(
                                                          client.form.summaryMapAfternoonUrl2,
                                                          "Carte après-midi J2",
                                                          { borderRadius: '4px', border: '1px solid #10b981' },
                                                          { maxWidth: '85%' }
                                                        )}
                                                      </div>
                                                    )}
                                                    {client.form.summaryAfternoon2}
                                                  </div>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        )}
                                      </div>
                                    )}

                                    {/* Images du résumé (Radar) - PAGE 4 */}
                                    {client.display.summaryImage && client.form.summaryImages.length > 0 && (
                                      <div style={{ marginTop: '15px' }}>
                                        <h2 style={{ fontSize: '15px', color: brandColor, borderBottom: `1px solid ${brandColor}`, margin: '0 0 10px 0', paddingBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                          📡 RADAR DES PRÉCIPITATIONS
                                        </h2>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                                          {client.form.summaryImages.map((img) => (
                                            <div key={img.id} style={{ width: client.form.summaryImages.length >= 2 ? '48%' : '100%', marginBottom: '10px' }}>
                                              {img.title && (
                                                <h3 style={{ fontSize: '13px', color: brandColor, margin: '0 0 5px 0', fontWeight: 'bold', textAlign: 'center' }}>
                                                  📷 {img.title}
                                                </h3>
                                              )}
                                              {renderMediaWithLogo(
                                                img.url,
                                                img.title || 'Image météo',
                                                {
                                                  width: '100%',
                                                  height: 'auto',
                                                  borderRadius: '4px',
                                                  border: '1px solid #e5e7eb'
                                                },
                                                { width: '100%' }
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Espace "3 fois Entrée" demandé pour pousser la tendance sur une nouvelle page */}
                                    <div style={{ height: '60px', clear: 'both' }}></div>
                                  </>
                                )}

                              {section.id === 'forecast' && section.visible && (parsedForecast.length > 0 || client.form.forecastRaw || client.form.forecastTextRaw) && (
                                <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                                  <div className="pdf-section" style={{ marginBottom: '15px', paddingTop: '10px' }}>
                                    <h2 style={{ fontSize: '15px', color: brandColor, borderBottom: `1px solid ${brandColor}`, margin: '0 0 10px 0', paddingBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                      {parsedTrend?.title ? `📉 ${parsedTrend.title}` : '🔮 Tendance Semaine'}
                                    </h2>
                                  </div>

                                  {client.form.forecastLancement && (
                                    <div style={{ fontSize: '13px', color: '#000000', marginBottom: '8px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                      <strong>lancement</strong>
                                      <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => updateForm('forecastLancement', e.currentTarget.textContent || '')}
                                        style={{
                                          cursor: 'text',
                                          outline: 'none',
                                          minWidth: '100px',
                                          flex: 1,
                                          padding: '2px 4px',
                                          borderRadius: '2px',
                                          border: '1px dashed transparent'
                                        }}
                                        onFocus={(e) => {
                                          e.currentTarget.style.border = '1px dashed #3b82f6';
                                          e.currentTarget.style.backgroundColor = '#eff6ff';
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.currentTarget.blur();
                                          }
                                        }}
                                        title="Cliquez pour écrire à côté de lancement"
                                      >
                                        {client.form.forecastLancement}
                                      </span>
                                    </div>
                                  )}

                                  {(client.form.forecastMode || 'table') === 'text' && client.form.forecastTextRaw ? (
                                    <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#000000' }}>
                                      {parsedTrend && parsedTrend.days.length > 0 ? (
                                        <div style={{ marginTop: '5px' }}>
                                          {parsedTrend.days.map((day, idx) => (
                                            <div
                                              key={idx}
                                              style={{
                                                marginBottom: '8px',
                                                backgroundColor: '#ffffff',
                                                border: `1px solid ${idx % 2 === 0 ? '#e0f2fe' : '#f0fdf4'}`,
                                                borderLeft: `5px solid ${idx % 2 === 0 ? '#3b82f6' : '#22c55e'}`,
                                                borderRadius: '4px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                                overflow: 'hidden'
                                              }}
                                            >
                                              <div style={{
                                                backgroundColor: idx % 2 === 0 ? '#eff6ff' : '#f0fdf4',
                                                padding: '6px 10px',
                                                color: idx % 2 === 0 ? '#1e40af' : '#166534',
                                                fontWeight: 'bold',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                borderBottom: `1px solid ${idx % 2 === 0 ? '#e0f2fe' : '#dcfce7'}`
                                              }}>
                                                📅 {day.day.toUpperCase()}
                                              </div>
                                              <div style={{ padding: '8px 10px', textAlign: 'justify', fontSize: '13px', color: '#1f2937' }}>
                                                {day.description.split('\n').map((line, j, arr) => (
                                                  <React.Fragment key={j}>
                                                    {parseFormattedText(line)}
                                                    {j < arr.length - 1 && <br />}
                                                  </React.Fragment>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        client.form.forecastTextRaw.split('\n\n').map((paragraph, i) => {
                                          if (!paragraph.trim()) return null;
                                          return (
                                            <p key={i} style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
                                              {paragraph.split('\n').map((line, j, arr) => (
                                                <React.Fragment key={j}>
                                                  {parseFormattedText(line)}
                                                  {j < arr.length - 1 && <br />}
                                                </React.Fragment>
                                              ))}
                                            </p>
                                          );
                                        })
                                      )}
                                    </div>
                                  ) : parsedForecast.length > 0 ? (
                                    <table
                                      width="100%"
                                      cellPadding={0}
                                      cellSpacing={0}
                                      style={{
                                        fontSize: '13px',
                                        border: '1px solid #e5e7eb',
                                        color: '#000000'
                                      }}
                                    >
                                      <thead>
                                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #d1d5db', width: '15%', color: '#000000' }}>Jour</th>
                                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #d1d5db', width: '40%', color: '#000000' }}>Temps</th>
                                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #d1d5db', width: '25%', color: '#000000' }}>Vent</th>
                                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #d1d5db', width: '20%', color: '#000000' }}>T°</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {parsedForecast.map((day, i) => (
                                          <tr key={i} style={{ backgroundColor: i % 2 !== 0 ? '#f9fafb' : '#ffffff' }}>
                                            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', color: '#000000' }}><strong>{day.date}</strong></td>
                                            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', color: '#000000' }}>{day.weather}</td>
                                            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', color: '#000000' }}>{day.wind}</td>
                                            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', color: '#000000', fontWeight: 'bold' }}>{day.temp}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div
                                      style={{
                                        fontSize: '13px',
                                        lineHeight: 1.6,
                                        color: '#000000',
                                        whiteSpace: 'pre-wrap',
                                        padding: '12px',
                                        overflowX: 'auto'
                                      }}
                                      dangerouslySetInnerHTML={{
                                        __html: client.form.forecastRaw
                                          .replace(/&/g, '&amp;')
                                          .replace(/</g, '&lt;')
                                          .replace(/>/g, '&gt;')
                                          .replace(/\n/g, '<br/>')
                                      }}
                                    />
                                  )}

                                  {/* Section: Phénomènes marquants (Nested under Forecast for layout) */}
                                  {client.display.records && client.form.recordsRaw && (
                                    <div style={{ marginTop: '15px', border: '2px solid #f59e0b', backgroundColor: '#fffbeb', padding: '12px', borderRadius: '6px', marginBottom: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                      <h3 style={{ fontSize: '13px', color: '#b45309', borderBottom: '1px solid #f59e0b', margin: '0 0 10px 0', paddingBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                        🏆🌬️ {client.form.recordsTitle || 'Phénomènes marquants et zones les plus exposées'}
                                      </h3>
                                      <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#000000', whiteSpace: 'pre-wrap' }}>
                                        {client.form.recordsRaw.split('\n').map((line, i) => (
                                          <p key={i} style={{ margin: '0 0 6px 0' }}>{line}</p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div style={{ height: '25px' }}></div>
                                </div>
                              )}

                              {section.id === 'apiCities' && section.visible && parsedApiCities.cities.length > 0 && (
                                <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                                  <div className="pdf-section" style={{ marginTop: '0px', border: '1px solid #86efac', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '4px', breakInside: 'avoid' }}>
                                    <h2 style={{ fontSize: '15px', color: '#15803d', borderBottom: '2px solid #15803d', margin: '0 0 10px 0', paddingBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                      🌍 Prévisions par commune pour le {apiDateLabel || '...'}
                                    </h2>
                                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ color: '#000000' }}>
                                      <tbody>
                                        <tr>
                                          <td width="49%" valign="top">
                                            <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '11px', color: '#000000' }}>
                                              <tbody>
                                                {parsedApiCities.col1.map((city, i) => (
                                                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#dcfce7' }}>
                                                    <td style={{ borderBottom: '1px solid #86efac', color: '#000000' }}>
                                                      <strong>{city.name.toUpperCase()}</strong>
                                                      <br />
                                                      <span style={{ color: '#000000' }}>
                                                        {city.wind
                                                          .replace(/^Vent\b/i, 'Vent moyen')
                                                          .replace(/\(?Rafales\s+(\d+)\s*(km\/h|kmh)\)?/i, '(Rafales $1 $2)')
                                                          .replace(/(\d+)\s*(km\/h|kmh)/gi, (_, n, u) => `${Math.round(parseInt(n) / 5) * 5} ${u}`)
                                                        }
                                                      </span>
                                                    </td>
                                                    <td align="right" style={{ borderBottom: '1px solid #86efac', verticalAlign: 'middle', color: '#000000' }}>
                                                      {client.options.showIcons && city.icon && ( <span style={{ fontSize: '16px', marginRight: '5px' }}>{city.icon}</span> )}
                                                      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                        <span style={{ color: '#2563eb' }}>{city.min}°</span>{' / '}<span style={{ color: '#dc2626' }}>{city.max}°</span>
                                                      </span>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </td>
                                          <td width="2%"></td>
                                          <td width="49%" valign="top">
                                            <table width="100%" cellPadding={4} cellSpacing={0} style={{ fontSize: '11px', color: '#000000' }}>
                                              <tbody>
                                                {parsedApiCities.col2.map((city, i) => (
                                                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#dcfce7' }}>
                                                    <td style={{ borderBottom: '1px solid #86efac', color: '#000000' }}>
                                                      <strong>{city.name.toUpperCase()}</strong>
                                                      <br />
                                                      <span style={{ color: '#000000' }}>
                                                        {city.wind
                                                          .replace(/^Vent\b/i, 'Vent moyen')
                                                          .replace(/\(?Rafales\s+(\d+)\s*(km\/h|kmh)\)?/i, '(Rafales $1 $2)')
                                                          .replace(/(\d+)\s*(km\/h|kmh)/gi, (_, n, u) => `${Math.round(parseInt(n) / 5) * 5} ${u}`)
                                                        }
                                                      </span>
                                                    </td>
                                                    <td align="right" style={{ borderBottom: '1px solid #86efac', verticalAlign: 'middle', color: '#000000' }}>
                                                      {client.options.showIcons && city.icon && ( <span style={{ fontSize: '16px', marginRight: '5px' }}>{city.icon}</span> )}
                                                      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                        <span style={{ color: '#2563eb' }}>{city.min}°</span>{' / '}<span style={{ color: '#dc2626' }}>{city.max}°</span>
                                                      </span>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {section.id === 'coastal' && section.visible && (client.display.mountain && client.form.mountain || client.display.marine && client.form.marine || client.display.beach && client.form.beach) && (
                                <div style={{ marginTop: '15px' }}>
                                  {/* Montagnes */}
                                  {client.display.mountain && client.form.mountain && (
                                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '15px', borderCollapse: 'collapse', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                      <tbody>
                                        <tr>
                                          <td style={{ backgroundColor: '#ecfdf5', padding: '15px', borderLeft: '4px solid #10b981' }}>
                                            <strong style={{ color: '#047857', textTransform: 'uppercase', fontSize: '13px' }}>{client.form.mountainTitle || '🏔️ Météo des Montagnes'}</strong>
                                            <div style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '8px', whiteSpace: 'pre-line', color: '#000000' }}>{client.form.mountain}</div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  )}

                                  {/* Marine */}
                                  {client.display.marine && client.form.marine && (
                                    <div style={{ marginBottom: '15px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                      <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderLeft: '4px solid #0ea5e9' }}>
                                        <strong style={{ color: '#0369a1', textTransform: 'uppercase', fontSize: '13px' }}>🚢 Météo Marine</strong>
                                        <div style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '8px', whiteSpace: 'pre-line', color: '#000000' }}>{client.form.marine}</div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Plages */}
                                  {client.display.beach && client.form.beach && (
                                    <div style={{ marginBottom: '15px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                      <div style={{ backgroundColor: '#fff7ed', padding: '15px', borderLeft: '4px solid #f97316' }}>
                                        <strong style={{ color: '#c2410c', textTransform: 'uppercase', fontSize: '13px' }}>🏖️ Plages</strong>
                                        <div style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '8px', whiteSpace: 'pre-line', color: '#000000' }}>{client.form.beach}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};

export default Preview;
