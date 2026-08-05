import DxfParser from 'dxf-parser';
import { normalizePoints, polygonArea, polygonBBox, convexHull } from './polygonUtils';

// Convierte un segmento con "bulge" (arco) de DXF en puntos interpolados.
// bulge = tan(theta/4), donde theta es el ángulo incluido del arco.
function bulgeToArcPoints(p1, p2, bulge, segments = 12) {
  if (!bulge) return [p1];
  const theta = 4 * Math.atan(bulge);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const chord = Math.hypot(dx, dy);
  if (chord === 0) return [p1];
  const radius = chord / (2 * Math.sin(theta / 2));
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const dirX = -dy / chord;
  const dirY = dx / chord;
  const sign = bulge >= 0 ? 1 : -1;

  const a = theta / 2;
  const h = radius * Math.cos(a);
  const cx = midX - dirX * h * sign;
  const cy = midY - dirY * h * sign;

  const startAngle = Math.atan2(p1.y - cy, p1.x - cx);
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = startAngle + (theta * i) / segments;
    points.push({ x: cx + Math.abs(radius) * Math.cos(t), y: cy + Math.abs(radius) * Math.sin(t) });
  }
  return points;
}

function verticesToPoints(vertices) {
  const points = [];
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    if (v.bulge && next) {
      points.push(...bulgeToArcPoints({ x: v.x, y: v.y }, { x: next.x, y: next.y }, v.bulge));
    } else {
      points.push({ x: v.x, y: v.y });
    }
  }
  return points;
}

function circleToPoints(entity, segments = 48) {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    points.push({
      x: entity.center.x + entity.radius * Math.cos(t),
      y: entity.center.y + entity.radius * Math.sin(t)
    });
  }
  return points;
}

// ARC/CIRCLE: startAngle/endAngle ya vienen en radianes (dxf-parser convierte
// desde grados al parsear los códigos 50/51).
function arcToPoints(entity, segments = 32) {
  const start = entity.startAngle ?? 0;
  let end = entity.endAngle ?? start;
  if (end <= start) end += 2 * Math.PI;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = start + ((end - start) * i) / segments;
    points.push({
      x: entity.center.x + entity.radius * Math.cos(t),
      y: entity.center.y + entity.radius * Math.sin(t)
    });
  }
  return points;
}

// LINE: dxf-parser guarda extremos en entity.vertices = [inicio, fin].
function lineToPoints(entity) {
  if (!entity.vertices || entity.vertices.length < 2) return null;
  return [{ x: entity.vertices[0].x, y: entity.vertices[0].y }, { x: entity.vertices[1].x, y: entity.vertices[1].y }];
}

// SPLINE: se aproxima con una polilínea por sus puntos de ajuste (fitPoints)
// o, si no hay, por sus puntos de control.
function splineToPoints(entity) {
  const pts = entity.fitPoints && entity.fitPoints.length >= 2 ? entity.fitPoints : entity.controlPoints;
  if (!pts || pts.length < 2) return null;
  return pts.map((p) => ({ x: p.x, y: p.y }));
}

// ELLIPSE: majorAxisEndPoint es un offset (dx,dy) relativo al centro. Los
// ángulos ya vienen en radianes (dxf-parser no los convierte para este tipo).
function ellipseToPoints(entity, segments = 48) {
  if (!entity.center || !entity.majorAxisEndPoint) return null;
  const majorLen = Math.hypot(entity.majorAxisEndPoint.x, entity.majorAxisEndPoint.y);
  if (majorLen === 0) return null;
  const rotation = Math.atan2(entity.majorAxisEndPoint.y, entity.majorAxisEndPoint.x);
  const minorLen = majorLen * (entity.axisRatio ?? 1);
  const start = entity.startAngle ?? 0;
  let end = entity.endAngle ?? start + 2 * Math.PI;
  if (end <= start) end += 2 * Math.PI;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = start + ((end - start) * i) / segments;
    const ex = majorLen * Math.cos(t);
    const ey = minorLen * Math.sin(t);
    points.push({
      x: entity.center.x + ex * Math.cos(rotation) - ey * Math.sin(rotation),
      y: entity.center.y + ex * Math.sin(rotation) + ey * Math.cos(rotation)
    });
  }
  return points;
}

function dedupe(points, tolerance = 1e-6) {
  const out = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) > tolerance) {
      out.push(p);
    }
  }
  if (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < tolerance) out.pop();
  }
  return out;
}

const pointsClose = (a, b, tolerance) => Math.hypot(a.x - b.x, a.y - b.y) <= tolerance;

