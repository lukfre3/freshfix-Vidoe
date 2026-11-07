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

// Allt i filmen sätts i samma typsnitt (Minion-stil).
export const FONT_SANS = '"Crimson Pro", serif';
export const FONT_SERIF = '"Crimson Pro", serif';

// Inga punkter efter rubriker (frågetecken behålls).

export const TEXT = {
  problem: {
    t1: 'VARJE ÅR SLÄNGS\nENORMA MÄNGDER MAT',
    t2: 'ETT PROBLEM SOM PÅVERKAR\nBÅDE VÅR MILJÖ OCH\nVÅRA PLÅNBÖCKER',
  },
  facts: [
    {
      index: '01',
      value: 130,
      suffix: ' kg',
      line: 'EN BARNFAMILJ I SVERIGE SLÄNGER\nCIRKA 130 KG MAT PER ÅR',
      sub: 'Två vuxna och två barn',
      source: 'Källa: Livsmedelsverket – Fakta om matsvinn',
    },
    {
      index: '02',
      value: 34,
      suffix: ' kg',
      line: 'MATSVINN PER PERSON OCH ÅR',
      sub: 'Varav cirka 16 kg slängs i soppåsen – resten hälls ut i vasken',
      source: 'Källa: Livsmedelsverket – Fakta om matsvinn',
    },
    {
      index: '03',
      value: 5000,
      prefixRange: '',
      suffix: '–6 000 kr',
      line: 'PER ÅR – SÅ MYCKET KOSTAR MATSVINNET\nEN FAMILJ MED TVÅ VUXNA OCH TVÅ BARN',
      sub: 'Cirka 1 330 kr per person och år',
      source: 'Källa: Livsmedelsverket – Fakta om matsvinn (PM 2024)',
    },
  ],
  solution: {
    question: 'MEN TÄNK OM DET FANNS\nETT ENKLARE SÄTT ATT\nTA HAND OM MATEN?',
    presentSmall: 'Vi presenterar',
    product: 'FRESHFIXER',
    tagline: 'Ett fräschare kylskåp – mindre matsvinn',
    // Produktsidan efter ca 20 s: egenskaper som poppar fram runt produkten
    features: ['Rostfritt stål', 'Aktivt kol + zeolit', 'Fångar lukt och mognadsgaser', 'Utbytbar filterpåse'],
  },
  how: {
    kol: { title: 'AKTIVT KOL', line: 'Fångar upp oönskade lukter', amount: '≈ 55 g per filter' },
    zeolit: { title: 'ZEOLIT', line: 'Hjälper till att fånga upp mognadsgaser\nfrån frukt och grönsaker', amount: '≈ 15 g per filter' },
    pase: { title: 'TVÅ MATERIAL\nETT SMART FILTER', line: '55 g aktivt kol + 15 g zeolit i en utbytbar filterpåse – för ett fräschare kylskåp och matvaror som håller sig fräscha längre' },
    montering: { title: 'ENKEL ATT ANVÄNDA\nENKEL ATT BYTA', line: 'Lägg i filterpåsen – skjut ihop – klart' },
  },
  sustain: [
    { title: 'BYGGT FÖR ATT ANVÄNDAS\nOM OCH OM IGEN', sub: 'En stilren behållare i rostfritt stål' },
    { title: 'BYT ENDAST\nFILTERPÅSEN', sub: 'Ingen ny produkt behövs när filtret är förbrukat' },
    { title: 'LOKAL PRODUKTION\nI UPPSALA', sub: 'Lokala samarbeten – korta transporter' },
    { title: 'SMARTARE MATERIALVAL\nMINDRE ONÖDIGT AVFALL', sub: 'Pappersbaserad förpackning och fyllnad' },
    { title: 'VÅRT MÅL ÄR ATT BIDRA\nTILL MINSKAT MATSVINN', sub: 'I linje med Globala målen 12 och 13' },
  ],
  whyPillars: ['Tydlig affärsidé', 'Verkligt problem', 'Konkret produkt', 'Hållbarhetsfokus', 'Lokal förankring', 'Potential att växa'],
  why: ['VI SER ETT PROBLEM', 'VI HAR UTVECKLAT EN LÖSNING', 'VI VILL GÖRA SKILLNAD', 'VI ÄR FRESHFIX UF'],
  finale: {
    t1: 'VI HAR EN LÖSNING PÅ ETT PROBLEM\nSOM INTE KAN IGNORERAS',
    t2: 'VI ÄR REDO ATT TA NÄSTA STEG',
    t3: 'VILL NI VETA MER OM VÅR IDÉ\nOCH VÅR POTENTIAL?',
    t4: 'VÄLJ FRESHFIX UF TILL ALUMNINÄSTET 2026',
    footer: 'FreshFix UF  ·  Lundellska skolan, Uppsala län',
  },
};
