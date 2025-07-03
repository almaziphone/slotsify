// Map numbers to emojis for display
export const SYMBOLS_MAP = ['7️⃣', '💎', '⭐', '🔔', '🍋', '🍒']


export const WIN_TABLE_DISPLAY = [
  { combo: [0,0,0], payout: 1000 },
  { combo: [1,1,1], payout: 700 },
  { combo: [2,2,2], payout: 500 },
  { combo: [3,3,3], payout: 400 },
  { combo: [4,4,4], payout: 300 },
  { combo: [5,5,5], payout: 150 },
  { combo: [4,4,'*'], payout: 70 },
  { combo: [5,5,'*'], payout: 35 },
  { combo: [4,'*','*'], payout: 12 },
  { combo: [5,'*','*'], payout: 5 },
]

export function formatCombo(combo) {
  return combo.map(x => x === '*' ? '*' : SYMBOLS_MAP[x]).join('');
}