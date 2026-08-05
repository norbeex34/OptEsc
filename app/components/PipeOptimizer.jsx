import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Scissors, TrendingDown, AlertCircle, Printer, Layers } from 'lucide-react';

const PipeOptimizer = () => {
  const [stockLength, setStockLength] = useState(6000);
  const [cuts, setCuts] = useState([]);
  const [newCutLength, setNewCutLength] = useState('');
  const [newCutQuantity, setNewCutQuantity] = useState(1);
  const [optimization, setOptimization] = useState(null);
  const [kerfEnabled, setKerfEnabled] = useState(true);
  const [kerfWidth, setKerfWidth] = useState(3);

  const addCut = () => {
    if (newCutLength && parseFloat(newCutLength) > 0) {
      setCuts([...cuts, {
        id: Date.now(),
        length: parseFloat(newCutLength),
        quantity: parseInt(newCutQuantity.toString()) || 1
      }]);
      setNewCutLength('');
      setNewCutQuantity(1);
    }
  };

  const removeCut = (id) => {
    setCuts(cuts.filter(cut => cut.id !== id));
  };

  const optimizeCuts = () => {
    if (cuts.length === 0) return;

    const expandedCuts = [];
    cuts.forEach(cut => {
      for (let i = 0; i < cut.quantity; i++) {
        expandedCuts.push(cut.length);
      }
    });

    expandedCuts.sort((a, b) => b - a);

    const pipes = [];
    const kerf = kerfEnabled ? kerfWidth : 0;

    expandedCuts.forEach(cutLength => {
      let placed = false;

      for (let pipe of pipes) {
        const usedLength = pipe.cuts.reduce((sum, cut) => sum + cut + kerf, 0) - kerf;
        if (usedLength + kerf + cutLength <= stockLength) {
          pipe.cuts.push(cutLength);
          placed = true;
          break;
        }
      }

      if (!placed) {
        pipes.push({ cuts: [cutLength] });
      }
    });

    const totalWaste = pipes.reduce((sum, pipe) => {
      const used = pipe.cuts.reduce((s, c) => s + c + kerf, 0) - kerf;
      return sum + (stockLength - used);
    }, 0);

    const totalCutLength = expandedCuts.reduce((sum, cut) => sum + cut, 0);
    const efficiency = ((totalCutLength / (pipes.length * stockLength)) * 100).toFixed(1);

    setOptimization({
      pipes,
      totalPipes: pipes.length,
      totalWaste,
      efficiency,
      totalCutLength,
      kerf
    });
  };

  useEffect(() => {
    if (cuts.length > 0) {
      optimizeCuts();
    } else {
      setOptimization(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuts, stockLength, kerfEnabled, kerfWidth]);

  const totalCutsCount = cuts.reduce((sum, cut) => sum + cut.quantity, 0);

  const groupIdenticalPipes = (pipes) => {
    const grouped = [];

    pipes.forEach(pipe => {
      const pipeSignature = pipe.cuts.slice().sort((a, b) => a - b).join(',');
      const existing = grouped.find(g =>
        g.cuts.slice().sort((a, b) => a - b).join(',') === pipeSignature
      );

      if (existing) {
        existing.count++;
      } else {
        grouped.push({ cuts: pipe.cuts, count: 1 });
      }
    });

    return grouped;
  };

  const exportToPrint = () => {
    if (!optimization) return;

    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const groupedPipes = groupIdenticalPipes(optimization.pipes);

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Plan de Corte de Caños</title>
  <style>
    @page { margin: 2cm; size: A4; }
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #1e293b; max-width: 100%; margin: 0; padding: 20px; }
    .header { border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #0ea5e9; font-size: 32px; font-weight: bold; }
    .header .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
    .header .date { color: #94a3b8; font-size: 12px; margin-top: 10px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-box { background: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 15px; border-radius: 4px; }
    .stat-box.waste { border-left-color: #ef4444; }
    .stat-box.efficiency { border-left-color: #10b981; }
    .stat-box label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; letter-spacing: 0.5px; }
    .stat-box value { display: block; font-size: 24px; font-weight: bold; color: #0f172a; }
    .config-section { background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
    .config-section h3 { margin: 0 0 10px 0; color: #92400e; font-size: 14px; }
    .config-section p { margin: 5px 0; color: #78350f; font-size: 13px; }
    .cuts-list { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .cuts-list h2 { margin: 0 0 15px 0; color: #0f172a; font-size: 18px; }
    .cut-items { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .cut-item { background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; font-size: 13px; }
    .cut-item strong { color: #0ea5e9; font-size: 16px; }
    .pipes-section h2 { color: #0f172a; font-size: 20px; margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .pipe-card { background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
    .pipe-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
    .pipe-number { font-size: 18px; font-weight: bold; color: #0ea5e9; }
    .pipe-stats { font-size: 12px; color: #64748b; }
    .pipe-visual { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 4px; height: 60px; display: flex; margin-bottom: 15px; overflow: hidden; }
    .cut-segment { background: linear-gradient(to bottom, #38bdf8, #0ea5e9); border-right: 3px solid #1e293b; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; position: relative; }
    .waste-segment { background: repeating-linear-gradient(45deg, #fee2e2, #fee2e2 10px, #fecaca 10px, #fecaca 20px); display: flex; align-items: center; justify-content: center; color: #991b1b; font-weight: bold; font-size: 11px; border-left: 2px dashed #ef4444; }
    .cuts-detail { display: flex; flex-wrap: wrap; gap: 8px; }
    .cut-tag { background: #e0f2fe; border: 1px solid #0ea5e9; color: #0c4a6e; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
    .notes { background: #fef3c7; border-left: 4px solid #fbbf24; padding: 15px; margin-top: 30px; border-radius: 4px; }
    .notes h3 { margin: 0 0 10px 0; color: #92400e; font-size: 14px; }
    .notes ul { margin: 0; padding-left: 20px; color: #78350f; font-size: 12px; }
    .notes li { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PLAN DE CORTE DE CAÑOS</h1>
    <div class="subtitle">Plan de optimización generado por Optimizador de Cortes</div>
    <div class="date">Generado el: ${date}</div>
  </div>

  <div class="summary">
    <div class="stat-box">
      <label>Total Caños</label>
      <value>${optimization.totalPipes}</value>
    </div>
    <div class="stat-box efficiency">
      <label>Eficiencia</label>
      <value>${optimization.efficiency}%</value>
    </div>
    <div class="stat-box waste">
      <label>Desperdicio Total</label>
      <value>${optimization.totalWaste}mm</value>
    </div>
    <div class="stat-box">
      <label>Total a Cortar</label>
      <value>${optimization.totalCutLength}mm</value>
    </div>
  </div>

  <div class="config-section">
    <h3>⚙️ CONFIGURACIÓN</h3>
    <p><strong>Longitud del caño stock:</strong> ${stockLength} mm</p>
    <p><strong>Kerf (ancho de corte):</strong> ${kerfEnabled ? kerfWidth + ' mm' : 'Deshabilitado'}</p>
    <p><strong>Total de piezas a cortar:</strong> ${totalCutsCount} unidades</p>
  </div>

  <div class="cuts-list">
    <h2>📋 LISTA DE CORTES REQUERIDOS</h2>
    <div class="cut-items">
      ${cuts.map(cut => `
        <div class="cut-item">
          <strong>${cut.length} mm</strong><br>
          Cantidad: ${cut.quantity}x<br>
          <span style="color: #6b6a66;">Total: ${cut.length * cut.quantity} mm</span>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="pipes-section">
    <h2>🔧 DISTRIBUCIÓN DE CORTES POR CAÑO</h2>

    ${groupedPipes.map((pipeGroup) => {
      const usedLength = pipeGroup.cuts.reduce((sum, cut) => sum + cut + optimization.kerf, 0) - optimization.kerf;
      const wasteLength = stockLength - usedLength;
      const efficiency = ((usedLength / stockLength) * 100).toFixed(1);

      return `
        <div class="pipe-card">
          <div class="pipe-header">
            <div class="pipe-number">
              ${pipeGroup.count > 1 ? `${pipeGroup.count}× CAÑOS (configuración idéntica)` : `CAÑO ÚNICO`}
            </div>
            <div class="pipe-stats">
              Usado: ${usedLength}mm | Desperdicio: ${wasteLength}mm | Eficiencia: ${efficiency}%
            </div>
          </div>

          <div class="pipe-visual">
            ${pipeGroup.cuts.map((cut) => {
              const widthPercent = ((cut + optimization.kerf) / stockLength) * 100;
              return `<div class="cut-segment" style="width: ${widthPercent}%">${cut}mm</div>`;
            }).join('')}
            ${wasteLength > 0 ? `
              <div class="waste-segment" style="width: ${(wasteLength / stockLength) * 100}%">
                ${wasteLength}mm
              </div>
            ` : ''}
          </div>

          <div class="cuts-detail">
            ${pipeGroup.cuts.map((cut, idx) => `
              <span class="cut-tag">#${idx + 1}: ${cut}mm</span>
            `).join('')}
            ${pipeGroup.count > 1 ? `
              <span class="cut-tag" style="background: #fef3c7; border-color: #fbbf24; color: #92400e;">
                ⚠️ Repetir ${pipeGroup.count} veces
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <div class="notes">
    <h3>📌 NOTAS IMPORTANTES</h3>
    <ul>
      <li>Verificar las medidas antes de comenzar el corte</li>
      <li>Los cortes están optimizados para minimizar el desperdicio</li>
      ${kerfEnabled ? `<li>Se ha incluido ${optimization.kerf}mm de kerf entre cada corte</li>` : ''}
      <li>Marcar cada pieza cortada para identificarla correctamente</li>
      <li>Conservar los retazos útiles para futuros trabajos</li>
    </ul>
  </div>

  <div class="footer">
    Generado con Optimizador de Cortes
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `;

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <>
      <style>{`
        .pipe-visualization {
          background: var(--input-bg);
          border: 2px solid var(--card-border);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        .cut-segment {
          background: linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%);
          border-right: 3px solid var(--page-bg);
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }
        .cut-segment:hover {
          background: linear-gradient(180deg, #7dd3fc 0%, #38bdf8 100%);
        }
        .waste-segment {
          background: repeating-linear-gradient(
            45deg,
            rgba(248, 113, 113, 0.3),
            rgba(248, 113, 113, 0.3) 10px,
            rgba(220, 38, 38, 0.3) 10px,
            rgba(220, 38, 38, 0.3) 20px
          );
          border-left: 2px dashed rgba(248, 113, 113, 0.7);
        }
      `}</style>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-6">
          {/* Configuración de Stock */}
          <div className="card rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-[var(--accent)] mr-3" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Caño Stock
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label block mb-2">Longitud (mm)</label>
                <input
                  type="number"
                  value={stockLength}
                  onChange={(e) => setStockLength(parseFloat(e.target.value) || 6000)}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-3 rounded-md mono"
                  min="100"
                  step="100"
                />
              </div>

              <div className="pt-4 border-t border-[var(--card-border)]">
                <div className="flex items-center justify-between mb-3">
                  <label className="label flex items-center gap-2">
                    <Scissors size={14} className="text-[var(--accent)]" />
                    Incluir Kerf
                  </label>
                  <button
                    onClick={() => setKerfEnabled(!kerfEnabled)}
                    className="relative w-14 h-7 rounded-full transition-colors"
                    style={{ background: kerfEnabled ? 'var(--accent)' : 'var(--input-border)' }}
                  >
                    <div
                      className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform"
                      style={{ transform: kerfEnabled ? 'translateX(1.75rem)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {kerfEnabled && (
                  <div>
                    <label className="label block mb-2">Ancho del kerf (mm)</label>
                    <input
                      type="number"
                      value={kerfWidth}
                      onChange={(e) => setKerfWidth(parseFloat(e.target.value) || 3)}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-4 py-3 rounded-md mono"
                      min="0"
                      step="0.5"
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-2 mono">Espacio entre cortes según tu herramienta</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Agregar Cortes */}
          <div className="card rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Scissors className="w-5 h-5 text-[var(--accent)] mr-3" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Nuevo Corte
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label block mb-2">Longitud (mm)</label>
                <input
                  type="number"
                  value={newCutLength}
                  onChange={(e) => setNewCutLength(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCut()}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-3 rounded-md mono"
                  placeholder="Ej: 1500"
                  min="1"
                />
              </div>
              <div>
                <label className="label block mb-2">Cantidad</label>
                <input
                  type="number"
                  value={newCutQuantity}
                  onChange={(e) => setNewCutQuantity(parseInt(e.target.value) || 1)}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-3 rounded-md mono"
                  min="1"
                />
              </div>
              <button
                onClick={addCut}
                className="btn-primary w-full font-semibold py-3 px-6 rounded-md flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Agregar Corte
              </button>
            </div>
          </div>

          {/* Lista de Cortes */}
          <div className="card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Cortes
              </h2>
              <span className="badge">{totalCutsCount} piezas</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cuts.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                  <p className="text-sm">No hay cortes agregados</p>
                </div>
              ) : (
                cuts.map((cut) => (
                  <div
                    key={cut.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-[var(--input-bg)] border-[var(--card-border)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold">
                        {cut.quantity}×
                      </div>
                      <div>
                        <div className="mono text-lg font-bold text-[var(--accent)]">
                          {cut.length} mm
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {cut.length * cut.quantity} mm total
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCut(cut.id)}
                      className="btn-danger p-2 rounded-md"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {optimization ? (
            <>
              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Caños', value: optimization.totalPipes, icon: Package, color: '#0ea5e9' },
                  { label: 'Eficiencia', value: `${optimization.efficiency}%`, icon: TrendingDown, color: '#10b981' },
                  { label: 'Desperdicio', value: `${optimization.totalWaste}mm`, icon: AlertCircle, color: '#f43f5e' },
                  { label: 'Total Corte', value: `${optimization.totalCutLength}mm`, icon: Scissors, color: '#f59e0b' }
                ].map((stat) => (
                  <div key={stat.label} className="card rounded-lg border-l-4 p-5" style={{ borderLeftColor: stat.color }}>
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                      <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wide">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)] mono">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Visualización de Caños */}
              <div className="card rounded-xl p-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center">
                    <Layers className="w-5 h-5 text-[var(--accent)] mr-3" />
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      Distribución Optimizada
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
                <div className="space-y-6">
                  {groupIdenticalPipes(optimization.pipes).map((pipeGroup, groupIndex) => {
                    const usedLength = pipeGroup.cuts.reduce((sum, cut) => sum + cut + optimization.kerf, 0) - optimization.kerf;
                    const wasteLength = stockLength - usedLength;
                    const efficiency = ((usedLength / stockLength) * 100).toFixed(1);

                    return (
                      <div key={groupIndex}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[var(--text-muted)]">
                            {pipeGroup.count > 1 ? (
                              <span className="flex items-center gap-2">
                                <span
                                  className="text-xs mono px-3 py-1 rounded-full font-semibold"
                                  style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}
                                >
                                  {pipeGroup.count}× CAÑOS
                                </span>
                                <span>(configuración idéntica)</span>
                              </span>
                            ) : (
                              `CAÑO ÚNICO`
                            )}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] mono">
                            Usado: {usedLength}mm • Desperdicio: {wasteLength}mm • {efficiency}%
                          </span>
                        </div>

                        <div className="pipe-visualization h-16 flex">
                          {pipeGroup.cuts.map((cut, cutIndex) => {
                            const widthPercent = ((cut + optimization.kerf) / stockLength) * 100;
                            return (
                              <div
                                key={cutIndex}
                                className="cut-segment flex items-center justify-center text-white font-bold text-xs relative"
                                style={{ width: `${widthPercent}%` }}
                              >
                                <span className="relative z-10">{cut}mm</span>
                              </div>
                            );
                          })}
                          {wasteLength > 0 && (
                            <div
                              className="waste-segment flex items-center justify-center font-bold text-xs"
                              style={{ width: `${(wasteLength / stockLength) * 100}%`, color: '#f43f5e' }}
                            >
                              {wasteLength}mm
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                          {pipeGroup.cuts.map((cut, cutIndex) => (
                            <span
                              key={cutIndex}
                              className="text-xs mono px-3 py-1 rounded-full font-semibold"
                              style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}
                            >
                              {cut}mm
                            </span>
                          ))}
                          {pipeGroup.count > 1 && (
                            <span className="text-xs text-[var(--text-muted)] italic">
                              → Repetir {pipeGroup.count} veces
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {kerfEnabled && (
                <div className="card rounded-xl p-4">
                  <div className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-[var(--accent)]" />
                    <p>
                      <strong className="text-[var(--accent)]">Nota:</strong> Los cálculos incluyen {optimization.kerf}mm de kerf (ancho de corte) entre cada pieza.
                      Ajusta según tu herramienta de corte.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card rounded-xl p-12 text-center">
              <Scissors className="mx-auto mb-4 text-[var(--text-muted)] opacity-50" size={64} />
              <h3 className="text-2xl font-bold mb-2 text-[var(--text-muted)] heading-font">
                Esperando Datos
              </h3>
              <p className="text-[var(--text-muted)]">
                Agrega cortes para ver la optimización
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PipeOptimizer;
