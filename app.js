const STORAGE_KEY = "tradyn-journal-entries";
const CAPITAL_KEY = "tradyn-journal-starting-balance";
const REPORT_KEY = "tradyn-journal-imported-report";
const REPORT_HISTORY_KEY = "tradyn-journal-report-history";
const COMPACT_KEY = "tradyn-journal-compact-mode";
const PLAN_CHECKLIST = [
  { key: "direction", label: "Direccion" },
  { key: "liquiditySweep", label: "Liquidity Sweep" },
  { key: "displacement", label: "Displacement" },
  { key: "ifvgLowTf", label: "IFVG low TF" },
];
const DAILY_CAPTURE_SLOTS = [
  { key: "capture1", label: "Captura 1" },
  { key: "capture2", label: "Captura 2" },
  { key: "final", label: "Captura final" },
];
const MAX_PDF_BYTES = 2 * 1024 * 1024;

const fields = {
  id: document.querySelector("#entryId"),
  date: document.querySelector("#date"),
  session: document.querySelector("#session"),
  asset: document.querySelector("#asset"),
  planFollowed: document.querySelector("#planFollowed"),
  checkDirection: document.querySelector("#checkDirection"),
  checkLiquiditySweep: document.querySelector("#checkLiquiditySweep"),
  checkDisplacement: document.querySelector("#checkDisplacement"),
  checkIfvgLowTf: document.querySelector("#checkIfvgLowTf"),
  chartImage: document.querySelector("#chartImage"),
  analysisDirection: document.querySelector("#analysisDirection"),
  analysisSweep: document.querySelector("#analysisSweep"),
  analysisDisplacement: document.querySelector("#analysisDisplacement"),
  analysisIfvg: document.querySelector("#analysisIfvg"),
  trades: document.querySelector("#trades"),
  wins: document.querySelector("#wins"),
  losses: document.querySelector("#losses"),
  pnl: document.querySelector("#pnl"),
  risk: document.querySelector("#risk"),
  rr: document.querySelector("#rr"),
  emotion: document.querySelector("#emotion"),
  notes: document.querySelector("#notes"),
};

const form = document.querySelector("#journalForm");
const entriesBody = document.querySelector("#entriesBody");
const emptyState = document.querySelector("#emptyState");
const newTradeButton = document.querySelector("#newTradeButton");
const compactModeButton = document.querySelector("#compactModeButton");
const reportHistoryBody = document.querySelector("#reportHistoryBody");
const reportHistoryEmpty = document.querySelector("#reportHistoryEmpty");
const reportChart = document.querySelector("#reportChart");
const reportChartEmpty = document.querySelector("#reportChartEmpty");
const searchInput = document.querySelector("#searchInput");
const downloadButton = document.querySelector("#downloadButton");
const clearButton = document.querySelector("#clearButton");
const importButton = document.querySelector("#importButton");
const importFile = document.querySelector("#importFile");
const importReportButton = document.querySelector("#importReportButton");
const reportFile = document.querySelector("#reportFile");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const editStatus = document.querySelector("#editStatus");
const journalPanel = document.querySelector("#journalPanel");
const startingBalanceInput = document.querySelector("#startingBalance");
const importedReportStatus = document.querySelector("#importedReportStatus");
const clearReportButton = document.querySelector("#clearReportButton");
const aiReportInput = document.querySelector("#aiReportInput");
const applyAiReportButton = document.querySelector("#applyAiReportButton");
const copyAiPromptButton = document.querySelector("#copyAiPromptButton");
const reportPeriodType = document.querySelector("#reportPeriodType");
const reportStartDate = document.querySelector("#reportStartDate");
const reportEndDate = document.querySelector("#reportEndDate");
const periodFilter = document.querySelector("#periodFilter");
const sessionFilter = document.querySelector("#sessionFilter");
const imageButton = document.querySelector("#imageButton");
const removeImageButton = document.querySelector("#removeImageButton");
const imagePreviewWrap = document.querySelector("#imagePreviewWrap");
const imagePreview = document.querySelector("#imagePreview");
const pdfPreview = document.querySelector("#pdfPreview");
const imageStatus = document.querySelector("#imageStatus");
const applyAnalysisButton = document.querySelector("#applyAnalysisButton");
const dailyCapturesWrap = document.querySelector("#dailyCaptures");
const captureAiInput = document.querySelector("#captureAiInput");
const copyCapturePromptButton = document.querySelector("#copyCapturePromptButton");
const applyCaptureAiButton = document.querySelector("#applyCaptureAiButton");
const captureAiStatus = document.querySelector("#captureAiStatus");
const tradeEditDialog = document.querySelector("#tradeEditDialog");
const quickEditId = document.querySelector("#quickEditId");
const quickEditMeta = document.querySelector("#quickEditMeta");
const quickEditPnl = document.querySelector("#quickEditPnl");
const quickEditRisk = document.querySelector("#quickEditRisk");
const quickEditRr = document.querySelector("#quickEditRr");
const quickEditWins = document.querySelector("#quickEditWins");
const quickEditLosses = document.querySelector("#quickEditLosses");
const quickEditNotes = document.querySelector("#quickEditNotes");
const saveQuickEditButton = document.querySelector("#saveQuickEditButton");
const capturesDialog = document.querySelector("#capturesDialog");
const captureViewerMeta = document.querySelector("#captureViewerMeta");
const captureViewerGrid = document.querySelector("#captureViewerGrid");
const closeCapturesButton = document.querySelector("#closeCapturesButton");

let entries = normalizeEntries(loadEntries());
let startingBalance = loadStartingBalance();
let importedReport = sanitizeImportedReport(loadImportedReport());
let reportHistory = loadReportHistory();
let currentChartFile = createEmptyChartFile();
let currentDailyCaptures = createEmptyDailyCaptures();
let pendingCaptureSlot = null;
saveEntries();

fields.date.valueAsDate = new Date();
startingBalanceInput.value = startingBalance || "";
setCompactMode(loadCompactMode());
setDefaultReportPeriod();
setupCaptureMetricFields();
renderDailyCaptures();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentJournalEntry();
});

clearButton.addEventListener("click", resetForm);
cancelEditButton.addEventListener("click", resetForm);

searchInput.addEventListener("input", render);
periodFilter.addEventListener("change", render);
sessionFilter.addEventListener("change", render);

newTradeButton.addEventListener("click", () => {
  resetForm();
  journalPanel.open = true;
  journalPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

compactModeButton.addEventListener("click", () => {
  setCompactMode(!document.body.classList.contains("compact"));
});

imageButton.addEventListener("click", () => {
  pendingCaptureSlot = null;
  fields.chartImage.multiple = true;
  fields.chartImage.click();
});
removeImageButton.addEventListener("click", () => {
  setDailyCapturesForm(createEmptyDailyCaptures());
  updateCapturePasteStatus();
});

dailyCapturesWrap.addEventListener("click", (event) => {
  const uploadButton = event.target.closest("[data-capture-upload]");
  const removeButton = event.target.closest("[data-capture-remove]");

  if (uploadButton) {
    pendingCaptureSlot = Number(uploadButton.dataset.captureUpload);
    fields.chartImage.multiple = false;
    fields.chartImage.click();
  }

  if (removeButton) {
    const slotIndex = Number(removeButton.dataset.captureRemove);
    syncDailyCapturesFromForm();
    currentDailyCaptures[slotIndex] = createEmptyDailyCapture(slotIndex);
    renderDailyCaptures();
    updateCapturePasteStatus();
  }
});

fields.chartImage.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  try {
    syncDailyCapturesFromForm();

    if (Number.isInteger(pendingCaptureSlot)) {
      await setDailyCaptureFromFile(pendingCaptureSlot, files[0]);
    } else {
      const availableSlots = DAILY_CAPTURE_SLOTS.map((_, index) => index);
      for (const [index, file] of files.slice(0, DAILY_CAPTURE_SLOTS.length).entries()) {
        await setDailyCaptureFromFile(availableSlots[index], file);
      }
    }

    renderDailyCaptures();
    applyManualImageAnalysis();
    updateCapturePasteStatus();
  } catch {
    alert("No pude cargar ese archivo. Usa imagenes o PDFs menores de 2 MB.");
  } finally {
    fields.chartImage.value = "";
    fields.chartImage.multiple = true;
    pendingCaptureSlot = null;
  }
});

applyAnalysisButton.addEventListener("click", () => {
  applyManualImageAnalysis();
});

copyCapturePromptButton.addEventListener("click", async () => {
  const prompt = buildCaptureChatGptPrompt();
  try {
    await navigator.clipboard.writeText(prompt);
    captureAiStatus.textContent = "Prompt copiado. Pegalo en ChatGPT junto con las capturas.";
  } catch {
    captureAiInput.value = prompt;
    captureAiStatus.textContent = "No pude copiarlo; deje el prompt en el cuadro para que lo copies.";
  }
});

applyCaptureAiButton.addEventListener("click", () => {
  try {
    applyCaptureChatGptAnalysis(parseCaptureChatGptInput(captureAiInput.value));
    captureAiInput.value = "";
    saveCurrentJournalEntry({ keepForm: false });
    captureAiStatus.textContent = "Analisis guardado en el historial junto con las capturas.";
  } catch (error) {
    captureAiStatus.textContent = error.message || "No pude leer ese analisis.";
  }
});

startingBalanceInput.addEventListener("input", () => {
  startingBalance = toNumber(startingBalanceInput.value);
  saveStartingBalance();
  renderSummary();
});

downloadButton.addEventListener("click", () => {
  if (!entries.length && !reportHistory.length) {
    alert("Agrega al menos un registro o reporte antes de descargar.");
    return;
  }

  downloadExcel(entries, reportHistory);
});

importButton.addEventListener("click", () => importFile.click());
importReportButton.addEventListener("click", () => reportFile.click());

clearReportButton.addEventListener("click", () => {
  importedReport = null;
  saveImportedReport();
  render();
});

applyAiReportButton.addEventListener("click", () => {
  try {
    importedReport = attachReportPeriod(parseAiReportInput(aiReportInput.value));
    saveImportedReport();
    aiReportInput.value = "";
    render();
  } catch (error) {
    alert(error.message || "No pude leer ese analisis.");
  }
});

copyAiPromptButton.addEventListener("click", async () => {
  const prompt = buildAiReportPrompt();
  try {
    await navigator.clipboard.writeText(prompt);
    importedReportStatus.textContent = "Prompt copiado. Pegalo junto con tu PDF/captura en ChatGPT.";
  } catch {
    aiReportInput.value = prompt;
  }
});

importFile.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  const imported = parseCsv(text);
  entries = mergeEntries(entries, imported);
  saveEntries();
  render();
  importFile.value = "";
});

reportFile.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    importedReportStatus.textContent = "Leyendo reporte PDF...";
    importedReport = await parseReportPdf(file);
    saveImportedReport();
    render();
  } catch (error) {
    importedReportStatus.textContent =
      "PDF directo no legible. Usa el panel de IA para actualizar el dashboard.";
    alert(error.message || "Ese PDF no se pudo leer directo. Usa Copiar prompt y pega el JSON de ChatGPT.");
  } finally {
    reportFile.value = "";
  }
});

entriesBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const entry = entries.find((item) => item.id === id);

  if (button.dataset.action === "edit" && entry) {
    openQuickEdit(entry);
  }

  if (button.dataset.action === "captures" && entry) {
    openCapturesViewer(entry);
  }

  if (button.dataset.action === "edit" && !entry) {
    alert("No pude encontrar ese registro. Recarga la pagina e intenta de nuevo.");
  }

  if (button.dataset.action === "delete") {
    const ok = confirm("Deseas eliminar este registro?");
    if (!ok) return;
    entries = entries.filter((item) => item.id !== id);
    saveEntries();
    render();
  }
});

saveQuickEditButton.addEventListener("click", () => {
  saveQuickEdit();
});

closeCapturesButton.addEventListener("click", () => {
  capturesDialog.close();
});

reportHistoryBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-report-action]");
  if (!button) return;

  const id = button.dataset.id;
  const report = reportHistory.find((item) => item.id === id);

  if (button.dataset.reportAction === "use" && report) {
    importedReport = sanitizeImportedReport(report);
    saveImportedReport({ addToHistory: false });
    render();
  }

  if (button.dataset.reportAction === "delete") {
    const ok = confirm("Deseas borrar este reporte guardado?");
    if (!ok) return;

    reportHistory = reportHistory.filter((item) => item.id !== id);
    saveReportHistory();

    if (importedReport?.id === id) {
      importedReport = null;
      saveImportedReport({ addToHistory: false });
    }

    render();
  }
});

