import {
  rotatePoints,
  translatePoints,
  polygonBBox,
  rasterizePolygon,
  dilateMask
} from './polygonUtils';

const ROTATIONS = [0, 90, 180, 270];

// Busca, para una forma dada, la mejor manera de encajar 2 copias en el
// rectángulo más chico posible: prueba las 4 rotaciones de cada copia entre
// sí (16 combinaciones), ubica la segunda pieza lo más "bottom-left" posible
// contra la primera respetando la separación pedida, y se queda con la
// combinación de menor área de bbox conjunta.
//
// Devuelve un "módulo": un rectángulo (width x height) con las 2 piezas
// reales adentro, listo para tratarse como una sola pieza rectangular a la
// hora de mosaiquear la hoja (y luego expandirse de vuelta a las 2 piezas
// reales para el resultado final). Devuelve `null` si no se pudo encontrar
// ninguna combinación válida (no debería pasar con una grilla suficiente).
export function buildPairModule(points, spacingMm, allowRotation) {
  const rotations = allowRotation === false ? [0] : ROTATIONS;

  const singleBBox = polygonBBox(points);
  const maxDim = Math.max(singleBBox.width, singleBBox.height, 1);
  // Resolución fina: esto se calcula una sola vez por forma (no por pieza),
  // así que el costo es insignificante aunque la grilla sea chica y precisa.
  const cellSize = Math.max(0.25, maxDim / 150);
  const spacing = Math.max(0, spacingMm || 0);
  const spacingCells = spacing > 0 ? Math.max(1, Math.round(spacing / cellSize)) : 0;
  const gridSize = Math.ceil((maxDim * 2 + spacing * 2 + 10) / cellSize);
  const gridW = gridSize;
  const gridH = gridSize;

  let best = null;

  for (const angleA of rotations) {
    const rotA = angleA === 0 ? points : rotatePoints(points, angleA);
    const { mask: maskA, w: wA, h: hA } = rasterizePolygon(rotA, cellSize);
    if (wA > gridW || hA > gridH) continue;

    const occupied = new Uint8Array(gridW * gridH);
    for (let ry = 0; ry < hA; ry++) {
      for (let rx = 0; rx < wA; rx++) {
        if (maskA[ry * wA + rx]) occupied[ry * gridW + rx] = 1;
      }
    }

    for (const angleB of rotations) {
      const rotB = angleB === 0 ? points : rotatePoints(points, angleB);
      const { mask: trueMaskB, w: mwB, h: mhB } = rasterizePolygon(rotB, cellSize);

      let searchMask = trueMaskB;
      let maskW = mwB;
      let maskH = mhB;
      let offX = 0;
      let offY = 0;

      if (spacingCells > 0) {
        maskW = mwB + spacingCells * 2;
        maskH = mhB + spacingCells * 2;
        const padded = new Uint8Array(maskW * maskH);
        for (let ry = 0; ry < mhB; ry++) {
          for (let rx = 0; rx < mwB; rx++) {
            if (trueMaskB[ry * mwB + rx]) {
              padded[(ry + spacingCells) * maskW + (rx + spacingCells)] = 1;
            }
          }
        }
        searchMask = dilateMask(padded, maskW, maskH, spacingCells);
        offX = spacingCells;
        offY = spacingCells;
      }

      if (maskW > gridW || maskH > gridH) continue;

      let found = null;
      for (let y = 0; y <= gridH - maskH && !found; y++) {
        for (let x = 0; x <= gridW - maskW && !found; x++) {
          let overlap = false;
          for (let ry = 0; ry < maskH && !overlap; ry++) {
            for (let rx = 0; rx < maskW; rx++) {
              if (searchMask[ry * maskW + rx] && occupied[(y + ry) * gridW + (x + rx)]) {
                overlap = true;
                break;
              }
            }
          }
          if (!overlap) found = { x, y };
        }
      }
      if (!found) continue;

      const bTrueX = (found.x + offX) * cellSize;
      const bTrueY = (found.y + offY) * cellSize;
      const bFinal = translatePoints(rotB, bTrueX, bTrueY);

      const combined = rotA.concat(bFinal);
      const bbox = polygonBBox(combined);
      const area = bbox.width * bbox.height;

      if (!best || area < best.area) {
        best = {
          area,
          width: bbox.width,
          height: bbox.height,
          parts: [
            { points: translatePoints(rotA, -bbox.minX, -bbox.minY), rotation: angleA },
            { points: translatePoints(bFinal, -bbox.minX, -bbox.minY), rotation: angleB }
          ]
        };
      }
    }
  }

  return best;
}
