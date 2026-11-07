// ===================================================================
//  FreshFix UF – reklamfilm. ALLA TEXTER OCH FÄRGER ÄNDRAS HÄR.
//  Tider (sekunder) finns i src/timeline.json.
// ===================================================================
import timeline from './timeline.json';

export const T = timeline;
export const FPS = timeline.fps;
export const f = (sec: number) => Math.round(sec * FPS); // sekunder -> frames

export const C = {
  charcoal: '#1B1C1A',
  charcoal2: '#26282A',
  beige: '#EEE7DB',
  beigeDeep: '#DCCFBB',
  sand: '#C9B89C',
  green: '#78826A', // exakt grön från logotypen
  greenDark: '#3E4A38',
  forest: '#2C3628',
  steel: '#B9BCBD',
  white: '#FFFFFF',
  black: '#0B0B0B',
};

export const FONT_SANS = 'Inter, sans-serif';
export const FONT_SERIF = '"Cormorant Garamond", serif';

export const TEXT = {
  problem: {
    t1: 'Varje år slängs\nenorma mängder mat.',
    t2: 'Ett problem som påverkar\nbåde vår miljö och\nvåra plånböcker.',
  },
  facts: [
    {
      index: '01',
      value: 130,
      suffix: ' kg',
      line: 'En barnfamilj i Sverige slänger cirka 130 kg mat per år.',
      sub: 'Två vuxna och två barn.',
      source: 'Källa: Livsmedelsverket, PM 2024 – Vad kostar matsvinnet i hemmet?',
    },
    {
      index: '02',
      value: 34,
      suffix: ' kg',
      line: 'matsvinn per person och år.',
      sub: 'Varav cirka 16 kg slängs i soppåsen – resten hälls ut i vasken.',
      source: 'Källa: Livsmedelsverket, Konsumentundersökning matsvinn 2024',
    },
    {
      index: '03',
      value: 5000,
      prefixRange: '',
      suffix: '–6 000 kr',
      line: 'per år – så mycket kostar matsvinnet\nen familj med två vuxna och två barn.',
      sub: 'Cirka 1 330 kr per person och år.',
      source: 'Källa: Livsmedelsverket, PM 2024 – Vad kostar matsvinnet i hemmet?',
    },
  ],
  solution: {
    question: 'Men tänk om det fanns\nett enklare sätt att\nta hand om maten?',
    presentSmall: 'Vi presenterar',
    product: 'FreshFixer',
    tagline: 'Doftneutraliserare för kylskåp · Rostfritt stål',
  },
  how: {
    kol: { title: 'AKTIVT KOL', line: 'Adsorberar oönskade lukter.', amount: '≈ 55 g per filter' },
    zeolit: { title: 'ZEOLIT', line: 'Ett kompletterande filtermaterial.', amount: '≈ 15 g per filter' },
    pase: { title: 'TVÅ MATERIAL.\nETT SMART FILTER.', line: '55 g aktivt kol + 15 g zeolit i en utbytbar filterpåse.' },
    montering: { title: 'ENKEL ATT ANVÄNDA.\nENKEL ATT BYTA.', line: 'Lägg i filterpåsen. Skjut ihop. Klart.' },
  },
  sustain: [
    { title: 'BYGGT FÖR ATT\nANVÄNDAS IGEN.', sub: 'Behållare i rostfritt stål – gjord för att hålla.' },
    { title: 'BYT ENDAST\nFILTERPÅSEN.', sub: 'Behållaren behålls. Bara filtret byts.' },
    { title: 'LOKAL PRODUKTION\nI UPPSALA.', sub: 'Lokala samarbeten – korta transporter.' },
    { title: 'SMARTARE MATERIALVAL.\nMINDRE ONÖDIGT AVFALL.', sub: 'Pappersbaserad förpackning och fyllnad.' },
    { title: 'VÅRT MÅL ÄR ATT BIDRA\nTILL MINSKAT MATSVINN.', sub: 'I linje med Globala målen 12 och 13.' },
  ],
  whyPillars: ['Tydlig affärsidé', 'Verkligt problem', 'Konkret produkt', 'Hållbarhetsfokus', 'Lokal förankring', 'Potential att växa'],
  why: ['VI SER ETT PROBLEM.', 'VI HAR UTVECKLAT EN LÖSNING.', 'VI VILL GÖRA SKILLNAD.', 'VI ÄR FRESHFIX UF.'],
  finale: {
    t1: 'VI HAR EN LÖSNING PÅ ETT PROBLEM\nSOM INTE KAN IGNORERAS.',
    t2: 'VI ÄR REDO ATT TA NÄSTA STEG.',
    t3: 'VILL NI VETA MER OM VÅR IDÉ\nOCH VÅR POTENTIAL?',
    t4: 'VÄLJ FRESHFIX UF TILL ALUMNINÄSTET 2026.',
    footer: 'FreshFix UF  ·  Lundellska skolan, Uppsala',
  },
};