function getFormEntry() {
  const dailyCaptures = getDailyCapturesFromForm();
  const primaryCaptureFile = getPrimaryCaptureFile(dailyCaptures);
  const enteredRisk = toNumber(fields.risk.value);

  return {
    id: fields.id.value || createId(),
    date: fields.date.value,
    session: fields.session.value,
    asset: fields.asset.value.trim(),
    planFollowed: fields.planFollowed.value,
    planChecklist: getChecklistFromForm(),
    imageAnalysis: getImageAnalysisFromForm(),
    dailyCaptures,
    chartFile: primaryCaptureFile,
    chartImage: primaryCaptureFile.type.startsWith("image/") ? primaryCaptureFile.data : "",
    trades: toNumber(fields.trades.value),
    wins: toNumber(fields.wins.value),
    losses: toNumber(fields.losses.value),
    pnl: toNumber(fields.pnl.value),
    risk: enteredRisk > 0 ? enteredRisk : getCalculatedRiskPercent(dailyCaptures, fields.asset.value.trim()),
    rr: toNumber(fields.rr.value),
    emotion: fields.emotion.value,
    notes: fields.notes.value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function saveCurrentJournalEntry(options = {}) {
  const { keepForm = false } = options;
  const entry = getFormEntry();
  const existingIndex = entries.findIndex((item) => item.id === entry.id);
  const duplicateIndex = existingIndex < 0 ? findDuplicateEntryIndex(entry) : -1;

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else if (duplicateIndex >= 0) {
    entries[duplicateIndex] = {
      ...entries[duplicateIndex],
      ...entry,
      id: entries[duplicateIndex].id,
    };
  } else {
    entries.push(entry);
  }

  saveEntries();
  if (!keepForm) resetForm();
  render();
}

function fillForm(entry) {
  fields.id.value = entry.id;
  fields.date.value = entry.date;
  fields.session.value = entry.session;
  fields.asset.value = entry.asset;
  fields.planFollowed.value = entry.planFollowed;
  setChecklistForm(entry.planChecklist);
  setImageAnalysisForm(entry.imageAnalysis);
  setDailyCapturesForm(normalizeDailyCaptures(entry));
  fields.trades.value = entry.trades;
  fields.wins.value = entry.wins;
  fields.losses.value = entry.losses;
  fields.pnl.value = entry.pnl;
  fields.risk.value = getEntryRiskPercent(entry) ?? "";
  fields.rr.value = entry.rr;
  fields.emotion.value = entry.emotion;
  fields.notes.value = entry.notes;
}

function resetForm() {
  form.reset();
  fields.id.value = "";
  fields.date.valueAsDate = new Date();
  fields.trades.value = 0;
  fields.wins.value = 0;
  fields.losses.value = 0;
  fields.pnl.value = 0;
  fields.risk.value = "";
  fields.rr.value = 0;
  setChecklistForm(createEmptyChecklist());
  setImageAnalysisForm(createEmptyImageAnalysis());
  setDailyCapturesForm(createEmptyDailyCaptures());
  setCreateMode();
}

function setEditMode(entry) {
  journalPanel.open = true;
  document.body.classList.add("is-editing");
  editStatus.textContent = `Editando ${entry.date || "registro"}`;
  submitButton.textContent = "Actualizar registro";
  cancelEditButton.classList.remove("hidden");
}

function setCreateMode() {
  document.body.classList.remove("is-editing");
  editStatus.textContent = "Nuevo registro";
  submitButton.textContent = "Guardar registro";
  cancelEditButton.classList.add("hidden");
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleEntries = entries
    .filter(matchesHistoryFilters)
    .filter((entry) => JSON.stringify(entry).toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date));

  entriesBody.innerHTML = visibleEntries.map(renderRow).join("");
  emptyState.classList.toggle("visible", visibleEntries.length === 0);
  renderReportHistory();
  renderSummary();
}

function renderRow(entry) {
  const pnlClass = entry.pnl >= 0 ? "money-positive" : "money-negative";
  const risk = getEntryRiskPercent(entry);

  return `
    <tr>
      <td>${escapeHtml(entry.date)}</td>
      <td>${escapeHtml(entry.session)}</td>
      <td>${escapeHtml(entry.asset || "-")}</td>
      <td>${entry.trades}</td>
      <td>${entry.wins}/${entry.losses}</td>
      <td class="${pnlClass}">${formatMoney(entry.pnl)}</td>
      <td>${renderRiskPill(risk)}</td>
      <td>${escapeHtml(entry.planFollowed)}</td>
      <td>${renderChecklistScore(entry)}</td>
      <td>${renderCaptureCell(entry)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-button edit" data-action="edit" data-id="${escapeHtml(entry.id)}" type="button">Editar</button>
          <button class="icon-button delete" data-action="delete" data-id="${escapeHtml(entry.id)}" type="button">Borrar</button>
        </div>
      </td>
    </tr>
  `;
}

function renderCaptureTradeSummary(entry) {
  const captures = normalizeDailyCaptures(entry).filter((capture) => capture.file.data);
  const trade = consolidateCaptureTrade(captures);

  if (!trade.entryPrice && !trade.entryTime && !trade.partials) return getSetupFileLabel(entry);

  const entryPrice = trade.entryPrice ? formatPriceValue(trade.entryPrice) : "s/p";
  const entryTime = trade.entryTime ? `${trade.entryTime} UTC-5` : "s/h";
  return `${trade.side || "Trade"} ${entryPrice} | ${entryTime} | P:${trade.partials}`;
}

function renderCaptureCell(entry) {
  const label = renderCaptureTradeSummary(entry);
  if (!hasSetupFile(entry)) return escapeHtml(label);

  return `<button class="capture-link" data-action="captures" data-id="${escapeHtml(entry.id)}" type="button">${escapeHtml(label)}</button>`;
}

function renderRiskPill(risk) {
  if (!isFiniteNumber(risk) || risk <= 0) return `<span class="risk-pill unknown">--</span>`;
  const status = risk <= 1 ? "ok" : "high";
  const label = risk <= 1 ? "OK" : "Alto";
  return `<span class="risk-pill ${status}" title="Riesgo ${label}">${formatPercent(risk)}</span>`;
}

function matchesHistoryFilters(entry) {
  const sessionValue = sessionFilter.value;
  if (sessionValue !== "all" && entry.session !== sessionValue) return false;

  const periodValue = periodFilter.value;
  if (periodValue === "all") return true;

  const entryDate = parseDateOnly(entry.date);
  if (!entryDate) return false;

  const today = parseDateOnly(formatDateInput(new Date()));
  if (periodValue === "today") return entry.date === formatDateInput(new Date());
  if (periodValue === "month") {
    return entryDate.getFullYear() === today.getFullYear() && entryDate.getMonth() === today.getMonth();
  }
  if (periodValue === "week") {
    const start = startOfWeek(today);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return entryDate >= start && entryDate <= end;
  }

  return true;
}

function findDuplicateEntryIndex(entry) {
  const fingerprint = getEntryFingerprint(entry);
  if (!fingerprint) return -1;
  return entries.findIndex((item) => item.id !== entry.id && getEntryFingerprint(item) === fingerprint);
}

function getEntryFingerprint(entry) {
  const captures = normalizeDailyCaptures(entry);
  const trade = consolidateCaptureTrade(captures);
  const date = entry.date || "";
  const asset = String(entry.asset || "").trim().toUpperCase();
  const entryTime = trade.entryTime || "";
  const entryPrice = trade.entryPrice ? formatPriceValue(trade.entryPrice) : "";

  if (!date || !asset) return "";
  return [date, asset, entryTime, entryPrice || formatMoney(entry.pnl)].join("|");
}

function openQuickEdit(entry) {
  quickEditId.value = entry.id;
  quickEditMeta.textContent = `${entry.date || "Sin fecha"} | ${entry.asset || "Sin activo"} | ${entry.session || ""}`;
  quickEditPnl.value = entry.pnl;
  quickEditRisk.value = getEntryRiskPercent(entry) ?? "";
  quickEditRr.value = entry.rr;
  quickEditWins.value = entry.wins;
  quickEditLosses.value = entry.losses;
  quickEditNotes.value = entry.notes || "";
  tradeEditDialog.showModal();
}

function saveQuickEdit() {
  const index = entries.findIndex((entry) => entry.id === quickEditId.value);
  if (index < 0) return;

  entries[index] = {
    ...entries[index],
    pnl: toNumber(quickEditPnl.value),
    risk: toOptionalNumber(quickEditRisk.value) ?? 0,
    rr: toNumber(quickEditRr.value),
    wins: toNumber(quickEditWins.value),
    losses: toNumber(quickEditLosses.value),
    trades: Math.max(1, toNumber(quickEditWins.value) + toNumber(quickEditLosses.value)),
    notes: quickEditNotes.value.trim(),
    updatedAt: new Date().toISOString(),
  };

  saveEntries();
  tradeEditDialog.close();
  render();
}

function openCapturesViewer(entry) {
  const captures = normalizeDailyCaptures(entry).filter((capture) => capture.file.data);
  captureViewerMeta.textContent = `${entry.date || "Sin fecha"} | ${entry.asset || "Sin activo"}`;
  captureViewerGrid.innerHTML = captures.length
    ? captures.map(renderCaptureViewerItem).join("")
    : `<p class="empty visible">Este registro no tiene capturas guardadas.</p>`;
  capturesDialog.showModal();
}

function renderCaptureViewerItem(capture) {
  const isPdf = capture.file.type === "application/pdf";
  const media = isPdf
    ? `<iframe src="${escapeHtml(capture.file.data)}" title="${escapeHtml(capture.label)}"></iframe>`
    : `<img src="${escapeHtml(capture.file.data)}" alt="${escapeHtml(capture.label)}" />`;
  const tradeLine = formatCaptureTradeLine(capture) || "Sin metricas";

  return `
    <figure class="capture-viewer-item">
      ${media}
      <figcaption>${escapeHtml(capture.label)} | ${escapeHtml(tradeLine)}</figcaption>
    </figure>
  `;
}

function renderReportHistory() {
  const rows = reportHistory
    .slice()
    .sort((a, b) => (b.importedAt || "").localeCompare(a.importedAt || ""))
    .map(renderReportHistoryRow)
    .join("");

  reportHistoryBody.innerHTML = rows;
  reportHistoryEmpty.classList.toggle("visible", reportHistory.length === 0);
  renderReportChart();
}

function renderReportChart() {
  const reports = reportHistory
    .slice()
    .filter((report) => isFiniteNumber(report.pnl))
    .sort((a, b) => getReportSortKey(a).localeCompare(getReportSortKey(b)));

  reportChartEmpty.classList.toggle("visible", reports.length < 2);

  if (reports.length < 2) {
    reportChart.innerHTML = "";
    return;
  }

  const width = 920;
  const height = 280;
  const padding = { top: 28, right: 28, bottom: 52, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const cumulative = [];
  let running = 0;

  reports.forEach((report) => {
    running += report.pnl;
    cumulative.push(running);
  });

  const values = [...cumulative, 0];
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const xStep = reports.length > 1 ? chartWidth / (reports.length - 1) : chartWidth;
  const yFor = (value) => padding.top + ((maxValue - value) / range) * chartHeight;
  const xFor = (index) => padding.left + index * xStep;
  const zeroY = yFor(0);
  const points = cumulative.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");
  const bars = reports
    .map((report, index) => {
      const x = xFor(index) - Math.min(24, xStep * 0.32) / 2;
      const barWidth = Math.min(24, xStep * 0.32);
      const y = report.pnl >= 0 ? yFor(report.pnl) : zeroY;
      const barHeight = Math.max(2, Math.abs(yFor(report.pnl) - zeroY));
      const cls = report.pnl >= 0 ? "gain-bar" : "loss-bar";

      return `<rect class="${cls}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="3"></rect>`;
    })
    .join("");
  const labels = reports
    .map((report, index) => {
      const label = report.periodEnd || report.periodStart || (report.importedAt || "").slice(5, 10);
      return `<text class="chart-label" x="${xFor(index)}" y="${height - 18}" text-anchor="middle">${escapeHtml(label.slice(5) || label)}</text>`;
    })
    .join("");

  reportChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  reportChart.innerHTML = `
    <title id="reportChartTitle">Evolucion de P&L acumulado</title>
    <line class="chart-grid-line" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"></line>
    <line class="chart-zero-line" x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}"></line>
    ${bars}
    <polyline class="equity-line" points="${points}"></polyline>
    ${cumulative
      .map(
        (value, index) =>
          `<circle class="equity-point" cx="${xFor(index)}" cy="${yFor(value)}" r="4"></circle>`
      )
      .join("")}
    <text class="chart-axis-label" x="14" y="${padding.top + 5}">${formatMoney(maxValue)}</text>
    <text class="chart-axis-label" x="14" y="${height - padding.bottom}">${formatMoney(minValue)}</text>
    ${labels}
  `;
}

function renderReportHistoryRow(report) {
  const source = report.source === "ai" ? "IA" : "PDF";
  const date = report.importedAt ? report.importedAt.slice(0, 10) : "-";
  const period = formatReportPeriod(report);

  return `
    <tr>
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(period)}</td>
      <td>${escapeHtml(report.fileName || "Reporte")}</td>
      <td class="${report.pnl >= 0 ? "money-positive" : "money-negative"}">${formatMoney(report.pnl || 0)}</td>
      <td>${validTradeCount(report.trades) ? report.trades : "-"}</td>
      <td>${isFiniteNumber(report.winRate) ? `${Math.round(report.winRate)}%` : "--"}</td>
      <td>${formatRatio(report.profitFactor)}</td>
      <td>${formatPercent(report.maxDrawdownPercent)}</td>
      <td>${source}</td>
      <td>
        <div class="row-actions">
          <button class="icon-button edit" data-report-action="use" data-id="${escapeHtml(report.id)}" type="button">Usar</button>
          <button class="icon-button delete" data-report-action="delete" data-id="${escapeHtml(report.id)}" type="button">Borrar</button>
        </div>
      </td>
    </tr>
  `;
}

function renderSummary() {
  const totals = entries.reduce(
    (acc, entry) => {
      const risk = getEntryRiskPercent(entry);
      acc.pnl += entry.pnl;
      acc.trades += getClosedTrades(entry);
      acc.wins += entry.wins;
      acc.losses += entry.losses;
      if (isFiniteNumber(risk)) {
        acc.risk += risk;
        acc.riskCount += 1;
      }
      return acc;
    },
    { pnl: 0, trades: 0, wins: 0, losses: 0, risk: 0, riskCount: 0 }
  );
  const reportTotals = applyImportedReport(totals);

  document.querySelector("#totalEntries").textContent = reportTotals.trades || entries.length;
  document.querySelector("#totalPnl").textContent = formatMoney(reportTotals.pnl);
  document.querySelector("#winRate").textContent =
    isFiniteNumber(reportTotals.winRate)
      ? `${Math.round(reportTotals.winRate)}%`
      : reportTotals.trades > 0
        ? `${Math.round((reportTotals.wins / reportTotals.trades) * 100)}%`
        : "0%";
  document.querySelector("#avgRisk").textContent =
    totals.riskCount > 0 ? formatPercent(totals.risk / totals.riskCount) : "--";
  renderDailySummary();
  renderDisciplineSummary();
  renderReport(reportTotals, totals);
}

function renderReport(totals, journalTotals = totals) {
  const grossProfit = totals.grossProfit ?? entries
    .filter((entry) => entry.pnl > 0)
    .reduce((sum, entry) => sum + entry.pnl, 0);
  const grossLoss =
    totals.grossLoss ??
    Math.abs(entries.filter((entry) => entry.pnl < 0).reduce((sum, entry) => sum + entry.pnl, 0));
  const profitFactor = totals.profitFactor ?? (grossLoss > 0 ? grossProfit / grossLoss : null);
  const closedTrades = totals.trades;
  const avgTrade = totals.avgTrade ?? (closedTrades > 0 ? totals.pnl / closedTrades : 0);
  const avgWin = totals.avgWin ?? (totals.wins > 0 ? grossProfit / totals.wins : 0);
  const avgLoss = totals.avgLoss ?? (totals.losses > 0 ? grossLoss / totals.losses : 0);
  const realRr = totals.realRr ?? (avgLoss > 0 ? avgWin / avgLoss : null);
  const winRate = totals.winRate ?? (closedTrades > 0 ? (totals.wins / closedTrades) * 100 : 0);
  const maxDrawdown = calculateMaxDrawdown(entries);
  const returnRate = totals.returnRate ?? (startingBalance > 0 ? (totals.pnl / startingBalance) * 100 : null);
  const drawdownRate =
    totals.maxDrawdownPercent ?? (startingBalance > 0 ? (maxDrawdown.amount / maxDrawdown.base) * 100 : null);
  const checklist = calculateChecklistStats(entries);

  renderImportedReportStatus();

  document.querySelector("#returnRate").textContent =
    returnRate === null ? "--" : formatPercent(returnRate);
  document.querySelector("#returnValue").textContent = formatMoney(totals.pnl);
  document.querySelector("#maxDrawdown").textContent =
    drawdownRate === null ? "--" : formatPercent(drawdownRate);
  document.querySelector("#maxDrawdownValue").textContent =
    formatMoney(totals.maxDrawdownAmount ?? maxDrawdown.amount);
  document.querySelector("#profitFactor").textContent = formatRatio(profitFactor);
  document.querySelector("#grossProfitLoss").textContent =
    `${formatMoney(grossProfit)} / ${formatMoney(grossLoss)}`;
  document.querySelector("#closedTrades").textContent = closedTrades;
  document.querySelector("#closedWinRate").textContent = `${Math.round(winRate)}% win rate`;
  document.querySelector("#avgTrade").textContent = formatMoney(avgTrade);
  document.querySelector("#expectancy").textContent = `Expectativa ${formatMoney(avgTrade)}`;
  document.querySelector("#realRr").textContent = formatRatio(realRr);
  document.querySelector("#avgWinLoss").textContent =
    `${formatMoney(avgWin)} / ${formatMoney(avgLoss)}`;
  document.querySelector("#planChecklistRate").textContent =
    formatPercent(checklist.completionRate);
  document.querySelector("#planChecklistDetail").textContent =
    `${checklist.averageScore.toFixed(1)}/4 por entrada`;
  document.querySelector("#aPlusSetups").textContent = checklist.aPlusCount;
  document.querySelector("#aPlusPnl").textContent = `${formatMoney(checklist.aPlusPnl)} P&L`;
}

function renderDailySummary() {
  const date = getLatestEntryDate(entries);
  const dayEntries = date ? entries.filter((entry) => entry.date === date) : [];
  const pnl = dayEntries.reduce((sum, entry) => sum + entry.pnl, 0);
  const trades = dayEntries.reduce((sum, entry) => sum + getClosedTrades(entry), 0);
  const wins = dayEntries.reduce((sum, entry) => sum + entry.wins, 0);
  const riskValues = dayEntries.map(getEntryRiskPercent).filter((risk) => isFiniteNumber(risk) && risk > 0);
  const riskTotal = riskValues.reduce((sum, risk) => sum + risk, 0);
  const bestSetup = dayEntries
    .slice()
    .sort((a, b) => getChecklistScore(b) - getChecklistScore(a) || b.pnl - a.pnl)[0];

  document.querySelector("#dailySummaryLabel").textContent = date ? `Dia ${date}` : "Dia";
  document.querySelector("#dailyPnl").textContent = formatMoney(pnl);
  document.querySelector("#dailyPnl").className = pnl >= 0 ? "money-positive" : "money-negative";
  document.querySelector("#dailyDetail").textContent =
    trades > 0 ? `${trades} trades | ${Math.round((wins / trades) * 100)}% win rate` : "Sin registros";
  document.querySelector("#dailyRisk").textContent = riskValues.length ? formatPercent(riskTotal) : "--";
  document.querySelector("#dailyRiskStatus").textContent = getRiskStatusText(riskTotal);
  document.querySelector("#dailyBestSetup").textContent = bestSetup ? bestSetup.asset || "--" : "--";
  document.querySelector("#dailyBestSetupDetail").textContent = bestSetup
    ? `${getChecklistScore(bestSetup)}/4 checklist | ${formatMoney(bestSetup.pnl)}`
    : "Sin capturas";
}

function renderDisciplineSummary() {
  const planCount = entries.filter((entry) => entry.planFollowed === "Si").length;
  const planRate = entries.length ? (planCount / entries.length) * 100 : 0;
  const riskValues = entries.map(getEntryRiskPercent).filter((risk) => isFiniteNumber(risk) && risk > 0);
  const riskOk = riskValues.filter((risk) => risk <= 1).length;
  const bestSession = getBestSession(entries);

  document.querySelector("#disciplinePlanRate").textContent = `${Math.round(planRate)}%`;
  document.querySelector("#disciplinePlanDetail").textContent = `${planCount} de ${entries.length} registros`;
  document.querySelector("#disciplineRiskOk").textContent = riskValues.length ? `${Math.round((riskOk / riskValues.length) * 100)}%` : "--";
  document.querySelector("#disciplineRiskDetail").textContent = riskValues.length
    ? `${riskOk} de ${riskValues.length} con riesgo <= 1%`
    : "Sin datos de riesgo";
  document.querySelector("#disciplineBestSession").textContent = bestSession.session;
  document.querySelector("#disciplineBestSessionDetail").textContent = `${formatMoney(bestSession.pnl)} P&L`;
}

function downloadExcel(data, reports) {
  const reportHeaders = [
    "Fecha importacion",
    "Tipo periodo",
    "Inicio",
    "Fin",
    "Reporte",
    "Origen",
    "P&L",
    "Trades",
    "Ganadoras",
    "Perdedoras",
    "Win rate %",
    "Gross profit",
    "Gross loss",
    "Profit factor",
    "Rendimiento %",
    "Drawdown %",
    "Drawdown $",
    "Prom. trade",
    "Prom. win",
    "Prom. loss",
    "R:R real",
  ];
  const reportRows = reports
    .slice()
    .sort((a, b) => (a.importedAt || "").localeCompare(b.importedAt || ""))
    .map((report) => [
      report.importedAt || "",
      report.periodType || "",
      report.periodStart || "",
      report.periodEnd || "",
      report.fileName || "",
      report.source || "",
      report.pnl ?? "",
      report.trades || "",
      report.wins || "",
      report.losses || "",
      report.winRate ?? "",
      report.grossProfit ?? "",
      report.grossLoss ?? "",
      report.profitFactor ?? "",
      report.returnRate ?? "",
      report.maxDrawdownPercent ?? "",
      report.maxDrawdownAmount ?? "",
      report.avgTrade ?? "",
      report.avgWin ?? "",
      report.avgLoss ?? "",
      report.realRr ?? "",
    ]);

  const journalHeaders = [
    "Fecha",
    "Sesion",
    "Activo",
    "Plan cumplido",
    "Direccion",
    "Liquidity Sweep",
    "Displacement",
    "IFVG low TF",
    "Checklist score",
    "Direccion vista",
    "Sweep visto",
    "Displacement visto",
    "IFVG visto",
    "Capturas diario",
    "Tipos capturas",
    "Lado capturas",
    "Fecha entrada capturas",
    "Hora entrada UTC-5",
    "Precio entrada",
    "Stop loss",
    "Precios parciales",
    "Precio salida",
    "Confianza analisis local",
    "Volumen capturas",
    "Entradas capturas",
    "Parciales capturas",
    "Resultados capturas",
    "Desarrollo capturas",
    "Grados capturas",
    "Notas capturas",
    "Trades",
    "Ganadoras",
    "Perdedoras",
    "Resultado $",
    "Riesgo %",
    "R:R promedio",
    "Emocion",
    "Notas",
  ];

  const journalRows = data
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => [
      entry.date,
      entry.session,
      entry.asset,
      entry.planFollowed,
      entry.planChecklist.direction ? "Si" : "No",
      entry.planChecklist.liquiditySweep ? "Si" : "No",
      entry.planChecklist.displacement ? "Si" : "No",
      entry.planChecklist.ifvgLowTf ? "Si" : "No",
      getChecklistScore(entry),
      entry.imageAnalysis.direction,
      entry.imageAnalysis.sweep,
      entry.imageAnalysis.displacement,
      entry.imageAnalysis.ifvg,
      getSetupFileLabel(entry),
      getDailyCaptureTypes(entry),
      getDailyCaptureMetricList(entry, "side"),
      getDailyCaptureMetricList(entry, "entryDate"),
      getDailyCaptureMetricList(entry, "entryTime"),
      getDailyCaptureMetricList(entry, "entryPrice"),
      getDailyCaptureMetricList(entry, "stopLoss"),
      getDailyCaptureMetricList(entry, "partialPrices"),
      getDailyCaptureMetricList(entry, "exitPrice"),
      getDailyCaptureMetricList(entry, "confidence"),
      getDailyCaptureMetricTotal(entry, "volume"),
      getDailyCaptureMetricTotal(entry, "entries"),
      getDailyCaptureMetricTotal(entry, "partials"),
      getDailyCaptureMetricList(entry, "result"),
      getDailyCaptureMetricList(entry, "trend"),
      getDailyCaptureMetricList(entry, "grade"),
      getDailyCaptureMetricList(entry, "notes"),
      entry.trades,
      entry.wins,
      entry.losses,
      entry.pnl,
      getEntryRiskPercent(entry) ?? "",
      entry.rr,
      entry.emotion,
      entry.notes,
    ]);

  const summaryRows = buildExportSummaryRows(data);
  const dailyRows = buildExportDailyRows(data);
  const summaryTable = renderExcelTable("Resumen", ["Metrica", "Valor"], summaryRows);
  const dailyTable = renderExcelTable(
    "Resumen diario",
    ["Fecha", "P&L", "Trades", "Ganadoras", "Perdedoras", "Win rate %", "Riesgo usado %"],
    dailyRows
  );
  const reportTable = renderExcelTable("Registro de reportes", reportHeaders, reportRows);
  const journalTable = renderExcelTable("Bitacora operativa", journalHeaders, journalRows);
  const workbook = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        ${summaryTable}
        <br />
        ${dailyTable}
        <br />
        ${reportTable}
        <br />
        ${journalTable}
      </body>
    </html>
  `;
  const blob = new Blob(["\ufeff", workbook], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trading-j-${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildExportSummaryRows(data) {
  const pnl = data.reduce((sum, entry) => sum + entry.pnl, 0);
  const trades = data.reduce((sum, entry) => sum + getClosedTrades(entry), 0);
  const wins = data.reduce((sum, entry) => sum + entry.wins, 0);
  const riskValues = data.map(getEntryRiskPercent).filter((risk) => isFiniteNumber(risk) && risk > 0);
  const checklist = calculateChecklistStats(data);
  const bestSession = getBestSession(data);

  return [
    ["Registros", data.length],
    ["P&L total", pnl],
    ["Trades cerrados", trades],
    ["Win rate %", trades > 0 ? (wins / trades) * 100 : 0],
    ["Riesgo promedio %", riskValues.length ? riskValues.reduce((sum, risk) => sum + risk, 0) / riskValues.length : ""],
    ["Checklist promedio", checklist.averageScore],
    ["Setups A+", checklist.aPlusCount],
    ["Mejor sesion", bestSession.session],
    ["P&L mejor sesion", bestSession.pnl],
  ];
}

function buildExportDailyRows(data) {
  const groups = data.reduce((acc, entry) => {
    const date = entry.date || "Sin fecha";
    acc[date] ||= [];
    acc[date].push(entry);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, items]) => {
      const pnl = items.reduce((sum, entry) => sum + entry.pnl, 0);
      const trades = items.reduce((sum, entry) => sum + getClosedTrades(entry), 0);
      const wins = items.reduce((sum, entry) => sum + entry.wins, 0);
      const losses = items.reduce((sum, entry) => sum + entry.losses, 0);
      const riskValues = items.map(getEntryRiskPercent).filter((risk) => isFiniteNumber(risk) && risk > 0);
      const risk = riskValues.reduce((sum, value) => sum + value, 0);

      return [date, pnl, trades, wins, losses, trades > 0 ? (wins / trades) * 100 : 0, riskValues.length ? risk : ""];
    });
}

function renderExcelTable(title, headers, rows) {
  const titleRow = `<tr><th colspan="${headers.length}">${escapeHtml(title)}</th></tr>`;
  const tableRows = [headers, ...rows]
    .map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`)
    .join("");

  return `<table>${titleRow}${tableRows}</table>`;
}

