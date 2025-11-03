(function () {
  const mount = document.getElementById("price-api-widget");
  if (!mount) return;

  // Config from attributes
  const endpoint = mount.dataset.endpoint;
  const apiKey   = mount.dataset.apikey;
  const currency = (mount.dataset.currency || "USD").toUpperCase();
  const locale   = mount.dataset.locale || "en-US";
  const plan     = mount.dataset.plan || "";
  const burstN   = Number(mount.dataset.burstCount || 20);


  if (!endpoint || !apiKey) {
    mount.innerHTML = `<div style="color:#ef4444">Missing <code>data-endpoint</code> or <code>data-apikey</code>.</div>`;
    return;
  }

  const style = `
    <style>
      .vs-card{display:grid; gap:14px}
      .vs-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px}
      .vs-field{display:flex; flex-direction:column; gap:6px}
      .vs-input{
        background:#0f1632; color:#eaf2ff; border:1px solid #243056; border-radius:10px; padding:10px;
        outline:none; transition: box-shadow .2s,border-color .2s;
      }
      .vs-input:focus{box-shadow:0 0 0 3px rgba(110,231,210,.25); border-color:#3aa3a1}
      .vs-row{display:flex; align-items:center; gap:10px; flex-wrap:wrap}
      .vs-btn{
        appearance:none; border:0; border-radius:10px; padding:10px 14px; cursor:pointer; color:#0b1020;
        background:linear-gradient(135deg,#6ee7d2,#8b5cf6); font-weight:700;
      }
      .vs-btn[disabled]{opacity:.7; cursor:not-allowed}
      .vs-sub{color:#a6b5d8; font-size:.9rem}
      .vs-result{font-weight:800; font-size:1.1rem}
      .vs-error{color:#ef4444}
      .vs-tags{display:flex; gap:8px; flex-wrap:wrap}
      .vs-tag{border:1px solid #243056; color:#a6b5d8; border-radius:999px; padding:4px 8px; font-size:.8rem}
      .vs-right{margin-left:auto}
      .vs-divider{height:1px; background:#243056; margin:6px 0}
      .vs-mono{font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;}
      .vs-badge{background:#101738;border:1px solid #243056;border-radius:999px;padding:6px 10px;color:#a6b5d8}
    </style>
  `;

  function fmtCurrency(n) {
    try {
      return new Intl.NumberFormat(locale, {style:"currency", currency}).format(Number(n));
    } catch { return `$${Number(n).toLocaleString()}`; }
  }

  mount.innerHTML = style + `
    <div class="vs-card">
      <div class="vs-row">
        <span class="vs-badge">Plan: <strong>${plan || "Unknown"}</strong></span>
        <span class="vs-badge">Locale: <span class="vs-mono">${locale}</span></span>
        <span class="vs-badge">Currency: <span class="vs-mono">${currency}</span></span>
        <span class="vs-right"></span>
        <button id="vs-burst" class="vs-btn" title="Fire ${burstN} quick requests to hit the limit">Try burst (429)</button>
      </div>

      <div class="vs-grid">
        <label class="vs-field">
          <span class="vs-sub">Overall Quality (1–10)</span>
          <input id="vs-qual" class="vs-input" type="number" min="1" max="10" value="7">
        </label>
        <label class="vs-field">
          <span class="vs-sub">Living Area (sqft)</span>
          <input id="vs-grliv" class="vs-input" type="number" value="1710">
        </label>
        <label class="vs-field">
          <span class="vs-sub">Garage Cars</span>
          <input id="vs-gcars" class="vs-input" type="number" value="2">
        </label>
        <label class="vs-field">
          <span class="vs-sub">Basement (sqft)</span>
          <input id="vs-bsmt" class="vs-input" type="number" value="856">
        </label>
        <label class="vs-field">
          <span class="vs-sub">Year Built</span>
          <input id="vs-year" class="vs-input" type="number" value="2003">
        </label>
      </div>

      <div class="vs-row">
        <button id="vs-submit" class="vs-btn">Estimate Price</button>
        <span id="vs-status" class="vs-sub"></span>
      </div>

      <div class="vs-divider"></div>

      <div class="vs-row">
        <div id="vs-result" class="vs-result"></div>
        <div id="vs-error" class="vs-error"></div>
      </div>
      <div id="vs-tags" class="vs-tags"></div>
    </div>
  `;

  const $ = (sel) => mount.querySelector(sel);
  const btnSubmit = $("#vs-submit");
  const btnBurst  = $("#vs-burst");
  const statusEl  = $("#vs-status");
  const resultEl  = $("#vs-result");
  const errorEl   = $("#vs-error");
  const tagsEl    = $("#vs-tags");

  function payload(){
    return {
      OverallQual: Number($("#vs-qual").value),
      GrLivArea:   Number($("#vs-grliv").value),
      GarageCars:  Number($("#vs-gcars").value),
      TotalBsmtSF: Number($("#vs-bsmt").value),
      YearBuilt:   Number($("#vs-year").value),
    };
  }

  function renderHeaders(resp){
    tagsEl.innerHTML = "";
    const limit  = resp.headers.get("X-RateLimit-Limit");
    const remain = resp.headers.get("X-RateLimit-Remaining");
    const retry  = resp.headers.get("Retry-After");
    if (limit)  tagsEl.insertAdjacentHTML("beforeend", `<span class="vs-tag">Limit: ${limit}</span>`);
    if (remain) tagsEl.insertAdjacentHTML("beforeend", `<span class="vs-tag">Remaining: ${remain}</span>`);
    if (retry)  tagsEl.insertAdjacentHTML("beforeend", `<span class="vs-tag">Retry-After: ${retry}s</span>`);
  }

  async function callOnce() {
    const resp = await fetch(endpoint, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "api-key": apiKey },
      body: JSON.stringify(payload())
    });
    renderHeaders(resp);

    if (resp.status === 429) {
      const retry = resp.headers.get("Retry-After");
      throw new Error(`429: rate limit hit${retry ? ` — retry in ~${retry}s` : ""}`);
    }
    if (resp.status === 401) throw new Error("401: invalid API key");
    if (resp.status === 422) {
      const j = await resp.json().catch(()=>({}));
      throw new Error(`422: validation error ${j?.detail ? JSON.stringify(j.detail) : ""}`);
    }
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${t}`);
    }
    return resp.json();
  }

  async function estimate() {
    errorEl.textContent = ""; resultEl.textContent = ""; tagsEl.innerHTML = "";
    btnSubmit.disabled = true; btnSubmit.textContent = "Estimating…";
    statusEl.textContent = "Calling pricing model…";
    try{
      const data = await callOnce();
      resultEl.textContent = `Estimated Price: ${fmtCurrency(data.predicted_price)}`;
      statusEl.textContent = "";
    }catch(e){
      errorEl.textContent = e.message || String(e);
      statusEl.textContent = "";
    }finally{
      btnSubmit.disabled = false; btnSubmit.textContent = "Estimate Price";
    }
  }

  async function burst() {
    errorEl.textContent = ""; resultEl.textContent = ""; tagsEl.innerHTML = "";
    btnBurst.disabled = true; btnBurst.textContent = `Bursting ${burstN}…`;
    statusEl.textContent = "Firing a quick burst to demonstrate throttling…";
    try{
      // Fire N requests in parallel to trigger 429s
      const tasks = Array.from({length: burstN}, () => callOnce().then(
        () => "200", 
        err => (err.message.startsWith("429") ? "429" : "ERR")
      ));
      const results = await Promise.all(tasks);
      const ok   = results.filter(x => x === "200").length;
      const hard = results.filter(x => x === "429").length;
      const err  = results.filter(x => x === "ERR").length;

      resultEl.textContent = `Burst summary → OK: ${ok}, 429: ${hard}, Other: ${err}`;
      statusEl.textContent = "";
    }catch(e){
      errorEl.textContent = e.message || String(e);
      statusEl.textContent = "";
    }finally{
      btnBurst.disabled = false; btnBurst.textContent = "Try burst (429)";
    }
  }

  btnSubmit.addEventListener("click", estimate);
  btnBurst.addEventListener("click", burst);
})();
