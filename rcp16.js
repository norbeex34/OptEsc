export const MEASURE_SCALE = 10;
export const FIXED_RECORD_COUNT = 501;
export const FOOTER_FILE_LINE_START = 489;
export const FOOTER_LINES = [
  "26963,8302,27747,25961,29806,",
  "101,0,0,0,0,",
  "1234,0,32,0,180,",
  "16717,17748,18770,19521,17440,",
  "8261,21072,17749,16706,19488,",
  "21321,79,0,0,0,",
];

function padLine() {
  return "0,0,0,0,0,";
}

function recordIndexFromFileLine(fileLine) {
  return fileLine - 4;
}

function buildHeaderLines() {
  return ["RCP16-1.0", "", `5,${FIXED_RECORD_COUNT}`];
}

function scalePieces(pieces) {
  return (pieces || []).map((p) => ({
    ...p,
    largoScaled: Math.round(Number(p.largo) * MEASURE_SCALE),
    anchoScaled: Math.round(Number(p.ancho) * MEASURE_SCALE),
  }));
}

function applyIncrementalIfPossible(piecesScaled) {
  if (piecesScaled.length <= 1) return piecesScaled;
  const l0 = piecesScaled[0].largoScaled;
  const a0 = piecesScaled[0].anchoScaled;
  const allL = piecesScaled.every((p) => p.largoScaled === l0);
  const allA = piecesScaled.every((p) => p.anchoScaled === a0);
  if (!allL && !allA) return piecesScaled;

  if (allL) {
    let sumA = 0;
    return piecesScaled.map((p) => {
      sumA += p.anchoScaled;
      return { ...p, largoScaled: l0, anchoScaled: sumA };
    });
  }

  let sumL = 0;
  return piecesScaled.map((p) => {
    sumL += p.largoScaled;
    return { ...p, largoScaled: sumL, anchoScaled: a0 };
  });
}

export function buildRcp16Csv({ board, pieces, incremental = false }) {
  const header = buildHeaderLines();
  const records = Array.from({ length: FIXED_RECORD_COUNT }, () => padLine());

  const footerRecordStart = recordIndexFromFileLine(FOOTER_FILE_LINE_START);
  for (let i = 0; i < FOOTER_LINES.length; i += 1) {
    const idx = footerRecordStart + i;
    if (idx >= 0 && idx < records.length) records[idx] = FOOTER_LINES[i];
  }

  records[0] = "4,0,0,18332,1,";
  records[1] = "2,0,0,0,0,";
  records[2] = `0,${Math.round(board.ancho * MEASURE_SCALE)},0,${Math.round(
    board.largo * MEASURE_SCALE
  )},${board.veta === 1 ? 1 : 0},`;
  records[3] = "2,0,0,0,0,";

  const piecesStart = 4;
  const piecesEnd = footerRecordStart - 1;
  if (piecesEnd < piecesStart) throw new Error("footer_overlaps_pieces");

  let piecesScaled = scalePieces(pieces);
  if (incremental === true) piecesScaled = applyIncrementalIfPossible(piecesScaled);

  const maxPieceLines = piecesEnd - piecesStart;
  if (piecesScaled.length + 1 > maxPieceLines) throw new Error("too_many_pieces");

  for (let i = 0; i < piecesScaled.length; i += 1) {
    const p = piecesScaled[i];
    records[piecesStart + i] = `1,${p.largoScaled},0,${p.anchoScaled},${p.veta === 1 ? 1 : 0},`;
  }

  records[piecesStart + piecesScaled.length] = "3,0,0,0,0,";

  const text = header.concat(records).join("\r\n");
  return text.replace(/\r\n$/, "");
}
