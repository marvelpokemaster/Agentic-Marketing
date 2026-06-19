"use strict";

const $ = (id) => document.getElementById(id);
const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
};

async function apiUpload(url, formData) {
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Upload failed (${res.status})`);
  }
  return res.json();
}

const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let toastTimer;
function toast(msg, isError = false) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast show" + (isError ? " err" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 3200);
}

let lastCriteria = null;
let currentLeads = [];
let currentView = "inbox";
let lastAd = null;
let campaignAd = null;

async function loadCampaignAd() {
  try {
    const { ad } = await api("/api/marketing/campaign-ad");
    campaignAd = ad;
    if (ad) lastAd = ad;
  } catch (e) {
    campaignAd = null;
  }
}

// ── Tab switching ──────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".module").forEach((m) => m.classList.remove("active"));
    tab.classList.add("active");
    $("module-" + tab.dataset.module).classList.add("active");
    document.querySelector("main")?.classList.toggle("analytics-wide", tab.dataset.module === "analytics");
    if (tab.dataset.module === "analytics") loadAnalytics();
  });
});

function funnelBadge(status) {
  const cls = { converted: "green", replied: "green", opened: "green", outreached: "", scored: "", scraped: "muted" }[status] || "";
  return `<span class="chip ${cls}">${esc(status || "scraped")}</span>`;
}

function statusBadge(status) {
  const colors = { sent: "green", pending_approval: "", failed: "err", draft: "muted" };
  const cls = colors[status] || "";
  return `<span class="chip ${cls === "err" ? "" : cls}" ${cls === "err" ? 'style="color:var(--danger);border-color:var(--danger)"' : ""}>${esc(status || "draft")}</span>`;
}

// ══════════════════════ LEAD GENERATION ══════════════════════
async function loadScrapers() {
  let health = {};
  try {
    health = await api("/api/health");
  } catch (e) {
    /* non-fatal */
  }
  try {
    const { scrapers } = await api("/api/scrapers");
    $("scraper-list").innerHTML = scrapers
      .map((s) => {
        const disabled = s.enabled === false;
        const hint = s.disabled_reason ? `<small class="muted" style="display:block;margin-left:28px;">${esc(s.disabled_reason)}</small>` : "";
        return `<label class="check${disabled ? " disabled" : ""}">
          <input type="checkbox" class="scraper-cb" value="${s.id}" ${disabled ? "disabled" : ""} data-enabled="${!disabled}" />
          ${esc(s.label)}${hint}
        </label>`;
      })
      .join("");
    if (health.serpapi) {
      const cb = document.querySelector('.scraper-cb[value="serpapi_google"]');
      if (cb && !cb.disabled) cb.checked = true;
    }
  } catch (e) {
    $("scraper-list").innerHTML = `<span class="muted">Failed to load sources</span>`;
  }
}

function applyScraperSelection(ids) {
  document.querySelectorAll(".scraper-cb").forEach((cb) => {
    cb.checked = ids.includes(cb.value) && cb.dataset.enabled !== "false";
  });
}

let testCases = [];
async function loadTestCases() {
  try {
    const { test_cases } = await api("/api/leads/test-cases");
    testCases = test_cases || [];
    const sel = $("test-case");
    sel.innerHTML =
      `<option value="">— Start from scratch —</option>` +
      testCases.map((t) => `<option value="${t.id}">${t.label}</option>`).join("");
  } catch (e) {
    /* non-fatal */
  }
}

$("test-case").addEventListener("change", async (e) => {
  const tc = testCases.find((t) => t.id === e.target.value);
  if (!tc) return;
  $("brief").value = tc.brief;
  $("criteria-box").style.display = "none";
  $("agent-plan-box").style.display = "none";
  lastCriteria = null;
  let ids = tc.default_scrapers || ["serpapi_google"];
  try {
    const health = await api("/api/health");
    if (!health.serpapi) ids = ["sample"];
  } catch (err) {
    ids = ["sample"];
  }
  applyScraperSelection(ids);
  if ($("test-client-email")) $("test-client-email").value = tc.test_client_email || "";
  if ($("marketer-email")) $("marketer-email").value = tc.marketer_email || "";
  toast("Test case loaded — data sources updated");
});

$("select-all").addEventListener("change", (e) => {
  document.querySelectorAll(".scraper-cb:not(:disabled)").forEach((cb) => (cb.checked = e.target.checked));
});

function selectedScrapers() {
  return [...document.querySelectorAll(".scraper-cb:checked")].map((cb) => cb.value);
}

function renderCriteria(c) {
  lastCriteria = c;
  const chips = [];
  if (c.company_name) chips.push(`<span class="chip green">${c.company_name}</span>`);
  if (c.product) chips.push(`<span class="chip">product: ${c.product}</span>`);
  (c.targets || []).forEach((t) => chips.push(`<span class="chip">target: ${t}</span>`));
  if (c.location) chips.push(`<span class="chip">location: ${c.location}</span>`);
  (c.attributes || []).forEach((a) => chips.push(`<span class="chip">${a}</span>`));
  $("criteria-chips").innerHTML = chips.join("") || `<span class="muted">No intent extracted</span>`;
  $("criteria-box").style.display = "block";
}

function renderAgentPlan(plan) {
  if (!plan) return;
  $("agent-plan-summary").textContent = plan.summary || "";
  $("agent-plan-steps").innerHTML = (plan.steps || [])
    .map(
      (step, idx) => `
      <div class="agent-step">
        <span class="agent-step-num">${idx + 1}</span>
        <div>
          <div class="agent-step-title">${esc(step.title)}</div>
          <div class="agent-step-detail">${esc(step.detail)}</div>
        </div>
        <span class="agent-step-status ${esc(step.status || "ready")}">${esc(step.status || "ready")}</span>
      </div>`
    )
    .join("");
  $("agent-plan-box").style.display = "block";
}

async function generateAgentPlan({ quiet = false } = {}) {
  const text = $("brief").value.trim();
  const scrapers = selectedScrapers();
  if (!text) {
    if (!quiet) toast("Enter a company brief first", true);
    return null;
  }
  if (!scrapers.length) {
    if (!quiet) toast("Select at least one data source", true);
    return null;
  }

  const btn = $("agent-plan-btn");
  if (btn && !quiet) {
    btn.disabled = true;
    btn.textContent = "Planning...";
  }
  try {
    const { plan } = await api("/api/agent/plan", {
      method: "POST",
      body: JSON.stringify({
        text,
        criteria: lastCriteria,
        scrapers,
        max_results_per_target: parseInt($("max-results").value) || 5,
      }),
    });
    renderAgentPlan(plan);
    if (!quiet) toast("Agent plan generated");
    return plan;
  } catch (e) {
    if (!quiet) toast(e.message, true);
    return null;
  } finally {
    if (btn && !quiet) {
      btn.disabled = false;
      btn.textContent = "Generate agent plan";
    }
  }
}

function renderAgentChecklist(checklist) {
  const box = $("agent-checklist");
  if (!box) return;
  if (!checklist?.length) {
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }
  box.style.display = "grid";
  box.innerHTML = checklist
    .map(
      (item) => `
      <div class="agent-check ${item.done ? "done" : ""}">
        <div class="agent-check-label">${item.done ? "✓" : "○"} ${esc(item.label)}</div>
        <div class="agent-check-hint">${esc(item.hint)}</div>
      </div>`
    )
    .join("");
}

async function refreshAgentChecklist() {
  try {
    const data = await api("/api/agent/recommendations");
    renderAgentChecklist(data.checklist || []);
  } catch (e) {
    renderAgentChecklist([]);
  }
}

$("extract-btn").addEventListener("click", async () => {
  const text = $("brief").value.trim();
  if (!text) return toast("Enter a company brief first", true);
  $("extract-btn").disabled = true;
  $("extract-btn").textContent = "Extracting...";
  try {
    const { criteria } = await api("/api/leads/extract", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    renderCriteria(criteria);
    toast("Intent extracted");
  } catch (e) {
    toast(e.message, true);
  } finally {
    $("extract-btn").disabled = false;
    $("extract-btn").textContent = "Preview extracted intent";
  }
});

$("agent-plan-btn")?.addEventListener("click", () => generateAgentPlan());

$("run-btn").addEventListener("click", async () => {
  const text = $("brief").value.trim();
  const scrapers = selectedScrapers();
  if (!text) return toast("Enter a company brief first", true);
  if (!scrapers.length) return toast("Select at least one data source", true);

  await generateAgentPlan({ quiet: true });
  $("run-btn").disabled = true;
  $("run-status").style.display = "block";
  $("run-status").querySelector(".status-line").style.display = "flex";
  $("run-message").textContent = "Starting...";
  $("run-log").innerHTML = "";

  try {
    const testCaseId = $("test-case")?.value || null;
    const { job_id } = await api("/api/leads/run", {
      method: "POST",
      body: JSON.stringify({
        text,
        criteria: lastCriteria,
        scrapers,
        max_results_per_target: parseInt($("max-results").value) || 5,
        test_case_id: testCaseId || null,
        test_client_email: $("test-client-email")?.value.trim() || null,
        marketer_email: $("marketer-email")?.value.trim() || null,
      }),
    });
    pollJob(job_id);
  } catch (e) {
    toast(e.message, true);
    $("run-btn").disabled = false;
    $("run-status").style.display = "none";
  }
});

function renderLog(log) {
  const box = $("run-log");
  box.innerHTML = (log || [])
    .map(
      (l) =>
        `<div class="log-line ${l.stage || ""}">${esc(l.message)}</div>`
    )
    .join("");
  box.scrollTop = box.scrollHeight;
}

async function pollJob(jobId) {
  try {
    const job = await api(`/api/leads/jobs/${jobId}`);
    $("run-message").textContent = job.message || job.stage || "Working...";
    renderLog(job.log);
    if (job.status === "done") {
      if (job.criteria) renderCriteria(job.criteria);
      await loadLeads("inbox");
      $("run-btn").disabled = false;
      $("run-status").querySelector(".status-line").style.display = "none";
      toast(`Done — ${(job.leads || []).length} new leads in inbox`);
      return;
    }
    if (job.status === "error") {
      toast("Error: " + job.message, true);
      $("run-btn").disabled = false;
      $("run-status").querySelector(".status-line").style.display = "none";
      return;
    }
    setTimeout(() => pollJob(jobId), 800);
  } catch (e) {
    toast(e.message, true);
    $("run-btn").disabled = false;
    $("run-status").querySelector(".status-line").style.display = "none";
  }
}

function scoreClass(s) {
  if (s >= 70) return "score-high";
  if (s >= 45) return "score-medium";
  return "score-low";
}

function attachmentListHtml(attachments) {
  if (!attachments?.length) return `<p class="muted" style="font-size:12px;">No files attached yet.</p>`;
  return `<ul class="attach-list">${attachments
    .map(
      (a) =>
        `<li>${esc(a.filename)} — <a href="${esc(a.url || `/api/files/${a.id}`)}" target="_blank" rel="noopener">Download</a></li>`
    )
    .join("")}</ul>`;
}

async function refreshLeadAttachments(leadId, idx) {
  const { attachments } = await api(`/api/leads/${leadId}/attachments`);
  const box = $(`attach-list-${idx}`);
  if (box) box.innerHTML = attachmentListHtml(attachments);
  if (currentLeads[idx]) {
    const o = currentLeads[idx].outreach || {};
    o.attachment_ids = attachments.map((a) => a.id);
    currentLeads[idx].outreach = o;
  }
  return attachments;
}

async function uploadLeadFiles(leadId, idx, fileInput) {
  const files = fileInput.files;
  if (!files?.length) return;
  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file);
    await apiUpload(`/api/leads/${leadId}/attachments`, fd);
  }
  fileInput.value = "";
  await refreshLeadAttachments(leadId, idx);
  toast("File(s) uploaded");
}

async function addAttachmentUrl(leadId, idx) {
  const url = $(`attach-url-${idx}`)?.value.trim();
  if (!url) return toast("Enter a URL first", true);
  await api(`/api/leads/${leadId}/attachments/url`, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  $(`attach-url-${idx}`).value = "";
  await refreshLeadAttachments(leadId, idx);
  toast("URL added");
}

async function openGmailForLead(leadId, idx) {
  await saveOutreach(leadId, idx);
  const sendTo = $(`send-to-${idx}`)?.value.trim();
  if (sendTo) {
    await api(`/api/leads/${leadId}/send-to`, {
      method: "PATCH",
      body: JSON.stringify({ send_to_email: sendTo }),
    });
    if (currentLeads[idx]) currentLeads[idx].send_to_email = sendTo;
  }
  const data = await api(`/api/leads/${leadId}/gmail-compose`);
  window.open(data.url, "_blank");
  const panel = $(`gmail-attach-${idx}`);
  if (panel && data.attachments?.length) {
    panel.style.display = "block";
    panel.innerHTML = `<p class="muted" style="font-size:12px;margin:0 0 6px;">${esc(data.note)}</p>${attachmentListHtml(data.attachments)}`;
  }
  toast("Gmail compose opened — attach downloaded files manually");
}

function scoreMissingLabel(lead) {
  const b = lead.score_breakdown || {};
  const missing = b.missing || b.missing_fields || [];
  if (!missing.length) return "";
  const n = missing.length;
  return `${n} gap${n === 1 ? "" : "s"}`;
}

function renderScoreBreakdown(lead) {
  const b = lead.score_breakdown;
  if (!b || !(b.factors || []).length) return "";

  const factors = (b.factors || [])
    .map(
      (f) => `
      <div class="score-factor">
        <div class="score-factor-label">
          <span class="${f.present ? "score-ok" : "score-miss"}">${f.present ? "✓" : "✗"}</span>
          <span>${esc(f.label)}</span>
        </div>
        <div class="score-factor-pts">${f.points ?? 0}/${f.max_points ?? 0} pts</div>
      </div>`
    )
    .join("");

  const missing = b.missing || [];
  const present = b.present || b.strengths || [];

  return `
    <div class="score-breakdown">
      <h4>Score breakdown ${lead.priority ? `· ${esc(lead.priority)} priority` : ""}</h4>
      ${b.mode === "ai" ? `<p class="muted" style="margin:0 0 8px;font-size:12px;">Checklist of present vs missing signals. Final score comes from AI fit judgment.</p>` : ""}
      ${factors}
      ${
        missing.length
          ? `<div class="score-chip-row">${missing
              .slice(0, 8)
              .map((m) => `<span class="score-chip missing">Missing: ${esc(m)}</span>`)
              .join("")}</div>`
          : ""
      }
      ${
        present.length
          ? `<div class="score-chip-row">${present
              .slice(0, 6)
              .map((p) => `<span class="score-chip present">${esc(p)}</span>`)
              .join("")}</div>`
          : ""
      }
    </div>`;
}

function updateLeadCounts(counts) {
  if (!counts) return;
  const set = (id, n) => {
    const el = $(id);
    if (el) el.textContent = n ?? 0;
  };
  set("count-inbox", counts.inbox);
  set("count-stored", counts.stored);
  set("count-discarded", counts.discarded);
}

const VIEW_HINTS = {
  inbox: "Inbox — new scrape results. Save companies for outreach or discard unwanted ones. Clear inbox hides them without deleting saved outreach.",
  stored: "Saved — leads you kept for outreach. Drafts, attachments, and queued sends stay with each company.",
  discarded: "Discarded — hidden leads you can restore to inbox or save for outreach later.",
};

async function loadLeads(view = currentView) {
  currentView = view;
  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
  const hint = $("lead-view-hint");
  if (hint) hint.textContent = VIEW_HINTS[view] || "";

  try {
    const d = await api(`/api/leads?view=${encodeURIComponent(view)}`);
    if (d.criteria) renderCriteria(d.criteria);
    updateLeadCounts(d.counts);
    renderLeads(d.leads || []);
    refreshAgentChecklist();
  } catch (e) {
    toast(e.message, true);
  }
}

async function setLeadListStatus(leadId, listStatus) {
  try {
    const { counts } = await api(`/api/leads/${leadId}/list-status`, {
      method: "PATCH",
      body: JSON.stringify({ list_status: listStatus }),
    });
    updateLeadCounts(counts);
    await loadLeads(currentView);
    const labels = {
      stored: "Saved for outreach",
      discarded: "Discarded",
      inbox: "Moved to inbox",
      cleared: "Cleared from inbox",
    };
    toast(labels[listStatus] || "Updated");
  } catch (e) {
    toast(e.message, true);
  }
}

function leadRowActions(lead) {
  if (currentView === "inbox") {
    return `<div class="lead-actions">
      <button type="button" class="btn ghost small" data-action="store" data-id="${esc(lead.id)}">Save</button>
      <button type="button" class="btn ghost small" data-action="discard" data-id="${esc(lead.id)}">Discard</button>
    </div>`;
  }
  if (currentView === "stored") {
    return `<div class="lead-actions">
      <button type="button" class="btn ghost small" data-action="inbox" data-id="${esc(lead.id)}">To inbox</button>
      <button type="button" class="btn ghost small" data-action="discard" data-id="${esc(lead.id)}">Discard</button>
    </div>`;
  }
  if (currentView === "discarded") {
    return `<div class="lead-actions">
      <button type="button" class="btn ghost small" data-action="store" data-id="${esc(lead.id)}">Save</button>
      <button type="button" class="btn ghost small" data-action="inbox" data-id="${esc(lead.id)}">Restore</button>
    </div>`;
  }
  return "";
}

const EMPTY_VIEW_MSG = {
  inbox: "No leads in inbox. Run scraping or check Saved for stored companies.",
  stored: "No saved leads yet. Use Save on inbox rows to keep companies for outreach.",
  discarded: "No discarded leads.",
};

function renderLeads(leads) {
  currentLeads = leads;
  const wrap = $("leads-wrap");
  if (!leads.length) {
    wrap.innerHTML = `<div class="empty">${EMPTY_VIEW_MSG[currentView] || "No leads found."}</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Score</th><th>Business</th><th>Funnel</th><th>Status</th><th>Source</th><th>Actions</th><th></th></tr></thead>
      <tbody>
        ${leads
          .map(
            (l, i) => `
          <tr class="lead-row" data-idx="${i}">
            <td>
              <span class="score-badge ${scoreClass(l.score || 0)}">${l.score ?? "—"}</span>
              ${scoreMissingLabel(l) ? `<span class="score-meta">${esc(scoreMissingLabel(l))}</span>` : ""}
            </td>
            <td><strong>${esc(l.name)}</strong><br/><span class="muted">${esc(l.category || "")}</span></td>
            <td>${funnelBadge(l.funnel_status)}</td>
            <td>${statusBadge(l.outreach_status)}</td>
            <td><span class="muted">${esc(l.source || "")}</span></td>
            <td>${leadRowActions(l)}</td>
            <td class="muted">▾</td>
          </tr>
          <tr class="detail-row" data-detail="${i}" style="display:none;">
            <td colspan="7"><div class="detail" id="detail-${i}"></div></td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;

  wrap.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const map = { store: "stored", discard: "discarded", inbox: "inbox" };
      setLeadListStatus(btn.dataset.id, map[btn.dataset.action]);
    });
  });

  wrap.querySelectorAll(".lead-row").forEach((row) => {
    row.addEventListener("click", () => {
      const idx = row.dataset.idx;
      const detail = wrap.querySelector(`[data-detail="${idx}"]`);
      const open = detail.style.display !== "none";
      detail.style.display = open ? "none" : "table-row";
      if (!open) renderDetail(leads[idx], idx);
    });
  });
}

function renderDetail(lead, idx) {
  const o = lead.outreach || {};
  const hasOutreach = !!(o.email || o.whatsapp);
  const sendTo = lead.send_to_email || $("test-client-email")?.value.trim() || lead.email || "";
  $(`detail-${idx}`).innerHTML = `
    <div class="btn-row" style="margin-bottom:12px;">
      ${lead.list_status !== "stored" ? `<button type="button" class="btn small" id="lead-store-${idx}">Save for outreach</button>` : `<span class="list-badge stored">Saved</span>`}
      ${lead.list_status !== "discarded" ? `<button type="button" class="btn ghost small" id="lead-discard-${idx}">Discard</button>` : `<span class="list-badge discarded">Discarded</span>`}
      ${lead.list_status !== "inbox" ? `<button type="button" class="btn ghost small" id="lead-inbox-${idx}">Move to inbox</button>` : ""}
    </div>
    <div class="chips" style="margin-bottom:12px;">
      ${lead.phone ? `<span class="chip">${esc(lead.phone)}</span>` : ""}
      ${lead.email ? `<span class="chip">scraped: ${esc(lead.email)}</span>` : ""}
      ${lead.website ? `<span class="chip"><a href="${esc(lead.website)}" target="_blank">website</a></span>` : ""}
      ${lead.rating ? `<span class="chip">${lead.rating}★${lead.reviews ? " · " + lead.reviews : ""}</span>` : ""}
      ${lead.address ? `<span class="chip">${esc(lead.address)}</span>` : ""}
    </div>
    ${renderScoreBreakdown(lead)}
    ${lead.score_reason ? `<p class="muted" style="margin:0 0 12px;"><strong style="color:var(--text)">Why:</strong> ${esc(lead.score_reason)}</p>` : ""}

    <div class="prompt-edit">
      <div class="field-label">Send email to</div>
      <input type="email" id="send-to-${idx}" value="${esc(sendTo)}" placeholder="Client email for Gmail" list="send-to-suggestions-${idx}" />
      <datalist id="send-to-suggestions-${idx}">
        ${lead.email ? `<option value="${esc(lead.email)}">Scraped</option>` : ""}
        ${$("test-client-email")?.value ? `<option value="${esc($("test-client-email").value)}">Test case</option>` : ""}
      </datalist>
    </div>

    <div class="prompt-edit">
      <div class="field-label">Outreach instructions (optional)</div>
      <textarea id="outreach-instr-${idx}" placeholder="e.g. Mention our free sample offer. Keep tone casual. Reference their rating."></textarea>
    </div>

    <div id="outreach-fields-${idx}">
      <div class="prompt-edit">
        <div class="field-label">Include image (optional)</div>
        <div class="image-mode-row">
          <label class="check"><input type="radio" name="img-mode-${idx}" value="none" ${!o.image_mode || o.image_mode === "none" ? "checked" : ""} /> No image</label>
          <label class="check"><input type="radio" name="img-mode-${idx}" value="campaign" ${o.image_mode === "campaign" ? "checked" : ""} /> Campaign ad image</label>
          <label class="check"><input type="radio" name="img-mode-${idx}" value="per_lead" ${o.image_mode === "per_lead" ? "checked" : ""} /> Per-lead image</label>
        </div>
        ${campaignAd?.image_url ? `<p class="muted" style="font-size:12px;margin:6px 0 0;">Campaign image ready from AI Marketing tab.</p>` : ""}
        ${o.image_url ? `<img src="${esc(o.image_url)}" alt="outreach image" class="pending-thumb" loading="lazy" />` : ""}
      </div>
      <div class="prompt-edit">
        <div class="field-label">Attachments</div>
        <div class="attach-row">
          <input type="file" id="attach-file-${idx}" multiple />
          <button type="button" class="btn ghost small" id="attach-upload-${idx}">Upload files</button>
        </div>
        <div class="attach-row" style="margin-top:8px;">
          <input type="text" id="attach-url-${idx}" placeholder="Or paste file/image URL" style="flex:1;min-width:180px;" />
          <button type="button" class="btn ghost small" id="attach-url-btn-${idx}">Add URL</button>
        </div>
        <div id="attach-list-${idx}"></div>
      </div>
      <div class="prompt-edit">
        <div class="field-label">Email</div>
        <textarea id="outreach-email-${idx}" class="tall" placeholder="Subject: ...\n\nHi team,...">${esc(o.email)}</textarea>
      </div>
      <div class="prompt-edit">
        <div class="field-label">WhatsApp</div>
        <textarea id="outreach-wa-${idx}" placeholder="Hi! ...">${esc(o.whatsapp)}</textarea>
      </div>
    </div>

    <div id="gmail-attach-${idx}" style="display:none;margin-bottom:12px;"></div>

    <div class="btn-row">
      <button class="btn ghost small" id="outreach-gen-${idx}">${hasOutreach ? "Regenerate with AI" : "Generate with AI"}</button>
      <button class="btn ghost small" id="outreach-save-${idx}">Save edits</button>
    </div>

    <label class="check" style="margin-top:12px;">
      <input type="checkbox" id="opt-in-${idx}" ${lead.whatsapp_opt_in ? "checked" : ""} />
      WhatsApp opt-in confirmed
    </label>

    <div class="btn-row" style="margin-top:10px;">
      <button class="btn small" id="gmail-${idx}">Open in Gmail</button>
      <button class="btn ghost small" id="send-email-${idx}">Queue SMTP send</button>
      <button class="btn ghost small" id="send-wa-${idx}">Queue WhatsApp (stub)</button>
      <button class="btn ghost small" id="convert-${idx}">Mark converted</button>
    </div>`;

  refreshLeadAttachments(lead.id, idx).catch(() => {});
  $(`lead-store-${idx}`)?.addEventListener("click", (e) => {
    e.stopPropagation();
    setLeadListStatus(lead.id, "stored");
  });
  $(`lead-discard-${idx}`)?.addEventListener("click", (e) => {
    e.stopPropagation();
    setLeadListStatus(lead.id, "discarded");
  });
  $(`lead-inbox-${idx}`)?.addEventListener("click", (e) => {
    e.stopPropagation();
    setLeadListStatus(lead.id, "inbox");
  });
  $(`attach-upload-${idx}`)?.addEventListener("click", () => uploadLeadFiles(lead.id, idx, $(`attach-file-${idx}`)));
  $(`attach-url-btn-${idx}`)?.addEventListener("click", () => addAttachmentUrl(lead.id, idx));
  $(`outreach-gen-${idx}`).addEventListener("click", () => genOutreach(lead.id, idx));
  $(`outreach-save-${idx}`).addEventListener("click", () => saveOutreach(lead.id, idx));
  $(`opt-in-${idx}`).addEventListener("change", (e) => setOptIn(lead.id, idx, e.target.checked));
  $(`gmail-${idx}`).addEventListener("click", () => openGmailForLead(lead.id, idx));
  $(`send-email-${idx}`).addEventListener("click", () => queueEmailSend(lead.id, idx));
  $(`send-wa-${idx}`).addEventListener("click", () => queueWhatsAppSend(lead.id, idx));
  $(`convert-${idx}`).addEventListener("click", () => markConverted(lead.id, idx));
}

async function genOutreach(leadId, idx) {
  const btn = $(`outreach-gen-${idx}`);
  const label = btn.textContent.trim();
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Generating...`;
  const instructions = $(`outreach-instr-${idx}`)?.value.trim() || "";
  const imageMode = document.querySelector(`input[name="img-mode-${idx}"]:checked`)?.value || "none";
  try {
    const { outreach } = await api(`/api/leads/${leadId}/outreach`, {
      method: "POST",
      body: JSON.stringify({ instructions, image_mode: imageMode }),
    });
    $(`outreach-fields-${idx}`).style.display = "block";
    $(`outreach-email-${idx}`).value = outreach.email || "";
    $(`outreach-wa-${idx}`).value = outreach.whatsapp || "";
    if (currentLeads[idx]) currentLeads[idx].outreach = outreach;
    btn.disabled = false;
    btn.textContent = "Regenerate with AI";
    toast(outreach.image_url ? "Outreach + image generated" : "Outreach generated");
  } catch (e) {
    btn.disabled = false;
    btn.textContent = label;
    toast(e.message, true);
  }
}

async function saveOutreach(leadId, idx) {
  const btn = $(`outreach-save-${idx}`);
  btn.disabled = true;
  try {
    const email = $(`outreach-email-${idx}`)?.value ?? "";
    const whatsapp = $(`outreach-wa-${idx}`)?.value ?? "";
    const image_mode = document.querySelector(`input[name="img-mode-${idx}"]:checked`)?.value || "none";
    const send_to_email = $(`send-to-${idx}`)?.value.trim() || null;
    const existing = currentLeads[idx]?.outreach || {};
    const { outreach } = await api(`/api/leads/${leadId}/outreach`, {
      method: "PUT",
      body: JSON.stringify({
        email,
        whatsapp,
        image_url: existing.image_url || null,
        image_mode,
        send_to_email,
      }),
    });
    if (currentLeads[idx]) {
      currentLeads[idx].outreach = outreach;
      if (send_to_email) currentLeads[idx].send_to_email = send_to_email;
    }
    toast("Outreach saved");
  } catch (e) {
    toast(e.message, true);
  } finally {
    btn.disabled = false;
  }
}

async function setOptIn(leadId, idx, checked) {
  try {
    await api(`/api/leads/${leadId}/opt-in`, {
      method: "PATCH",
      body: JSON.stringify({ whatsapp_opt_in: checked }),
    });
    if (currentLeads[idx]) currentLeads[idx].whatsapp_opt_in = checked;
    toast(checked ? "Opt-in confirmed" : "Opt-in removed");
  } catch (e) {
    toast(e.message, true);
  }
}

async function queueEmailSend(leadId, idx) {
  try {
    await api(`/api/leads/${leadId}/send/email`, { method: "POST" });
    if (currentLeads[idx]) currentLeads[idx].outreach_status = "pending_approval";
    await loadLeads(currentView);
    refreshPending();
    toast("Email queued — approve in Pending drawer");
  } catch (e) {
    toast(e.message, true);
  }
}

async function queueWhatsAppSend(leadId, idx) {
  try {
    await api(`/api/leads/${leadId}/send/whatsapp`, { method: "POST" });
    if (currentLeads[idx]) currentLeads[idx].outreach_status = "pending_approval";
    await loadLeads(currentView);
    refreshPending();
    toast("WhatsApp queued (stub) — approve in Pending drawer");
  } catch (e) {
    toast(e.message, true);
  }
}

async function markConverted(leadId, idx) {
  try {
    const { funnel_status } = await api(`/api/leads/${leadId}/convert`, { method: "POST" });
    if (currentLeads[idx]) currentLeads[idx].funnel_status = funnel_status;
    await loadLeads(currentView);
    toast("Marked as converted");
  } catch (e) {
    toast(e.message, true);
  }
}

// ── Pending sends drawer ───────────────────────────────────────────────────
let pendingSends = [];

async function refreshPending() {
  try {
    const { pending } = await api("/api/sends/pending");
    pendingSends = pending || [];
  } catch (e) {
    pendingSends = [];
  }
  const badge = $("pending-badge");
  if (badge) {
    badge.textContent = pendingSends.length;
    badge.style.display = pendingSends.length ? "inline-block" : "none";
  }
  if ($("pending-drawer")?.classList.contains("open")) renderPending();
}

function pendingEmailRaw(p) {
  const ctx = p.context || {};
  if (ctx.email_raw) return ctx.email_raw;
  const subj = ctx.subject || "Hello";
  const body = ctx.body || "";
  return `Subject: ${subj}\n\n${body}`;
}

function renderPendingEditor(p) {
  const ctx = p.context || {};
  if (p.channel === "email") {
    const to = ctx.send_to_email || ctx.to_email || "";
    return `
      <div class="prompt-edit">
        <div class="field-label">Send to</div>
        <input type="email" id="pending-send-to-${p.id}" value="${esc(to)}" />
      </div>
      <div class="prompt-edit">
        <div class="field-label">Email content</div>
        <textarea class="tall pending-edit" id="pending-email-${p.id}">${esc(pendingEmailRaw(p))}</textarea>
      </div>
      <div class="prompt-edit">
        <div class="field-label">Attachment image URL</div>
        <input type="text" id="pending-img-${p.id}" value="${esc(ctx.image_url || "")}" placeholder="Optional — listed in Gmail body for manual attach" />
      </div>`;
  }
  if (p.channel === "whatsapp") {
    return `
      <div class="prompt-edit">
        <div class="field-label">WhatsApp message</div>
        <textarea class="pending-edit" id="pending-wa-${p.id}">${esc(ctx.message || "")}</textarea>
      </div>
      <div class="prompt-edit">
        <div class="field-label">Image URL (appended to message)</div>
        <input type="text" id="pending-img-${p.id}" value="${esc(ctx.image_url || "")}" />
      </div>`;
  }
  if (p.channel === "meta_ad") {
    const ad = ctx.ad || {};
    return `
      <div class="prompt-edit"><div class="field-label">Headline</div><input type="text" id="pending-ad-head-${p.id}" value="${esc(ad.headline || "")}" /></div>
      <div class="prompt-edit"><div class="field-label">Copy</div><textarea class="pending-edit" id="pending-ad-copy-${p.id}">${esc(ad.copy || "")}</textarea></div>
      <div class="prompt-edit"><div class="field-label">CTA</div><input type="text" id="pending-ad-cta-${p.id}" value="${esc(ad.cta || "")}" /></div>
      ${ad.image_url ? `<img src="${esc(ad.image_url)}" class="pending-thumb" loading="lazy" />` : ""}`;
  }
  return `<pre class="receipt-box">${esc(JSON.stringify(ctx, null, 2))}</pre>`;
}

async function savePendingSend(id) {
  const p = pendingSends.find((x) => x.id === id);
  if (!p) return;
  const body = {};
  if (p.channel === "email") {
    body.email = $(`pending-email-${id}`)?.value ?? "";
    body.image_url = $(`pending-img-${id}`)?.value.trim() || null;
    body.send_to_email = $(`pending-send-to-${id}`)?.value.trim() || null;
  } else if (p.channel === "whatsapp") {
    body.message = $(`pending-wa-${id}`)?.value ?? "";
    body.image_url = $(`pending-img-${id}`)?.value.trim() || null;
  } else if (p.channel === "meta_ad") {
    body.ad = {
      ...(p.context?.ad || {}),
      headline: $(`pending-ad-head-${id}`)?.value ?? "",
      copy: $(`pending-ad-copy-${id}`)?.value ?? "",
      cta: $(`pending-ad-cta-${id}`)?.value ?? "",
    };
  }
  try {
    await api(`/api/sends/${id}`, { method: "PUT", body: JSON.stringify(body) });
    await refreshPending();
    toast("Pending send saved");
  } catch (e) {
    toast(e.message, true);
  }
}

async function openGmailFromPending(p) {
  await savePendingSend(p.id);
  if (!p.lead_id) return toast("No lead linked", true);
  const data = await api(`/api/leads/${p.lead_id}/gmail-compose`);
  window.open(data.url, "_blank");
  toast("Gmail compose opened");
}

function renderPending() {
  const box = $("pending-list");
  if (!pendingSends.length) {
    box.innerHTML = `<div class="empty">No pending sends.</div>`;
    return;
  }
  box.innerHTML = pendingSends
    .map(
      (p) => `
    <div class="approval">
      <div class="approval-type">${esc(p.channel)} ${p.context?.variant ? `(variant ${p.context.variant})` : ""}</div>
      <div class="muted" style="font-size:12px; margin:4px 0 10px;">
        ${p.lead_name ? `<strong style="color:var(--text); font-size:14px;">${esc(p.lead_name)}</strong><br/>` : ""}
        ${p.lead_id ? `<span>Send to: ${esc((p.context?.send_to_email || p.context?.to_email) || "—")}</span><br/><span class="muted">Lead ID: ${esc(p.lead_id)}</span>` : p.channel === "meta_ad" ? `<span>${esc((p.context?.ad?.headline) || "Meta ad publish (stub)")}</span>` : ""}
        ${p.scheduled_at ? `<br/>Scheduled: ${esc(p.scheduled_at)}` : ""}
      </div>
      ${renderPendingEditor(p)}
      <div class="btn-row" style="margin-top:10px;">
        ${p.channel === "email" && p.lead_id ? `<button class="btn ghost small" data-gmail="${p.id}">Open in Gmail</button>` : ""}
        <button class="btn ghost small" data-save="${p.id}">Save edits</button>
        <button class="btn small" data-approve="${p.id}">Approve &amp; send</button>
        <button class="btn ghost small" data-reject="${p.id}">Reject</button>
      </div>
    </div>`
    )
    .join("");
  box.querySelectorAll("[data-save]").forEach((b) =>
    b.addEventListener("click", () => savePendingSend(b.dataset.save))
  );
  box.querySelectorAll("[data-gmail]").forEach((b) =>
    b.addEventListener("click", () => openGmailFromPending(pendingSends.find((x) => x.id === b.dataset.gmail)))
  );
  box.querySelectorAll("[data-approve]").forEach((b) =>
    b.addEventListener("click", () => resolvePending(b.dataset.approve, true))
  );
  box.querySelectorAll("[data-reject]").forEach((b) =>
    b.addEventListener("click", () => resolvePending(b.dataset.reject, false))
  );
}

async function resolvePending(id, approved) {
  try {
    await api(`/api/sends/${id}/${approved ? "approve" : "reject"}`, { method: "POST" });
    toast(approved ? "Sent" : "Rejected");
    await refreshPending();
    await loadLeads(currentView);
  } catch (e) {
    toast(e.message, true);
  }
}

function togglePendingDrawer(open) {
  $("pending-drawer").classList.toggle("open", open);
  $("drawer-scrim").classList.toggle("open", open);
  if (open) renderPending();
}

$("pending-btn").addEventListener("click", () => togglePendingDrawer(true));
$("pending-close").addEventListener("click", () => togglePendingDrawer(false));
$("drawer-scrim").addEventListener("click", () => togglePendingDrawer(false));

$("export-csv-btn").addEventListener("click", () => {
  window.location.href = "/api/leads/export.csv";
  toast("Downloading CSV…");
});

$("lead-view-tabs")?.addEventListener("click", (e) => {
  const tab = e.target.closest(".view-tab");
  if (!tab || tab.dataset.view === currentView) return;
  loadLeads(tab.dataset.view);
});

$("clear-inbox-btn")?.addEventListener("click", async () => {
  const count = parseInt($("count-inbox")?.textContent || "0", 10);
  if (!count) return toast("Inbox is already empty");
  if (!confirm(`Clear ${count} lead(s) from the inbox display? Saved outreach data is kept — see the Saved tab.`)) return;
  try {
    const { cleared, counts } = await api("/api/leads/clear-inbox", { method: "POST" });
    updateLeadCounts(counts);
    await loadLeads("inbox");
    toast(`Cleared ${cleared} from inbox`);
  } catch (e) {
    toast(e.message, true);
  }
});

$("reset-leads-btn").addEventListener("click", async () => {
  if (!confirm("Delete ALL leads permanently? Inbox, saved, and discarded lists will be wiped.")) return;
  try {
    const { cleared, counts } = await api("/api/leads/reset", { method: "POST" });
    updateLeadCounts(counts);
    currentLeads = [];
    $("leads-wrap").innerHTML = `<div class="empty">No leads yet. Describe your business and run scraping.</div>`;
    toast(`Deleted ${cleared} lead${cleared === 1 ? "" : "s"}`);
  } catch (e) {
    toast(e.message, true);
  }
});

$("batch-email-btn").addEventListener("click", async () => {
  let leads = currentLeads;
  if (currentView !== "stored") {
    try {
      const d = await api("/api/leads?view=stored");
      leads = d.leads || [];
    } catch (e) {
      return toast(e.message, true);
    }
  }
  const ids = leads.filter((l) => l.email && l.outreach?.email).map((l) => l.id);
  if (!ids.length) return toast("No saved leads with email outreach — save leads and generate outreach first", true);
  try {
    const { count } = await api("/api/leads/batch-send/email", {
      method: "POST",
      body: JSON.stringify({ lead_ids: ids, use_ab: true }),
    });
    refreshPending();
    toast(`${count} emails queued with A/B variants`);
  } catch (e) {
    toast(e.message, true);
  }
});

// ══════════════════════ AI MARKETING ══════════════════════
let adTestCases = [];
async function loadAdTestCases() {
  try {
    const { test_cases } = await api("/api/marketing/test-cases");
    adTestCases = test_cases || [];
    $("ad-test-case").innerHTML =
      `<option value="">— Start from scratch —</option>` +
      adTestCases.map((t) => `<option value="${t.id}">${t.label}</option>`).join("");
  } catch (e) {
    /* non-fatal */
  }
}

$("ad-test-case").addEventListener("change", (e) => {
  const tc = adTestCases.find((t) => t.id === e.target.value);
  if (!tc) return;
  $("ad-product").value = tc.product || "";
  $("ad-objective").value = tc.objective || "";
  $("ad-audience").value = tc.audience || "";
  if (tc.tone) $("ad-tone").value = tc.tone;
  if (tc.platform) $("ad-platform").value = tc.platform;
  $("ad-branding").value = tc.branding || "";
  toast("Test case loaded");
});

$("generate-ad-btn").addEventListener("click", async () => {
  const product = $("ad-product").value.trim();
  if (!product) return toast("Enter a product description", true);

  const btn = $("generate-ad-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Generating...`;
  $("ad-wrap").innerHTML = `<div class="empty"><span class="spinner"></span><br/><br/>Writing copy &amp; generating image...</div>`;

  try {
    const { ad } = await api("/api/marketing/generate", {
      method: "POST",
      body: JSON.stringify({
        product,
        objective: $("ad-objective").value.trim(),
        audience: $("ad-audience").value.trim(),
        tone: $("ad-tone").value,
        platform: $("ad-platform").value,
        branding: $("ad-branding").value.trim(),
      }),
    });
    lastAd = ad;
    renderAd(ad);
    toast("Ad generated");
  } catch (e) {
    toast(e.message, true);
    $("ad-wrap").innerHTML = `<div class="empty">Generation failed. ${esc(e.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate ad";
  }
});

function renderAd(ad) {
  lastAd = ad;
  campaignAd = ad;
  const sourceBadge = ad.ai_generated
    ? `<span class="chip green">AI-generated by Gemini</span>`
    : `<span class="chip" style="color:var(--danger);border-color:var(--danger)">Gemini unavailable — fallback copy</span>`;
  $("ad-wrap").innerHTML = `
    <div class="chips" style="margin-bottom:12px;">${sourceBadge}</div>
    <div class="ad-preview" id="ad-image-wrap"><img id="ad-image" src="${esc(ad.image_url)}" alt="ad preview" loading="lazy" /></div>
    <div class="ad-headline">${esc(ad.headline)}</div>
    <p style="margin:0 0 6px; line-height:1.55;">${esc(ad.copy)}</p>
    ${ad.cta ? `<span class="ad-cta">${esc(ad.cta)}</span>` : ""}
    ${
      (ad.design_suggestions || []).length
        ? `<p class="section-title" style="margin:20px 0 8px;">Design suggestions</p>
           <ul class="muted" style="margin:0; padding-left:18px; line-height:1.7;">
             ${ad.design_suggestions.map((d) => `<li>${esc(d)}</li>`).join("")}
           </ul>`
        : ""
    }
    <div class="prompt-edit">
      <div class="field-label">Image prompt — edit before regenerating</div>
      <textarea id="ad-image-prompt" class="tall">${esc(ad.image_prompt)}</textarea>
    </div>
    <div class="btn-row">
      <button class="btn ghost small" id="regen-image-btn">Regenerate image</button>
      <button class="btn ghost small" id="regen-ad-btn">Regenerate all (copy + image)</button>
    </div>
    <div class="prompt-edit" style="margin-top:14px;">
      <div class="field-label">Schedule publish (optional, stub)</div>
      <input type="datetime-local" id="ad-schedule" />
    </div>
    <div class="btn-row">
      <button class="btn small" id="publish-ad-btn">Publish ad (dry run)</button>
    </div>
    <pre id="publish-receipt" class="receipt-box" style="display:none;"></pre>`;

  $("regen-image-btn").addEventListener("click", regenImage);
  $("regen-ad-btn").addEventListener("click", () => $("generate-ad-btn").click());
  $("publish-ad-btn").addEventListener("click", () => queueMetaPublish(ad));
}

async function regenImage() {
  const prompt = $("ad-image-prompt")?.value.trim();
  if (!prompt) return toast("Enter an image prompt first", true);
  const btn = $("regen-image-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Rendering...`;
  try {
    const result = await api("/api/marketing/regenerate-image", {
      method: "POST",
      body: JSON.stringify({ image_prompt: prompt }),
    });
    $("ad-image").src = result.image_url;
    if (lastAd) {
      lastAd.image_url = result.image_url;
      lastAd.image_prompt = prompt;
      lastAd.seed = result.seed;
    }
    toast("Image regenerated");
  } catch (e) {
    toast(e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Regenerate image";
  }
}

async function queueMetaPublish(ad) {
  const sched = $("ad-schedule")?.value;
  const scheduled_at = sched ? new Date(sched).toISOString() : null;
  try {
    const { pending } = await api("/api/marketing/publish", {
      method: "POST",
      body: JSON.stringify({
        ad: { ...ad, platform: $("ad-platform").value },
        platform: $("ad-platform").value,
        scheduled_at,
      }),
    });
    refreshPending();
    toast(scheduled_at ? "Ad scheduled (stub) — approve in Pending" : "Ad queued — approve in Pending");
    const box = $("publish-receipt");
    if (box) {
      box.style.display = "block";
      box.textContent = JSON.stringify(pending, null, 2);
    }
  } catch (e) {
    toast(e.message, true);
  }
}

// ══════════════════════ ANALYTICS ══════════════════════
let analyticsData = null;
let analyticsView = "sends";
let analyticsCampaign = "all";
let analyticsFilterChannel = "all";
let analyticsFilterSource = "all";
let analyticsFilterSearch = "";
let analyticsSearchTimer;
let agentRecommendationsData = null;

function pct(n) {
  return `${Math.round((n || 0) * 100)}%`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function bar(label, rate, maxW = 100) {
  const w = Math.round((rate || 0) * maxW);
  return `<div class="bar-row"><span class="bar-label">${esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><span class="bar-val">${pct(rate)}</span></div>`;
}

function trackPills(row) {
  const pills = [
    ["Sent", row.sent_at],
    ["Opened", row.opened_at],
    ["Clicked", row.clicked_at],
    ["Replied", row.replied_at],
  ];
  return `<div class="track-pills">${pills
    .map(([label, ts]) => {
      const on = !!ts;
      const cls = label === "Replied" && on ? "track-pill reply on" : on ? "track-pill on" : "track-pill";
      return `<span class="${cls}" title="${on ? fmtDate(ts) : ""}">${label}</span>`;
    })
    .join("")}</div>`;
}

function channelBadge(ch) {
  const c = ch || "email";
  return `<span class="channel-badge ${esc(c)}">${c === "whatsapp" ? "WhatsApp" : "Email"}</span>`;
}

function renderFunnelStrip(funnel) {
  const stages = [
    ["scraped", "Scraped"],
    ["scored", "Scored"],
    ["outreached", "Contacted"],
    ["opened", "Opened"],
    ["replied", "Replied"],
    ["converted", "Converted"],
  ];
  return `<div class="funnel-strip">${stages
    .map(([key, label], i) => {
      const val = funnel?.[key] ?? 0;
      const active = val > 0 ? " active" : "";
      const arrow = i < stages.length - 1 ? `<span class="funnel-arrow">→</span>` : "";
      return `<div class="funnel-step${active}"><div class="funnel-step-val">${val}</div><div class="funnel-step-label">${label}</div></div>${arrow}`;
    })
    .join("")}</div>`;
}

function renderKpiGrid(t) {
  const items = [
    { val: t.leads ?? 0, label: "Total leads", sub: "In campaign" },
    { val: t.email_sent ?? 0, label: "Emails sent", sub: `${pct(t.open_rate)} open rate`, cls: "accent" },
    { val: t.whatsapp_sent ?? 0, label: "WhatsApp sent", sub: "Stub / queued", cls: "accent" },
    { val: t.opened ?? 0, label: "Opened", sub: "Email tracking pixel", highlight: true },
    { val: t.replied ?? 0, label: "Replied", sub: `${pct(t.reply_rate)} reply rate`, highlight: true },
    { val: t.converted ?? 0, label: "Converted", sub: `${pct(t.conversion_rate)} conv. rate`, highlight: true },
    { val: t.failed ?? 0, label: "Failed sends", sub: "SMTP / delivery", cls: "danger", warn: t.failed > 0 },
  ];
  return `<div class="analytics-kpi-grid">${items
    .map((k) => {
      const cls = ["analytics-kpi", k.highlight ? "highlight" : "", k.warn ? "warn" : ""].filter(Boolean).join(" ");
      const valCls = ["analytics-kpi-val", k.cls || ""].filter(Boolean).join(" ");
      return `<div class="${cls}"><div class="${valCls}">${k.val}</div><div class="analytics-kpi-label">${k.label}</div><div class="analytics-kpi-sub">${esc(k.sub)}</div></div>`;
    })
    .join("")}</div>`;
}

function renderAgentRecommendationsPanel(data) {
  const recs = data?.recommendations || [];
  if (!recs.length) return "";
  const state = data.state || {};
  return `
    <div class="analytics-section agent-panel" style="margin:0 0 16px;">
      <div class="analytics-section-head">
        <div>
          <h4>Agent recommendations</h4>
          <p class="muted" style="font-size:12px;margin:4px 0 0;">Next best actions based on saved leads, sends, replies, conversions, and source performance.</p>
        </div>
        <span class="agent-badge">feedback loop</span>
      </div>
      <div class="source-card-stats" style="margin-bottom:12px;">
        <span>Saved: <strong>${state.saved ?? 0}</strong></span>
        <span>Contacted: <strong>${state.contacted ?? 0}</strong></span>
        <span>Replied: <strong>${state.replied ?? 0}</strong></span>
        <span>Top source: <strong>${esc(state.top_source || "needs data")}</strong></span>
      </div>
      <div class="agent-rec-grid">
        ${recs
          .map(
            (rec) => `
          <div class="agent-rec-card ${esc(rec.priority || "low")}">
            <div class="agent-rec-head">
              <div>
                <div class="agent-rec-title">${esc(rec.action)}</div>
                <p class="agent-rec-reason">${esc(rec.reason)}</p>
              </div>
              <span class="agent-rec-priority ${esc(rec.priority || "low")}">${esc(rec.priority || "low")}</span>
            </div>
            <p class="agent-rec-next"><strong>Next:</strong> ${esc(rec.next_step)}</p>
            ${rec.metric ? `<p class="agent-rec-next"><strong>Signal:</strong> ${esc(rec.metric)}</p>` : ""}
          </div>`
          )
          .join("")}
      </div>
    </div>`;
}

function renderSourcePanel(bySource) {
  const entries = Object.entries(bySource || {}).sort((a, b) => (b[1].sent || 0) - (a[1].sent || 0));
  if (!entries.length) return `<p class="muted">No source data yet.</p>`;
  return `<div class="source-grid">${entries
    .map(
      ([src, v]) => `
    <div class="source-card">
      <div class="source-card-name">${esc(src)}</div>
      <div class="source-card-stats">
        <span><strong>${v.leads ?? 0}</strong> leads</span>
        <span><strong>${v.sent ?? 0}</strong> sent</span>
        <span><strong>${v.replied ?? 0}</strong> replied</span>
        <span><strong>${v.converted ?? 0}</strong> converted</span>
      </div>
      <div class="bar-val">${pct(v.reply_rate)} reply</div>
    </div>`
    )
    .join("")}</div>`;
}

function renderRespondersPanel(responders) {
  if (!responders?.length) {
    return `<p class="muted">No replies yet. Mark email replies manually or use the WhatsApp webhook.</p>`;
  }
  return `<div class="responder-cards">${responders
    .map(
      (r) => `
    <div class="responder-card">
      <div class="responder-card-head">
        <div>
          <div class="responder-card-name">${esc(r.lead_name || "Unknown")}</div>
          <div class="responder-card-meta">
            ${channelBadge(r.channel)} · Source: <strong>${esc(r.source || "—")}</strong>
            ${r.manual ? ' · <span class="muted">Manual</span>' : ""}
          </div>
        </div>
        ${funnelBadge(r.funnel_status)}
      </div>
      <div class="responder-card-meta" style="margin-top:8px;">
        To: ${esc(r.to || "—")} · Replied: ${fmtDate(r.replied_at)} · Sent: ${fmtDate(r.sent_at)}
      </div>
    </div>`
    )
    .join("")}</div>`;
}

function filterSendLog(log, { channel, source, q }) {
  return (log || []).filter((row) => {
    if (channel && channel !== "all" && row.channel !== channel) return false;
    if (source && source !== "all" && (row.source || "unknown") !== source) return false;
    if (q) {
      const hay = `${row.lead_name || ""} ${row.to || ""} ${row.subject || ""} ${row.source || ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });
}

function renderSendLogTable(rows) {
  if (!rows.length) return `<p class="muted">No sends match your filters.</p>`;
  return `<div class="analytics-table-wrap"><table class="analytics-table">
    <thead><tr>
      <th>Company</th><th>Source</th><th>Channel</th><th>To</th><th>Sent</th><th>Tracking</th><th>Funnel</th><th>Score</th><th>Actions</th>
    </tr></thead>
    <tbody>${rows
      .map((row) => {
        const replied = !!row.replied_at;
        return `<tr class="${replied ? "responder-row" : ""}">
          <td><strong>${esc(row.lead_name || "—")}</strong>${row.subject ? `<br/><span class="muted">${esc(row.subject.slice(0, 50))}${row.subject.length > 50 ? "…" : ""}</span>` : ""}</td>
          <td><span class="muted">${esc(row.source || "—")}</span></td>
          <td>${channelBadge(row.channel)}</td>
          <td class="muted">${esc(row.to || "—")}</td>
          <td class="muted">${fmtDate(row.sent_at)}</td>
          <td>${trackPills(row)}</td>
          <td>${funnelBadge(row.funnel_status)}</td>
          <td>${row.score ?? "—"}</td>
          <td><div class="analytics-actions">
            ${replied ? "" : `<button type="button" class="btn ghost small" data-mark-replied="${esc(row.id)}">Mark replied</button>`}
            ${row.funnel_status === "converted" ? "" : `<button type="button" class="btn ghost small" data-mark-converted="${esc(row.id)}">Converted</button>`}
          </div></td>
        </tr>`;
      })
      .join("")}</tbody></table></div>`;
}

function renderAnalyticsMain() {
  if (!analyticsData) return;
  const wrap = $("analytics-wrap");
  const t = analyticsData.totals || {};
  const sendLog = analyticsData.send_log || [];
  const filtered = filterSendLog(sendLog, {
    channel: analyticsFilterChannel,
    source: analyticsFilterSource,
    q: analyticsFilterSearch,
  });

  const mainPanel =
    analyticsView === "responders"
      ? renderRespondersPanel(analyticsData.responders)
      : analyticsView === "sources"
        ? renderSourcePanel(analyticsData.by_source)
        : `<div class="analytics-filters">
            <input type="search" id="analytics-filter-search" placeholder="Search company, email, source…" value="${esc(analyticsFilterSearch)}" />
            <select id="analytics-filter-channel"><option value="all">All channels</option><option value="email" ${analyticsFilterChannel === "email" ? "selected" : ""}>Email</option><option value="whatsapp" ${analyticsFilterChannel === "whatsapp" ? "selected" : ""}>WhatsApp</option></select>
            <select id="analytics-filter-source"><option value="all">All sources</option>${(analyticsData.sources || []).map((s) => `<option value="${esc(s)}" ${analyticsFilterSource === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
          </div>
          ${renderSendLogTable(filtered)}`;

  wrap.innerHTML = `
    ${renderAgentRecommendationsPanel(agentRecommendationsData)}
    ${renderKpiGrid(t)}
    ${renderFunnelStrip(analyticsData.funnel)}
    <div class="analytics-panels split">
      <div class="analytics-section">
        <div class="analytics-section-head">
          <h4>Outreach activity</h4>
          <div class="analytics-view-tabs">
            <button type="button" class="analytics-view-tab ${analyticsView === "sends" ? "active" : ""}" data-aview="sends">All sends (${sendLog.length})</button>
            <button type="button" class="analytics-view-tab ${analyticsView === "responders" ? "active" : ""}" data-aview="responders">Responders (${(analyticsData.responders || []).length})</button>
            <button type="button" class="analytics-view-tab ${analyticsView === "sources" ? "active" : ""}" data-aview="sources">By source</button>
          </div>
        </div>
        ${mainPanel}
        ${
          (analyticsData.ab_decisions || []).length
            ? `<p class="section-title" style="margin:16px 0 8px;">Recent A/B decisions</p>
               <ul class="muted" style="font-size:12px;">${analyticsData.ab_decisions.map((d) => `<li>Winner <strong>${esc(d.winner)}</strong> — ${esc(d.reason || "")}</li>`).join("")}</ul>`
            : ""
        }
      </div>
      <div class="analytics-section">
        <div class="analytics-section-head"><h4>Latest responders</h4></div>
        ${renderRespondersPanel((analyticsData.responders || []).slice(0, 8))}
        <p class="section-title" style="margin:16px 0 8px;">Channel breakdown</p>
        <div class="source-card-stats" style="margin-bottom:10px;">
          <span>Email: <strong>${analyticsData.by_channel?.email?.sent ?? 0}</strong> sent · <strong>${analyticsData.by_channel?.email?.replied ?? 0}</strong> replied</span>
        </div>
        <div class="source-card-stats">
          <span>WhatsApp: <strong>${analyticsData.by_channel?.whatsapp?.sent ?? 0}</strong> sent · <strong>${analyticsData.by_channel?.whatsapp?.replied ?? 0}</strong> replied</span>
        </div>
        <p class="section-title" style="margin:16px 0 8px;">Meta ads (stub)</p>
        <p class="muted" style="font-size:12px;">Published: ${analyticsData.meta_ads?.published ?? 0} · Scheduled: ${analyticsData.meta_ads?.scheduled ?? 0}</p>
      </div>
    </div>`;

  wrap.querySelectorAll("[data-aview]").forEach((btn) => {
    btn.addEventListener("click", () => {
      analyticsView = btn.dataset.aview;
      renderAnalyticsMain();
    });
  });

  $("analytics-filter-search")?.addEventListener("input", (e) => {
    clearTimeout(analyticsSearchTimer);
    analyticsSearchTimer = setTimeout(() => {
      analyticsFilterSearch = e.target.value.trim();
      renderAnalyticsMain();
    }, 200);
  });
  $("analytics-filter-channel")?.addEventListener("change", (e) => {
    analyticsFilterChannel = e.target.value;
    renderAnalyticsMain();
  });
  $("analytics-filter-source")?.addEventListener("change", (e) => {
    analyticsFilterSource = e.target.value;
    renderAnalyticsMain();
  });

  wrap.querySelectorAll("[data-mark-replied]").forEach((btn) => {
    btn.addEventListener("click", () => markOutreachReplied(btn.dataset.markReplied));
  });
  wrap.querySelectorAll("[data-mark-converted]").forEach((btn) => {
    btn.addEventListener("click", () => markOutreachConverted(btn.dataset.markConverted));
  });
}

function populateAnalyticsCampaigns(data) {
  const sel = $("analytics-campaign");
  if (!sel) return;
  const current = analyticsCampaign || data.campaign_id || "all";
  const campaigns = data.campaigns || [];
  sel.innerHTML =
    `<option value="all">All campaigns</option>` +
    campaigns.map((c) => `<option value="${esc(c.id)}">${esc(c.name || c.id)}</option>`).join("");
  sel.value = campaigns.some((c) => c.id === current) ? current : "all";
  analyticsCampaign = sel.value;
}

async function markOutreachReplied(logId) {
  try {
    await api(`/api/analytics/outreach/${logId}/mark-replied`, { method: "POST" });
    toast("Marked as replied");
    await loadAnalytics(true);
  } catch (e) {
    toast(e.message, true);
  }
}

async function markOutreachConverted(logId) {
  try {
    await api(`/api/analytics/outreach/${logId}/mark-converted`, { method: "POST" });
    toast("Marked as converted");
    await loadAnalytics(true);
  } catch (e) {
    toast(e.message, true);
  }
}

async function loadAnalytics(skipLoading = false) {
  const wrap = $("analytics-wrap");
  if (!skipLoading) wrap.innerHTML = `<div class="empty"><span class="spinner"></span> Loading analytics…</div>`;
  try {
    const cid = analyticsCampaign || $("analytics-campaign")?.value || "all";
    analyticsCampaign = cid;
    const data = await api(`/api/analytics/summary?campaign_id=${encodeURIComponent(cid)}`);
    agentRecommendationsData = await api(`/api/agent/recommendations?campaign_id=${encodeURIComponent(cid)}`).catch(() => null);
    analyticsData = data;
    renderAgentChecklist(agentRecommendationsData?.checklist || []);
    populateAnalyticsCampaigns(data);
    renderAnalyticsMain();
  } catch (e) {
    wrap.innerHTML = `<div class="empty">Failed to load analytics. ${esc(e.message)}</div>`;
  }
}

$("analytics-campaign")?.addEventListener("change", (e) => {
  analyticsCampaign = e.target.value;
  loadAnalytics();
});
$("analytics-refresh")?.addEventListener("click", () => loadAnalytics());
$("analytics-export")?.addEventListener("click", () => {
  const cid = analyticsCampaign || "all";
  window.location.href = `/api/analytics/send-log.csv?campaign_id=${encodeURIComponent(cid)}`;
  toast("Downloading send log CSV…");
});

// ── init ──
loadScrapers();
loadTestCases();
loadAdTestCases();
refreshPending();
loadCampaignAd();
setInterval(refreshPending, 15000);
loadLeads("inbox");
