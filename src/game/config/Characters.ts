/**
 * Character Archetypes matching the specialist roster directly from the hero artwork:
 * /public/assets/aistudio/file_000000003b048208b6bf0699c05c7595_a8eda307.png
 */

export interface CharacterArchetype {
  id: string;
  name: string;
  role: string;
  tagline: string;
  traits: string[];
  description: string;
  imageCropOffset: string; // CSS background position / crop for portrait card
  statsDisplay: {
    speed: string;
    special: string;
  };
  colors: {
    jacket: number;
    pants: number;
    body: number;
    accent: number;
    glow: number;
    hair?: number;
    beanie?: number;
    shoes?: number;
  };
  modifiers: {
    speedMultiplier: number;
    jumpPower: number;
    wallRunBonus: number;
    doubleJumpBonus: number;
    momentumRetention: number;
    grappleBonus: number;
  };
}

export const CHARACTERS: CharacterArchetype[] = [
  {
    id: 'rebel',
    name: 'THE REBEL',
    role: 'SCOUT',
    tagline: 'Observes • Plans • Moves • Alone • But never lonely',
    traits: ['OBSERVES', 'PLANS', 'MOVES', 'ALONE', 'BUT NEVER LONELY'],
    description: 'Black oversized streetwear hoodie with sunglasses & tactical courier rig. Ultra-high agility & lightning-quick wall-hops.',
    imageCropOffset: '12% 20%',
    statsDisplay: {
      speed: 'SPEED: 10 / 10',
      special: 'AGILITY: 9.8 / 10',
    },
    colors: {
      jacket: 0x14161b, // Jet black hoodie
      pants: 0x1f222a,  // Heavy black techwear cargo pants
      body: 0xd89f78,
      accent: 0xff9900,
      glow: 0xffaa00,
      hair: 0x111113,
      shoes: 0xdcdfe4,  // White/grey chunky sneakers
    },
    modifiers: {
      speedMultiplier: 1.25,
      jumpPower: 14.5,
      wallRunBonus: 1.35,
      doubleJumpBonus: 1.1,
      momentumRetention: 1.15,
      grappleBonus: 1.0,
    },
  },
  {
    id: 'brawler',
    name: 'THE BRAWLER',
    role: 'HEAVY',
    tagline: 'Protects • Fights • Leads • Loyal • No fear',
    traits: ['PROTECTS', 'FIGHTS', 'LEADS', 'LOYAL', 'NO FEAR'],
    description: 'High-collar technical windbreaker, tactical chest harnesses & combat half-gloves. Heavy impact landings & smash vaulting.',
    imageCropOffset: '37% 20%',
    statsDisplay: {
      speed: 'SPEED: 7.5 / 10',
      special: 'RESILIENCE: 10 / 10',
    },
    colors: {
      jacket: 0x16181d, // Tactical windbreaker with orange accents
      pants: 0x181a1f,  // Heavy multi-pocket cargo pants
      body: 0xba7d56,
      accent: 0xef4444,
      glow: 0xff3b30,
      hair: 0x1a1815,
      shoes: 0x242426,  // Rugged combat parkour boots
    },
    modifiers: {
      speedMultiplier: 1.0,
      jumpPower: 12.8,
      wallRunBonus: 0.9,
      doubleJumpBonus: 0.95,
      momentumRetention: 1.35, // Holds momentum longer once built!
      grappleBonus: 1.1,
    },
  },
  {
    id: 'thinker',
    name: 'THE THINKER',
    role: 'MIND',
    tagline: 'Analyzes • Connects • Solves • Builds • Beyond the visible',
    traits: ['ANALYZES', 'CONNECTS', 'SOLVES', 'BUILDS', 'BEYOND THE VISIBLE'],
    description: 'Heather grey knit beanie, light-grey hoodie & olive khaki cargo pants. Precision trajectory & extended ledge reach.',
    imageCropOffset: '63% 20%',
    statsDisplay: {
      speed: 'SPEED: 9.0 / 10',
      special: 'PRECISION: 10 / 10',
    },
    colors: {
      jacket: 0xdfe3e8, // Heather off-white/light grey hoodie
      pants: 0x58523d,  // Olive khaki cargo pants
      body: 0xd9a27e,
      accent: 0x00d2ff,
      glow: 0x00f0ff,
      hair: 0x222222,
      beanie: 0x3d4349, // Charcoal beanie
      shoes: 0x1f2022,
    },
    modifiers: {
      speedMultiplier: 1.12,
      jumpPower: 13.5,
      wallRunBonus: 1.15,
      doubleJumpBonus: 1.05,
      momentumRetention: 1.1,
      grappleBonus: 1.4, // Super long grapple range and pull!
    },
  },
  {
    id: 'free_spirit',
    name: 'THE FREE SPIRIT',
    role: 'VIBE',
    tagline: 'Creates • Feels • Inspires • Flows • Lives',
    traits: ['CREATES', 'FEELS', 'INSPIRES', 'FLOWS', 'LIVES'],
    description: 'Color-blocked light tech jacket, over-ear DJ headphones & cross-body sling bag. Infinite momentum combos & air spins.',
    imageCropOffset: '88% 20%',
    statsDisplay: {
      speed: 'FLOW: 2.0x',
      special: 'AIR FLIP: 10 / 10',
    },
    colors: {
      jacket: 0xc8ccd1, // Light grey/white windbreaker with dark trim
      pants: 0x1b1d22,  // Baggy techwear black cargos
      body: 0xd59b75,
      accent: 0xa855f7,
      glow: 0xc084fc,
      hair: 0x18181c,
      shoes: 0xe5e7eb,  // Clean white performance runners
    },
    modifiers: {
      speedMultiplier: 1.18,
      jumpPower: 14.2,
      wallRunBonus: 1.45,
      doubleJumpBonus: 1.35,
      momentumRetention: 1.25,
      grappleBonus: 1.2,
    },
  },
];
