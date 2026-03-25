import { buildRcp16Csv } from "./rcp16.js";
import { expandPieces, generatePlans } from "./optimizer.js";

function $(id) {
  return document.getElementById(id);
}

const els = {
  boardAncho: $("boardAncho"),
  boardLargo: $("boardLargo"),
  boardVeta: $("boardVeta"),
  incrementalMode: $("incrementalMode"),
  addPiece: $("addPiece"),
  removeSelected: $("removeSelected"),
  piecesTbody: document.querySelector("#piecesTable tbody"),
  optimizeBtn: $("optimizeBtn"),
  exportBtn: $("exportBtn"),
  status: $("status"),
  plansBar: $("plansBar"),
  planName: $("planName"),
  planMeta: $("planMeta"),
  cuts: $("cuts"),
  viz: $("viz"),
  codePreview: $("codePreview"),
};

const state = {
  pieces: [],
  plans: [],
  selectedPlanId: null,
  planName: "Plan 1",
};

function setStatus(html) {
  els.status.innerHTML = html;
}

function mm(n) {
  return Number.isFinite(n) ? n : 0;
}

function parseMmText(s) {
  const v = String(s ?? "").trim();
  if (v.length === 0) return NaN;
  const digits = v.replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = Number.parseFloat(digits);
  return n;
}

function stableHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function colorForPieceName(name) {
  const palette = [
    { fill: "rgba(76,141,255,0.22)", stroke: "rgba(76,141,255,0.75)" },
    { fill: "rgba(255,76,117,0.18)", stroke: "rgba(255,76,117,0.72)" },
    { fill: "rgba(120,255,214,0.16)", stroke: "rgba(120,255,214,0.70)" },
    { fill: "rgba(255,210,76,0.16)", stroke: "rgba(255,210,76,0.75)" },
    { fill: "rgba(190,120,255,0.16)", stroke: "rgba(190,120,255,0.75)" },
    { fill: "rgba(76,255,144,0.16)", stroke: "rgba(76,255,144,0.70)" },
  ];
  const idx = stableHash(String(name ?? "")) % palette.length;
  return palette[idx];
}

function numberLines(text) {
  const lines = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");
  const width = String(lines.length).length;
  return lines
    .map((l, i) => `${String(i + 1).padStart(width, "0")}: ${l}`)
    .join("\n");
}

function validateBoard(board) {
  const issues = [];
  if (!(board.ancho > 0)) issues.push("Placa ancho inválido.");
  if (!(board.largo > 0)) issues.push("Placa largo inválido.");
  return issues;
}

function validatePieces(piecesExpanded) {
  const issues = [];
  for (const p of piecesExpanded) {
    if (!(p.largo > 0) || !(p.ancho > 0)) issues.push(`Pieza inválida: ${p.name}.`);
  }
  return issues;
}

function nextPieceId() {
  return String(Date.now()) + "-" + String(Math.random()).slice(2, 7);
}

function defaultPiece() {
  return { id: nextPieceId(), name: "Pieza", qty: 1, largo: 1000, ancho: 500, veta: 1, allowRotate: false };
}

