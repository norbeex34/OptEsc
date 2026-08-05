import {
  rotatePoints,
  rotatePointsRigid,
  translatePoints,
  rasterizePolygon,
  dilateMask,
  buildIntegral,
  integralRectSum,
  polygonArea,
  polygonBBox
} from './polygonUtils';
import { buildPairModule } from './moduleBuilder';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Corre una sola pasada del heurístico "bottom-left fill" sobre un orden de
// piezas dado. Es determinista salvo por `randomizeRotationOrder`, que baraja
// el orden en que se prueba cada rotación candidata: cuando dos rotaciones
// terminan empatadas en qué tan abajo/izquierda dejan la pieza, ese orden
// decide cuál gana, así que variarlo entre pasadas explora acomodos distintos
// (útil incluso con piezas idénticas, como dos triángulos que podrían
// "hermanarse" de más de una forma).
async function runPass({ expandedOrder, gridW, gridH, cellSize, spacingCells, edgeMargin, randomizeRotationOrder, onPieceDone }) {
  const sheets = [];
  let currentSheet = null;

  const newSheet = () => {
    const mask = new Uint8Array(gridW * gridH);
    const sheet = { occupied: mask, integral: buildIntegral(mask, gridW, gridH), placements: [] };
    sheets.push(sheet);
    return sheet;
  };
  currentSheet = newSheet();

  const baseRotations = [0, 90, 180, 270];

  for (let idx = 0; idx < expandedOrder.length; idx++) {
    const piece = expandedOrder[idx];
    let candidates = piece.allowRotation === false ? [0] : baseRotations;
    if (randomizeRotationOrder && candidates.length > 1) candidates = shuffle(candidates);

    let placed = false;
    let attemptSheet = currentSheet;
    let sheetIndex = sheets.length - 1;

    while (!placed) {
      // Se evalúan TODAS las rotaciones candidatas y se compara la mejor
      // posición (más abajo, más a la izquierda) de cada una, para elegir
      // la mejor de todas en vez de quedarse con la primera rotación que
      // simplemente entre en algún lado.
      let best = null;

      for (const angle of candidates) {
        const rotated = angle === 0 ? piece.points : rotatePoints(piece.points, angle);
        const { mask: trueMask, w: mw, h: mh } = rasterizePolygon(rotated, cellSize);

        // Para que la separación realmente aleje una pieza de otra, la
        // máscara con la que se busca lugar (`searchMask`) debe tener margen
        // extra alrededor de la pieza real (dilatar dentro del mismo tamaño
        // no sirve: una forma sólida no tiene "aire" propio hacia dónde
        // crecer). Se arma un lienzo más grande, se centra la pieza real en
        // él con el padding del espaciado, y recién ahí se dilata.
        let searchMask = trueMask;
        let maskW = mw;
        let maskH = mh;
        let trueOffsetX = 0;
        let trueOffsetY = 0;

        if (spacingCells > 0) {
          maskW = mw + spacingCells * 2;
          maskH = mh + spacingCells * 2;
          const padded = new Uint8Array(maskW * maskH);
          for (let ry = 0; ry < mh; ry++) {
            for (let rx = 0; rx < mw; rx++) {
              if (trueMask[ry * mw + rx]) {
                padded[(ry + spacingCells) * maskW + (rx + spacingCells)] = 1;
              }
            }
          }
          searchMask = dilateMask(padded, maskW, maskH, spacingCells);
          trueOffsetX = spacingCells;
          trueOffsetY = spacingCells;
        }

        if (maskW > gridW || maskH > gridH) continue;

        let found = null;
        for (let y = 0; y <= gridH - maskH && !found; y++) {
          for (let x = 0; x <= gridW - maskW && !found; x++) {
            const freeSum = integralRectSum(attemptSheet.integral, gridW, x, y, x + maskW, y + maskH);
            if (freeSum === 0) {
              // Región completamente libre: no hace falta comparar máscara.
              found = { x, y };
              break;
            }
            // Región con ocupación parcial: comparar máscara exacta (forma real + halo de separación).
            let overlap = false;
            for (let ry = 0; ry < maskH && !overlap; ry++) {
              for (let rx = 0; rx < maskW; rx++) {
                if (searchMask[ry * maskW + rx] && attemptSheet.occupied[(y + ry) * gridW + (x + rx)]) {
                  overlap = true;
                  break;
                }
              }
            }
            if (!overlap) found = { x, y };
          }
        }

        if (found && (!best || found.y < best.found.y || (found.y === best.found.y && found.x < best.found.x))) {
          best = { angle, rotated, trueMask, mw, mh, trueOffsetX, trueOffsetY, found };
        }
      }

      if (best) {
        const { angle, rotated, trueMask, mw, mh, trueOffsetX, trueOffsetY, found } = best;
        const trueX = found.x + trueOffsetX;
        const trueY = found.y + trueOffsetY;
        for (let ry = 0; ry < mh; ry++) {
          for (let rx = 0; rx < mw; rx++) {
            if (trueMask[ry * mw + rx]) {
              attemptSheet.occupied[(trueY + ry) * gridW + (trueX + rx)] = 1;
            }
          }
        }
        attemptSheet.integral = buildIntegral(attemptSheet.occupied, gridW, gridH);

        const xMm = edgeMargin + trueX * cellSize;
        const yMm = edgeMargin + trueY * cellSize;
        attemptSheet.placements.push({
          id: `${piece.id}-${idx}`,
          name: piece.name,
          rotation: angle,
          x: xMm,
          y: yMm,
          polygon: translatePoints(rotated, xMm, yMm),
          width: mw * cellSize,
          height: mh * cellSize,
          moduleParts: piece.moduleParts || null,
          moduleWidth: piece.width,
          moduleHeight: piece.height
        });
        placed = true;
      }

      if (!placed) {
        if (sheetIndex === sheets.length - 1) {
          attemptSheet = newSheet();
          sheetIndex = sheets.length - 1;
          currentSheet = attemptSheet;
        } else {
          throw new Error(`La pieza "${piece.name}" (${Math.round(piece.width)}x${Math.round(piece.height)}mm) no entra en la hoja configurada.`);
        }
      }
    }

    if (onPieceDone) await onPieceDone(idx + 1, expandedOrder.length);
  }

  return sheets;
}

