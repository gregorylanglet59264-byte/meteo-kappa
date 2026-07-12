import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ubdevaemtwbzxksjlhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_1qhA0xAnNSd3VxpoLdxYrQ_yUemEhaP";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PHENOMENA = [
    { id: "2", name: "Pluie-inondation" },
    { id: "9", name: "Vagues-submersion" },
    { id: "4", name: "Crues" },
    { id: "1", name: "Vent" },
    { id: "3", name: "Orages" },
    { id: "5", name: "Neige-verglas" },
    { id: "6", name: "Canicule" },
    { id: "7", name: "Grand Froid" },
    { id: "8", name: "Avalanches" }
];

const DEPARTMENTS: Record<string, string> = {
    "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes",
    "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège", "10": "Aube",
    "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal",
    "16": "Charente", "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "2A": "Corse-du-Sud",
    "2B": "Haute-Corse", "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne",
    "25": "Doubs", "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère",
    "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault",
    "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura",
    "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique",
    "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire",
    "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle",
    "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord",
    "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques",
    "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône",
    "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie",
    "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines", "79": "Deux-Sèvres",
    "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var", "84": "Vaucluse",
    "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne",
    "90": "Territoire de Belfort", "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis",
    "94": "Val-de-Marne", "95": "Val-d'Oise", "99": "Andorre"
};

export const REGIONS: { id: string, name: string, deps: string[] }[] = [
    { id: 'ARA', name: 'Auvergne-Rhône-Alpes', deps: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
    { id: 'BFC', name: 'Bourgogne-Franche-Comté', deps: ['21', '25', '39', '58', '70', '71', '89', '90'] },
    { id: 'BRE', name: 'Bretagne', deps: ['22', '29', '35', '56'] },
    { id: 'CVL', name: 'Centre-Val de Loire', deps: ['18', '28', '36', '37', '41', '45'] },
    { id: 'COR', name: 'Corse', deps: ['2A', '2B'] },
    { id: 'GES', name: 'Grand Est', deps: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'] },
    { id: 'HDF', name: 'Hauts-de-France', deps: ['02', '59', '60', '62', '80'] },
    { id: 'IDF', name: 'Île-de-France', deps: ['75', '77', '78', '91', '92', '93', '94', '95'] },
    { id: 'NOR', name: 'Normandie', deps: ['14', '27', '50', '61', '76'] },
    { id: 'NAQ', name: 'Nouvelle-Aquitaine', deps: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
    { id: 'OCC', name: 'Occitanie', deps: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'] },
    { id: 'PDL', name: 'Pays de la Loire', deps: ['44', '49', '53', '72', '85'] },
    { id: 'PAC', name: 'Provence-Alpes-Côte d\'Azur', deps: ['04', '05', '06', '13', '83', '84'] },
];

export async function fetchVigilanceBulletin(period = 1, regionId: string | null = null): Promise<string> {
    try {
        const { data, error } = await supabase
            .from('vigilance_status')
            .select('*')
            .eq('period', period);

        if (error || !data) return "";

        const regionConfig = regionId ? REGIONS.find(r => r.id === regionId) : null;

        const filteredData = data.filter(d => {
            const isBase = d.dep_code && !['FRA', '99', 'METRO', '00'].includes(d.dep_code.toString().trim());
            if (!isBase) return false;
            if (regionConfig) return regionConfig.deps.includes(d.dep_code);
            return true;
        });

        const sections: string[] = [];

        // 1. ROUGE & ORANGE
        [4, 3].forEach(level => {
            PHENOMENA.forEach(phenomenon => {
                const matchingDeps = filteredData.filter(d => {
                    const risk = d.risks?.find((r: any) => r.id === phenomenon.id);
                    return risk && risk.level === level;
                }).sort((a, b) => {
                    const aCode = a.dep_code.replace("2A", "20.1").replace("2B", "20.2");
                    const bCode = b.dep_code.replace("2A", "20.1").replace("2B", "20.2");
                    return parseFloat(aCode) - parseFloat(bCode);
                });

                if (matchingDeps.length > 0) {
                    const icon = level === 4 ? "🔴" : "🟠";
                    const label = level === 4 ? "ROUGE" : "ORANGE";
                    const count = matchingDeps.length;
                    const depList = matchingDeps.map(m => `${DEPARTMENTS[m.dep_code] || m.dep_code} (${m.dep_code})`);

                    let depText = "";
                    if (depList.length === 1) {
                        depText = depList[0];
                    } else {
                        const last = depList.pop();
                        depText = depList.join(", ") + " et " + last;
                    }

                    sections.push(`${icon} Vigilance ${label} – ${phenomenon.name.toUpperCase()} : ${depText}`);
                }
            });
        });

        // 2. JAUNE
        const yellowParts: string[] = [];
        PHENOMENA.forEach(p => {
            const count = filteredData.filter(d => d.risks?.some((r: any) => r.id === p.id && r.level === 2)).length;
            if (count > 0) {
                yellowParts.push(`${p.name.toUpperCase()} pour ${count} département${count > 1 ? 's' : ''}`);
            }
        });

        if (yellowParts.length > 0) {
            sections.push(`🟡 Vigilance JAUNE – ${yellowParts.join(", ")}.`);
        }

        const now = new Date();
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + period);
        
        const dateStrFull = new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).format(targetDate).toUpperCase();

        const scopeLabel = regionConfig ? regionConfig.name.toUpperCase() : "MÉTÉOROLOGIQUE";
        const header = `📋 VIGILANCE ${scopeLabel} DU ${dateStrFull}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        if (sections.length === 0) {
            return header + "✅ RAS : Aucune vigilance particulière.";
        }

        return header + sections.join('\n\n');

    } catch (err) {
        console.error("Erreur sync vigilance:", err);
        return "";
    }
}
