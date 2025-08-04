// Map numbers to image paths for display (matching slotreel order)
export const SYMBOLS_MAP: string[] = [
  '/images/symbol_0.webp', // 7
  '/images/symbol_1.webp', // banana
  '/images/symbol_2.webp', // melon
  '/images/symbol_3.webp', // citron
  '/images/symbol_4.webp', // BAR
  '/images/symbol_5.webp', // bell
  '/images/symbol_6.webp', // orange
  '/images/symbol_7.webp', // plum
  '/images/symbol_8.webp', // cherry
]

interface WinTableEntry {
  combo: (number | '*')[]
  payout: number
}

// WIN_TABLE_DISPLAY matches the server WIN_TABLE
export const WIN_TABLE_DISPLAY: WinTableEntry[] = [
  { combo: [0, 0, 0], payout: 1000 },
  { combo: [1, 1, 1], payout: 700 },
  { combo: [2, 2, 2], payout: 500 },
  { combo: [3, 3, 3], payout: 400 },
  { combo: [4, 4, 4], payout: 300 },
  { combo: [5, 5, 5], payout: 150 },
  { combo: [6, 6, 6], payout: 100 },
  { combo: [7, 7, 7], payout: 80 },
  { combo: [8, 8, 8], payout: 60 },
  { combo: [7, 7, '*'], payout: 30 },
  { combo: [8, 8, '*'], payout: 15 },
  { combo: [7, '*', '*'], payout: 7 },
  { combo: [8, '*', '*'], payout: 2 },
]

export function formatCombo(combo: (number | '*')[]) {
  return combo.map((x, idx) =>
    x === '*' ? (
      <span key={idx} style={{ fontWeight: 'bold', fontSize: '1.2em', margin: '0 2px' }}>*</span>
    ) : (
      <img
        key={idx}
        src={SYMBOLS_MAP[x]}
        alt={`symbol_${x}`}
        style={{ height: '1.5em', verticalAlign: 'middle', margin: '0 2px' }}
      />
    )
  )
}
