import { Svg } from "@svgdotjs/svg.js";
import { GridPos } from "./grid";

export class Tile {

  pos: GridPos;
  val: number;
  svg?: Svg;

  constructor(col: number, row: number, val: number) {
    this.pos = new GridPos(col, row);
    this.val = val;
  }

}