// Desperdicio dentro del rectángulo que realmente ocupan las piezas en una
// hoja (no la hoja completa): área de ese rectángulo menos el área real de
// las piezas. A diferencia de mirar solo "qué tan abajo llega" el acomodo,
// esto también penaliza acomodos que se extienden más a lo ancho de lo
// necesario (p.ej. una fila floja, sin piezas "hermanadas", que no baja más
// pero desperdicia mucho ancho). Sirve para comparar qué tan compacto quedó
// el acomodo entre pasadas que usan la misma cantidad de hojas.
function sheetWasteMetric(sheet) {
  if (sheet.placements.length === 0) return 0;
  const allPoints = sheet.placements.flatMap((p) => p.polygon);
  const bbox = polygonBBox(allPoints);
  const usedArea = bbox.width * bbox.height;
  const pieceArea = sheet.placements.reduce((sum, p) => sum + polygonArea(p.polygon), 0);
  return usedArea - pieceArea;
}

// Convierte las colocaciones de "módulos" (rectángulos con 2 piezas reales
// adentro) de vuelta a las 2 piezas reales, en sus posiciones finales.
//
// El módulo se colocó como si fuera una pieza rectangular más: se rotó
// rígidamente (0/90/180/270), se renormalizó a que su bbox empiece en (0,0)
// y se trasladó a (placement.x, placement.y). Para que las 2 piezas internas
// terminen exactamente donde corresponde, hay que aplicarles la MISMA
// secuencia de transformación (misma rotación rígida + mismo corrimiento de
// renormalización + misma traslación), no cada una por separado con
// `rotatePoints` (eso las renormalizaría cada una a su propia bbox y
// rompería su posición relativa dentro del módulo).
function expandModulePlacements(sheets) {
  return sheets.map((sheet) => {
    const expanded = [];
    sheet.placements.forEach((p) => {
      if (!p.moduleParts) {
        expanded.push(p);
        return;
      }

      const rectPoints = [
        { x: 0, y: 0 },
        { x: p.moduleWidth, y: 0 },
        { x: p.moduleWidth, y: p.moduleHeight },
        { x: 0, y: p.moduleHeight }
      ];
      const rotatedRectRigid = rotatePointsRigid(rectPoints, p.rotation);
      const rectBBox = polygonBBox(rotatedRectRigid);
      const shiftX = -rectBBox.minX;
      const shiftY = -rectBBox.minY;

      p.moduleParts.forEach((part, i) => {
        const rotatedPartRigid = rotatePointsRigid(part.points, p.rotation);
        const shifted = translatePoints(rotatedPartRigid, shiftX, shiftY);
        const finalPolygon = translatePoints(shifted, p.x, p.y);
        const finalBBox = polygonBBox(finalPolygon);

        expanded.push({
          id: `${p.id}-part${i}`,
          name: p.name,
          rotation: (part.rotation + p.rotation) % 360,
          x: finalBBox.minX,
          y: finalBBox.minY,
          polygon: finalPolygon,
          width: finalBBox.width,
          height: finalBBox.height
        });
      });
    });
    return { placements: expanded };
  });
}

