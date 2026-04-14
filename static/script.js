/* ============================================================
   Banker's Algorithm — Frontend JavaScript
   Handles: matrix generation, validation, API call, rendering
   ============================================================ */

"use strict";

// ── DOM shortcuts ────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── State ────────────────────────────────────────────────────
let numP = 0, numR = 0;

// ── Classic safe example (5 processes, 3 resources) ─────────
const CLASSIC = {
  p: 5, r: 3,
  allocation: [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]],
  max:        [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]],
  available:  [3,3,2]
};

// ── Unsafe example (3 processes, 3 resources) ────────────────
const UNSAFE = {
  p: 3, r: 3,
  allocation: [[1,2,0],[2,1,1],[1,0,2]],
  max:        [[2,3,1],[3,2,2],[2,1,3]],
  available:  [0,0,0]          // no resources left → unsafe
};

// ────────────────────────────────────────────────────────────
//  EVENT LISTENERS
// ────────────────────────────────────────────────────────────

$("build-btn").addEventListener("click", buildMatrices);
$("run-btn").addEventListener("click", runBankers);
$("fill-classic").addEventListener("click", () => fillExample(CLASSIC));
$("fill-unsafe").addEventListener("click",  () => fillExample(UNSAFE));
$("clear-all").addEventListener("click", clearAll);
$("steps-toggle").addEventListener("click", toggleSteps);