function renderPieces() {
  els.piecesTbody.innerHTML = "";
  for (const p of state.pieces) {
    const tr = document.createElement("tr");
    tr.dataset.id = p.id;

    const tdSel = document.createElement("td");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "rowSelect";
    tdSel.appendChild(cb);

    const tdName = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = p.name;
    nameInput.addEventListener("input", () => {
      p.name = nameInput.value;
    });
    tdName.appendChild(nameInput);

    const tdQty = document.createElement("td");
    const qtyInput = document.createElement("input");
    qtyInput.type = "text";
    qtyInput.inputMode = "numeric";
    qtyInput.dir = "ltr";
    qtyInput.value = String(p.qty);
    qtyInput.onfocus = () => qtyInput.select();
    qtyInput.addEventListener("input", () => {
      const v = Number.parseInt(qtyInput.value, 10);
      if (Number.isFinite(v) && v > 0) p.qty = v;
    });
    tdQty.appendChild(qtyInput);

    const tdL = document.createElement("td");
    const lInput = document.createElement("input");
    lInput.type = "text";
    lInput.inputMode = "numeric";
    lInput.dir = "ltr";
    lInput.value = String(p.largo);
    lInput.onfocus = () => lInput.select();
    lInput.addEventListener("input", () => {
      const v = Number.parseFloat(lInput.value);
      if (Number.isFinite(v) && v > 0) p.largo = v;
    });
    tdL.appendChild(lInput);

    const tdA = document.createElement("td");
    const aInput = document.createElement("input");
    aInput.type = "text";
    aInput.inputMode = "numeric";
    aInput.dir = "ltr";
    aInput.value = String(p.ancho);
    aInput.onfocus = () => aInput.select();
    aInput.addEventListener("input", () => {
      const v = Number.parseFloat(aInput.value);
      if (Number.isFinite(v) && v > 0) p.ancho = v;
    });
    tdA.appendChild(aInput);

    const tdV = document.createElement("td");
    const vetaSelect = document.createElement("select");
    const opt1 = document.createElement("option");
    opt1.value = "1";
    opt1.textContent = "1";
    const opt0 = document.createElement("option");
    opt0.value = "0";
    opt0.textContent = "0";
    vetaSelect.appendChild(opt1);
    vetaSelect.appendChild(opt0);
    vetaSelect.value = p.veta === 1 ? "1" : "0";
    vetaSelect.addEventListener("change", () => {
      p.veta = Number.parseInt(vetaSelect.value, 10) === 1 ? 1 : 0;
      if (p.veta === 1) p.allowRotate = false;
      renderPieces();
    });
    tdV.appendChild(vetaSelect);

    const tdR = document.createElement("td");
    const rotCb = document.createElement("input");
    rotCb.type = "checkbox";
    rotCb.checked = p.allowRotate === true;
    rotCb.disabled = p.veta === 1;
    rotCb.addEventListener("change", () => {
      p.allowRotate = rotCb.checked;
    });
    tdR.appendChild(rotCb);

    tr.appendChild(tdSel);
    tr.appendChild(tdName);
    tr.appendChild(tdQty);
    tr.appendChild(tdA);
    tr.appendChild(tdL);
    tr.appendChild(tdV);
    tr.appendChild(tdR);
    els.piecesTbody.appendChild(tr);
  }
}

function readBoard() {
  const ancho = parseMmText(els.boardAncho.value);
  const largo = parseMmText(els.boardLargo.value);
  return {
    ancho: mm(ancho),
    largo: mm(largo),
    veta: Number.parseInt(els.boardVeta.value, 10) === 1 ? 1 : 0,
  };
}

function renderPlansBar() {
  els.plansBar.innerHTML = "";
  for (const p of state.plans) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = p.name;
    if (p.id === state.selectedPlanId) b.className = "primary";
    b.addEventListener("click", () => {
      state.selectedPlanId = p.id;
      state.planName = p.name;
      els.planName.value = state.planName;
      renderPlan();
    });
    els.plansBar.appendChild(b);
  }
}

function drawViz(board, plan) {
  const svg = els.viz;
  svg.innerHTML = "";
  const W = 1000;
  const H = 700;
  const pad = 30;
  const bw = board.ancho;
  const bh = board.largo;
  const scale = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
  const ox = pad;
  const oy = pad;

  const boardRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  boardRect.setAttribute("x", String(ox));
  boardRect.setAttribute("y", String(oy));
  boardRect.setAttribute("width", String(bw * scale));
  boardRect.setAttribute("height", String(bh * scale));
  boardRect.setAttribute("fill", "rgba(11,16,32,0.2)");
  boardRect.setAttribute("stroke", "rgba(232,238,252,0.5)");
  boardRect.setAttribute("stroke-width", "2");
  svg.appendChild(boardRect);

  for (const pl of plan.placements) {
    const px = pl.x;
    const py = pl.y;
    const pw = pl.w;
    const ph = pl.h;

    const color = colorForPieceName(pl.name);
    const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r.setAttribute("x", String(ox + px * scale));
    r.setAttribute("y", String(oy + py * scale));
    r.setAttribute("width", String(pw * scale));
    r.setAttribute("height", String(ph * scale));
    r.setAttribute("fill", color.fill);
    r.setAttribute("stroke", color.stroke);
    r.setAttribute("stroke-width", "1.5");
    svg.appendChild(r);

    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", String(ox + px * scale + 6));
    t.setAttribute("y", String(oy + py * scale + 16));
    t.setAttribute("fill", "rgba(232,238,252,0.9)");
    t.setAttribute("font-size", "12");
    t.textContent = pl.name;
    svg.appendChild(t);
  }
}

function updateCodePreview() {
  const board = readBoard();
  const plan = state.plans.find((p) => p.id === state.selectedPlanId);
  if (!plan) {
    els.codePreview.textContent = "Generá y seleccioná un plan para ver el RCP16.";
    return;
  }
  const pieces = plan.placements.map((pl) => ({
    name: pl.name,
    largo: pl.w,
    ancho: pl.h,
    veta: pl.veta,
  }));
  try {
    const csv = buildRcp16Csv({ board, pieces, incremental: els.incrementalMode.checked === true });
    els.codePreview.textContent = numberLines(csv);
  } catch {
    els.codePreview.textContent = "No se pudo generar el RCP16 para este plan.";
  }
}

