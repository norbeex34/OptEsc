// Utilidades geométricas para el anidado (nesting) de piezas irregulares.

export function polygonBBox(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// Traslada el polígono para que su bbox comience en (0,0).
export function normalizePoints(points) {
  const bbox = polygonBBox(points);
  return {
    points: points.map(p => ({ x: p.x - bbox.minX, y: p.y - bbox.minY })),
    width: bbox.width,
    height: bbox.height
  };
}

// Rota alrededor del origen (0,0) SIN renormalizar. A diferencia de
// `rotatePoints`, esto preserva la posición relativa entre varios grupos de
// puntos que deben rotar juntos rígidamente (p.ej. las piezas internas de un
// "módulo" compuesto), ya que cada uno rotado por separado con `rotatePoints`
// se renormalizaría a su propia bbox y perdería su posición relativa.
export function rotatePointsRigid(points, degrees) {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map(p => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos
  }));
}

export function rotatePoints(points, degrees) {
  return normalizePoints(rotatePointsRigid(points, degrees)).points;
}

export function translatePoints(points, dx, dy) {
  return points.map(p => ({ x: p.x + dx, y: p.y + dy }));
}

// Área con signo (fórmula del cordón/shoelace). Valor absoluto = área real.
export function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(area) / 2;
}

// Rasteriza un polígono (coordenadas mm, ya normalizado a origen 0,0) a una
// máscara booleana usando barrido de líneas (regla par-impar). Soporta formas
// cóncavas/irregulares, no solo rectángulos.
export function rasterizePolygon(points, cellSize) {
  const w = Math.max(1, Math.ceil(polygonBBox(points).width / cellSize) || 1);
  const h = Math.max(1, Math.ceil(polygonBBox(points).height / cellSize) || 1);
  const mask = new Uint8Array(w * h);

  for (let row = 0; row < h; row++) {
    const yMm = (row + 0.5) * cellSize;
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (a.y === b.y) continue;
      if ((yMm >= a.y && yMm < b.y) || (yMm >= b.y && yMm < a.y)) {
        const t = (yMm - a.y) / (b.y - a.y);
        xs.push(a.x + t * (b.x - a.x));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      let cStart = Math.max(0, Math.round(xs[i] / cellSize));
      let cEnd = Math.min(w, Math.round(xs[i + 1] / cellSize));
      for (let c = cStart; c < cEnd; c++) {
        mask[row * w + c] = 1;
      }
    }
  }
  return { mask, w, h };
}

// Dilata (crece) una máscara booleana `k` celdas en todas direcciones.
// Implementado en dos pasadas (horizontal + vertical) para eficiencia.
export function dilateMask(mask, w, h, k) {
  if (k <= 0) return mask;
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      const x0 = Math.max(0, x - k);
      const x1 = Math.min(w - 1, x + k);
      for (let xx = x0; xx <= x1; xx++) tmp[y * w + xx] = 1;
    }
  }
  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (!tmp[y * w + x]) continue;
      const y0 = Math.max(0, y - k);
      const y1 = Math.min(h - 1, y + k);
      for (let yy = y0; yy <= y1; yy++) out[yy * w + x] = 1;
    }
  }
  return out;
}

// Tabla de sumas acumuladas (integral image) para consultar en O(1) si una
// región rectangular de la grilla está completamente libre.
export function buildIntegral(mask, w, h) {
  const integral = new Uint32Array((w + 1) * (h + 1));
  const stride = w + 1;
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += mask[y * w + x];
      integral[(y + 1) * stride + (x + 1)] = integral[y * stride + (x + 1)] + rowSum;
    }
  }
  return integral;
}

// Envolvente convexa (Andrew's monotone chain). Se usa como último recurso
// cuando un DXF no trae ningún contorno cerrado utilizable.
export function convexHull(points) {
  const pts = points
    .slice()
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (pts.length < 3) return pts;

  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function integralRectSum(integral, w, x0, y0, x1, y1) {
  const stride = w + 1;
  return (
    integral[y1 * stride + x1] -
    integral[y0 * stride + x1] -
    integral[y1 * stride + x0] +
    integral[y0 * stride + x0]
  );
}
