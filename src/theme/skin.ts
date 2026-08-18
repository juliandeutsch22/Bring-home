// skin.ts — DIE austauschbare Schicht.
//
// Alles, was bring-home von Stoa unterscheidet, steht hier: die zwei Akzente,
// die Materialtöne, die Display-Schrift. Der Rest des Design-Systems
// (Abstände, Radien, Meißel, Bewegung, Bauteile) ist thematisch neutral und
// bleibt unangetastet.
//
// Eine Variante auszuprobieren heißt: EINE Zeile unten umstellen.
//
// Gewählt ist `stoa` — dieselbe Haut wie die Schwester-App. Die Alternativen
// bleiben stehen: sie haben nichts gekostet und ersparen beim nächsten Zweifel
// das Wiederherleiten.

export type SkinName = 'stoa' | 'leinen' | 'emaille' | 'holz';

type Skin = {
  name: SkinName;
  /** Kurzbeschreibung — steht in den Vergleichs-Screenshots. */
  beschreibung: string;
  hell: Materialtoene;
  dunkel: Materialtoene;
};

type Materialtoene = {
  /** Primär: Handlung, „an", Erfolg. */
  a: string;
  /** Sekundär: Info, Zweitrang, Destruktives. */
  b: string;
  bg: string;
  bg2: string;
  bg3: string;
  bg4: string;
  chip: string;
  chipBorder: string;
  sunk: string;
  border: string;
  border2: string;
  border3: string;
  text: string;
  text2: string;
  text3: string;
};

/**
 * Regel für neue Akzentpaare: die beiden Töne müssen sich in der
 * GRAUSTUFEN-Helligkeit deutlich unterscheiden. Dann trägt die Hierarchie auch
 * ohne Farbe — und ein drittes Alarm-Rot wird nicht vermisst.
 */