// Intenta unir tramos abiertos (LINE, ARC, SPLINE, polilíneas sin flag de
// cierre) que comparten extremos, formando contornos más largos. Los que
// terminan uniendo su punta con su propio inicio quedan como contornos
// cerrados utilizables.
function chainSegments(segments, tolerance) {
  const chains = segments.map((s) => s.slice());
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < chains.length; i++) {
      for (let j = 0; j < chains.length; j++) {
        if (i === j) continue;
        const a = chains[i];
        const b = chains[j];
        if (a.length === 0 || b.length === 0) continue;
        const aStart = a[0], aEnd = a[a.length - 1];
        const bStart = b[0], bEnd = b[b.length - 1];

        if (pointsClose(aEnd, bStart, tolerance)) {
          chains[i] = a.concat(b.slice(1));
        } else if (pointsClose(aEnd, bEnd, tolerance)) {
          chains[i] = a.concat(b.slice().reverse().slice(1));
        } else if (pointsClose(aStart, bEnd, tolerance)) {
          chains[i] = b.concat(a.slice(1));
        } else if (pointsClose(aStart, bStart, tolerance)) {
          chains[i] = b.slice().reverse().concat(a.slice(1));
        } else {
          continue;
        }
        chains.splice(j, 1);
        merged = true;
        break outer;
      }
    }
  }
  return chains;
}

// Extrae UNA sola pieza por archivo DXF: el archivo completo representa una
// única pieza a cortar. Acepta contornos explícitamente cerrados
// (LWPOLYLINE/POLYLINE con flag de cierre, CIRCLE, ELLIPSE completa) y
// también intenta cerrar contornos armados con tramos sueltos (LINE, ARC,
// SPLINE o polilíneas sin el flag de cierre) uniendo los que comparten
// extremos. Si ningún contorno cierra, usa la envolvente convexa de todos
// los puntos del dibujo como silueta aproximada, para que el archivo siempre
// se pueda cargar. El contorno de mayor área es la silueta exterior de la
// pieza; el resto (agujeros, detalles internos) se ignora para el anidado.
export async function extractPiecesFromDxf(file) {
  const text = await file.text();
  const parser = new DxfParser();
  const dxf = parser.parseSync(text);
  if (!dxf || !dxf.entities) {
    throw new Error('No se pudieron leer entidades del archivo DXF.');
  }

  const closedCandidates = [];
  const openSegments = [];
  const allPoints = [];

  for (const entity of dxf.entities) {
    let rawPoints = null;
    let forceOpen = false;

    if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
      if (!entity.vertices || entity.vertices.length < 2) continue;
      rawPoints = verticesToPoints(entity.vertices);
      if (!(entity.closed || entity.shape)) forceOpen = true;
    } else if (entity.type === 'CIRCLE') {
      rawPoints = circleToPoints(entity);
    } else if (entity.type === 'ARC') {
      rawPoints = arcToPoints(entity);
      forceOpen = true;
    } else if (entity.type === 'LINE') {
      rawPoints = lineToPoints(entity);
      forceOpen = true;
    } else if (entity.type === 'SPLINE') {
      rawPoints = splineToPoints(entity);
      forceOpen = true;
    } else if (entity.type === 'ELLIPSE') {
      rawPoints = ellipseToPoints(entity);
      forceOpen = true;
    }

    if (!rawPoints || rawPoints.length < 2) continue;
    const points = dedupe(rawPoints);
    if (points.length < 2) continue;

    allPoints.push(...points);

    if (!forceOpen && points.length >= 3) {
      const area = polygonArea(points);
      if (area >= 1) {
        closedCandidates.push({ points, area });
        continue;
      }
    }

    openSegments.push(points);
  }

  if (allPoints.length === 0) {
    throw new Error('No se encontraron entidades geométricas utilizables en el DXF.');
  }

  // Tolerancia de cierre proporcional al tamaño del dibujo (para unir tramos
  // cuyos extremos no coinciden pixel-perfecto por redondeo de exportación).
  const bbox = polygonBBox(allPoints);
  const extent = Math.max(bbox.width, bbox.height, 1);
  const tolerance = Math.max(extent * 0.002, 0.05);

  if (openSegments.length > 0) {
    const chains = chainSegments(openSegments, tolerance);
    for (const chain of chains) {
      if (chain.length < 3) continue;
      if (!pointsClose(chain[0], chain[chain.length - 1], tolerance)) continue;
      const points = dedupe(chain);
      if (points.length < 3) continue;
      const area = polygonArea(points);
      if (area >= 1) closedCandidates.push({ points, area });
    }
  }

  let outerPoints;
  if (closedCandidates.length > 0) {
    // El contorno con mayor área es la silueta exterior de la pieza.
    closedCandidates.sort((a, b) => b.area - a.area);
    outerPoints = closedCandidates[0].points;
  } else {
    // Último recurso: nada cierra. Se usa la envolvente convexa de todos los
    // puntos del dibujo como silueta aproximada, para que el DXF igual se
    // pueda importar en vez de rechazarlo.
    const hull = convexHull(allPoints);
    if (hull.length < 3) {
      throw new Error('El DXF no contiene geometría suficiente para aproximar una pieza.');
    }
    outerPoints = hull;
  }

  const { points: normalized, width, height } = normalizePoints(outerPoints);

  return [{
    id: `dxf-${Date.now()}`,
    name: file.name.replace(/\.dxf$/i, ''),
    points: normalized,
    width,
    height,
    quantity: 1,
    allowRotation: true,
    sourceFile: file.name,
    approximated: closedCandidates.length === 0
  }];
}
