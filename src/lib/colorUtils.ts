export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export function hexToRgb(hex: string): Rgb {
  const num = parseInt(hex.replace('#', ''), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

export function hexToHsv(hex: string): Hsv {
  return rgbToHsv(hexToRgb(hex));
}

export function hsvToHex(hsv: Hsv): string {
  return rgbToHex(hsvToRgb(hsv));
}
