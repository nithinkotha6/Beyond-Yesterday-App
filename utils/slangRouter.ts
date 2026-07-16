/**
 * In-memory Slang Routing Utility
 * Maps user-selected conversational tones and gender styles
 * to target vocabulary arrays to bypass database latency.
 */

const SLANG_MAP: Record<string, Record<string, string[]>> = {
  ragebait: {
    Male: ['kothi-badcow', 'adavi manishi', 'waste fellow', 'pichi-fellow'],
    Female: ['over-action', 'drama queen', 'gossip-monger'],
    Neutral: ['adavi manishi', 'waste fellow'],
  },
  flirt_tease: {
    Male: ['hero', 'manmadhudu', 'heavy personality'],
    Female: ['bangaram', 'heroine', 'angel', 'attitude queen'],
    Neutral: ['bangaram'],
  },
  motivate: {
    Male: ['tiger', 'machine', 'boss', 'champion'],
    Female: ['queen', 'boss-lady', 'superstar'],
    Neutral: ['champion'],
  },
};

/**
 * Returns tone & gender appropriate Romanized Telugu slang vocabulary list.
 */
export function getSlangFor(tone: string, gender: string): string[] {
  // Map UI tone strings to seed tones
  let mappedTone = 'ragebait';
  if (tone === 'motivate' || tone === 'praise') {
    mappedTone = 'motivate';
  } else if (tone === 'flirt' || tone === 'flirt_tease') {
    mappedTone = 'flirt_tease';
  } else {
    mappedTone = 'ragebait'; // default for ragebait, fun-roast, sarcastic
  }

  // Normalize target gender
  let targetGender = 'Neutral';
  if (gender === 'Male' || gender === 'male') {
    targetGender = 'Male';
  } else if (gender === 'Female' || gender === 'female') {
    targetGender = 'Female';
  }

  const list = SLANG_MAP[mappedTone]?.[targetGender] || SLANG_MAP[mappedTone]?.Neutral || [];
  return list;
}
