export class GridPos {

  col: number;
  row: number;

  constructor(col: number, row: number) {
    this.col = col;
    this.row = row;
  }

  equals(pos: GridPos): boolean {
    return pos.col === this.col && pos.row === this.row;
  }

}

export class Grid {

  static TILE_SIZE = 100;
  static TILE_GAP = 20;

  cols: number;
  rows: number;

  private grid: [x: number, y: number][][];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;

    this.grid = [];
    for (let i = 0; i < (cols * rows); i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = Grid.TILE_SIZE * col + Grid.TILE_GAP * col;
      const y = Grid.TILE_SIZE * row + Grid.TILE_GAP * row;

      if (!this.grid[col])
        this.grid[col] = [];

      this.grid[col][row] = [x, y];
    }
  }

  getXY(pos: GridPos): [x: number, y: number] {
    return this.grid[pos.col][pos.row];
  }

}