function parseCsv(text) {
  const rows = csvToRows(text);
  const [headers = [], ...body] = rows;
  const hasChecklistColumns = headers.some((header) =>
    String(header).toLowerCase().includes("liquidity")
  );
  const hasImageAnalysisColumns = headers.some((header) =>
    String(header).toLowerCase().includes("direccion vista")
  );
  const tradesIndex = headers.findIndex((header) => String(header).toLowerCase() === "trades");
  const metricsStart = tradesIndex >= 0 ? tradesIndex : hasImageAnalysisColumns ? 14 : 9;

  return body
    .filter((row) => row.some(Boolean))
    .map((row) =>
      hasChecklistColumns
        ? {
            id: createId(),
            date: row[0] || "",
            session: row[1] || "",
            asset: row[2] || "",
            planFollowed: row[3] || "",
            planChecklist: {
              direction: toBoolean(row[4]),
              liquiditySweep: toBoolean(row[5]),
              displacement: toBoolean(row[6]),
              ifvgLowTf: toBoolean(row[7]),
            },
            imageAnalysis: {
              direction: hasImageAnalysisColumns ? row[9] || "" : "",
              sweep: hasImageAnalysisColumns ? row[10] || "" : "",
              displacement: hasImageAnalysisColumns ? row[11] || "" : "",
              ifvg: hasImageAnalysisColumns ? row[12] || "" : "",
            },
            chartFile: createEmptyChartFile(),
            chartImage: "",
            trades: toNumber(row[metricsStart]),
            wins: toNumber(row[metricsStart + 1]),
            losses: toNumber(row[metricsStart + 2]),
            pnl: toNumber(row[metricsStart + 3]),
            risk: toNumber(row[metricsStart + 4]),
            rr: toNumber(row[metricsStart + 5]),
            emotion: row[metricsStart + 6] || "",
            notes: row[metricsStart + 7] || "",
            updatedAt: new Date().toISOString(),
          }
        : {
            id: createId(),
            date: row[0] || "",
            session: row[1] || "",
            asset: row[2] || "",
            planFollowed: row[3] || "",
            planChecklist: createEmptyChecklist(),
            imageAnalysis: createEmptyImageAnalysis(),
            chartFile: createEmptyChartFile(),
            chartImage: "",
            trades: toNumber(row[4]),
            wins: toNumber(row[5]),
            losses: toNumber(row[6]),
            pnl: toNumber(row[7]),
            risk: toNumber(row[8]),
            rr: toNumber(row[9]),
            emotion: row[10] || "",
            notes: row[11] || "",
            updatedAt: new Date().toISOString(),
          }
    );
}

function csvToRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function mergeEntries(current, imported) {
  return [...current, ...imported].filter((entry) => entry.date);
}

function normalizeEntries(items) {
  return items.map((entry) => {
    const dailyCaptures = normalizeDailyCaptures(entry);
    const captureCount = dailyCaptures.filter((capture) => capture.file.data).length;
    const consolidatedTrade = consolidateCaptureTrade(dailyCaptures);
    const shouldConsolidate =
      captureCount > 1 &&
      consolidatedTrade.entries === 1 &&
      toNumber(entry.trades) === captureCount;

    return {
      ...entry,
      id: entry.id || createId(),
      session: entry.session || "New York",
      planFollowed: entry.planFollowed || "Si",
      planChecklist: normalizeChecklist(entry.planChecklist),
      imageAnalysis: normalizeImageAnalysis(entry.imageAnalysis),
      dailyCaptures,
      chartFile: normalizeChartFile(entry),
      chartImage: entry.chartImage || "",
      emotion: entry.emotion || "Neutral",
      trades: shouldConsolidate ? 1 : toNumber(entry.trades),
      wins: shouldConsolidate && consolidatedTrade.result === "Positivo" ? 1 : toNumber(entry.wins),
      losses: shouldConsolidate && consolidatedTrade.result === "Positivo" ? 0 : toNumber(entry.losses),
      pnl: toNumber(entry.pnl),
      risk: toNumber(entry.risk),
      rr: toNumber(entry.rr),
    };
  });
}

function getChecklistFromForm() {
  return {
    direction: fields.checkDirection.checked,
    liquiditySweep: fields.checkLiquiditySweep.checked,
    displacement: fields.checkDisplacement.checked,
    ifvgLowTf: fields.checkIfvgLowTf.checked,
  };
}

function setChecklistForm(checklist) {
  const normalized = normalizeChecklist(checklist);
  fields.checkDirection.checked = normalized.direction;
  fields.checkLiquiditySweep.checked = normalized.liquiditySweep;
  fields.checkDisplacement.checked = normalized.displacement;
  fields.checkIfvgLowTf.checked = normalized.ifvgLowTf;
}

function createEmptyChecklist() {
  return PLAN_CHECKLIST.reduce((acc, item) => {
    acc[item.key] = false;
    return acc;
  }, {});
}

function normalizeChecklist(checklist = {}) {
  return PLAN_CHECKLIST.reduce((acc, item) => {
    acc[item.key] = Boolean(checklist[item.key]);
    return acc;
  }, {});
}

function getChecklistScore(entry) {
  const checklist = normalizeChecklist(entry.planChecklist);
  return PLAN_CHECKLIST.reduce((score, item) => score + (checklist[item.key] ? 1 : 0), 0);
}

function renderChecklistScore(entry) {
  const score = getChecklistScore(entry);
  const status = score === PLAN_CHECKLIST.length ? "complete" : score > 0 ? "partial" : "missing";
  return `<span class="checklist-pill ${status}">${score}/${PLAN_CHECKLIST.length}</span>`;
}

function calculateChecklistStats(items) {
  if (!items.length) {
    return { completionRate: 0, averageScore: 0, aPlusCount: 0, aPlusPnl: 0 };
  }

  const totalScore = items.reduce((sum, entry) => sum + getChecklistScore(entry), 0);
  const aPlusEntries = items.filter(
    (entry) => getChecklistScore(entry) === PLAN_CHECKLIST.length && entry.planFollowed === "Si"
  );

  return {
    completionRate: (totalScore / (items.length * PLAN_CHECKLIST.length)) * 100,
    averageScore: totalScore / items.length,
    aPlusCount: aPlusEntries.length,
    aPlusPnl: aPlusEntries.reduce((sum, entry) => sum + entry.pnl, 0),
  };
}