// Anida piezas irregulares (formas reales, no solo su caja rectangular)
// sobre una o más hojas. Prueba varias pasadas del heurístico "bottom-left
// fill" con distinto orden de piezas y de rotaciones, y se queda con la que
// menos hojas usa (y, a igualdad de hojas, la más compacta), para aprovechar
// mejor el material en vez de conformarse con la primera solución válida.
// `onProgress` se llama entre piezas para no congelar la UI.
export async function nestPieces({ sheetWidth, sheetHeight, spacing, margin = 0, pieces, onProgress }) {
  if (sheetWidth <= 0 || sheetHeight <= 0) {
    throw new Error('El tamaño de hoja debe ser mayor a 0.');
  }

  // El margen deja un borde sin piezas alrededor de toda la hoja; el
  // anidado corre sobre el área útil (hoja menos margen a cada lado).
  const edgeMargin = Math.max(0, margin || 0);
  const usableWidth = sheetWidth - edgeMargin * 2;
  const usableHeight = sheetHeight - edgeMargin * 2;
  if (usableWidth <= 0 || usableHeight <= 0) {
    throw new Error('El margen es demasiado grande para el tamaño de hoja configurado.');
  }

  const edgeSpacing = Math.max(0, spacing || 0);

  // Expandir por cantidad. Si hay 2 o más copias de la misma pieza, primero
  // se arma un "módulo": la mejor forma de encajar 2 copias en el rectángulo
  // más chico posible (probando sus 4 rotaciones entre sí). Ese módulo se
  // trata como una sola pieza rectangular más grande a la hora de mosaiquear
  // la hoja (en vez de dejar que el heurístico "descubra" el hermanado pieza
  // por pieza, que no lo garantiza en toda la hoja) y se expande de vuelta a
  // las 2 piezas reales al final. La unidad que sobra en cantidades impares
  // se coloca individualmente, como antes.
  const baseExpanded = [];
  pieces.forEach((piece) => {
    const qty = Math.max(1, parseInt(piece.quantity) || 1);

    if (qty >= 2) {
      const module = buildPairModule(piece.points, edgeSpacing, piece.allowRotation);
      if (module) {
        const moduleCount = Math.floor(qty / 2);
        const remainder = qty % 2;
        const moduleRect = [
          { x: 0, y: 0 },
          { x: module.width, y: 0 },
          { x: module.width, y: module.height },
          { x: 0, y: module.height }
        ];
        for (let i = 0; i < moduleCount; i++) {
          baseExpanded.push({
            id: `${piece.id}-mod-${i}`,
            name: piece.name,
            points: moduleRect,
            width: module.width,
            height: module.height,
            allowRotation: piece.allowRotation,
            moduleParts: module.parts
          });
        }
        for (let i = 0; i < remainder; i++) {
          baseExpanded.push(piece);
        }
        return;
      }
    }

    for (let i = 0; i < qty; i++) {
      baseExpanded.push(piece);
    }
  });

  // Resolución de grilla: se limita el máximo de celdas para que el
  // algoritmo corra en tiempos razonables en el navegador. Si la separación
  // pedida es más fina que la celda por defecto, se afina la resolución
  // (dentro de un presupuesto de celdas) para que la separación no termine
  // redondeada a 0 y desaparezca.
  const maxCellsPerSide = 260;
  const maxTotalCells = 240000;
  let cellSize = Math.max(1, Math.ceil(Math.max(usableWidth, usableHeight) / maxCellsPerSide));
  if (edgeSpacing > 0) {
    const desiredCellSize = Math.max(0.5, edgeSpacing / 2);
    if (desiredCellSize < cellSize) {
      const candidateW = Math.ceil(usableWidth / desiredCellSize);
      const candidateH = Math.ceil(usableHeight / desiredCellSize);
      if (candidateW * candidateH <= maxTotalCells) {
        cellSize = desiredCellSize;
      } else {
        const scale = Math.sqrt((candidateW * candidateH) / maxTotalCells);
        cellSize = Math.max(cellSize * 0.1, desiredCellSize * scale);
      }
    }
  }
  const gridW = Math.max(1, Math.floor(usableWidth / cellSize));
  const gridH = Math.max(1, Math.floor(usableHeight / cellSize));
  // Nunca redondear una separación pedida (>0) a 0 celdas.
  const spacingCells = edgeSpacing > 0 ? Math.max(1, Math.round(edgeSpacing / cellSize)) : 0;

  const byAreaDesc = baseExpanded.slice().sort((a, b) => polygonArea(b.points) - polygonArea(a.points));

  // La primera pasada es la determinista (grandes primero, sin aleatoriedad).
  // Las siguientes barajan el orden entre piezas de igual/similar área y el
  // orden de prueba de rotaciones, para explorar otros acomodos válidos.
  // Cada pasada completa cuesta tiempo proporcional a la cantidad de piezas,
  // así que la cantidad de pasadas se adapta al tamaño del lote: para lotes
  // grandes, probar 5 veces se siente lento y el margen de mejora por pasada
  // extra es menor en proporción, así que se corre solo la determinista
  // (igual de rápido que antes de tener multi-pasada).
  const pieceCount = baseExpanded.length;
  const PASS_COUNT = pieceCount <= 40 ? 5 : pieceCount <= 120 ? 2 : 1;
  const orderings = [{ order: byAreaDesc, randomizeRotationOrder: false }];
  for (let i = 1; i < PASS_COUNT; i++) {
    orderings.push({
      order: shuffle(baseExpanded).sort((a, b) => polygonArea(b.points) - polygonArea(a.points)),
      randomizeRotationOrder: true
    });
  }

  let bestSheets = null;
  let bestKey = null;

  for (let pass = 0; pass < orderings.length; pass++) {
    const { order, randomizeRotationOrder } = orderings[pass];
    const sheets = await runPass({
      expandedOrder: order,
      gridW,
      gridH,
      cellSize,
      spacingCells,
      edgeMargin,
      randomizeRotationOrder,
      onPieceDone: async (done, total) => {
        if (onProgress) onProgress(done, total, pass + 1, orderings.length);
        if (done % 4 === 0) await sleep(0); // ceder el hilo principal
      }
    });

    const totalSheets = sheets.length;
    const compactness = sheets.reduce((sum, s) => sum + sheetWasteMetric(s), 0);
    const key = [totalSheets, compactness];

    if (!bestKey || key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
      bestKey = key;
      bestSheets = sheets;
    }
  }

  const sheets = expandModulePlacements(bestSheets);
  const sheetArea = sheetWidth * sheetHeight;
  // El área real de las piezas se calcula sobre las piezas originales (no
  // sobre los rectángulos de los módulos, que son más grandes que la forma
  // real y no deben contarse como "aprovechado").
  const totalPieceArea = pieces.reduce((sum, p) => {
    const qty = Math.max(1, parseInt(p.quantity) || 1);
    return sum + polygonArea(p.points) * qty;
  }, 0);
  const totalSheetArea = sheets.length * sheetArea;
  const utilization = totalSheetArea > 0 ? ((totalPieceArea / totalSheetArea) * 100).toFixed(1) : '0.0';

  return {
    sheets: sheets.map((s) => ({ placements: s.placements })),
    totalSheets: sheets.length,
    sheetWidth,
    sheetHeight,
    utilization,
    totalPieceArea: Math.round(totalPieceArea),
    totalSheetArea: Math.round(totalSheetArea),
    wasteArea: Math.round(totalSheetArea - totalPieceArea)
  };
}