const SKINS: Record<SkinName, Skin> = {
  // Die Haut aus Stoa, unverändert übernommen: Marmor und Ägäis. Kuppel-Blau
  // trägt die Handlung, der Oliven-Zweig erdet Zweitinformationen.
  stoa: {
    name: 'stoa',
    beschreibung: 'Stoa — Marmor, Kuppel-Blau, Oliv',
    hell: {
      a: '#2B5FA6',
      b: '#7E8C5C',
      // `bg` ist der GRUND, auf dem alles liegt — weiß. Er steht auch im Kopf
      // der ausgelieferten Seite (`scripts/pwa-huelle.mjs` liest ihn hier) und
      // färbt damit die Fläche hinter der App und die iOS-Statusleiste. Wer ihn
      // ändert, muss `Backdrop.tsx` mitziehen: dort steht derselbe Grund als
      // Verlauf, und laufen die beiden auseinander, sitzt die App in einem
      // Rahmen anderer Farbe.
      bg: '#FFFFFF',
      // Die Steinflächen. Sie sind gegenüber der ersten Fassung ENTWÄRMT
      // (dieselbe Helligkeit, weniger Gelb), weil cremiges Beige neben reinem
      // Weiß nach vergilbtem Papier aussieht statt nach Stein.
      //
      // `bg2` muss zum Mittelwert von `marble-light.jpg` passen (#F3F2ED): das
      // Blatt liegt deckend auf der Fläche, und überall, wo es sie nicht ganz
      // erreicht, schaut sie hervor. Solange beide warm waren, fiel das nicht
      // auf — mit einer kühlen Textur auf warmem Grund stand plötzlich ein
      // gelblicher Streifen am Fuß der Platte.
      bg2: '#F5F4F0',
      bg3: '#ECEAE5',
      bg4: '#E2DFD9',
      chip: '#ECEAE5',
      chipBorder: 'rgba(50,50,40,0.12)',
      sunk: '#E8E6E0',
      border: 'rgba(50,50,40,0.12)',
      border2: 'rgba(50,50,40,0.18)',
      border3: 'rgba(50,50,40,0.30)',
      text: '#1E1D18',
      text2: '#565349',
      text3: '#93907F',
    },
    dunkel: {
      a: '#7BA7DC',
      b: '#9DAF7E',
      bg: '#0B0E13',
      bg2: '#1A1F28',
      bg3: '#1A2029',
      bg4: '#222A34',
      chip: 'rgba(255,255,255,0.07)',
      chipBorder: 'rgba(255,255,255,0.10)',
      sunk: 'rgba(0,0,0,0.28)',
      border: 'rgba(255,255,255,0.12)',
      border2: 'rgba(255,255,255,0.20)',
      border3: 'rgba(255,255,255,0.32)',
      text: '#FFFFFF',
      text2: 'rgba(255,255,255,0.70)',
      text3: 'rgba(255,255,255,0.38)',
    },
  },

  // Ein Einkaufszettel ist ein Zettel. Warmes Leinenpapier, Ziegelrot für die
  // Handlung, ein stilles Salbeigrün für alles Zweite.
  leinen: {
    name: 'leinen',
    beschreibung: 'Leinen & Ziegel — warmes Papier, Ziegelrot, Salbei',
    hell: {
      a: '#A24A34',
      b: '#8AA08B',
      bg: '#F5F1E9',
      bg2: '#FCF8F1',
      bg3: '#EFEADF',
      bg4: '#E4DDCE',
      chip: '#EFE9DD',
      chipBorder: 'rgba(60,50,40,0.12)',
      sunk: '#EBE4D6',
      border: 'rgba(60,50,40,0.12)',
      border2: 'rgba(60,50,40,0.18)',
      border3: 'rgba(60,50,40,0.30)',
      text: '#201C18',
      text2: '#5A5147',
      text3: '#968E80',
    },
    dunkel: {
      a: '#E08268',
      b: '#A9C1AA',
      bg: '#12100E',
      bg2: '#211D19',
      bg3: '#221E1A',
      bg4: '#2C2722',
      chip: 'rgba(255,255,255,0.07)',
      chipBorder: 'rgba(255,255,255,0.10)',
      sunk: 'rgba(0,0,0,0.28)',
      border: 'rgba(255,255,255,0.12)',
      border2: 'rgba(255,255,255,0.20)',
      border3: 'rgba(255,255,255,0.32)',
      text: '#FFFFFF',
      text2: 'rgba(255,255,255,0.70)',
      text3: 'rgba(255,255,255,0.38)',
    },
  },

  // Küchen-Emaille: kühles Petrol auf cremeweißem Blech, Senf als Zweitton.
  emaille: {
    name: 'emaille',
    beschreibung: 'Emaille — Petrol auf Creme, Senf als Zweitton',
    hell: {
      a: '#1F5F6B',
      b: '#C9A227',
      bg: '#F2F2ED',
      bg2: '#FBFBF6',
      bg3: '#EAEAE4',
      bg4: '#DEDED6',
      chip: '#E9E9E2',
      chipBorder: 'rgba(40,50,50,0.12)',
      sunk: '#E4E4DC',
      border: 'rgba(40,50,50,0.12)',
      border2: 'rgba(40,50,50,0.18)',
      border3: 'rgba(40,50,50,0.30)',
      text: '#171B1C',
      text2: '#4C5455',
      text3: '#8A9192',
    },
    dunkel: {
      a: '#6FB3C0',
      b: '#E0C55E',
      bg: '#0B0F10',
      bg2: '#181E20',
      bg3: '#191F21',
      bg4: '#222A2C',
      chip: 'rgba(255,255,255,0.07)',
      chipBorder: 'rgba(255,255,255,0.10)',
      sunk: 'rgba(0,0,0,0.28)',
      border: 'rgba(255,255,255,0.12)',
      border2: 'rgba(255,255,255,0.20)',
      border3: 'rgba(255,255,255,0.32)',
      text: '#FFFFFF',
      text2: 'rgba(255,255,255,0.70)',
      text3: 'rgba(255,255,255,0.38)',
    },
  },

  // Schneidebrett: Waldgrün auf hellem Ahorn, Terrakotta als Zweitton.
  holz: {
    name: 'holz',
    beschreibung: 'Holz — Waldgrün auf Ahorn, Terrakotta',
    hell: {
      a: '#2F6446',
      b: '#C98A6B',
      bg: '#F4EFE4',
      bg2: '#FBF6EB',
      bg3: '#EDE7D9',
      bg4: '#E1D9C7',
      chip: '#EDE6D7',
      chipBorder: 'rgba(60,50,35,0.12)',
      sunk: '#E8E0CE',
      border: 'rgba(60,50,35,0.12)',
      border2: 'rgba(60,50,35,0.18)',
      border3: 'rgba(60,50,35,0.30)',
      text: '#1E1B15',
      text2: '#575044',
      text3: '#948C7B',
    },
    dunkel: {
      a: '#7FBE96',
      b: '#E0A98C',
      bg: '#101210',
      bg2: '#1D211D',
      bg3: '#1E221E',
      bg4: '#272C27',
      chip: 'rgba(255,255,255,0.07)',
      chipBorder: 'rgba(255,255,255,0.10)',
      sunk: 'rgba(0,0,0,0.28)',
      border: 'rgba(255,255,255,0.12)',
      border2: 'rgba(255,255,255,0.20)',
      border3: 'rgba(255,255,255,0.32)',
      text: '#FFFFFF',
      text2: 'rgba(255,255,255,0.70)',
      text3: 'rgba(255,255,255,0.38)',
    },
  },
};

// ↓↓↓ HIER die Variante umstellen ↓↓↓
export const SKIN: Skin = SKINS.stoa;

export const ALLE_SKINS = SKINS;