function renderPlan() {
  const board = readBoard();
  const plan = state.plans.find((p) => p.id === state.selectedPlanId);
  if (!plan) {
    els.planMeta.textContent = "Generá un plan con Optimizar.";
    els.cuts.innerHTML = "";
    els.viz.innerHTML = "";
    els.exportBtn.disabled = true;
    updateCodePreview();
    return;
  }

  plan.name = els.planName.value.trim() || plan.name;
  els.planMeta.innerHTML = `Aprovechamiento: <strong>${Math.round(
    (plan.usedArea / (board.ancho * board.largo)) * 100
  )}%</strong> · Desperdicio: <strong>${Math.round(plan.waste)}</strong> mm²`;

  els.cuts.innerHTML = "";
  const isFresado = els.incrementalMode.checked === true;
  const stepPrefix = isFresado ? "Fresado" : "Corte";
  const verb = isFresado ? "Fresar" : "Cortar";
  let stepN = 1;
  for (const c of plan.cuts) {
    const row = document.createElement("div");
    row.className = c.pieceName ? "cutRow pieceCut" : "cutRow";
    if (c.pieceName) {
      const color = colorForPieceName(c.pieceName);
      row.style.borderLeftColor = color.stroke;
    }
    const tag = document.createElement("div");
    tag.className = "cutTag";
    tag.textContent = `${stepPrefix} ${stepN++}`;
    const desc = document.createElement("div");
    desc.textContent = `${verb} ${c.desc}`;
    row.appendChild(tag);
    row.appendChild(desc);
    els.cuts.appendChild(row);
  }

  drawViz(board, plan);
  els.exportBtn.disabled = false;
  updateCodePreview();
}

function optimize() {
  const board = readBoard();
  const boardIssues = validateBoard(board);
  if (boardIssues.length) {
    setStatus(boardIssues.join(" "));
    return;
  }
  const expandedAll = expandPieces(state.pieces);
  const pieceIssues = validatePieces(expandedAll);
  if (pieceIssues.length) {
    setStatus(pieceIssues[0]);
    return;
  }
  const expanded = expandedAll.filter((p) => p.largo > 0 && p.ancho > 0);

  const plans = generatePlans(board, expanded);
  if (plans.length === 0) {
    setStatus("No se pudo generar un plan: alguna pieza no entra en la placa.");
    state.plans = [];
    state.selectedPlanId = null;
    renderPlansBar();
    renderPlan();
    return;
  }

  state.plans = plans;
  state.selectedPlanId = plans[0].id;
  els.planName.value = plans[0].name;
  setStatus(`Planes generados: <strong>${plans.length}</strong>.`);
  renderPlansBar();
  renderPlan();
}

function exportSelectedPlan() {
  const board = readBoard();
  const plan = state.plans.find((p) => p.id === state.selectedPlanId);
  if (!plan) return;

  const pieces = plan.placements.map((pl) => ({
    name: pl.name,
    largo: pl.w,
    ancho: pl.h,
    veta: pl.veta,
  }));

  let csv = "";
  try {
    csv = buildRcp16Csv({ board, pieces, incremental: els.incrementalMode.checked === true });
  } catch (e) {
    setStatus("No se pudo exportar: excede el límite de registros/piezas.");
    return;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(els.planName.value || "rcp16").replace(/[^\w\-]+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

els.addPiece.addEventListener("click", () => {
  state.pieces.push(defaultPiece());
  renderPieces();
});

els.removeSelected.addEventListener("click", () => {
  const selected = new Set(
    Array.from(document.querySelectorAll(".rowSelect"))
      .filter((cb) => cb.checked)
      .map((cb) => cb.closest("tr")?.dataset?.id)
      .filter(Boolean)
  );
  state.pieces = state.pieces.filter((p) => !selected.has(p.id));
  renderPieces();
});

els.optimizeBtn.addEventListener("click", optimize);
els.exportBtn.addEventListener("click", exportSelectedPlan);
els.incrementalMode.addEventListener("change", () => {
  updateCodePreview();
});
els.planName.addEventListener("input", () => {
  const plan = state.plans.find((p) => p.id === state.selectedPlanId);
  if (plan) plan.name = els.planName.value;
  renderPlansBar();
});

state.pieces = [defaultPiece()];
renderPieces();
setStatus("Listo. Agregá piezas y tocá Optimizar.");
renderPlan();