function applyImportedReport(totals) {
  if (!importedReport) {
    return {
      ...totals,
      grossProfit: undefined,
      grossLoss: undefined,
      profitFactor: undefined,
      winRate: undefined,
      returnRate: undefined,
      maxDrawdownPercent: undefined,
      maxDrawdownAmount: undefined,
    };
  }

  const trades = validTradeCount(importedReport.trades) ? importedReport.trades : totals.trades;
  const wins = importedReport.wins || totals.wins;
  const losses = importedReport.losses || totals.losses;
  const pnl = isFiniteNumber(importedReport.pnl) ? importedReport.pnl : totals.pnl;

  return {
    ...totals,
    pnl,
    trades,
    wins,
    losses,
    grossProfit: importedReport.grossProfit,
    grossLoss: importedReport.grossLoss,
    profitFactor: importedReport.profitFactor,
    winRate: importedReport.winRate,
    returnRate: importedReport.returnRate,
    maxDrawdownPercent: importedReport.maxDrawdownPercent,
    maxDrawdownAmount: importedReport.maxDrawdownAmount,
    avgTrade: importedReport.avgTrade,
    avgWin: importedReport.avgWin,
    avgLoss: importedReport.avgLoss,
    realRr: importedReport.realRr,
  };
}

function renderImportedReportStatus() {
  clearReportButton.classList.toggle("hidden", !importedReport);

  if (!importedReport) {
    importedReportStatus.textContent =
      "Metricas calculadas desde el historial. Para PDFs dificiles usa Actualizar dashboard con IA.";
    return;
  }

  const source = importedReport.source === "ai" ? "Analisis IA aplicado" : "PDF directo importado";
  importedReportStatus.textContent =
    `${source}: ${importedReport.fileName} (${importedReport.detectedFields} metricas detectadas).`;
}

async function parseReportPdf(file) {
  if (!isPdfFile(file)) {
    throw new Error("Sube un reporte en formato PDF.");
  }

  const text = await extractPdfText(await file.arrayBuffer());
  const report = parseTradingReportText(text, file.name);

  if (report.detectedFields < 2) {
    throw new Error("Ese PDF no tiene suficiente texto de metricas para actualizar el dashboard.");
  }

  return attachReportPeriod(sanitizeImportedReport(report));
}

function parseAiReportInput(value) {
  const text = value.trim();
  if (!text) {
    throw new Error("Pega primero el analisis del reporte.");
  }

  const jsonReport = parseReportJson(text);
  const report = jsonReport || parseTradingReportText(text, "Analisis IA");
  const sanitized = sanitizeImportedReport(report);

  if (!sanitized || sanitized.detectedFields < 1) {
    throw new Error("No encontre metricas validas en ese texto.");
  }

  return {
    ...sanitized,
    source: "ai",
    fileName: sanitized.fileName || "Analisis IA",
  };
}

function attachReportPeriod(report) {
  return {
    ...report,
    periodType: reportPeriodType.value,
    periodStart: reportStartDate.value,
    periodEnd: reportEndDate.value,
  };
}

function setDefaultReportPeriod() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  reportPeriodType.value = "Semanal";
  reportStartDate.value = formatDateInput(monday);
  reportEndDate.value = formatDateInput(today);
}

function formatReportPeriod(report) {
  const type = report.periodType || "Reporte";
  const start = report.periodStart || "";
  const end = report.periodEnd || "";

  if (start && end) return `${type}: ${start} a ${end}`;
  if (start) return `${type}: desde ${start}`;
  if (end) return `${type}: hasta ${end}`;
  return type;
}

function getReportSortKey(report) {
  return report.periodEnd || report.periodStart || report.importedAt || "";
}

function parseReportJson(text) {
  const jsonText = extractJsonObject(text);
  if (!jsonText) return null;

  try {
    const data = JSON.parse(jsonText);
    const trades = validTradeCount(Math.round(toOptionalNumber(data.trades)))
      ? Math.round(toOptionalNumber(data.trades))
      : 0;
    const wins = Math.max(0, Math.round(toOptionalNumber(data.wins)));
    const losses = Math.max(0, Math.round(toOptionalNumber(data.losses)));
    const winRate =
      isFiniteNumber(toOptionalNumber(data.winRate))
        ? toOptionalNumber(data.winRate)
        : trades > 0
          ? (wins / trades) * 100
          : undefined;
    const grossProfit = toOptionalNumber(data.grossProfit);
    const grossLoss = absNumber(toOptionalNumber(data.grossLoss));
    const pnl =
      toOptionalNumber(data.pnl) ??
      toOptionalNumber(data.netProfit) ??
      (isFiniteNumber(grossProfit) && isFiniteNumber(grossLoss) ? grossProfit - grossLoss : undefined);

    const report = {
      fileName: data.fileName || "Analisis IA",
      source: "ai",
      importedAt: new Date().toISOString(),
      pnl,
      grossProfit,
      grossLoss,
      profitFactor: finitePositiveNumber(toOptionalNumber(data.profitFactor)),
      trades,
      wins,
      losses,
      winRate,
      maxDrawdownPercent: toOptionalNumber(data.maxDrawdownPercent),
      maxDrawdownAmount: absNumber(toOptionalNumber(data.maxDrawdownAmount)),
      returnRate: toOptionalNumber(data.returnRate),
      avgTrade: toOptionalNumber(data.avgTrade),
      avgWin: toOptionalNumber(data.avgWin),
      avgLoss: absNumber(toOptionalNumber(data.avgLoss)),
      realRr: finitePositiveNumber(toOptionalNumber(data.realRr)),
    };

    report.detectedFields = [
      isFiniteNumber(report.pnl),
      validTradeCount(report.trades),
      isFiniteNumber(report.winRate),
      isFiniteNumber(report.grossProfit),
      isFiniteNumber(report.grossLoss),
      isFiniteNumber(report.profitFactor),
      isFiniteNumber(report.returnRate),
      isFiniteNumber(report.maxDrawdownPercent),
    ].filter(Boolean).length;

    return report;
  } catch {
    return null;
  }
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : null;
}

function buildAiReportPrompt() {
  return `Analiza este reporte/captura de trading y devuelve SOLO un JSON valido, sin explicaciones.
Reglas:
- No confundas numero de cuenta, balance ID o login con trades.
- Si una metrica no aparece clara, usa null.
- winRate, returnRate y maxDrawdownPercent deben ir como numero, sin el simbolo %.
- grossLoss y maxDrawdownAmount deben ir positivos.
Formato:
{
  "fileName": "Reporte",
  "pnl": null,
  "trades": null,
  "wins": null,
  "losses": null,
  "winRate": null,
  "grossProfit": null,
  "grossLoss": null,
  "profitFactor": null,
  "returnRate": null,
  "maxDrawdownPercent": null,
  "maxDrawdownAmount": null,
  "avgTrade": null,
  "avgWin": null,
  "avgLoss": null,
  "realRr": null
}`;
}

async function importReportFromSetupPdf(file) {
  if (!isPdfFile(file)) return;

  try {
    const report = await parseReportPdf(file);
    importedReport = report;
    saveImportedReport();
    render();
    imageStatus.textContent = "PDF guardado y dashboard actualizado";
  } catch {
    // Some PDFs are just chart evidence, so failing to parse metrics here is fine.
  }
}

async function extractPdfText(buffer) {
  const bytes = new Uint8Array(buffer);
  const raw = latin1FromBytes(bytes);
  const chunks = [raw];
  const streams = [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)];

  for (const match of streams) {
    const streamBytes = bytesFromLatin1(match[1]);
    const inflated = await inflatePdfStream(streamBytes);
    if (inflated) chunks.push(latin1FromBytes(inflated));
  }

  return chunks
    .flatMap((chunk) => extractPdfStrings(chunk))
    .join("\n")
    .replace(/[^\x09\x0a\x0d\x20-\x7eáéíóúÁÉÍÓÚñÑüÜ$%.,:;+\-/()]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n");
}

function extractPdfStrings(chunk) {
  const items = [];

  for (const match of chunk.matchAll(/\(([^()\r\n]{1,220})\)\s*Tj/g)) {
    items.push(decodePdfLiteral(match[1]));
  }

  for (const match of chunk.matchAll(/\[([^\]\r\n]{1,1600})\]\s*TJ/g)) {
    const line = [...match[1].matchAll(/\(([^()\r\n]{1,220})\)/g)]
      .map((item) => decodePdfLiteral(item[1]))
      .join("");
    if (line.trim()) items.push(line);
  }

  for (const match of chunk.matchAll(/<([0-9a-fA-F\s]{4,500})>\s*Tj/g)) {
    const value = decodePdfHex(match[1]);
    if (value.trim()) items.push(value);
  }

  return items;
}

async function inflatePdfStream(bytes) {
  if (!window.DecompressionStream) return null;

  for (const format of ["deflate", "deflate-raw"]) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      // Try the next deflate flavor.
    }
  }

  return null;
}

function parseTradingReportText(text, fileName) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const pnl =
    labeledNumber(cleanText, ["P&L total", "Resultado", "Beneficio neto", "Beneficio", "Total Net Profit", "Net Profit"]) ??
    sumProfitRows(lines);
  const grossProfit = labeledNumber(cleanText, ["Gross Profit", "Profit Total", "Ganancia bruta", "Ganancia total"]);
  const grossLoss = absNumber(
    labeledNumber(cleanText, ["Gross Loss", "Loss Total", "Perdida bruta", "Pérdida bruta"])
  );
  const profitFactor = finitePositiveNumber(
    labeledNumber(cleanText, ["Profit Factor", "Factor de beneficio", "Factor beneficio"])
  );
  const trades = validTradeCount(integerLabel(cleanText, ["Trades cerrados", "Total Trades", "Trades", "Operaciones"]))
    ? integerLabel(cleanText, ["Trades cerrados", "Total Trades", "Trades", "Operaciones"])
    : countTradeRows(lines);
  const winRate = percentLabel(cleanText, ["Win Rate", "Winrate", "Profit Trades", "Ganadoras"]);
  const maxDrawdownPercent = percentLabel(cleanText, [
    "Maximal Drawdown",
    "Relative Drawdown",
    "Drawdown",
  ]);
  const maxDrawdownAmount = absNumber(
    labeledNumber(cleanText, ["Maximal Drawdown", "Drawdown", "Absolute Drawdown"])
  );
  const returnRate = percentLabel(cleanText, ["Growth", "Rendimiento", "Total"]);
  const wins = winRate !== null && trades ? Math.round((trades * winRate) / 100) : 0;
  const losses = trades && wins ? Math.max(0, trades - wins) : 0;
  const avgTrade = trades && isFiniteNumber(pnl) ? pnl / trades : undefined;
  const avgWin = wins && grossProfit ? grossProfit / wins : undefined;
  const avgLoss = losses && grossLoss ? grossLoss / losses : undefined;
  const realRr = avgWin && avgLoss ? avgWin / avgLoss : undefined;

  const report = {
    fileName,
    source: "pdf",
    importedAt: new Date().toISOString(),
    pnl,
    grossProfit,
    grossLoss,
    profitFactor,
    trades,
    wins,
    losses,
    winRate,
    maxDrawdownPercent,
    maxDrawdownAmount,
    returnRate,
    avgTrade,
    avgWin,
    avgLoss,
    realRr,
  };

  report.detectedFields = [
    isFiniteNumber(pnl),
    isFiniteNumber(grossProfit),
    isFiniteNumber(grossLoss),
    isFiniteNumber(profitFactor),
    validTradeCount(trades),
    isFiniteNumber(winRate),
    isFiniteNumber(maxDrawdownPercent),
    isFiniteNumber(maxDrawdownAmount),
    isFiniteNumber(returnRate),
  ].filter(Boolean).length;

  return report;
}

function labeledNumber(text, labels) {
  for (const label of labels) {
    const escaped = escapeRegExp(label);
    const match = text.match(
      new RegExp(`(?:^|[^A-Za-z])${escaped}(?:[^A-Za-z]|$)[^\\d\\-+]{0,40}([+-]?\\d[\\d,]*(?:\\.\\d+)?)`, "i")
    );
    if (match) return parseFlexibleNumber(match[1]);
  }

  return null;
}

function percentLabel(text, labels) {
  for (const label of labels) {
    const escaped = escapeRegExp(label);
    const match = text.match(
      new RegExp(`(?:^|[^A-Za-z])${escaped}(?:[^A-Za-z]|$).{0,70}?([+-]?\\d[\\d,]*(?:\\.\\d+)?)\\s*%`, "i")
    );
    if (match) return parseFlexibleNumber(match[1]);
  }

  return null;
}

function integerLabel(text, labels) {
  const value = labeledNumber(text, labels);
  return value === null ? 0 : Math.round(value);
}

function sumProfitRows(lines) {
  const values = lines
    .filter((line) => /(xauusd|eurusd|gbpusd|nas|us30|btc|sell|buy)/i.test(line))
    .map((line) => parseFlexibleNumber(line.match(/([+-]?\d[\d,]*\.\d{2})\s*$/)?.[1]))
    .filter(isFiniteNumber);

  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function countTradeRows(lines) {
  return lines.filter((line) => /(xauusd|eurusd|gbpusd|nas|us30|btc).*\b(buy|sell)\b/i.test(line)).length;
}

function parseFlexibleNumber(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(/,/g, "");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : null;
}

function toOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const number = typeof value === "number" ? value : parseFlexibleNumber(value);
  return isFiniteNumber(number) ? number : undefined;
}

function absNumber(value) {
  return isFiniteNumber(value) ? Math.abs(value) : value;
}

function finitePositiveNumber(value) {
  return isFiniteNumber(value) && value > 0 ? value : undefined;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validTradeCount(value) {
  return Number.isInteger(value) && value > 0 && value <= 10000;
}

function sanitizeImportedReport(report) {
  if (!report) return null;

  return {
    ...report,
    id: report.id || createId(),
    importedAt: report.importedAt || new Date().toISOString(),
    fileName: report.fileName || "Reporte",
    source: report.source || "ai",
    periodType: report.periodType || "",
    periodStart: report.periodStart || "",
    periodEnd: report.periodEnd || "",
    trades: validTradeCount(report.trades) ? report.trades : 0,
    wins: validTradeCount(report.trades) ? Math.max(0, Math.round(report.wins || 0)) : 0,
    losses: validTradeCount(report.trades) ? Math.max(0, Math.round(report.losses || 0)) : 0,
    grossProfit: isFiniteNumber(report.grossProfit) ? report.grossProfit : undefined,
    grossLoss: isFiniteNumber(report.grossLoss) ? report.grossLoss : undefined,
    profitFactor: finitePositiveNumber(report.profitFactor),
    avgTrade: isFiniteNumber(report.avgTrade) ? report.avgTrade : undefined,
    avgWin: isFiniteNumber(report.avgWin) ? report.avgWin : undefined,
    avgLoss: isFiniteNumber(report.avgLoss) ? report.avgLoss : undefined,
    realRr: finitePositiveNumber(report.realRr),
  };
}

function decodePdfLiteral(value) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, char) => {
      const map = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" };
      return map[char] || char;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal) =>
      String.fromCharCode(Number.parseInt(octal, 8))
    );
}

function decodePdfHex(hex) {
  const clean = hex.replace(/\s+/g, "");
  const bytes = clean.match(/.{1,2}/g)?.map((part) => Number.parseInt(part, 16)) || [];

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let text = "";
    for (let i = 2; i < bytes.length - 1; i += 2) {
      text += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return text;
  }

  return String.fromCharCode(...bytes);
}

function latin1FromBytes(bytes) {
  let text = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    text += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return text;
}

function bytesFromLatin1(text) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getImageAnalysisFromForm() {
  return {
    direction: fields.analysisDirection.value,
    sweep: fields.analysisSweep.value,
    displacement: fields.analysisDisplacement.value,
    ifvg: fields.analysisIfvg.value,
  };
}

