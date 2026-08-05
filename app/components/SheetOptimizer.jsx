import React, { useEffect, useMemo, useState } from 'react';
import {
  Upload, Trash2, Plus, Play, Printer, AlertCircle, Layers,
  Ruler, LayoutGrid, RotateCw, PackageSearch
} from 'lucide-react';
import { extractPiecesFromDxf } from '../lib/dxfImport';
import { nestPieces } from '../lib/nesting';
import { polygonArea } from '../lib/polygonUtils';

const SHEET_PRESETS = [
  { label: '1220 x 2440 mm', width: 1220, height: 2440 },
  { label: '1000 x 2000 mm', width: 1000, height: 2000 },
  { label: '1200 x 3000 mm', width: 1200, height: 3000 },
  { label: '1500 x 3000 mm', width: 1500, height: 3000 },
  { label: '2000 x 1000 mm', width: 2000, height: 1000 },
  { label: 'Personalizado', width: null, height: null }
];

// Paleta "dinámica" (la del optimizador de tubos original) reservada para
// las exportaciones/planes de impresión, para diferenciarlas visualmente
// del naranja/gris plano de la interfaz.
const DYNAMIC_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

const dynamicColorForName = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return DYNAMIC_COLORS[hash % DYNAMIC_COLORS.length];
};

const pointsToSvg = (points) => points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

const centroidOf = (points) => {
  const c = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: c.x / points.length, y: c.y / points.length };
};

const rectPolygon = (w, h) => [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];

// Firma de una hoja: mismo set de piezas en las mismas posiciones/rotación
// = mismo layout, sin importar el orden en que se colocaron.
const sheetSignature = (placements) =>
  placements
    .map((p) => `${p.name}|${p.rotation}|${Math.round(p.x)}|${Math.round(p.y)}`)
    .sort()
    .join(';');

// Agrupa hojas con el layout idéntico (misma distribución de piezas) para
// mostrarlas una sola vez con un "×N", igual que los caños idénticos.
const groupIdenticalSheets = (sheets) => {
  const groups = [];
  sheets.forEach((sheet, index) => {
    const signature = sheetSignature(sheet.placements);
    const existing = groups.find((g) => g.signature === signature);
    if (existing) {
      existing.count += 1;
    } else {
      groups.push({ signature, sheet, index, count: 1 });
    }
  });
  return groups;
};

// Agrupa las piezas colocadas por nombre (misma pieza = mismo número),
// contando cuántas unidades de cada una entraron en la hoja.
const groupPlacementsByName = (placements) => {
  const order = [];
  const counts = {};
  placements.forEach((p) => {
    if (!(p.name in counts)) {
      counts[p.name] = 0;
      order.push(p.name);
    }
    counts[p.name] += 1;
  });
  return order.map((name) => ({ name, count: counts[name] }));
};

