export type BingoCard = number[][];
export type CalledSet = Set<number>;

export function checkBingo(card: BingoCard, called: CalledSet): { win: boolean; pattern?: string } {
  const marked = card.map(row => row.map(n => n === 0 || called.has(n)));
  
  // Rows
  for (let r = 0; r < 5; r++) {
    if (marked[r].every(Boolean)) return { win: true, pattern: `row-${r}` };
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    if ([0,1,2,3,4].every(r => marked[r][c])) return { win: true, pattern: `col-${c}` };
  }
  // Diagonals
  if ([0,1,2,3,4].every(i => marked[i][i])) return { win: true, pattern: 'diag-main' };
  if ([0,1,2,3,4].every(i => marked[i][4-i])) return { win: true, pattern: 'diag-anti' };
  
  // Four corners
  if (marked[0][0] && marked[0][4] && marked[4][0] && marked[4][4]) return { win: true, pattern: 'four-corners' };
  
  // Full house
  const allMarked = marked.flat().every(Boolean);
  if (allMarked) return { win: true, pattern: 'full-house' };
  
  return { win: false };
}