function setImageAnalysisForm(analysis) {
  const normalized = normalizeImageAnalysis(analysis);
  fields.analysisDirection.value = normalized.direction;
  fields.analysisSweep.value = normalized.sweep;
  fields.analysisDisplacement.value = normalized.displacement;
  fields.analysisIfvg.value = normalized.ifvg;
}

function createEmptyImageAnalysis() {
  return { direction: "", sweep: "", displacement: "", ifvg: "" };
}

function normalizeImageAnalysis(analysis = {}) {
  return {
    direction: analysis.direction || "",
    sweep: analysis.sweep || "",
    displacement: analysis.displacement || "",
    ifvg: analysis.ifvg || "",
  };
}

function applyManualImageAnalysis() {
  const analysis = getImageAnalysisFromForm();

  fields.checkDirection.checked = analysis.direction === "Alcista" || analysis.direction === "Bajista";
  fields.checkLiquiditySweep.checked = Boolean(analysis.sweep);
  fields.checkDisplacement.checked =
    analysis.displacement === "Fuerte" || analysis.displacement === "Medio";
  fields.checkIfvgLowTf.checked = analysis.ifvg === "Confirmado";
  applyDailyCaptureMetricsToEntry();
}

function setupCaptureMetricFields() {
  dailyCapturesWrap.querySelectorAll("[data-capture-slot]").forEach((card) => {
    const metrics = card.querySelector(".capture-metrics");
    if (!metrics) return;

    metrics.innerHTML = `
      <label>
        Lado
        <select class="capture-input" data-capture-field="side">
          <option value="">No claro</option>
          <option value="Compra">Compra</option>
          <option value="Venta">Venta</option>
        </select>
      </label>
      <label>
        Fecha grafico
        <input class="capture-input" data-capture-field="entryDate" type="date" />
      </label>
      <label>
        Hora entrada UTC-5
        <input class="capture-input" data-capture-field="entryTime" type="text" placeholder="16:32" />
      </label>
      <label>
        Precio entrada
        <input class="capture-input" data-capture-field="entryPrice" type="number" step="0.01" placeholder="0.00" />
      </label>
      <label>
        Stop loss
        <input class="capture-input" data-capture-field="stopLoss" type="number" step="0.01" placeholder="0.00" />
      </label>
      <label>
        Parciales tomados
        <input class="capture-input" data-capture-field="partialPrices" type="text" placeholder="4696.20, 4694.10" />
      </label>
      <label>
        Precio salida
        <input class="capture-input" data-capture-field="exitPrice" type="number" step="0.01" placeholder="0.00" />
      </label>
      <label>
        Entradas
        <input class="capture-input" data-capture-field="entries" type="number" min="0" step="1" value="0" />
      </label>
      <label>
        Parciales
        <input class="capture-input" data-capture-field="partials" type="number" min="0" step="1" value="0" />
      </label>
      <label>
        Resultado
        <select class="capture-input" data-capture-field="result">
          <option value="">No claro</option>
          <option value="Positivo">Positivo</option>
          <option value="Negativo">Negativo</option>
          <option value="Break even">Break even</option>
        </select>
      </label>
      <label>
        Confianza local
        <input class="capture-input" data-capture-field="confidence" type="number" min="0" max="100" step="1" readonly />
      </label>
    `;
  });
}

function createEmptyDailyCaptures() {
  return DAILY_CAPTURE_SLOTS.map((_, index) => createEmptyDailyCapture(index));
}

function createEmptyDailyCapture(slotIndex) {
  const slot = DAILY_CAPTURE_SLOTS[slotIndex] || DAILY_CAPTURE_SLOTS[0];

  return {
    slot: slot.key,
    label: slot.label,
    file: createEmptyChartFile(),
    metrics: createEmptyCaptureMetrics(),
  };
}

function createEmptyCaptureMetrics() {
  return {
    volume: 0,
    entries: 0,
    partials: 0,
    side: "",
    entryDate: "",
    entryTime: "",
    entryPrice: "",
    stopLoss: "",
    partialPrices: "",
    exitPrice: "",
    confidence: 0,
    asset: "",
    result: "",
    trend: "",
    grade: "",
    notes: "",
  };
}

function normalizeDailyCaptures(entry = {}) {
  const source = Array.isArray(entry) ? entry : entry.dailyCaptures;
  const captures = DAILY_CAPTURE_SLOTS.map((_, index) =>
    normalizeDailyCapture(Array.isArray(source) ? source[index] : null, index)
  );

  if (!Array.isArray(source) && !captures.some((capture) => capture.file.data)) {
    const legacyFile = normalizeLegacyChartFile(entry);
    if (legacyFile.data) {
      captures[0].file = legacyFile;
    }
  }

  return captures;
}

function normalizeDailyCapture(capture = {}, slotIndex = 0) {
  const empty = createEmptyDailyCapture(slotIndex);
  const file = capture?.file || capture?.chartFile || createEmptyChartFile();

  return {
    slot: capture?.slot || empty.slot,
    label: capture?.label || empty.label,
    file: file && file.data
      ? {
          data: file.data || "",
          type: file.type || "",
          name: file.name || "",
        }
      : createEmptyChartFile(),
    metrics: normalizeCaptureMetrics(capture?.metrics || capture),
  };
}

function normalizeCaptureMetrics(metrics = {}) {
  return {
    volume: toNumber(metrics.volume),
    entries: toNumber(metrics.entries),
    partials: toNumber(metrics.partials),
    side: metrics.side || "",
    entryDate: metrics.entryDate || "",
    entryTime: metrics.entryTime || "",
    entryPrice: normalizeOptionalMetric(metrics.entryPrice),
    stopLoss: normalizeOptionalMetric(metrics.stopLoss),
    partialPrices: metrics.partialPrices || "",
    exitPrice: normalizeOptionalMetric(metrics.exitPrice),
    confidence: toNumber(metrics.confidence),
    asset: metrics.asset || "",
    result: metrics.result || "",
    trend: metrics.trend || "",
    grade: metrics.grade || "",
    notes: metrics.notes || "",
  };
}

function normalizeOptionalMetric(value) {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = normalizeTradingPrice(value);
  return Number.isFinite(numeric) ? numeric : "";
}

function getDailyCapturesFromForm() {
  syncDailyCapturesFromForm();
  return normalizeDailyCaptures(currentDailyCaptures);
}

function syncDailyCapturesFromForm() {
  currentDailyCaptures = normalizeDailyCaptures(currentDailyCaptures);

  dailyCapturesWrap.querySelectorAll("[data-capture-slot]").forEach((card) => {
    const slotIndex = Number(card.dataset.captureSlot);
    const capture = currentDailyCaptures[slotIndex] || createEmptyDailyCapture(slotIndex);

    card.querySelectorAll("[data-capture-field]").forEach((input) => {
      const field = input.dataset.captureField;
      capture.metrics[field] = input.type === "number" ? normalizeMetricInputValue(field, input.value) : input.value;
    });

    currentDailyCaptures[slotIndex] = normalizeDailyCapture(capture, slotIndex);
  });

  updatePrimaryChartFile();
}

function normalizeMetricInputValue(field, value) {
  if (field === "entryPrice" || field === "stopLoss" || field === "exitPrice") {
    return value === "" ? "" : toNumber(value);
  }

  return toNumber(value);
}

function setDailyCapturesForm(captures) {
  currentDailyCaptures = normalizeDailyCaptures(captures);
  renderDailyCaptures();
}

function renderDailyCaptures() {
  currentDailyCaptures = normalizeDailyCaptures(currentDailyCaptures);

  dailyCapturesWrap.querySelectorAll("[data-capture-slot]").forEach((card) => {
    const slotIndex = Number(card.dataset.captureSlot);
    const capture = currentDailyCaptures[slotIndex] || createEmptyDailyCapture(slotIndex);
    const file = capture.file || createEmptyChartFile();
    const hasFile = Boolean(file.data);
    const isPdf = file.type === "application/pdf";

    card.querySelector("[data-capture-name]").textContent = hasFile ? file.name || "Archivo guardado" : "Sin archivo";
    card.querySelector("[data-capture-remove]").classList.toggle("hidden", !hasFile);

    const previewWrap = card.querySelector("[data-capture-preview-wrap]");
    const image = card.querySelector("[data-capture-preview]");
    const pdf = card.querySelector("[data-capture-pdf]");

    image.src = hasFile && !isPdf ? file.data : "";
    pdf.src = hasFile && isPdf ? file.data : "";
    image.classList.toggle("hidden", !hasFile || isPdf);
    pdf.classList.toggle("hidden", !hasFile || !isPdf);
    previewWrap.classList.toggle("hidden", !hasFile);

    card.querySelectorAll("[data-capture-field]").forEach((input) => {
      const field = input.dataset.captureField;
      input.value = capture.metrics[field] ?? "";
    });
  });

  updatePrimaryChartFile();
  updateDailyCaptureStatus();
}

async function setDailyCaptureFromFile(slotIndex, file) {
  const setupFile = await prepareSetupFile(file);
  const capture = normalizeDailyCapture(currentDailyCaptures[slotIndex], slotIndex);
  const inferred = inferCaptureMetricsFromFile(file.name, slotIndex);

  capture.file = setupFile;
  capture.metrics = mergeDetectedCaptureMetrics(capture.metrics, inferred);
  currentDailyCaptures[slotIndex] = normalizeDailyCapture(capture, slotIndex);
}

function mergeDetectedCaptureMetrics(current, ...sources) {
  const next = normalizeCaptureMetrics(current);

  sources.forEach((source) => {
    Object.entries(source || {}).forEach(([key, value]) => {
      const currentValue = next[key];
      const hasValue = value !== "" && value !== 0 && value !== null && value !== undefined;
      const canFill = currentValue === "" || currentValue === 0 || currentValue === null || currentValue === undefined;

      if (hasValue && canFill) {
        next[key] = key === "entryPrice" || key === "stopLoss" || key === "exitPrice" ? normalizeTradingPrice(value) || "" : value;
      }
    });
  });

  return normalizeCaptureMetrics(next);
}

function inferCaptureMetricsFromFile(fileName, slotIndex) {
  const name = fileName.toLowerCase();
  const inferred = createEmptyCaptureMetrics();

  inferred.entries = extractNumberFromName(name, ["entrada", "entradas", "entry", "entries"]);
  inferred.partials = extractNumberFromName(name, ["parcial", "parciales", "partial", "partials"]);
  inferred.volume = extractNumberFromName(name, ["vol", "volume", "volumen"]);

  if (name.includes("positivo") || name.includes("positive") || name.includes("win")) {
    inferred.result = "Positivo";
  }

  if (name.includes("negativo") || name.includes("negative") || name.includes("loss")) {
    inferred.result = "Negativo";
  }

  if (name.includes("be") || name.includes("break")) {
    inferred.result = "Break even";
  }

  if (name.includes("reversal")) inferred.trend = "Reversal";
  if (name.includes("retroceso") || name.includes("pullback")) inferred.trend = "Retroceso";
  if (name.includes("consolidacion") || name.includes("range")) inferred.trend = "Consolidacion";
  if (name.includes("impulso") || name.includes("trend")) inferred.trend = "Impulso limpio";

  if (slotIndex === 2 && !inferred.trend) {
    inferred.trend = "Impulso limpio";
  }

  ["A+", "A", "B", "C"].forEach((grade) => {
    if (name.includes(`grado-${grade.toLowerCase()}`) || name.includes(`grade-${grade.toLowerCase()}`)) {
      inferred.grade = grade;
    }
  });

  return inferred;
}

function extractNumberFromName(name, tokens) {
  for (const token of tokens) {
    const pattern = new RegExp(`${token}[-_ ]*(\\d+)`, "i");
    const match = name.match(pattern);
    if (match) return toNumber(match[1]);
  }

  return 0;
}

function buildCaptureChatGptPrompt() {
  return `Analiza estas capturas de trading como un SOLO trade documentado en 3 momentos.
Devuelve SOLO JSON valido, sin markdown y sin explicaciones.

Capital configurado en la app: ${startingBalance > 0 ? startingBalance : "no definido"}.

Reglas:
- Usa horario Panama / New York UTC-5.
- Lee el activo, fecha visible, hora de entrada, lado, precio de entrada, parciales tomados y salida si se ve.
- Lee el stop loss si aparece. Si no aparece, usa null.
- Lee tambien el lotaje/volumen de la orden si aparece, por ejemplo BUY 0.02 o SELL 0.02.
- No inventes datos: si algo no se ve claro usa "" o null.
- Si las 3 imagenes son del mismo trade, totals.trades debe ser 1.
- partialPrices debe ser una lista de precios unicos, no repitas el mismo parcial.
- Calcula pnl en dolares si hay entrada, salida y lotaje. Para XAUUSD usa 1.00 lote = 100 oz, entonces pnl = diferencia de precio * lote * 100. En compra usa salida - entrada; en venta usa entrada - salida.
- Calcula riskAmount en dolares si hay entrada, stop loss y lotaje. Para XAUUSD usa 1.00 lote = 100 oz, entonces riskAmount = diferencia absoluta entre entrada y stop * lote * 100.
- Calcula riskPercent usando el capital configurado si aparece arriba; si no hay capital, usa null.
- Calcula rr como P&L absoluto dividido entre riskAmount si ambos existen; si no, usa null.
- Si hay parciales pero no tamanos de cierre, estima pnl con exitPrice o el ultimo parcial visible y explicalo en notes.
- Si no hay datos suficientes para pnl, usa 0.
- confidence es 0 a 100 segun claridad.

Formato exacto:
{
  "date": "YYYY-MM-DD",
  "session": "New York",
  "asset": "XAUUSD",
  "direction": "Alcista|Bajista|Rango|",
  "sweep": "Altos|Bajos|Ambos|",
  "displacement": "Fuerte|Medio|Debil|",
  "ifvg": "Confirmado|Pendiente|No valido|",
  "trade": {
    "side": "Compra|Venta|",
    "entryTime": "HH:MM",
    "entryTimezone": "UTC-5",
    "volume": null,
    "entryPrice": null,
    "stopLoss": null,
    "partialPrices": [],
    "exitPrice": null,
    "result": "Positivo|Negativo|Break even|",
    "pnl": 0,
    "riskAmount": null,
    "riskPercent": null,
    "rr": null,
    "notes": ""
  },
  "totals": {
    "trades": 1,
    "wins": 0,
    "losses": 0,
    "partials": 0
  },
  "captures": [
    {
      "index": 0,
      "label": "Captura 1",
      "entries": 0,
      "partials": 0,
      "result": "Positivo|Negativo|Break even|",
      "trend": "Impulso limpio|Retroceso|Consolidacion|Reversal|",
      "grade": "A+|A|B|C|",
      "notes": ""
    }
  ]
}`;
}

function parseCaptureChatGptInput(text) {
  const jsonText = extractJsonObject(text.trim());
  if (!jsonText) throw new Error("Pega el JSON que devolvio ChatGPT.");

  try {
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== "object") throw new Error();
    return data.analysis || data.result || data;
  } catch {
    throw new Error("Ese texto no es JSON valido.");
  }
}

