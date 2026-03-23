function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function expandPieces(pieces) {
  const out = [];
  for (const p of pieces) {
    const qty = Math.max(1, Math.trunc(p.qty || 1));
    for (let i = 0; i < qty; i += 1) {
      out.push({
        id: `${p.id}-${i + 1}`,
        name: p.name || p.id,
        largo: Number(p.largo),
        ancho: Number(p.ancho),
        veta: p.veta === 1 ? 1 : 0,
        allowRotate: p.allowRotate === true,
      });
    }
  }
  return out;
}

function tryRotate(piece) {
  if (!piece.allowRotate) return null;
  if (piece.veta === 1) return null;
  return { ...piece, largo: piece.ancho, ancho: piece.largo, rotated: true };
}

function shelfPack(board, pieces, axis) {
  const w = axis === "x" ? board.ancho : board.largo;
  const h = axis === "x" ? board.largo : board.ancho;

  const sorted = pieces
    .slice()
    .sort((a, b) => Math.max(b.largo, b.ancho) - Math.max(a.largo, a.ancho));

  const placements = [];
  let x = 0;
  let y = 0;
  let rowH = 0;

  for (const p0 of sorted) {
    let p = p0;
    if (p.largo > w - x || p.ancho > h - y) {
      const pr = tryRotate(p0);
      if (pr && pr.largo <= w - x && pr.ancho <= h - y) p = pr;
    }

    if (p.largo > w - x || p.ancho > h - y) {
      x = 0;
      y += rowH;
      rowH = 0;
    }

    p = p0;
    if (p.largo > w - x || p.ancho > h - y) {
      const pr = tryRotate(p0);
      if (pr) p = pr;
    }

    if (p.largo > w - x || p.ancho > h - y) {
      return { ok: false, placements: [], usedArea: 0, waste: 0 };
    }

    placements.push({
      ...p,
      x,
      y,
      w: p.largo,
      h: p.ancho,
      axis,
    });
    x += p.largo;
    rowH = Math.max(rowH, p.ancho);
  }

  const usedArea = placements.reduce((acc, pl) => acc + pl.w * pl.h, 0);
  const waste = w * h - usedArea;
  return { ok: true, placements, usedArea, waste };
}

function buildCutsFromShelves(plan) {
  const rows = new Map();
  for (const p of plan.placements) {
    const key = String(p.y);
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(p);
  }
  const rowList = Array.from(rows.values())
    .map((r) => r.sort((a, b) => a.x - b.x))
    .sort((a, b) => a[0].y - b[0].y);

  const cuts = [];
  let cutN = 1;
  for (const r of rowList) {
    for (const p of r)
      cuts.push({
        name: `Corte ${cutN++}`,
        desc: `${p.name} ${p.w}x${p.h}`,
        pieceName: p.name,
      });
  }
  return cuts;
}

export function generatePlans(board, piecesExpanded) {
  const plans = [];
  const p1 = shelfPack(board, piecesExpanded, "x");
  if (p1.ok) plans.push({ id: "plan-x", name: "Plan A", ...p1, cuts: buildCutsFromShelves(p1) });
  const swappedBoard = { ancho: board.largo, largo: board.ancho };
  const p2 = shelfPack(swappedBoard, piecesExpanded, "y");
  if (p2.ok) plans.push({ id: "plan-y", name: "Plan B", ...p2, cuts: buildCutsFromShelves(p2) });

  plans.sort((a, b) => a.waste - b.waste);
  return plans.map((p) => clone(p));
}
