export type BingoCard = number[][];

export const BINGO_RANGES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

export function generateCard(seed?: number): BingoCard {
  const rng = seed ? mulberry32(seed) : Math.random;
  const card: BingoCard = [];
  
  const columns = ['B','I','N','G','O'];
  
  for (let col = 0; col < 5; col++) {
    const [min, max] = BINGO_RANGES[columns[col] as keyof typeof BINGO_RANGES];
    const nums = new Set<number>();
    while (nums.size < 5) {
      const n = Math.floor(rng() * (max - min + 1)) + min;
      nums.add(n);
    }
    const sorted = Array.from(nums).sort((a,b)=>a-b);
    for (let row = 0; row < 5; row++) {
      if (!card[row]) card[row] = [0,0,0,0,0];
      card[row][col] = sorted[row];
    }
  }
  // Free center
  card[2][2] = 0;
  return card;
}

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