function applyCaptureChatGptAnalysis(data) {
  currentDailyCaptures = getDailyCapturesFromForm();

  if (data.date) fields.date.value = normalizeDateValue(data.date) || fields.date.value;
  if (data.session) fields.session.value = validSelectValue(fields.session, data.session) || fields.session.value;
  if (data.asset) fields.asset.value = data.asset;

  fields.analysisDirection.value = validSelectValue(fields.analysisDirection, data.direction);
  fields.analysisSweep.value = validSelectValue(fields.analysisSweep, data.sweep);
  fields.analysisDisplacement.value = validSelectValue(fields.analysisDisplacement, data.displacement);
  fields.analysisIfvg.value = validSelectValue(fields.analysisIfvg, data.ifvg);

  const trade = normalizePastedTrade(
    {
      ...(data.trade || {}),
      riskAmount: data.trade?.riskAmount ?? data.riskAmount ?? data.riskUsd ?? data.riesgoUsd,
      riskPercent: data.trade?.riskPercent ?? data.riskPercent ?? data.riskPct ?? data.riesgoPercent ?? data.riesgoPct,
      rr: data.trade?.rr ?? data.rr ?? data.riskReward ?? data.rMultiple,
    },
    data.asset || fields.asset.value
  );
  const totals = data.totals || {};
  const primaryIndex = getPrimaryCaptureIndex();

  if (currentDailyCaptures[primaryIndex]) {
    currentDailyCaptures[primaryIndex].metrics = normalizeCaptureMetrics({
      ...currentDailyCaptures[primaryIndex].metrics,
        entries: toNumber(totals.trades) || 1,
        partials: toNumber(totals.partials) || trade.partialPrices.length,
        volume: trade.volume,
        side: trade.side,
        entryDate: data.date || fields.date.value,
        entryTime: trade.entryTime,
        entryPrice: trade.entryPrice,
        stopLoss: trade.stopLoss,
        partialPrices: trade.partialPrices.map(formatPriceValue).join(", "),
        exitPrice: trade.exitPrice,
        result: trade.result,
        notes: trade.notes,
        asset: data.asset || "",
        confidence: toNumber(data.confidence) || 100,
    });
  }

  (data.captures || []).forEach((item, fallbackIndex) => {
    const slotIndex = Number.isInteger(item.index) ? item.index : fallbackIndex;
    if (!currentDailyCaptures[slotIndex]) return;

    currentDailyCaptures[slotIndex].metrics = normalizeCaptureMetrics({
      ...currentDailyCaptures[slotIndex].metrics,
        entries: item.entries,
        partials: item.partials,
        result: validCaptureSelectValue(slotIndex, "result", item.result),
        trend: validCaptureSelectValue(slotIndex, "trend", item.trend),
        grade: validCaptureSelectValue(slotIndex, "grade", item.grade),
        notes: item.notes,
    });
  });

  fields.trades.value = toNumber(totals.trades) || 1;
  fields.wins.value = toNumber(totals.wins) || (trade.result === "Positivo" ? 1 : 0);
  fields.losses.value = toNumber(totals.losses) || (trade.result === "Negativo" ? 1 : 0);
  fields.pnl.value = toNumber(trade.pnl);
  const riskPercent = trade.riskPercent || calculateRiskPercentFromTrade(trade);
  fields.risk.value = riskPercent > 0 ? formatMetricNumber(riskPercent) : "";
  fields.rr.value = trade.rr > 0 ? formatMetricNumber(trade.rr) : "";

  const summary = buildPastedTradeSummary(data, trade);
  if (summary && !fields.notes.value.includes(summary)) {
    fields.notes.value = fields.notes.value ? `${fields.notes.value}\n${summary}` : summary;
  }

  renderDailyCaptures();
  applyManualImageAnalysis();
  updateCapturePasteStatus();
}

function normalizePastedTrade(trade) {
  const asset = arguments[1] || "";
  const partialPrices = Array.isArray(trade.partialPrices)
    ? trade.partialPrices.map(normalizeTradingPrice).filter(Boolean)
    : parsePriceList(trade.partialPrices || "");
  const entryPrice = normalizeTradingPrice(trade.entryPrice) || "";
  const stopLoss = normalizeTradingPrice(trade.stopLoss ?? trade.sl ?? trade.stop) || "";
  const exitPrice = normalizeTradingPrice(trade.exitPrice) || partialPrices[partialPrices.length - 1] || "";
  const volume = toNumber(trade.volume ?? trade.lotSize ?? trade.lots ?? trade.lotaje);
  const providedPnl = parseLooseNumber(trade.pnl ?? trade.profit ?? trade.resultUsd ?? trade.resultadoUsd);
  const providedRiskAmount = parseLooseNumber(trade.riskAmount ?? trade.riskUsd ?? trade.riesgoUsd);
  const providedRiskPercent = parseLooseNumber(trade.riskPercent ?? trade.riskPct ?? trade.riesgoPercent ?? trade.riesgoPct);
  const providedRr = parseLooseNumber(trade.rr ?? trade.riskReward ?? trade.rMultiple);
  const calculatedPnl = calculateTradePnl({
    asset,
    side: trade.side,
    entryPrice,
    exitPrice,
    volume,
  });
  const calculatedRiskAmount = calculateTradeRiskAmount({
    asset,
    entryPrice,
    stopLoss,
    volume,
  });

  return {
    side: trade.side || "",
    entryTime: trade.entryTime || "",
    volume,
    entryPrice,
    stopLoss,
    partialPrices,
    exitPrice,
    result: trade.result || "",
    pnl: Number.isFinite(providedPnl) && providedPnl !== 0 ? providedPnl : calculatedPnl,
    riskAmount:
      Number.isFinite(providedRiskAmount) && providedRiskAmount > 0 ? providedRiskAmount : calculatedRiskAmount,
    riskPercent:
      Number.isFinite(providedRiskPercent) && providedRiskPercent > 0 ? providedRiskPercent : 0,
    rr:
      Number.isFinite(providedRr) && providedRr > 0
        ? providedRr
        : calculateTradeRr(Number.isFinite(providedPnl) && providedPnl !== 0 ? providedPnl : calculatedPnl,
            Number.isFinite(providedRiskAmount) && providedRiskAmount > 0 ? providedRiskAmount : calculatedRiskAmount),
    notes: trade.notes || "",
  };
}

function calculateTradePnl({ asset, side, entryPrice, exitPrice, volume }) {
  if (!entryPrice || !exitPrice || !volume) return 0;

  const normalizedSide = String(side || "").toLowerCase();
  const direction = normalizedSide.includes("venta") || normalizedSide.includes("sell") ? -1 : 1;
  const move = direction === 1 ? exitPrice - entryPrice : entryPrice - exitPrice;

  return Number((move * volume * getContractSize(asset)).toFixed(2));
}

function calculateTradeRiskAmount({ asset, entryPrice, stopLoss, volume }) {
  if (!entryPrice || !stopLoss || !volume) return 0;

  return Number((Math.abs(entryPrice - stopLoss) * volume * getContractSize(asset)).toFixed(2));
}

function calculateTradeRr(pnl, riskAmount) {
  if (!riskAmount || !pnl) return 0;
  return Number((Math.abs(pnl) / riskAmount).toFixed(2));
}

function calculateRiskPercentFromTrade(trade) {
  if (trade.riskPercent > 0) return trade.riskPercent;
  if (!startingBalance || startingBalance <= 0 || !trade.riskAmount) return null;
  return Number(((trade.riskAmount / startingBalance) * 100).toFixed(2));
}

function getCalculatedRiskPercent(captures, asset) {
  const normalizedCaptures = normalizeDailyCaptures(captures);
  const trade = consolidateCaptureTrade(normalizedCaptures);
  const riskAmount = calculateTradeRiskAmount({
    asset,
    entryPrice: trade.entryPrice,
    stopLoss: trade.stopLoss,
    volume: trade.volume,
  });

  return calculateRiskPercentFromTrade({ ...trade, asset, riskAmount });
}

function getEntryRiskPercent(entry) {
  const savedRisk = toNumber(entry.risk);
  if (savedRisk > 0) return savedRisk;
  return getCalculatedRiskPercent(normalizeDailyCaptures(entry), entry.asset);
}

function getContractSize(asset) {
  return String(asset || "").toUpperCase().includes("XAU") ? 100 : 1;
}

function normalizeDateValue(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](20\d{2})$/);
  if (slash) {
    const [, month, day, year] = slash;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return "";
}

function buildPastedTradeSummary(data, trade) {
  const parts = ["Analisis ChatGPT capturas"];
  if (data.asset) parts.push(data.asset);
  if (trade.side) parts.push(trade.side);
  if (trade.volume) parts.push(`lote ${trade.volume}`);
  if (trade.entryPrice) parts.push(`entrada ${formatPriceValue(trade.entryPrice)}`);
  if (trade.stopLoss) parts.push(`SL ${formatPriceValue(trade.stopLoss)}`);
  if (trade.entryTime) parts.push(`${trade.entryTime} UTC-5`);
  if (trade.partialPrices.length) parts.push(`parciales ${trade.partialPrices.map(formatPriceValue).join(", ")}`);
  if (trade.exitPrice) parts.push(`salida ${formatPriceValue(trade.exitPrice)}`);
  if (trade.pnl) parts.push(`P&L ${formatMoney(trade.pnl)}`);
  if (trade.riskPercent) parts.push(`riesgo ${formatMetricNumber(trade.riskPercent)}%`);
  if (trade.result) parts.push(trade.result);
  if (trade.notes) parts.push(trade.notes);
  return `${parts.join(" | ")}.`;
}

function getPrimaryCaptureIndex() {
  const index = currentDailyCaptures.findIndex((capture) => capture.file.data);
  return index >= 0 ? index : 0;
}

function validSelectValue(select, value) {
  const normalized = value || "";
  return Array.from(select.options).some((option) => option.value === normalized) ? normalized : "";
}

function validCaptureSelectValue(slotIndex, field, value) {
  const input = dailyCapturesWrap.querySelector(
    `[data-capture-slot="${slotIndex}"] [data-capture-field="${field}"]`
  );
  if (!input || input.tagName !== "SELECT") return value || "";
  return validSelectValue(input, value);
}

function updateCapturePasteStatus() {
  const count = normalizeDailyCaptures(currentDailyCaptures).filter((capture) => capture.file.data).length;
  captureAiStatus.textContent = count
    ? `${count}/3 capturas cargadas. Copia el prompt, subelas a ChatGPT y pega aqui el JSON.`
    : "Primero sube las capturas aqui para guardarlas con el registro. Luego copia el prompt y usalo en ChatGPT junto con esas imagenes.";
}

async function analyzeSetupCaptureLocally(file, slotIndex) {
  const image = await loadImageElement(file.data);
  const canvas = document.createElement("canvas");
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true }) || canvas.getContext("2d");
  if (!context) throw new Error("Este navegador no permite analizar la imagen en canvas.");
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const chart = detectChartBounds(imageData, width, height);
  const markers = detectTradeMarkers(imageData, width, height, chart);
  const texts = await detectTextLocally(canvas);
  const priceAxis = normalizeAxisLabels([
    ...extractPriceAxis(texts, chart),
    ...extractPriceAxisFromPixels(imageData, width, height, chart),
  ]);
  const calibratedPriceAxis = calibratePriceAxis(priceAxis);
  const timeAxis = extractTimeAxis(texts, chart, file.name);
  const textSide = detectTradeSideFromText(texts);
  const side = textSide || inferTradeSide(markers);
  const entryMarker = pickEntryMarker(markers, side);
  const partialMarkers = pickPartialMarkers(markers, side, entryMarker);
  const entryPrice = priceAtY(entryMarker?.y, calibratedPriceAxis);
  const partialPrices = partialMarkers.map((marker) => priceAtY(marker.y, calibratedPriceAxis)).filter((value) => value !== "");
  const normalizedEntryPrice = normalizeTradingPrice(entryPrice) || "";
  const normalizedPartialPrices = partialPrices.map(normalizeTradingPrice).filter(Boolean);
  const exitPrice = normalizedPartialPrices.length ? normalizedPartialPrices[normalizedPartialPrices.length - 1] : "";
  const entryMoment = timeAtX(entryMarker?.x, timeAxis);
  const volume = extractTradeVolume(texts);
  const asset = extractCaptureAsset(texts);
  const confidence = calculateLocalConfidence({ markers, entryMarker, priceAxis: calibratedPriceAxis, timeAxis, texts });

  return {
    volume,
    entries: entryMarker ? 1 : 0,
    partials: partialMarkers.length,
    side,
    entryDate: entryMoment.dateIso,
    entryTime: entryMoment.time,
    entryPrice: normalizedEntryPrice,
    partialPrices: normalizedPartialPrices.map(formatPriceValue).join(", "),
    exitPrice,
    confidence,
    asset,
    result: partialMarkers.length ? "Positivo" : "",
    notes: buildLocalCaptureNotes({
      slotIndex,
      markers,
      entryPrice: normalizedEntryPrice,
      entryMoment,
      partialPrices: normalizedPartialPrices,
      side,
      confidence,
      hasTextDetector: hasLocalTextDetector(),
      hasPixelPriceAxis: calibratedPriceAxis.length >= 2,
    }),
  };
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function detectChartBounds(imageData, width, height) {
  const fallback = {
    left: 0,
    top: Math.round(height * 0.11),
    right: Math.round(width * 0.845),
    bottom: Math.round(height * 0.89),
  };
  const right = findStrongVerticalLine(imageData, width, height, Math.round(width * 0.72), Math.round(width * 0.9));
  const bottom = findStrongHorizontalLine(imageData, width, height, Math.round(height * 0.78), Math.round(height * 0.93));

  return {
    ...fallback,
    right: right || fallback.right,
    bottom: bottom || fallback.bottom,
  };
}

function findStrongVerticalLine(imageData, width, height, fromX, toX) {
  let bestX = 0;
  let bestScore = 0;

  for (let x = fromX; x <= toX; x += 1) {
    let score = 0;
    for (let y = Math.round(height * 0.12); y < Math.round(height * 0.9); y += 3) {
      const pixel = getPixel(imageData, width, x, y);
      if (isGridPixel(pixel)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestX = x;
    }
  }

  return bestScore > height * 0.08 ? bestX : 0;
}

function findStrongHorizontalLine(imageData, width, height, fromY, toY) {
  let bestY = 0;
  let bestScore = 0;

  for (let y = fromY; y <= toY; y += 1) {
    let score = 0;
    for (let x = 0; x < Math.round(width * 0.85); x += 3) {
      const pixel = getPixel(imageData, width, x, y);
      if (isGridPixel(pixel)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestY = y;
    }
  }

  return bestScore > width * 0.08 ? bestY : 0;
}

function isGridPixel(pixel) {
  const [r, g, b] = pixel;
  return Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && r >= 32 && r <= 120;
}

function detectTradeMarkers(imageData, width, height, chart) {
  const candidates = [];
  collectColorComponents(imageData, width, height, chart, "blue", candidates);
  collectColorComponents(imageData, width, height, chart, "red", candidates);
  return mergeNearbyMarkers(candidates).sort((a, b) => a.x - b.x);
}

function collectColorComponents(imageData, width, height, chart, color, output) {
  const visited = new Uint8Array(width * height);
  const isTarget = color === "blue" ? isBlueMarkerPixel : isRedMarkerPixel;
  const minY = chart.top + 50;
  const maxY = chart.bottom - 10;
  const maxX = chart.right - 4;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = chart.left + 4; x <= maxX; x += 1) {
      const index = y * width + x;
      if (visited[index] || !isTarget(getPixel(imageData, width, x, y))) continue;

      const component = floodColorComponent(imageData, width, height, x, y, visited, isTarget, chart);
      if (isTradeArrowComponent(component, imageData, width, color)) {
        output.push({
          color,
          x: Math.round((component.minX + component.maxX) / 2),
          y: Math.round((component.minY + component.maxY) / 2),
          pixels: component.pixels,
        });
      }
    }
  }
}

