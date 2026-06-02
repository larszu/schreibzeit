// Kuratierte Artikel-Liste häufiger deutscher Nomen (Grundschul-Grundwortschatz).
// Schlüssel sind kleingeschriebene Singular-Nominative.
//
// Die korrekte Silbentrennung liefert die Wörterbuch-Bibliothek (hyphen) für
// *beliebige* Wörter; diese Liste ergänzt die Artikel (Genus) für die im
// Grundschulalltag häufigsten Nomen. Sie ist bewusst kompakt gehalten und
// kann jederzeit erweitert werden.

export type Artikel = 'der' | 'die' | 'das';

export const GERMAN_NOUNS: Record<string, Artikel> = {
  // Familie & Menschen
  mutter: 'die', vater: 'der', oma: 'die', opa: 'der', kind: 'das', baby: 'das',
  junge: 'der', mädchen: 'das', mann: 'der', frau: 'die', freund: 'der', freundin: 'die',
  bruder: 'der', schwester: 'die', tante: 'die', onkel: 'der', familie: 'die', mensch: 'der',
  lehrer: 'der', lehrerin: 'die', schüler: 'der', kinder: 'das',

  // Schule
  schule: 'die', klasse: 'die', tafel: 'die', kreide: 'die', heft: 'das', buch: 'das',
  stift: 'der', bleistift: 'der', radiergummi: 'der', schere: 'die', kleber: 'der',
  ranzen: 'der', tasche: 'die', mappe: 'die', lineal: 'das', federmappe: 'die',
  pause: 'die', aufgabe: 'die', wort: 'das', satz: 'der', buchstabe: 'der', zahl: 'die',
  bild: 'das', papier: 'das', farbe: 'die', pinsel: 'der',

  // Tiere
  hund: 'der', katze: 'die', maus: 'die', pferd: 'das', kuh: 'die', schwein: 'das',
  schaf: 'das', ziege: 'die', huhn: 'das', hahn: 'der', ente: 'die', gans: 'die',
  vogel: 'der', fisch: 'der', frosch: 'der', hase: 'der', igel: 'der', fuchs: 'der',
  bär: 'der', wolf: 'der', löwe: 'der', tiger: 'der', affe: 'der', elefant: 'der',
  schlange: 'die', schnecke: 'die', biene: 'die', wespe: 'die', ameise: 'die',
  spinne: 'die', schmetterling: 'der', käfer: 'der', wurm: 'der', tier: 'das',
  pony: 'das', küken: 'das', esel: 'der', maulwurf: 'der', eichhörnchen: 'das',

  // Natur
  baum: 'der', blume: 'die', blatt: 'das', wald: 'der', wiese: 'die', berg: 'der',
  see: 'der', fluss: 'der', meer: 'das', stein: 'der', sand: 'der', erde: 'die',
  sonne: 'die', mond: 'der', stern: 'der', himmel: 'der', wolke: 'die', regen: 'der',
  schnee: 'der', wind: 'der', sturm: 'der', gewitter: 'das', blitz: 'der', donner: 'der',
  feuer: 'das', wasser: 'das', luft: 'die', gras: 'das', wurzel: 'die', ast: 'der',

  // Essen
  apfel: 'der', birne: 'die', banane: 'die', erdbeere: 'die', kirsche: 'die',
  traube: 'die', zitrone: 'die', obst: 'das', gemüse: 'das', kartoffel: 'die',
  tomate: 'die', gurke: 'die', möhre: 'die', salat: 'der', zwiebel: 'die',
  brot: 'das', brötchen: 'das', butter: 'die', käse: 'der', wurst: 'die', ei: 'das',
  milch: 'die', saft: 'der', tee: 'der', kakao: 'der', kuchen: 'der', keks: 'der',
  schokolade: 'die', zucker: 'der', salz: 'das', suppe: 'die', nudel: 'die', reis: 'der',
  fleisch: 'das', honig: 'der', marmelade: 'die', eis: 'das',

  // Körper
  kopf: 'der', haar: 'das', auge: 'das', ohr: 'das', nase: 'die', mund: 'der',
  zahn: 'der', zunge: 'die', hals: 'der', arm: 'der', hand: 'die', finger: 'der',
  bein: 'das', fuß: 'der', knie: 'das', bauch: 'der', rücken: 'der', herz: 'das',

  // Zuhause & Stadt
  haus: 'das', wohnung: 'die', zimmer: 'das', küche: 'die', bad: 'das', tür: 'die',
  fenster: 'das', wand: 'die', boden: 'der', dach: 'das', treppe: 'die', garten: 'der',
  tisch: 'der', stuhl: 'der', bett: 'das', schrank: 'der', sofa: 'das', lampe: 'die',
  teller: 'der', tasse: 'die', glas: 'das', löffel: 'der', gabel: 'die', messer: 'das',
  straße: 'die', weg: 'der', stadt: 'die', dorf: 'das', kirche: 'die', laden: 'der',
  brücke: 'die', auto: 'das', bus: 'der', zug: 'der', fahrrad: 'das', schiff: 'das',
  flugzeug: 'das', roller: 'der', ampel: 'die',

  // Kleidung
  hose: 'die', jacke: 'die', mantel: 'der', pullover: 'der', hemd: 'das', kleid: 'das',
  rock: 'der', schuh: 'der', socke: 'die', mütze: 'die', hut: 'der', handschuh: 'der',

  // Zeit & Abstraktes
  tag: 'der', nacht: 'die', morgen: 'der', abend: 'der', woche: 'die', monat: 'der',
  jahr: 'das', stunde: 'die', minute: 'die', uhr: 'die', zeit: 'die', geburtstag: 'der',
  ferien: 'die', wochenende: 'das', spiel: 'das', ball: 'der', puppe: 'die', name: 'der',
  sommer: 'der', winter: 'der', frühling: 'der', herbst: 'der', jahreszeit: 'die',
  montag: 'der', dienstag: 'der', mittwoch: 'der', donnerstag: 'der', freitag: 'der',
  samstag: 'der', sonntag: 'der',
};
