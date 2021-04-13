import { Svg, SVG, Timeline } from '@svgdotjs/svg.js';
import { Mutex } from 'async-mutex';

import { Grid, GridPos } from './grid';
import { Tile } from './tile';

enum MoveDir {
  Up,
  Down,
  Left,
  Right
}

export class App {

  static GRID_COLS = 5;
  static GRID_ROWS = 4;

  private svg: Svg;
  private grid: Grid;
  private tiles: Tile[] = [];
  private tilesToRemove: Tile[] = [];
  private mutex = new Mutex();

  constructor() {
    this.svg = SVG().addTo('body').size(1000, 500);
    this.grid = new Grid(App.GRID_COLS, App.GRID_ROWS);
  }

  run(): void {
    document.addEventListener('keydown', this.inputEventListener.bind(this));

    this.createTiles(3);
    this.render();
  }

  private render(): void {
    const timeline = new Timeline();

    this.tiles.forEach(t => {
      while (this.tilesToRemove.length) {
        const tile = this.tilesToRemove.pop();
        if (tile)
          tile.svg?.remove();
      }

      if (t.svg) {
        t.svg.findOne('text').remove();
        t.svg.text(t.val.toString());
        t.svg.timeline(timeline)
          // TODO this is a bug in svg.js.d.ts @3.0.16
          // @ts-ignore
          .animate(200, 0, 'absolute')
          .move(...this.grid.getXY(t.pos));
      } else {
        t.svg = this.svg.nested();
        t.svg.size(0, 0)
          .move(...this.grid.getXY(t.pos));
        t.svg.rect(Grid.TILE_SIZE, Grid.TILE_SIZE)
          .radius(10)
          .fill({ color: 'black', opacity: 0.25 });
        t.svg.text(t.val.toString());
        t.svg.timeline(timeline)
          // TODO this is a bug in svg.js.d.ts @3.0.16
          // @ts-ignore
          .animate(50, 200, 'absolute')
          .size(Grid.TILE_SIZE, Grid.TILE_SIZE);
      }
    });
  }

  private update(dir: MoveDir): void {
    let dimAMax = 0;
    let dimBMax = 0;
    let reverse = false;
    let getPos: (dimA: number, dimB: number) => GridPos;
    let getPosAdd: (pos: GridPos, add: number) => GridPos;

    // For horizontal moves, dimA is rows and dimB is columns
    // For vertical moves, dimA is columns and dimB is rows
    switch (dir) {
      case MoveDir.Up:
      case MoveDir.Down:
        // UP: dimA = col, dimB = row + 1
        // DOWN: dimA = col, dimB = row - 1
        dimAMax = App.GRID_COLS;
        dimBMax = App.GRID_ROWS;
        reverse = dir === MoveDir.Down;
        getPos = (dimA: number, dimB: number) => new GridPos(dimA, dimB);
        getPosAdd = (pos: GridPos, add: number) => new GridPos(pos.col, pos.row + add);
        break;
      case MoveDir.Left:
      case MoveDir.Right:
        // LEFT: dimA = row, dimB = col + 1
        // RIGHT: dimA = row, dimB = col - 1
        dimAMax = App.GRID_ROWS;
        dimBMax = App.GRID_COLS;
        reverse = dir === MoveDir.Right;
        getPos = (dimA: number, dimB: number) => new GridPos(dimB, dimA);
        getPosAdd = (pos: GridPos, add: number) => new GridPos(pos.col + add, pos.row);
        break;
    }

    for (let dimA = 0; dimA < dimAMax; dimA++) {
      let destPos: GridPos | undefined = undefined;
      let destTile: Tile | undefined = undefined;

      for (let dimBi = 0; dimBi < dimBMax - 1; dimBi++) {
        let dimB = dimBi;
        if (reverse)
          dimB = dimBMax - dimBi - 1;

        destPos ??= getPos(dimA, dimB);
        destTile = this.tiles.find(t => t.pos.equals(destPos!));

        const nextPos = getPos(dimA, dimB + (reverse ? -1 : 1));
        // console.log('--------', dimA, dimB, nextPos, destPos);
        const nextTile = this.tiles.find(t => t.pos.equals(nextPos));
        if (nextTile) {
          // console.log('nextTile', nextTile.pos, nextTile.val);
          if (destTile) {
            // console.log('destTile', destTile.pos, destTile.val);
            if (nextTile.val === destTile.val) {
              // Destination tile exists and has same value
              nextTile.pos = destPos;
              nextTile.val *= 2;
              // Remove destTile
              this.tilesToRemove.push(destTile);
              this.tiles = this.tiles.filter(t => t !== destTile);
              // console.log('equal', nextTile.val, nextTile.pos);
            } else {
              // Destination tile exists but has different value
              destPos = getPosAdd(destPos, (reverse ? -1 : 1));
              nextTile.pos = destPos;
              // console.log('unequal', nextTile.pos);
            }
          } else {
            // Destination tile does not exist
            nextTile.pos = destPos;
            // console.log('move', nextTile.pos);
          }
        }
      }
    }

    this.createTiles(1);
  }

  private createTiles(count: number): void {
    for (let i = 0; i < count; i++) {
      const col = Math.floor(Math.random() * App.GRID_COLS);
      const row = Math.floor(Math.random() * App.GRID_ROWS);
      const pos = new GridPos(col, row);
      if (!this.tiles.find(t => t.pos.equals(pos)))
        this.tiles.push(new Tile(col, row, 2));
      else
        i--;
    }
  }

  private async inputEventListener(e: Event): Promise<void> {
    // const release = await this.mutex.acquire();

    // try {
    if (e instanceof KeyboardEvent) {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.update(MoveDir.Up);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.update(MoveDir.Down);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.update(MoveDir.Left);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.update(MoveDir.Right);
          break;
      }
      this.render();
    }
    // } finally {
    //   release();
    // }
  }

}