function floodColorComponent(imageData, width, height, startX, startY, visited, isTarget, chart) {
  const stack = [[startX, startY]];
  const component = {
    minX: startX,
    maxX: startX,
    minY: startY,
    maxY: startY,
    pixels: 0,
  };

  while (stack.length) {
    const [x, y] = stack.pop();
    const index = y * width + x;
    if (visited[index] || x < chart.left || x > chart.right || y < chart.top || y > chart.bottom) continue;
    visited[index] = 1;
    if (!isTarget(getPixel(imageData, width, x, y))) continue;

    component.pixels += 1;
    component.minX = Math.min(component.minX, x);
    component.maxX = Math.max(component.maxX, x);
    component.minY = Math.min(component.minY, y);
    component.maxY = Math.max(component.maxY, y);

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return component;
}

function isTradeArrowComponent(component, imageData, width) {
  const boxWidth = component.maxX - component.minX + 1;
  const boxHeight = component.maxY - component.minY + 1;
  const whitePixels = countBrightPixelsAround(component, imageData, width);

  return (
    component.pixels >= 10 &&
    boxWidth >= 5 &&
    boxWidth <= 32 &&
    boxHeight >= 5 &&
    boxHeight <= 32 &&
    whitePixels >= 8
  );
}

function countBrightPixelsAround(component, imageData, width) {
  let count = 0;

  for (let y = component.minY - 3; y <= component.maxY + 3; y += 1) {
    for (let x = component.minX - 3; x <= component.maxX + 3; x += 1) {
      const [r, g, b] = getPixel(imageData, width, x, y);
      if (r > 190 && g > 190 && b > 190) count += 1;
    }
  }

  return count;
}

function mergeNearbyMarkers(markers) {
  const merged = [];

  markers.forEach((marker) => {
    const match = merged.find(
      (item) => item.color === marker.color && Math.hypot(item.x - marker.x, item.y - marker.y) < 18
    );

    if (match) {
      const total = match.pixels + marker.pixels;
      match.x = Math.round((match.x * match.pixels + marker.x * marker.pixels) / total);
      match.y = Math.round((match.y * match.pixels + marker.y * marker.pixels) / total);
      match.pixels = total;
    } else {
      merged.push({ ...marker });
    }
  });

  return merged;
}

function isBlueMarkerPixel([r, g, b]) {
  return b > 135 && g > 75 && r < 120 && b - r > 70;
}

function isRedMarkerPixel([r, g, b]) {
  return r > 160 && g < 125 && b < 135 && r - b > 45;
}

function getPixel(imageData, width, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= imageData.height) return [0, 0, 0, 0];
  const index = (y * width + x) * 4;
  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
    imageData.data[index + 3],
  ];
}

function hasLocalTextDetector() {
  return "TextDetector" in window;
}

async function detectTextLocally(canvas) {
  if (!hasLocalTextDetector()) return [];

  try {
    const detector = new TextDetector();
    const results = await detector.detect(canvas);
    return results.map((item) => ({
      text: item.rawValue || item.rawText || "",
      box: item.boundingBox || { x: 0, y: 0, width: 0, height: 0 },
    }));
  } catch {
    return [];
  }
}

function extractPriceAxis(texts, chart) {
  return texts
    .map((item) => {
      const match = item.text.replace(",", ".").match(/\b(\d{3,5}\.\d{2})\b/);
      if (!match) return null;
      const center = getTextCenter(item);
      if (center.x < chart.right - 12 || center.y < chart.top || center.y > chart.bottom + 8) return null;
      return { value: Number(match[1]), y: center.y };
    })
    .filter(Boolean)
    .sort((a, b) => a.y - b.y)
    .filter((item, index, list) => index === 0 || Math.abs(item.y - list[index - 1].y) > 6);
}

function extractPriceAxisFromPixels(imageData, width, height, chart) {
  const axisLeft = Math.min(width - 1, chart.right + 6);
  const axisRight = width - 4;
  const bands = detectPriceTextBands(imageData, width, height, axisLeft, axisRight, chart);

  return bands
    .map((band) => {
      const glyphs = segmentPriceGlyphs(imageData, width, axisLeft, axisRight, band);
      const raw = glyphs.map((glyph) => recognizePriceGlyph(imageData, width, glyph)).join("");
      const value = normalizeRecognizedPrice(raw);

      return value
        ? {
            value,
            y: Math.round((band.top + band.bottom) / 2),
          }
        : null;
    })
    .filter(Boolean);
}

function detectPriceTextBands(imageData, width, height, axisLeft, axisRight, chart) {
  const rows = [];

  for (let y = chart.top + 4; y <= chart.bottom + 12 && y < height; y += 1) {
    let count = 0;

    for (let x = axisLeft; x <= axisRight; x += 1) {
      if (isPriceAxisTextPixel(getPixel(imageData, width, x, y))) count += 1;
    }

    if (count >= 4) rows.push(y);
  }

  return groupSequentialNumbers(rows)
    .map((group) => ({ top: group[0], bottom: group[group.length - 1] }))
    .filter((band) => band.bottom - band.top >= 6)
    .map((band) => ({ top: Math.max(0, band.top - 2), bottom: Math.min(height - 1, band.bottom + 2) }));
}

function segmentPriceGlyphs(imageData, width, axisLeft, axisRight, band) {
  const columns = [];

  for (let x = axisLeft; x <= axisRight; x += 1) {
    let count = 0;

    for (let y = band.top; y <= band.bottom; y += 1) {
      if (isPriceAxisTextPixel(getPixel(imageData, width, x, y))) count += 1;
    }

    if (count > 0) columns.push(x);
  }

  return groupSequentialNumbers(columns)
    .map((group) => {
      const left = group[0];
      const right = group[group.length - 1];
      return {
        left: Math.max(axisLeft, left - 1),
        right: Math.min(axisRight, right + 1),
        top: band.top,
        bottom: band.bottom,
      };
    })
    .filter((glyph) => glyph.right - glyph.left >= 1 && glyph.bottom - glyph.top >= 3);
}

function recognizePriceGlyph(imageData, width, glyph) {
  const normalized = normalizeGlyphBitmap(imageData, width, glyph);
  const templates = getPriceGlyphTemplates();
  let best = { char: "", score: -Infinity };

  templates.forEach((template) => {
    const score = compareGlyphBitmap(normalized, template.bitmap);
    if (score > best.score) {
      best = { char: template.char, score };
    }
  });

  return best.score >= 0.42 ? best.char : "";
}

function normalizeRecognizedPrice(raw) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const exact = cleaned.match(/\d{3,5}\.\d{2}/);
  if (exact) return normalizeTradingPrice(Number(exact[0]));

  const digits = cleaned.replace(/\D/g, "");
  if (digits.length >= 6 && digits.length <= 7) {
    return normalizeTradingPrice(Number(`${digits.slice(0, -2)}.${digits.slice(-2)}`));
  }

  return null;
}

function normalizeTradingPrice(value) {
  let price = parseLooseNumber(value);
  if (!Number.isFinite(price) || price <= 0) return null;

  while (price >= 10000) {
    price /= 10;
  }

  return Number(price.toFixed(2));
}

function parseLooseNumber(value) {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "")
    .replace(/[^\d.,-]/g, "")
    .trim();

  if (!cleaned) return NaN;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    return Number(cleaned.replace(/,/g, ""));
  }

  if (cleaned.includes(",") && !cleaned.includes(".")) {
    return Number(cleaned.replace(",", "."));
  }

  return Number(cleaned);
}

function calibratePriceAxis(labels) {
  const normalized = normalizeAxisLabels(
    labels
      .map((item) => ({
        ...item,
        value: normalizeTradingPrice(item.value),
      }))
      .filter((item) => item.value)
  );

  if (normalized.length < 4) return [];

  const coherent = longestCoherentPriceAxis(normalized);
  return coherent.length >= 4 ? coherent : [];
}

function longestCoherentPriceAxis(labels) {
  const chains = [];

  labels.forEach((label) => {
    let bestChain = [label];

    chains.forEach((chain) => {
      const last = chain[chain.length - 1];
      const diff = last.value - label.value;
      const yGap = label.y - last.y;

      if (diff > 0.1 && diff <= 15 && yGap > 8 && isCoherentPriceStep(chain, diff)) {
        const candidate = [...chain, label];
        if (candidate.length > bestChain.length) bestChain = candidate;
      }
    });

    chains.push(bestChain);
  });

  return chains.sort((a, b) => b.length - a.length)[0] || [];
}

function isCoherentPriceStep(chain, diff) {
  if (chain.length < 2) return true;
  const previousDiffs = [];

  for (let index = 1; index < chain.length; index += 1) {
    previousDiffs.push(chain[index - 1].value - chain[index].value);
  }

  const median = medianNumber(previousDiffs);
  return diff >= median * 0.45 && diff <= median * 1.8;
}

function medianNumber(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function normalizeAxisLabels(labels) {
  const sorted = labels
    .filter((item) => item && Number.isFinite(item.value) && Number.isFinite(item.y))
    .sort((a, b) => a.y - b.y);
  const normalized = [];

  sorted.forEach((item) => {
    const duplicate = normalized.find((existing) => Math.abs(existing.y - item.y) < 8);
    if (!duplicate) normalized.push(item);
  });

  return normalized;
}

function isPriceAxisTextPixel([r, g, b]) {
  const brightGray = r > 115 && g > 115 && b > 115 && Math.abs(r - g) < 45 && Math.abs(g - b) < 45;
  const white = r > 180 && g > 180 && b > 180;
  return brightGray || white;
}

function groupSequentialNumbers(values) {
  if (!values.length) return [];
  const groups = [[values[0]]];

  for (let index = 1; index < values.length; index += 1) {
    const current = values[index];
    const previous = values[index - 1];
    if (current - previous <= 1) {
      groups[groups.length - 1].push(current);
    } else {
      groups.push([current]);
    }
  }

  return groups;
}

function normalizeGlyphBitmap(imageData, width, glyph) {
  const targetWidth = 12;
  const targetHeight = 18;
  const bitmap = [];
  const sourceWidth = Math.max(1, glyph.right - glyph.left + 1);
  const sourceHeight = Math.max(1, glyph.bottom - glyph.top + 1);

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.round(glyph.left + (x / (targetWidth - 1)) * (sourceWidth - 1));
      const sourceY = Math.round(glyph.top + (y / (targetHeight - 1)) * (sourceHeight - 1));
      bitmap.push(isPriceAxisTextPixel(getPixel(imageData, width, sourceX, sourceY)) ? 1 : 0);
    }
  }

  return bitmap;
}

function compareGlyphBitmap(a, b) {
  let matches = 0;

  for (let index = 0; index < a.length; index += 1) {
    matches += a[index] === b[index] ? 1 : -0.35;
  }

  return matches / a.length;
}

function getPriceGlyphTemplates() {
  if (getPriceGlyphTemplates.cache) return getPriceGlyphTemplates.cache;

  const chars = "0123456789.";
  const fonts = ["18px Arial", "18px Roboto", "18px sans-serif", "17px Arial", "19px Arial"];
  const templates = [];

  chars.split("").forEach((char) => {
    fonts.forEach((font) => {
      templates.push({
        char,
        bitmap: renderGlyphTemplate(char, font),
      });
    });
  });

  getPriceGlyphTemplates.cache = templates;
  return templates;
}

function renderGlyphTemplate(char, font) {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff";
  context.font = font;
  context.textBaseline = "top";
  context.fillText(char, 4, 5);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const box = findTemplateBounds(imageData, canvas.width, canvas.height);
  return normalizeTemplateBitmap(imageData, canvas.width, box);
}

function findTemplateBounds(imageData, width, height) {
  const box = { left: width, right: 0, top: height, bottom: 0 };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = getPixel(imageData, width, x, y);
      if (r > 80 || g > 80 || b > 80) {
        box.left = Math.min(box.left, x);
        box.right = Math.max(box.right, x);
        box.top = Math.min(box.top, y);
        box.bottom = Math.max(box.bottom, y);
      }
    }
  }

  return box.left <= box.right ? box : { left: 0, right: width - 1, top: 0, bottom: height - 1 };
}

function normalizeTemplateBitmap(imageData, width, box) {
  const targetWidth = 12;
  const targetHeight = 18;
  const bitmap = [];
  const sourceWidth = Math.max(1, box.right - box.left + 1);
  const sourceHeight = Math.max(1, box.bottom - box.top + 1);

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.round(box.left + (x / (targetWidth - 1)) * (sourceWidth - 1));
      const sourceY = Math.round(box.top + (y / (targetHeight - 1)) * (sourceHeight - 1));
      const [r, g, b] = getPixel(imageData, width, sourceX, sourceY);
      bitmap.push(r > 80 || g > 80 || b > 80 ? 1 : 0);
    }
  }

  return bitmap;
}

function extractTimeAxis(texts, chart, fileName) {
  const fallbackYear = extractYearFromText(fileName) || extractYearFromText(fields.date.value) || new Date().getFullYear();

  return texts
    .flatMap((item) => parseTimeLabels(item, fallbackYear))
    .filter((item) => item.x >= chart.left && item.x <= chart.right && item.y >= chart.bottom - 42)
    .sort((a, b) => a.x - b.x);
}

function parseTimeLabels(item, fallbackYear) {
  const center = getTextCenter(item);
  const normalized = item.text.replace(/\s+/g, " ").trim();
  const labels = [];
  const dateTimePattern = /(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{1,2}:\d{2})/g;
  let match;

  while ((match = dateTimePattern.exec(normalized))) {
    const month = monthIndex(match[2]);
    if (month >= 0) {
      labels.push({
        x: center.x,
        y: center.y,
        date: new Date(Date.UTC(fallbackYear, month, Number(match[1]), ...match[3].split(":").map(Number))),
      });
    }
  }

  if (!labels.length) {
    const timeMatch = normalized.match(/(\d{1,2}:\d{2})/);
    if (timeMatch && fields.date.value) {
      const [year, month, day] = fields.date.value.split("-").map(Number);
      labels.push({
        x: center.x,
        y: center.y,
        date: new Date(Date.UTC(year, month - 1, day, ...timeMatch[1].split(":").map(Number))),
      });
    }
  }

  return labels;
}

function monthIndex(label) {
  const key = label.toLowerCase().slice(0, 3);
  return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(key);
}

function getTextCenter(item) {
  return {
    x: item.box.x + item.box.width / 2,
    y: item.box.y + item.box.height / 2,
  };
}

function detectTradeSideFromText(texts) {
  const joined = texts.map((item) => item.text).join(" ").toUpperCase();
  if (/\bBUY\b/.test(joined)) return "Compra";
  if (/\bSELL\b/.test(joined)) return "Venta";
  return "";
}

function inferTradeSide(markers) {
  if (!markers.length) return "";
  const first = markers.slice().sort((a, b) => a.x - b.x)[0];
  return first.color === "red" ? "Venta" : "Compra";
}

function pickEntryMarker(markers, side) {
  const entryColor = side === "Venta" ? "red" : "blue";
  return markers.find((marker) => marker.color === entryColor) || markers[0] || null;
}

function pickPartialMarkers(markers, side, entryMarker) {
  if (!entryMarker) return [];
  const partialColor = side === "Venta" ? "blue" : "red";
  return markers.filter((marker) => marker.color === partialColor && marker.x > entryMarker.x + 8);
}

function priceAtY(y, priceAxis) {
  if (!Number.isFinite(y) || priceAxis.length < 2) return "";
  const sorted = priceAxis.slice().sort((a, b) => a.y - b.y);
  let before = sorted[0];
  let after = sorted[sorted.length - 1];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    if (y >= sorted[index].y && y <= sorted[index + 1].y) {
      before = sorted[index];
      after = sorted[index + 1];
      break;
    }
  }

  const ratio = (y - before.y) / (after.y - before.y || 1);
  return Number((before.value + (after.value - before.value) * ratio).toFixed(2));
}

function timeAtX(x, timeAxis) {
  if (!Number.isFinite(x) || !timeAxis.length) return { dateIso: "", time: "" };
  if (timeAxis.length === 1) return formatDetectedMoment(timeAxis[0].date);

  const sorted = timeAxis.slice().sort((a, b) => a.x - b.x);
  let before = sorted[0];
  let after = sorted[sorted.length - 1];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    if (x >= sorted[index].x && x <= sorted[index + 1].x) {
      before = sorted[index];
      after = sorted[index + 1];
      break;
    }
  }

  const ratio = (x - before.x) / (after.x - before.x || 1);
  const timestamp = before.date.getTime() + (after.date.getTime() - before.date.getTime()) * ratio;
  return formatDetectedMoment(new Date(timestamp));
}