// ────────────────────────────────────────────────────────────
//  BUILD MATRICES  (Step 01 → Step 02)
// ────────────────────────────────────────────────────────────
function buildMatrices() {
  numP = parseInt($("num-processes").value);
  numR = parseInt($("num-resources").value);

  if (!validateConfig(numP, numR)) return;

  buildAvailableTable(numP, numR);
  buildMatrixTable("allocation-table", numP, numR, "A");
  buildMatrixTable("max-table",        numP, numR, "M");

  $("matrix-section").classList.remove("hidden");
  $("result-section").classList.add("hidden");

  // Smooth scroll
  $("matrix-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

// Validate config inputs
function validateConfig(p, r) {
  if (isNaN(p) || p < 1 || p > 20) {
    alert("Number of processes must be between 1 and 20.");
    return false;
  }
  if (isNaN(r) || r < 1 || r > 20) {
    alert("Number of resources must be between 1 and 20.");
    return false;
  }
  return true;
}

// Build Available row (single row, R inputs)
function buildAvailableTable(p, r) {
  const wrap = $("available-table");
  const colHeaders = resourceHeaders(r);

  let html = `<div class="matrix-table-wrap"><table class="matrix-tbl">
    <thead><tr>
      ${colHeaders.map(h => `<th>${h}</th>`).join("")}
    </tr></thead>
    <tbody><tr>`;

  for (let j = 0; j < r; j++) {
    html += `<td><input type="number" id="avail-${j}" min="0" value="0" /></td>`;
  }
  html += `</tr></tbody></table></div>`;
  wrap.innerHTML = html;
}

// Build a P×R matrix table
function buildMatrixTable(containerId, p, r, prefix) {
  const wrap = $(containerId);
  const colHeaders = resourceHeaders(r);

  let html = `<div class="matrix-table-wrap"><table class="matrix-tbl">
    <thead><tr>
      <th></th>
      ${colHeaders.map(h => `<th>${h}</th>`).join("")}
    </tr></thead><tbody>`;

  for (let i = 0; i < p; i++) {
    html += `<tr><td class="row-label">P${i}</td>`;
    for (let j = 0; j < r; j++) {
      html += `<td><input type="number" id="${prefix}-${i}-${j}" min="0" value="0" /></td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;
  wrap.innerHTML = html;
}

// Generate R column header labels: R0, R1, ...
function resourceHeaders(r) {
  return Array.from({ length: r }, (_, j) => `R${j}`);
}


// ────────────────────────────────────────────────────────────
//  FILL EXAMPLES
// ────────────────────────────────────────────────────────────
function fillExample(ex) {
  // Update config inputs
  $("num-processes").value = ex.p;
  $("num-resources").value = ex.r;

  // Rebuild tables
  numP = ex.p; numR = ex.r;
  buildAvailableTable(numP, numR);
  buildMatrixTable("allocation-table", numP, numR, "A");
  buildMatrixTable("max-table",        numP, numR, "M");
  $("matrix-section").classList.remove("hidden");

  // Fill values
  for (let j = 0; j < numR; j++)
    setVal(`avail-${j}`, ex.available[j]);

  for (let i = 0; i < numP; i++)
    for (let j = 0; j < numR; j++) {
      setVal(`A-${i}-${j}`, ex.allocation[i][j]);
      setVal(`M-${i}-${j}`, ex.max[i][j]);
    }

  $("result-section").classList.add("hidden");
  $("matrix-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setVal(id, val) {
  const el = $(id);
  if (el) el.value = val;
}

function clearAll() {
  document.querySelectorAll("table.matrix-tbl input").forEach(inp => inp.value = 0);
  $("result-section").classList.add("hidden");
}


// ────────────────────────────────────────────────────────────
//  READ MATRICES FROM DOM
// ────────────────────────────────────────────────────────────
function readMatrix(prefix, p, r) {
  const mat = [];
  for (let i = 0; i < p; i++) {
    const row = [];
    for (let j = 0; j < r; j++) {
      const el = $(`${prefix}-${i}-${j}`);
      const val = parseInt(el ? el.value : "0");
      if (isNaN(val) || val < 0) return null;
      row.push(val);
    }
    mat.push(row);
  }
  return mat;
}

function readAvailable(r) {
  const avail = [];
  for (let j = 0; j < r; j++) {
    const el = $(`avail-${j}`);
    const val = parseInt(el ? el.value : "0");
    if (isNaN(val) || val < 0) return null;
    avail.push(val);
  }
  return avail;
}


// ────────────────────────────────────────────────────────────
//  VALIDATE INPUTS
// ────────────────────────────────────────────────────────────
function validateInputs(allocation, max, available, p, r) {
  for (let i = 0; i < p; i++)
    for (let j = 0; j < r; j++)
      if (allocation[i][j] > max[i][j]) {
        alert(`Validation Error: Allocation[P${i}][R${j}] (${allocation[i][j]}) exceeds Max[P${i}][R${j}] (${max[i][j]}).`);
        return false;
      }
  return true;
}


// ────────────────────────────────────────────────────────────
//  RUN BANKER'S ALGORITHM  (main entry point)
// ────────────────────────────────────────────────────────────
async function runBankers() {
  if (numP === 0 || numR === 0) {
    alert("Please build the matrices first.");
    return;
  }

  // Read data
  const allocation = readMatrix("A", numP, numR);
  const maxMat     = readMatrix("M", numP, numR);
  const available  = readAvailable(numR);

  if (!allocation || !maxMat || !available) {
    alert("Please fill all matrix cells with valid non-negative integers.");
    return;
  }

  if (!validateInputs(allocation, maxMat, available, numP, numR)) return;

  // Disable button, show loading
  const btn = $("run-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Running...`;

  try {
    // ── Call Flask backend ─────────────────────────────────
    const response = await fetch("/run-bankers", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        num_processes: numP,
        num_resources: numR,
        allocation,
        max: maxMat,
        available
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      showError(data.error || "Unknown server error.");
      return;
    }

    renderResults(data);

  } catch (err) {
    showError(
      `Could not connect to server.\n\n` +
      `Make sure Python Flask is running:\n  python app.py`
    );
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "▶ Run Banker's Algorithm";
  }
}


// ────────────────────────────────────────────────────────────
//  RENDER RESULTS
// ────────────────────────────────────────────────────────────
function renderResults(data) {
  const section = $("result-section");
  section.classList.remove("hidden");

  // ── Status Banner ──────────────────────────────────────────
  const banner = $("status-banner");
  if (data.safe) {
    banner.className = "status-banner safe";
    banner.innerHTML = `
      <span class="status-icon">✅</span>
      <div>
        <div>SAFE STATE DETECTED</div>
        <div style="font-size:11px;opacity:0.7;font-weight:400;margin-top:3px;">
          The system can satisfy all process requests. No deadlock possible.
        </div>
      </div>`;
  } else {
    banner.className = "status-banner unsafe";
    banner.innerHTML = `
      <span class="status-icon">🔴</span>
      <div>
        <div>UNSAFE STATE — DEADLOCK POSSIBLE</div>
        <div style="font-size:11px;opacity:0.7;font-weight:400;margin-top:3px;">
          No safe sequence exists. The system may enter a deadlock.
        </div>
      </div>`;
  }

  // ── Need Matrix ────────────────────────────────────────────
  renderNeedMatrix(data.need_matrix, data.num_p, data.num_r);

  // ── Safe Sequence ──────────────────────────────────────────
  const seqBlock = $("sequence-block");
  if (data.safe && data.sequence.length > 0) {
    seqBlock.classList.remove("hidden");
    renderSequence(data.sequence);
  } else {
    seqBlock.classList.add("hidden");
  }

  // ── Steps Log ──────────────────────────────────────────────
  renderSteps(data.steps);

  // Scroll to results
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render Need Matrix as a table
function renderNeedMatrix(matrix, p, r) {
  const wrap = $("need-table");
  const colHeaders = resourceHeaders(r);

  let html = `<div class="matrix-table-wrap"><table class="matrix-tbl">
    <thead><tr>
      <th></th>
      ${colHeaders.map(h => `<th>${h}</th>`).join("")}
    </tr></thead><tbody>`;

  for (let i = 0; i < p; i++) {
    html += `<tr><td class="row-label">P${i}</td>`;
    for (let j = 0; j < r; j++) {
      const v = matrix[i] ? matrix[i][j] : "?";
      const cls = v > 0 ? "val highlight" : "val";
      html += `<td class="${cls}">${v}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;
  wrap.innerHTML = html;
}

// Animate safe sequence nodes
function renderSequence(seq) {
  const container = $("sequence-visual");
  container.innerHTML = "";
  seq.forEach((proc, idx) => {
    if (idx > 0) {
      const arrow = document.createElement("span");
      arrow.className = "seq-arrow";
      arrow.textContent = "→";
      container.appendChild(arrow);
    }
    const node = document.createElement("div");
    node.className = "seq-node";
    node.textContent = proc;
    node.style.animationDelay = `${idx * 120}ms`;
    container.appendChild(node);
  });
}

// Render intermediate algorithm steps
function renderSteps(steps) {
  const log = $("steps-log");
  if (!steps || steps.length === 0) {
    log.innerHTML = `<div class="step-line">No step data available.</div>`;
    return;
  }

  log.innerHTML = steps.map((s, i) => {
    const isInit  = s.startsWith("INIT");
    const isAlloc = s.startsWith("STEP");
    const tag = isInit  ? `<span class="step-tag">INIT</span>` :
                isAlloc ? `<span class="step-tag">STEP ${i}</span>` : "";
    const cls = isInit ? "step-line init" : isAlloc ? "step-line alloc" : "step-line";
    // Strip prefix keywords for cleaner display
    const text = s.replace(/^(INIT|STEP) /, "");
    return `<div class="${cls}">${tag}${text}</div>`;
  }).join("");
}

// Expand/collapse steps panel
function toggleSteps() {
  const log     = $("steps-log");
  const chevron = $("chevron");
  const isOpen  = log.classList.toggle("open");
  chevron.classList.toggle("open", isOpen);
}

// Show a prominent error message in results area
function showError(msg) {
  const section = $("result-section");
  section.classList.remove("hidden");

  $("status-banner").className = "status-banner unsafe";
  $("status-banner").innerHTML = `
    <span class="status-icon">⚠️</span>
    <div>
      <div>ERROR</div>
      <div style="font-size:12px;opacity:0.8;font-weight:400;margin-top:4px;white-space:pre-line;">${msg}</div>
    </div>`;

  $("need-table").innerHTML = "";
  $("sequence-block").classList.add("hidden");
  $("steps-log").innerHTML = "";

  section.scrollIntoView({ behavior: "smooth", block: "start" });
}