const SheetOptimizer = () => {
  const [presetIndex, setPresetIndex] = useState(0);
  const [sheetWidth, setSheetWidth] = useState(SHEET_PRESETS[0].width);
  const [sheetHeight, setSheetHeight] = useState(SHEET_PRESETS[0].height);
  const [spacing, setSpacing] = useState(5);
  const [edgeMargin, setEdgeMargin] = useState(10);

  const [pieces, setPieces] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  const [manualName, setManualName] = useState('');
  const [manualWidth, setManualWidth] = useState('');
  const [manualHeight, setManualHeight] = useState('');
  const [manualQty, setManualQty] = useState(1);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, pass: 1, totalPasses: 1 });
  const [result, setResult] = useState(null);
  const [nestError, setNestError] = useState(null);

  const totalPieceCount = pieces.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);

  // Número identificador por pieza (mismo nombre = mismo número), según el
  // orden en que fueron agregadas. Se muestra en la lista y en el plan.
  const pieceNumbers = useMemo(() => {
    const map = {};
    let next = 1;
    pieces.forEach((p) => {
      if (!(p.name in map)) {
        map[p.name] = next;
        next += 1;
      }
    });
    return map;
  }, [pieces]);

  const applyPreset = (index) => {
    setPresetIndex(index);
    const preset = SHEET_PRESETS[index];
    if (preset.width) {
      setSheetWidth(preset.width);
      setSheetHeight(preset.height);
    }
  };

  const handleDxfImport = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const allNew = [];
      for (const file of files) {
        const extracted = await extractPiecesFromDxf(file);
        allNew.push(...extracted);
      }
      setPieces(prev => [...prev, ...allNew]);
    } catch (err) {
      setImportError(err.message || 'Error al importar el archivo DXF.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const addManualPiece = () => {
    const w = parseFloat(manualWidth);
    const h = parseFloat(manualHeight);
    if (!w || !h || w <= 0 || h <= 0) return;
    setPieces(prev => [...prev, {
      id: `manual-${Date.now()}`,
      name: manualName.trim() || `Pieza rectangular ${prev.length + 1}`,
      points: rectPolygon(w, h),
      width: w,
      height: h,
      quantity: parseInt(manualQty) || 1,
      allowRotation: true
    }]);
    setManualName('');
    setManualWidth('');
    setManualHeight('');
    setManualQty(1);
  };

  const removePiece = (id) => setPieces(prev => prev.filter(p => p.id !== id));

  const updatePieceField = (id, field, value) => {
    setPieces(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const runOptimize = async () => {
    if (pieces.length === 0) {
      setResult(null);
      setNestError(null);
      return;
    }
    setIsOptimizing(true);
    setNestError(null);
    setProgress({ done: 0, total: 0, pass: 1, totalPasses: 1 });
    try {
      const res = await nestPieces({
        sheetWidth,
        sheetHeight,
        spacing,
        margin: edgeMargin,
        pieces,
        onProgress: (done, total, pass, totalPasses) => setProgress({ done, total, pass, totalPasses })
      });
      setResult(res);
    } catch (err) {
      setNestError(err.message || 'No se pudo completar la optimización.');
      setResult(null);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Recalcula automáticamente ante cualquier cambio relevante (piezas,
  // cantidades, rotación, tamaño de hoja o separación), con un pequeño
  // debounce para no relanzar el cálculo en cada tecleo.
  useEffect(() => {
    if (pieces.length === 0) {
      setResult(null);
      setNestError(null);
      return;
    }
    const timer = setTimeout(() => {
      runOptimize();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, sheetWidth, sheetHeight, spacing, edgeMargin]);

  const sheetStats = useMemo(() => {
    if (!result) return [];
    const sheetArea = sheetWidth * sheetHeight;
    return result.sheets.map(sheet => {
      const usedArea = sheet.placements.reduce((sum, p) => sum + polygonArea(p.polygon), 0);
      return {
        usedArea: Math.round(usedArea),
        wasteArea: Math.round(sheetArea - usedArea),
        efficiency: ((usedArea / sheetArea) * 100).toFixed(1)
      };
    });
  }, [result, sheetWidth, sheetHeight]);

  const groupedSheets = useMemo(() => {
    if (!result) return [];
    return groupIdenticalSheets(result.sheets);
  }, [result]);

  const exportToPrint = () => {
    if (!result) return;
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('es-AR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const labelFontSize = Math.max(14, Math.min(sheetWidth, sheetHeight) / 22);
    const sheetsHtml = groupedSheets.map((group, i) => {
      const sheet = group.sheet;
      const stats = sheetStats[group.index];
      const polys = sheet.placements.map(p => {
        const centroid = centroidOf(p.polygon);
        return `
        <polygon points="${pointsToSvg(p.polygon)}" fill="${dynamicColorForName(p.name)}" fill-opacity="0.82" stroke="#1e293b" stroke-width="${Math.max(sheetWidth, sheetHeight) / 300}" />
        <text x="${centroid.x}" y="${centroid.y}" font-size="${labelFontSize}" font-weight="700" fill="#1e293b" text-anchor="middle" dominant-baseline="middle">${pieceNumbers[p.name] ?? '?'}</text>
      `;
      }).join('');
      const strokeW = Math.max(sheetWidth, sheetHeight) / 200;
      const marginGuide = edgeMargin > 0 ? `
        <rect x="${edgeMargin}" y="${edgeMargin}" width="${Math.max(0, sheetWidth - edgeMargin * 2)}" height="${Math.max(0, sheetHeight - edgeMargin * 2)}" fill="none" stroke="#94a3b8" stroke-dasharray="${Math.max(sheetWidth, sheetHeight) / 100} ${Math.max(sheetWidth, sheetHeight) / 100}" stroke-width="${Math.max(sheetWidth, sheetHeight) / 500}" />
      ` : '';
      const grouped = groupPlacementsByName(sheet.placements);
      return `
        <div class="sheet-card">
          <div class="sheet-header">
            <div class="sheet-number">HOJA ${i + 1}${group.count > 1 ? ` × ${group.count}` : ''}</div>
            <div class="sheet-stats">Usado: ${stats.usedArea.toLocaleString()}mm² | Desperdicio: ${stats.wasteArea.toLocaleString()}mm² | Eficiencia: ${stats.efficiency}%${group.count > 1 ? ` (por hoja, repetir ${group.count} veces)` : ''}</div>
          </div>
          <svg viewBox="0 0 ${sheetWidth} ${sheetHeight}" style="width:100%;max-height:600px;background:#f8fafc;border:2px solid #cbd5e1;border-radius:4px;">
            ${marginGuide}
            ${polys}
          </svg>
          <div class="pieces-detail">
            ${grouped.map(g => `<span class="piece-tag">#${pieceNumbers[g.name] ?? '?'} ${g.name} × ${g.count}</span>`).join('')}
          </div>
        </div>
      `;
    }).join('');

    const printContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Plan de Corte de Hojas</title>
<style>
  @page { margin: 2cm; size: A4; }
  body { font-family: Arial, sans-serif; color: #1c1c1a; margin: 0; padding: 20px; }
  .header { border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { margin: 0; color: #0ea5e9; font-size: 32px; }
  .header .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
  .summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 15px; margin-bottom: 30px; }
  .stat-box { background: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 15px; border-radius: 4px; }
  .stat-box label { display:block; font-size: 11px; color:#64748b; text-transform:uppercase; font-weight:bold; margin-bottom:5px; }
  .stat-box value { display:block; font-size: 22px; font-weight:bold; }
  .config-section { background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
  .sheet-card { background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; page-break-inside: avoid; }
  .sheet-header { display:flex; justify-content:space-between; margin-bottom: 12px; font-size: 13px; color:#64748b; }
  .sheet-number { font-size: 18px; font-weight: bold; color: #0ea5e9; }
  .pieces-detail { display:flex; flex-wrap:wrap; gap:6px; margin-top: 10px; }
  .piece-tag { background:#e0f2fe; border:1px solid #0ea5e9; color:#0c4a6e; padding:3px 8px; border-radius:4px; font-size:11px; }
  .footer { margin-top: 30px; text-align:center; color:#94a3b8; font-size: 11px; }
</style>
</head>
<body>
  <div class="header">
    <h1>PLAN DE CORTE DE HOJAS</h1>
    <div class="subtitle">Anidado automático generado por Optimizador de Cortes</div>
    <div class="subtitle">Generado el: ${date}</div>
  </div>
  <div class="config-section">
    <strong>Hoja:</strong> ${sheetWidth} x ${sheetHeight} mm &nbsp;|&nbsp;
    <strong>Separación entre piezas:</strong> ${spacing} mm &nbsp;|&nbsp;
    <strong>Margen desde el borde:</strong> ${edgeMargin} mm &nbsp;|&nbsp;
    <strong>Piezas totales:</strong> ${totalPieceCount}
  </div>
  <div class="summary">
    <div class="stat-box"><label>Hojas necesarias</label><value>${result.totalSheets}</value></div>
    <div class="stat-box"><label>Utilización</label><value>${result.utilization}%</value></div>
    <div class="stat-box"><label>Área piezas</label><value>${result.totalPieceArea.toLocaleString()}mm²</value></div>
    <div class="stat-box"><label>Desperdicio</label><value>${result.wasteArea.toLocaleString()}mm²</value></div>
  </div>
  ${sheetsHtml}
  <div class="footer">Generado con Optimizador de Cortes</div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Panel de control */}
      <div className="lg:col-span-1 space-y-6">
        {/* Configuración de Hoja */}
        <div className="card rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Ruler className="w-5 h-5 text-[var(--accent)] mr-3" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Hoja de Material
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label block mb-2">Tamaño de hoja</label>
              <select
                value={presetIndex}
                onChange={(e) => applyPreset(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-md"
              >
                {SHEET_PRESETS.map((preset, i) => (
                  <option key={preset.label} value={i}>{preset.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-2">Ancho (mm)</label>
                <input
                  type="number"
                  value={sheetWidth}
                  onChange={(e) => { setSheetWidth(parseFloat(e.target.value) || 0); setPresetIndex(SHEET_PRESETS.length - 1); }}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-3 rounded-md mono"
                  min="1"
                />
              </div>
              <div>
                <label className="label block mb-2">Alto (mm)</label>
                <input
                  type="number"
                  value={sheetHeight}
                  onChange={(e) => { setSheetHeight(parseFloat(e.target.value) || 0); setPresetIndex(SHEET_PRESETS.length - 1); }}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-3 rounded-md mono"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="label block mb-2 flex items-center gap-2">
                <LayoutGrid size={14} className="text-[var(--accent)]" />
                Separación entre piezas (mm)
              </label>
              <input
                type="number"
                value={spacing}
                onChange={(e) => setSpacing(parseFloat(e.target.value) || 0)}
                onWheel={(e) => e.target.blur()}
                className="w-full px-4 py-3 rounded-md mono"
                min="0"
                step="0.5"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2 mono">Margen de corte entre piezas contiguas</p>
            </div>
            <div>
              <label className="label block mb-2 flex items-center gap-2">
                <Ruler size={14} className="text-[var(--accent)]" />
                Margen desde el borde (mm)
              </label>
              <input
                type="number"
                value={edgeMargin}
                onChange={(e) => setEdgeMargin(parseFloat(e.target.value) || 0)}
                onWheel={(e) => e.target.blur()}
                className="w-full px-4 py-3 rounded-md mono"
                min="0"
                step="0.5"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2 mono">Franja sin piezas alrededor de toda la hoja</p>
            </div>
          </div>
        </div>

        {/* Importar DXF */}
        <div className="card rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Upload className="w-5 h-5 text-[var(--accent)] mr-3" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Importar Piezas (DXF)
            </h2>
          </div>
          <input
            type="file"
            id="dxf-import"
            accept=".dxf"
            multiple
            onChange={handleDxfImport}
            className="hidden"
          />
          <label
            htmlFor="dxf-import"
            className={`theme-toggle w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-pointer ${importing ? 'opacity-50 cursor-wait' : ''}`}
          >
            <Upload className="w-5 h-5 text-[var(--accent)]" />
            <span className="text-[var(--text-primary)]">
              {importing ? 'Importando...' : 'Seleccionar archivo .dxf'}
            </span>
          </label>
          <p className="text-xs text-[var(--text-muted)] mt-3 mono">
            Cada archivo se toma como una sola pieza (se usa su contorno exterior; agujeros internos se ignoran para el anidado). Formato DWG no soportado: convertí primero a DXF.
          </p>
          {importError && (
            <div className="mt-3 p-3 rounded-lg border border-[#e2504f]/40 bg-[#e2504f]/10 text-xs text-[#e2504f] flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        {/* Agregar pieza rectangular manual */}
        <div className="card rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Plus className="w-5 h-5 text-[var(--accent)] mr-3" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Agregar Pieza Rectangular
            </h2>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Nombre (opcional)"
              className="w-full px-4 py-3 rounded-md"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                value={manualWidth}
                onChange={(e) => setManualWidth(e.target.value)}
                onWheel={(e) => e.target.blur()}
                placeholder="Ancho"
                className="w-full px-3 py-3 rounded-md mono"
                min="1"
              />
              <input
                type="number"
                value={manualHeight}
                onChange={(e) => setManualHeight(e.target.value)}
                onWheel={(e) => e.target.blur()}
                placeholder="Alto"
                className="w-full px-3 py-3 rounded-md mono"
                min="1"
              />
              <input
                type="number"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
                onWheel={(e) => e.target.blur()}
                placeholder="Cant."
                className="w-full px-3 py-3 rounded-md mono"
                min="1"
              />
            </div>
            <button
              onClick={addManualPiece}
              className="btn-primary w-full font-semibold py-3 px-6 rounded-md flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Agregar Pieza
            </button>
          </div>
        </div>

        {/* Lista de piezas */}
        <div className="card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Piezas
            </h2>
            <span className="badge">{totalPieceCount} unidades</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pieces.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <PackageSearch className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">Importá un DXF o agregá una pieza rectangular</p>
              </div>
            ) : (
              pieces.map((piece) => {
                const vb = `0 0 ${Math.max(piece.width, 1)} ${Math.max(piece.height, 1)}`;
                return (
                  <div
                    key={piece.id}
                    className="p-3 rounded-lg border bg-[var(--input-bg)] border-[var(--card-border)]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mono flex-shrink-0"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {pieceNumbers[piece.name]}
                      </span>
                      <svg viewBox={vb} className="w-10 h-10 flex-shrink-0 rounded" style={{ background: 'var(--input-bg)' }}>
                        <polygon points={pointsToSvg(piece.points)} fill="none" stroke="var(--accent)" strokeWidth={Math.max(piece.width, piece.height) / 25} />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate text-[var(--text-primary)] flex items-center gap-2">
                          {piece.name}
                          {piece.approximated && (
                            <span title="El DXF no tenía un contorno cerrado: se usó la envolvente convexa de los puntos como aproximación">
                              <AlertCircle size={13} className="text-[#f59e0b] flex-shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mono">{Math.round(piece.width)} x {Math.round(piece.height)} mm</div>
                      </div>
                      <button
                        onClick={() => removePiece(piece.id)}
                        className="btn-danger p-2 rounded-md flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2 pl-1">
                      <label className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        Cant.
                        <input
                          type="number"
                          min="1"
                          value={piece.quantity}
                          onChange={(e) => updatePieceField(piece.id, 'quantity', parseInt(e.target.value) || 1)}
                          onWheel={(e) => e.target.blur()}
                          className="w-16 px-2 py-1 rounded-md text-xs mono"
                        />
                      </label>
                      <label className={`text-xs flex items-center gap-1 cursor-pointer ${piece.allowRotation !== false ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                        <input
                          type="checkbox"
                          checked={piece.allowRotation !== false}
                          onChange={(e) => updatePieceField(piece.id, 'allowRotation', e.target.checked)}
                        />
                        <RotateCw size={12} /> Rotar
                      </label>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card rounded-xl p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Optimización Automática
            </h2>
            <p className="text-sm text-[var(--text-muted)] mono mt-1">
              Prueba varios acomodos y se queda con el que menos hojas y menos desperdicio deja
            </p>
          </div>
          <button
            onClick={runOptimize}
            disabled={pieces.length === 0 || isOptimizing}
            className="btn-primary px-6 py-3 rounded-md font-semibold flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            {isOptimizing
              ? `Optimizando... pasada ${progress.pass}/${progress.totalPasses} (${progress.done}/${progress.total})`
              : 'Optimizar'}
          </button>
        </div>

        {nestError && (
          <div className="card rounded-xl p-4 border border-[#e2504f]/40">
            <div className="flex items-start gap-3 text-sm text-[#e2504f]">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p>{nestError}</p>
            </div>
          </div>
        )}

        {result ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Hojas', value: result.totalSheets },
                { label: 'Utilización', value: `${result.utilization}%` },
                { label: 'Área Piezas', value: `${result.totalPieceArea.toLocaleString()}mm²` },
                { label: 'Desperdicio', value: `${result.wasteArea.toLocaleString()}mm²` }
              ].map((stat) => (
                <div key={stat.label} className="card rounded-lg border-l-4 border-l-[var(--accent2)] p-5">
                  <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wide block mb-1">{stat.label}</span>
                  <div className="text-xl font-bold text-[var(--text-primary)] mono">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="card rounded-xl p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center">
                  <Layers className="w-5 h-5 text-[var(--accent)] mr-3" />
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    Distribución por Hoja
                  </h2>
                </div>
                <button
                  onClick={exportToPrint}
                  className="btn-primary font-semibold py-3 px-6 rounded-md flex items-center gap-2"
                >
                  <Printer size={20} />
                  Exportar Plan
                </button>
              </div>

              <div className="space-y-8">
                {groupedSheets.map((group, groupIdx) => {
                  const sheet = group.sheet;
                  const stats = sheetStats[group.index];
                  return (
                    <div key={groupIdx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="badge">
                          HOJA {groupIdx + 1}{group.count > 1 ? ` × ${group.count}` : ''}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] mono">
                          Usado: {stats.usedArea.toLocaleString()}mm² • Desperdicio: {stats.wasteArea.toLocaleString()}mm² • {stats.efficiency}%
                          {group.count > 1 ? ` (por hoja, repetir ${group.count} veces)` : ''}
                        </span>
                      </div>
                      <div className="rounded-lg border overflow-hidden border-[var(--card-border)]">
                        <svg
                          viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
                          style={{ width: '100%', maxHeight: '520px', background: 'var(--input-bg)' }}
                        >
                          <rect
                            x={Math.max(sheetWidth, sheetHeight) / 400}
                            y={Math.max(sheetWidth, sheetHeight) / 400}
                            width={sheetWidth - Math.max(sheetWidth, sheetHeight) / 200}
                            height={sheetHeight - Math.max(sheetWidth, sheetHeight) / 200}
                            fill="none"
                            stroke="var(--text-muted)"
                            strokeWidth={Math.max(sheetWidth, sheetHeight) / 200}
                          />
                          {edgeMargin > 0 && (
                            <rect
                              x={edgeMargin}
                              y={edgeMargin}
                              width={Math.max(0, sheetWidth - edgeMargin * 2)}
                              height={Math.max(0, sheetHeight - edgeMargin * 2)}
                              fill="none"
                              stroke="var(--text-muted)"
                              strokeDasharray={`${Math.max(sheetWidth, sheetHeight) / 100} ${Math.max(sheetWidth, sheetHeight) / 100}`}
                              strokeWidth={Math.max(sheetWidth, sheetHeight) / 500}
                              opacity="0.6"
                            />
                          )}
                          {sheet.placements.map((p) => {
                            const centroid = centroidOf(p.polygon);
                            return (
                              <g key={p.id}>
                                <polygon
                                  points={pointsToSvg(p.polygon)}
                                  fill="none"
                                  stroke="var(--accent)"
                                  strokeWidth={Math.max(sheetWidth, sheetHeight) / 300}
                                />
                                <text
                                  x={centroid.x}
                                  y={centroid.y}
                                  fontSize={Math.max(14, Math.min(sheetWidth, sheetHeight) / 25)}
                                  fill="var(--text-secondary)"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  style={{ pointerEvents: 'none', fontWeight: 700 }}
                                >
                                  {pieceNumbers[p.name] ?? '?'}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {groupPlacementsByName(sheet.placements).map((g) => (
                          <span key={g.name} className="badge mono">
                            #{pieceNumbers[g.name] ?? '?'} {g.name} × {g.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          !nestError && (
            <div className="card rounded-xl p-12 text-center">
              <LayoutGrid className="mx-auto mb-4 text-[var(--text-muted)] opacity-50" size={64} />
              <h3 className="text-2xl font-bold mb-2 text-[var(--text-muted)] heading-font">
                Esperando Piezas
              </h3>
              <p className="text-[var(--text-muted)]">
                Importá un DXF o agregá piezas para calcular el anidado
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SheetOptimizer;