function formatDetectedMoment(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return { dateIso: "", time: "" };
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return { dateIso: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

function extractTradeVolume(texts) {
  const match = texts
    .map((item) => item.text)
    .join(" ")
    .replace(",", ".")
    .match(/\b(?:BUY|SELL)\s+(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : 0;
}

function extractCaptureAsset(texts) {
  const match = texts
    .map((item) => item.text)
    .join(" ")
    .match(/\b(XAUUSD|XAGUSD|NAS100|US30|SPX500|BTCUSD|ETHUSD|[A-Z]{6})\b/);
  return match ? match[1] : "";
}

function calculateLocalConfidence({ markers, entryMarker, priceAxis, timeAxis, texts }) {
  let confidence = 0;
  if (markers.length) confidence += 25;
  if (entryMarker) confidence += 20;
  if (priceAxis.length >= 2) confidence += 25;
  if (timeAxis.length >= 2) confidence += 20;
  if (texts.length) confidence += 10;
  return Math.min(100, confidence);
}

function buildLocalCaptureNotes({
  slotIndex,
  markers,
  entryPrice,
  entryMoment,
  partialPrices,
  side,
  confidence,
  hasTextDetector,
  hasPixelPriceAxis,
}) {
  const parts = [`Analisis local ${DAILY_CAPTURE_SLOTS[slotIndex]?.label || "captura"}: ${confidence}% confianza`];
  if (!hasTextDetector && hasPixelPriceAxis) parts.push("precios leidos por pixeles");
  if (!hasTextDetector && !hasPixelPriceAxis) parts.push("OCR local no disponible en este navegador");
  if (side) parts.push(`lado ${side}`);
  if (entryPrice) parts.push(`entrada ${formatPriceValue(entryPrice)}`);
  if (entryMoment.time) parts.push(`hora ${entryMoment.time} UTC-5`);
  if (partialPrices.length) parts.push(`parciales ${partialPrices.map(formatPriceValue).join(", ")}`);
  if (!markers.length) parts.push("sin flechas detectadas");
  return `${parts.join(" | ")}.`;
}

function formatPriceValue(value) {
  const price = normalizeTradingPrice(value);
  return Number.isFinite(price) ? price.toFixed(2) : "";
}

function extractYearFromText(value = "") {
  const match = String(value).match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : 0;
}

function applyDailyCaptureMetricsToEntry() {
  const captures = getDailyCapturesFromForm();
  const totals = getDailyCaptureTotals(captures);
  const consolidatedTrade = consolidateCaptureTrade(captures);
  const firstDetectedDate = captures.find((capture) => capture.metrics.entryDate)?.metrics.entryDate;
  const firstDetectedAsset = captures.find((capture) => capture.metrics.asset)?.metrics.asset;
  const calculatedRisk = getCalculatedRiskPercent(captures, firstDetectedAsset || fields.asset.value);

  if (consolidatedTrade.entries > 0) fields.trades.value = consolidatedTrade.entries;
  if (consolidatedTrade.result === "Positivo") {
    fields.wins.value = 1;
    fields.losses.value = 0;
  } else if (consolidatedTrade.result === "Negativo") {
    fields.wins.value = 0;
    fields.losses.value = 1;
  } else if (totals.positive + totals.negative > 0) {
    fields.wins.value = totals.positive > 0 ? 1 : 0;
    fields.losses.value = totals.negative > 0 ? 1 : 0;
  }
  if (firstDetectedDate && !fields.id.value) {
    fields.date.value = firstDetectedDate;
  }
  if (firstDetectedAsset && !fields.asset.value.trim()) {
    fields.asset.value = firstDetectedAsset;
  }
  if (calculatedRisk > 0) {
    fields.risk.value = formatMetricNumber(calculatedRisk);
  }

  const notes = captures
    .map((capture) => {
      const metricNotes = capture.metrics.notes.trim();
      const tradeLine = formatCaptureTradeLine(capture);
      const content = [tradeLine, metricNotes].filter(Boolean).join(" | ");
      return content ? `${capture.label}: ${content}` : "";
    })
    .filter(Boolean)
    .join("\n");

  if (notes && !fields.notes.value.includes(notes)) {
    fields.notes.value = fields.notes.value ? `${fields.notes.value}\n${notes}` : notes;
  }
}

function formatCaptureTradeLine(capture) {
  const metrics = normalizeCaptureMetrics(capture.metrics);
  const parts = [];
  if (metrics.side) parts.push(metrics.side);
  if (metrics.entryPrice) parts.push(`entrada ${formatPriceValue(metrics.entryPrice)}`);
  if (metrics.stopLoss) parts.push(`SL ${formatPriceValue(metrics.stopLoss)}`);
  if (metrics.entryTime) parts.push(`${metrics.entryTime} UTC-5`);
  if (metrics.partialPrices) parts.push(`parciales ${metrics.partialPrices}`);
  if (metrics.exitPrice) parts.push(`salida ${formatPriceValue(metrics.exitPrice)}`);
  return parts.join(" | ");
}

function consolidateCaptureTrade(captures) {
  const normalized = normalizeDailyCaptures(captures);
  const withTrade = normalized.filter(
    (capture) =>
      capture.metrics.entryPrice ||
      capture.metrics.stopLoss ||
      capture.metrics.entryTime ||
      capture.metrics.partialPrices
  );
  const source = withTrade[0] || normalized.find((capture) => capture.file.data) || normalized[0];
  const totalVolume = normalized.reduce((sum, capture) => sum + toNumber(capture.metrics.volume), 0);
  const partialPrices = uniquePriceList(
    normalized.flatMap((capture) => parsePriceList(capture.metrics.partialPrices))
  );
  const hasPositive = normalized.some((capture) => capture.metrics.result === "Positivo") || partialPrices.length > 0;
  const hasNegative = normalized.some((capture) => capture.metrics.result === "Negativo");
  const reliableSourcePrice = source && (toNumber(source.metrics.confidence) >= 60 || Boolean(source.metrics.entryTime));

  return {
    side: source?.metrics.side || "",
    entryTime: source?.metrics.entryTime || "",
    entryPrice: reliableSourcePrice ? source?.metrics.entryPrice || "" : "",
    stopLoss:
      reliableSourcePrice
        ? normalized.find((capture) => capture.metrics.stopLoss)?.metrics.stopLoss || ""
        : "",
    partialPrices,
    exitPrice:
      reliableSourcePrice
        ? normalized
            .slice()
            .reverse()
            .find((capture) => capture.metrics.exitPrice)?.metrics.exitPrice ||
          partialPrices[partialPrices.length - 1] ||
          ""
        : "",
    volume: toNumber(source?.metrics.volume) || totalVolume,
    entries: source && (source.file.data || withTrade.length) ? 1 : 0,
    partials: partialPrices.length,
    result: hasPositive ? "Positivo" : hasNegative ? "Negativo" : "",
  };
}

function parsePriceList(value = "") {
  return String(value)
    .split(",")
    .map((item) => normalizeTradingPrice(item.trim()))
    .filter(Boolean);
}

function uniquePriceList(values) {
  const unique = [];

  values.forEach((value) => {
    if (!unique.some((item) => Math.abs(item - value) < 0.2)) {
      unique.push(value);
    }
  });

  return unique;
}

function getDailyCaptureTotals(captures) {
  return captures.reduce(
    (totals, capture) => {
      totals.volume += toNumber(capture.metrics.volume);
      totals.entries += toNumber(capture.metrics.entries);
      totals.partials += toNumber(capture.metrics.partials) || countPartialPrices(capture.metrics.partialPrices);
      totals.positive += capture.metrics.result === "Positivo" ? 1 : 0;
      totals.negative += capture.metrics.result === "Negativo" ? 1 : 0;
      return totals;
    },
    { volume: 0, entries: 0, partials: 0, positive: 0, negative: 0 }
  );
}

function countPartialPrices(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function getPrimaryCaptureFile(captures = currentDailyCaptures) {
  const normalized = normalizeDailyCaptures(captures);
  const capture = normalized.find((item) => item.file && item.file.data);
  return capture ? capture.file : createEmptyChartFile();
}

function updatePrimaryChartFile() {
  currentChartFile = getPrimaryCaptureFile(currentDailyCaptures);
}

function updateDailyCaptureStatus() {
  const captures = normalizeDailyCaptures(currentDailyCaptures);
  const count = captures.filter((capture) => capture.file.data).length;

  removeImageButton.classList.toggle("hidden", count === 0);
  imageStatus.textContent = count
    ? `${count}/3 capturas guardadas. Pega el JSON de ChatGPT para llenar el registro.`
    : "Sube hasta 3 capturas del dia. El analisis viene del JSON de ChatGPT.";
}

function getDailyCaptureTypes(entry) {
  return normalizeDailyCaptures(entry)
    .filter((capture) => capture.file.data)
    .map((capture) => (capture.file.type === "application/pdf" ? "PDF" : "Img"))
    .join(", ");
}

function getDailyCaptureMetricTotal(entry, field) {
  return normalizeDailyCaptures(entry).reduce((sum, capture) => sum + toNumber(capture.metrics[field]), 0);
}

function getDailyCaptureMetricList(entry, field) {
  return normalizeDailyCaptures(entry)
    .map((capture) => capture.metrics[field])
    .filter(Boolean)
    .join(" | ");
}

function createEmptyChartFile() {
  return { data: "", type: "", name: "" };
}

function normalizeChartFile(entry = {}) {
  if (Array.isArray(entry.dailyCaptures)) {
    return getPrimaryCaptureFile(entry.dailyCaptures);
  }

  return normalizeLegacyChartFile(entry);
}

function normalizeLegacyChartFile(entry = {}) {
  if (entry.chartFile && entry.chartFile.data) {
    return {
      data: entry.chartFile.data || "",
      type: entry.chartFile.type || "",
      name: entry.chartFile.name || "",
    };
  }

  if (entry.chartImage) {
    return {
      data: entry.chartImage,
      type: "image/jpeg",
      name: "captura.jpg",
    };
  }

  return createEmptyChartFile();
}

function hasSetupFile(entry) {
  return normalizeDailyCaptures(entry).some((capture) => capture.file.data) || Boolean(normalizeChartFile(entry).data);
}

function getSetupFileLabel(entry) {
  const captures = normalizeDailyCaptures(entry).filter((capture) => capture.file.data);
  if (!captures.length) return "No";
  if (captures.length === 1) return captures[0].file.type === "application/pdf" ? "1 PDF" : "1 Img";
  return `${captures.length} capturas`;
}

function setChartFile(file) {
  currentChartFile = file && file.data ? file : createEmptyChartFile();
  const isPdf = currentChartFile.type === "application/pdf";
  const hasFile = Boolean(currentChartFile.data);

  if (imagePreview && pdfPreview && imagePreviewWrap) {
    imagePreview.src = !isPdf ? currentChartFile.data : "";
    pdfPreview.src = isPdf ? currentChartFile.data : "";
    imagePreview.classList.toggle("hidden", !hasFile || isPdf);
    pdfPreview.classList.toggle("hidden", !hasFile || !isPdf);
    imagePreviewWrap.classList.toggle("hidden", !hasFile);
  }

  removeImageButton.classList.toggle("hidden", !hasFile);
  imageStatus.textContent = hasFile
    ? `${isPdf ? "PDF" : "Captura"} guardado con este registro`
    : "Sin archivo cargado";
}

async function prepareSetupFile(file) {
  const isPdf = isPdfFile(file);

  if (isPdf) {
    if (file.size > MAX_PDF_BYTES) {
      throw new Error("PDF demasiado grande");
    }

    return {
      data: await readFileAsDataUrl(file),
      type: "application/pdf",
      name: file.name,
    };
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Tipo no soportado");
  }

  return {
    data: await compressImage(file),
    type: "image/jpeg",
    name: file.name,
  };
}

function isPdfFile(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxWidth = 1100;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    alert("No hay espacio suficiente para guardar todas las capturas. Quita alguna imagen e intenta de nuevo.");
  }
}

function loadImportedReport() {
  try {
    const stored = JSON.parse(localStorage.getItem(REPORT_KEY));
    return stored && typeof stored === "object" ? stored : null;
  } catch {
    return null;
  }
}

function saveImportedReport(options = {}) {
  const { addToHistory = true } = options;

  if (importedReport) {
    importedReport = sanitizeImportedReport(importedReport);
    localStorage.setItem(REPORT_KEY, JSON.stringify(importedReport));
    if (addToHistory) {
      upsertReportHistory(importedReport);
    }
  } else {
    localStorage.removeItem(REPORT_KEY);
  }
}

function loadReportHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY)) || [];
    return Array.isArray(stored)
      ? stored.map(sanitizeImportedReport).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function saveReportHistory() {
  localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(reportHistory));
}

function upsertReportHistory(report) {
  const normalized = sanitizeImportedReport(report);
  if (!normalized) return;

  const existingIndex = reportHistory.findIndex((item) => item.id === normalized.id);
  if (existingIndex >= 0) {
    reportHistory[existingIndex] = normalized;
  } else {
    reportHistory.push(normalized);
  }

  saveReportHistory();
}

function loadStartingBalance() {
  return toNumber(localStorage.getItem(CAPITAL_KEY));
}

function loadCompactMode() {
  return localStorage.getItem(COMPACT_KEY) === "true";
}

function setCompactMode(enabled) {
  document.body.classList.toggle("compact", enabled);
  compactModeButton.setAttribute("aria-pressed", String(enabled));
  compactModeButton.textContent = enabled ? "Normal" : "Compacto";
  localStorage.setItem(COMPACT_KEY, String(enabled));
}

function saveStartingBalance() {
  if (startingBalance > 0) {
    localStorage.setItem(CAPITAL_KEY, String(startingBalance));
  } else {
    localStorage.removeItem(CAPITAL_KEY);
  }
}

function getClosedTrades(entry) {
  const closed = toNumber(entry.wins) + toNumber(entry.losses);
  return closed > 0 ? closed : toNumber(entry.trades);
}

function calculateMaxDrawdown(items) {
  let equity = 0;
  let peak = 0;
  let maxAmount = 0;
  let maxBase = startingBalance || 1;

  items
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((entry) => {
      equity += entry.pnl;
      peak = Math.max(peak, equity);
      const amount = peak - equity;
      const base = Math.max(startingBalance + peak, startingBalance, 1);

      if (amount > maxAmount) {
        maxAmount = amount;
        maxBase = base;
      }
    });

  return { amount: maxAmount, base: maxBase };
}

function getLatestEntryDate(items) {
  return items
    .map((entry) => entry.date)
    .filter(Boolean)
    .sort()
    .pop() || "";
}

function getRiskStatusText(risk) {
  if (!isFiniteNumber(risk) || risk <= 0) return "Sin dato";
  if (risk <= 1) return "Riesgo OK";
  if (risk <= 2) return "Riesgo alto";
  return "Riesgo muy alto";
}

function getBestSession(items) {
  const sessions = items.reduce((acc, entry) => {
    const key = entry.session || "Sin sesion";
    acc[key] = (acc[key] || 0) + entry.pnl;
    return acc;
  }, {});
  const [session = "--", pnl = 0] =
    Object.entries(sessions).sort((a, b) => b[1] - a[1])[0] || [];

  return { session, pnl };
}

function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function toNumber(value) {
  return parseLooseNumber(value) || 0;
}

function toBoolean(value) {
  return ["si", "true", "1", "yes", "x"].includes(String(value).trim().toLowerCase());
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatPercent(value) {
  if (!isFiniteNumber(value)) return "--";
  return `${Number(value).toFixed(2)}%`;
}

function formatMetricNumber(value) {
  const number = toNumber(value);
  return Number(number.toFixed(2));
}

function formatRatio(value) {
  if (!isFiniteNumber(value)) return "--";
  return Number(value).toFixed(2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
