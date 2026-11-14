import type { Decal } from './scene';

/** Paint a decal (inset frame and/or text) to a canvas for use as a texture. W/H = face size in world units. */
export function paintDecal(dec: Decal, W: number, H: number, ink: string, ppu = 48): HTMLCanvasElement {
  const cw = Math.max(2, Math.round(W * ppu));
  const ch = Math.max(2, Math.round(H * ppu));
  const cv = document.createElement('canvas');
  cv.width = cw;
  cv.height = ch;
  const g = cv.getContext('2d')!;
  g.strokeStyle = ink;
  g.fillStyle = ink;
  g.lineWidth = Math.max(1.5, ppu * 0.05);
  if (dec.inset != null) {
    const m = dec.inset * ppu;
    g.strokeRect(m, m, cw - 2 * m, ch - 2 * m);
  }
  if (dec.windows) {
    // facade: grid of windows above a name sign at street level
    const { cols, rows } = dec.windows;
    const sign = (dec.size ?? 1) * ppu * 1.9;
    const mx = cw * 0.14, top = ch * 0.07, bottom = ch - sign - ch * 0.03;
    const cellW = (cw - 2 * mx) / cols, cellH = (bottom - top) / rows;
    g.lineWidth = Math.max(1.2, ppu * 0.035);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.strokeRect(mx + c * cellW + cellW * 0.18, top + r * cellH + cellH * 0.2, cellW * 0.64, cellH * 0.55);
      }
    }
    if (dec.text) {
      g.font = `600 ${(dec.size ?? 1) * ppu}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(dec.text, cw / 2, ch - sign / 2 - ch * 0.015);
    }
    return cv;
  }
  if (dec.text) {
    g.save();
    g.translate(cw / 2, ch / 2);
    if (dec.vertical) g.rotate(Math.PI / 2);
    g.font = `${(dec.size ?? 1) * ppu}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(dec.text, 0, 0);
    g.restore();
  }
  return cv;
}
