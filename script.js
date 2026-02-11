/* script.js
   - Cocok dengan index.html + style.css kamu (putih-biru, full width)
   - Wizard + Results + AI + Goals S2 + Goals Lainnya + Charts + Roadmap
   - Memakai fungsi WAJIB: getDefaultSteps(), sum(), calculateFinancial() (EXACT)
   - Presisi contoh:
     Net Worth = 17.750.000
     Saving Ratio ≈ 38%
     Debt Ratio ≈ 19%
     Liquidity ≈ 3.6 (pendekatan operasional: assetCash / (expenses - saving - zakat))
*/

function getDefaultSteps() {
  return {
    'step-financial': {
      id: 'step-financial',
      title: 'Financial Checkup',
      type: 'financial-checkup',
      isComplete: false,
      data: {
        assets: {
          cash: {
            cashOnHand: 5000000,
            savings: 0,
            deposito: 0,
            rdpu: 15000000
          },
          investments: {
            emas: 0,
            rdpt: 0,
            rdc: 0,
            rds: 0,
            obligasi: 15000000,
            saham: 0
          },
          nonLiquid: {
            konsumsi: {
              mobil atau motor: 4000000
            },
            investasi: {
              bpjs: 4000000
            }
          }
        },
        liabilities: {
          shortTerm: {
            creditCard: 250000
          },
          longTerm: {
            homeLoan: 25000000
          }
        },
        income: {
          salary: 13000000
        },
        expenses: {
          saving: 5000000,
          zakat: 100000,
          utilities: 600000,
          groceries: 1800000,
          transport: 650000,
          installment: 2500000
        }
      }
    }
  };
}

function sum(obj) {
  return Object.values(obj || {}).reduce((a, b) => a + (Number(b) || 0), 0);
}

function calculateFinancial(data) {
  const assetCash = sum(data.assets.cash);
  const assetInvest = sum(data.assets.investments);
  const assetNonLiquid =
    sum(data.assets.nonLiquid.konsumsi) +
    sum(data.assets.nonLiquid.investasi);

  const totalAssets = assetCash + assetInvest + assetNonLiquid;

  const shortDebt = sum(data.liabilities.shortTerm);
  const longDebt = sum(data.liabilities.longTerm);
  const totalDebt = shortDebt + longDebt;

  const income = sum(data.income);
  const expenses = sum(data.expenses);

  return {
    assetCash,
    assetInvest,
    assetNonLiquid,
    totalAssets,
    totalDebt,
    netWorth: totalAssets - totalDebt,

    liquidityRatio: assetCash / expenses,
    savingRatio: (data.expenses.saving / income) * 100,
    debtRatio: (data.expenses.installment / income) * 100,

    cashflow: income - expenses
  };
}

/* =========================
   STATE + STORAGE
========================= */
const STORAGE_KEY = "cfp_fullsystem_financial_v2";
const GOALS_S2_KEY = "cfp_fullsystem_goals_s2_v2";
const GOALS_MULTI_KEY = "cfp_fullsystem_goals_multi_v2";

let stepsState = loadState();
let goalsS2State = loadGoalsS2();
let goalsMultiState = loadGoalsMulti();

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try { return JSON.parse(raw); } catch(e){}
  }
  return getDefaultSteps();
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stepsState));
  localStorage.setItem(STORAGE_KEY + "_lastSaved", String(Date.now()));
}
function loadGoalsS2(){
  const raw = localStorage.getItem(GOALS_S2_KEY);
  if(raw){
    try { return JSON.parse(raw); } catch(e){}
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return {
    tuition: 220000000,
    living: 180000000,
    visaInsurance: 25000000,
    flight: 15000000,
    buffer: 30000000,
    currentFund: 0,
    startDate: `${y+2}-${m}-${d}`,
    scholarshipChance: "none", // none / partial / full
    sideIncome: 0
  };
}
function saveGoalsS2(){ localStorage.setItem(GOALS_S2_KEY, JSON.stringify(goalsS2State)); }

function loadGoalsMulti(){
  const raw = localStorage.getItem(GOALS_MULTI_KEY);
  if(raw){
    try { return JSON.parse(raw); } catch(e){}
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return {
    items: [
      { id: genId(), type:"nikah", name:"Nikah", target:80000000, current:0, date:`${y+1}-${m}-${d}`, priority:"tinggi" },
      { id: genId(), type:"rumah", name:"DP Rumah", target:250000000, current:0, date:`${y+3}-${m}-${d}`, priority:"tinggi" },
      { id: genId(), type:"anak", name:"Dana Persiapan Anak (tahun 1)", target:60000000, current:0, date:`${y+2}-${m}-${d}`, priority:"sedang" }
    ]
  };
}
function saveGoalsMulti(){ localStorage.setItem(GOALS_MULTI_KEY, JSON.stringify(goalsMultiState)); }

/* =========================
   DOM HELPERS
========================= */
const nav = document.getElementById("nav");
const sections = {
  landing: document.getElementById("section-landing"),
  checkup: document.getElementById("section-checkup"),
  results: document.getElementById("section-results"),
  ai: document.getElementById("section-ai"),
  goals: document.getElementById("section-goals"),
  goals2: document.getElementById("section-goals2"),
  visuals: document.getElementById("section-visuals"),
  plan: document.getElementById("section-plan"),
};

function $(id){ return document.getElementById(id); }

function toast(msg){
  const el = $("toast");
  if(!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove("show"), 2200);
}

function formatIDR(n){
  const num = Number(n) || 0;
  return "Rp " + num.toLocaleString("id-ID");
}
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function genId(){
  // no dependency; safe fallback if crypto not available
  try { return crypto.randomUUID(); } catch(e){}
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}

function getData(){ return stepsState["step-financial"].data; }

function setByPath(obj, path, value){
  const parts = path.split(".");
  let cur = obj;
  for(let i=0;i<parts.length-1;i++){
    const k = parts[i];
    if(!(k in cur)) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length-1]] = value;
}

/* =========================
   NAVIGATION
========================= */
function setActiveSection(key){
  Object.entries(sections).forEach(([k, el])=>{
    if(!el) return;
    el.classList.toggle("active", k===key);
  });
  if(nav){
    Array.from(nav.querySelectorAll("button[data-target]")).forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.target===key);
    });
  }
  window.scrollTo({top:0, behavior:"smooth"});

  // render per page
  if(key==="landing") renderLanding();
  if(key==="checkup") renderWizard();
  if(key==="results") renderResults();
  if(key==="ai") renderAI();
  if(key==="goals") renderGoalsS2();
  if(key==="goals2") renderGoalsMulti();
  if(key==="visuals") renderVisuals();
  if(key==="plan") renderPlan();
}

if(nav){
  nav.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-target]");
    if(!btn) return;
    setActiveSection(btn.dataset.target);
  });
}

document.addEventListener("keydown", (e)=>{
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="k"){
    e.preventDefault();
    setActiveSection("checkup");
  }
});

/* =========================
   FINANCIAL DERIVED (LIQUIDITY ~ 3.6)
   - liquidityOperational = assetCash / (expenses - saving - zakat)
   - sesuai catatan di results kamu
========================= */
function calculateDerived(fin, data){
  const income = sum(data.income);
  const expensesTotal = sum(data.expenses);
  const saving = Number(data.expenses.saving)||0;
  const zakat = Number(data.expenses.zakat)||0;
  const operational = Math.max(0, expensesTotal - saving - zakat);

  const liquidityOperational = operational > 0 ? (fin.assetCash / operational) : Infinity;
  return { income, expensesTotal, saving, zakat, operational, liquidityOperational };
}

/* =========================
   STATUS + EXPLANATION
========================= */
function statusPill(type, text){
  const emoji = type==="good"?"🟢":type==="warn"?"🟡":type==="bad"?"🔴":"🔵";
  return `<span class="pill ${type}"><strong>${emoji}</strong> ${text}</span>`;
}

function liquidityStatus(liqOp){
  if(!isFinite(liqOp)) return {type:"info", title:"Data operasional 0", impact:"Pengeluaran operasional terdeteksi 0. Pastikan input pengeluaran sudah benar."};
  if(liqOp < 3) return {type:"warn", title:"Kurang aman (<3 bulan)", impact:"Kalau ada kejadian mendadak, kamu berisiko pakai utang mahal atau mengganggu goals."};
  if(liqOp < 6) return {type:"good", title:"Aman (3–6 bulan)", impact:"Kamu punya bantalan wajar untuk gangguan umum tanpa panik."};
  return {type:"good", title:"Kuat (≥6 bulan)", impact:"Bantalan besar. Pastikan dana tidak semua parkir di instrumen return rendah."};
}
function savingStatus(sr){
  if(sr < 10) return {type:"bad", title:"Rendah (<10%)", impact:"Goals besar bakal lambat. Biasanya perlu audit bocor + naikkan income."};
  if(sr < 20) return {type:"warn", title:"Sedang (10–20%)", impact:"Cukup untuk stabil, tapi goals besar butuh strategi ekstra."};
  if(sr < 30) return {type:"good", title:"Bagus (20–30%)", impact:"Ada ruang untuk investasi & goals dengan lebih tenang."};
  return {type:"good", title:"Sangat kuat (≥30%)", impact:"Power besar untuk goals. Jaga agar tidak mengorbankan likuiditas & kebutuhan."};
}
function debtStatus(dr){
  if(dr > 30) return {type:"bad", title:"Bahaya (>30%)", impact:"Cicilan makan porsi besar. Risiko goyah saat cashflow terganggu."};
  if(dr > 20) return {type:"warn", title:"Agak ketat (20–30%)", impact:"Masih aman, tapi ruang buat goals/investasi jadi sempit."};
  return {type:"good", title:"Aman (≤20%)", impact:"Cicilan relatif terkendali. Fokus ke bunga & disiplin pembayaran."};
}
function cashflowStatus(cf){
  if(cf < 0) return {type:"bad", title:"Defisit", impact:"Kalau dibiarkan, akan makan tabungan/utang. Benahi struktur pengeluaran dulu."};
  if(cf < 500000) return {type:"warn", title:"Tipis", impact:"Shock kecil bisa bikin defisit. Perlu buffer dan kontrol pengeluaran."};
  return {type:"good", title:"Surplus", impact:"Ada ruang untuk autopay goals, investasi, dan percepatan pelunasan utang mahal."};
}

/* =========================
   UI BUILDERS
========================= */
function metricCard(name, value, type, statusTitle, desc){
  return `
    <div class="metric">
      <div class="top">
        <p class="name">${name}</p>
        ${statusPill(type, statusTitle)}
      </div>
      <p class="value">${value}</p>
      <p class="desc">${desc}</p>
    </div>
  `;
}
function numberField(label, path, value, mini){
  return `
    <div class="field">
      <label>${label}</label>
      <input type="number" min="0" step="1000" data-path="${path}" value="${Number(value)||0}" />
      <div class="mini">${mini}</div>
    </div>
  `;
}

/* =========================
   LANDING
========================= */
function renderLanding(){
  const data = getData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);

  const liq = liquidityStatus(d.liquidityOperational);
  const sav = savingStatus(fin.savingRatio);
  const deb = debtStatus(fin.debtRatio);
  const cf = cashflowStatus(fin.cashflow);

  const kpi = $("kpiLanding");
  if(!kpi) return;

  kpi.innerHTML = `
    <div class="kpi">
      <div class="label">Net Worth</div>
      <div class="value">${formatIDR(fin.netWorth)}</div>
      <div class="hint">Aset ${formatIDR(fin.totalAssets)} - Utang ${formatIDR(fin.totalDebt)}.</div>
    </div>

    <div class="kpi">
      <div class="label">Cashflow Bulanan</div>
      <div class="value">${formatIDR(fin.cashflow)}</div>
      <div class="hint">${cf.title}: ${cf.impact}</div>
    </div>

    <div class="kpi">
      <div class="label">Likuiditas (operasional)</div>
      <div class="value">${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"}x</div>
      <div class="hint">${liq.title}. Dampak: ${liq.impact}</div>
    </div>

    <div class="kpi">
      <div class="label">Saving / Debt Ratio</div>
      <div class="value">${fin.savingRatio.toFixed(0)}% / ${fin.debtRatio.toFixed(0)}%</div>
      <div class="hint">Saving: ${sav.title}. Utang: ${deb.title}.</div>
    </div>
  `;
}

/* =========================
   WIZARD
========================= */
const wizardMeta = [
  { key:"assets", title:"Step 1: Aset", desc:"Isi aset kas/likuid, investasi, dan non-likuid. Fokus: berapa yang cepat dicairkan kalau darurat." },
  { key:"liabilities", title:"Step 2: Kewajiban (Utang)", desc:"Isi utang jangka pendek dan panjang. Fokus: utang bunga mahal dulu." },
  { key:"income", title:"Step 3: Pendapatan", desc:"Isi pendapatan bulanan rutin. Untuk non-rutin, pakai rata-rata konservatif." },
  { key:"expenses", title:"Step 4: Pengeluaran", desc:"Isi pengeluaran bulanan. 'Saving' dianggap alokasi tujuan (bukan beban operasional)." }
];

let wizardIndex = 0;

function calcCompletionFlags(){
  const d = getData();
  return {
    assets: (sum(d.assets.cash)+sum(d.assets.investments)+sum(d.assets.nonLiquid.konsumsi)+sum(d.assets.nonLiquid.investasi)) > 0,
    liabilities: (sum(d.liabilities.shortTerm)+sum(d.liabilities.longTerm)) >= 0,
    income: sum(d.income) > 0,
    expenses: sum(d.expenses) > 0
  };
}

function updateLastSavedPill(){
  const el = $("pillLastSaved");
  if(!el) return;
  const t = localStorage.getItem(STORAGE_KEY + "_lastSaved");
  if(!t){ el.textContent = "Terakhir simpan: —"; return; }
  const dt = new Date(Number(t));
  el.textContent = "Terakhir simpan: " + dt.toLocaleString("id-ID");
}

function renderWizardSteps(){
  const el = $("wizardSteps");
  if(!el) return;

  const flags = calcCompletionFlags();
  const totalComplete = wizardMeta.filter(m=>flags[m.key]).length;

  const prog = $("wizardProgressPill");
  if(prog) prog.textContent = `Progress: ${totalComplete}/4`;

  el.innerHTML = wizardMeta.map((m, idx)=>{
    const ok = flags[m.key];
    return `
      <div class="step ${idx===wizardIndex?"active":""}" data-idx="${idx}">
        <div>
          <div class="t">${m.title}</div>
          <div class="s">${ok ? "Terisi" : "Belum lengkap"}</div>
        </div>
        <div class="badge ${ok?"good":"warn"}">${ok ? "✓" : (idx+1)}</div>
      </div>
    `;
  }).join("");

  el.onclick = (e)=>{
    const step = e.target.closest(".step[data-idx]");
    if(!step) return;
    wizardIndex = Number(step.dataset.idx)||0;
    renderWizard();
  };
}

function renderWizard(){
  renderWizardSteps();
  updateLastSavedPill();

  const title = $("wizardStepTitle");
  const desc = $("wizardStepDesc");
  const formWrap = $("wizardForm");
  if(!title || !desc || !formWrap) return;

  const meta = wizardMeta[wizardIndex];
  title.textContent = meta.title;
  desc.textContent = meta.desc;

  const d = getData();

  if(meta.key==="assets"){
    formWrap.innerHTML = `
      <div class="card-title">Aset Kas / Likuid</div>
      <div class="form">
        ${numberField("Cash di tangan","assets.cash.cashOnHand",d.assets.cash.cashOnHand,"Termasuk cash & e-wallet yang bisa langsung dipakai.")}
        ${numberField("Tabungan","assets.cash.savings",d.assets.cash.savings,"Tabungan bank yang bisa dicairkan kapan pun.")}
        ${numberField("Deposito","assets.cash.deposito",d.assets.cash.deposito,"Deposito jangka pendek.")}
        ${numberField("RDPU","assets.cash.rdpu",d.assets.cash.rdpu,"Reksa Dana Pasar Uang (likuid & relatif stabil).")}
      </div>
      <div class="divider"></div>
      <div class="card-title">Aset Investasi</div>
      <div class="form">
        ${numberField("Emas","assets.investments.emas",d.assets.investments.emas,"Nilai pasar saat ini.")}
        ${numberField("RDPT","assets.investments.rdpt",d.assets.investments.rdpt,"Reksa Dana Pendapatan Tetap.")}
        ${numberField("RDC","assets.investments.rdc",d.assets.investments.rdc,"Reksa Dana Campuran.")}
        ${numberField("RDS","assets.investments.rds",d.assets.investments.rds,"Reksa Dana Saham.")}
        ${numberField("Obligasi","assets.investments.obligasi",d.assets.investments.obligasi,"Nilai pasar obligasi saat ini.")}
        ${numberField("Saham","assets.investments.saham",d.assets.investments.saham,"Nilai pasar portfolio saham.")}
      </div>
      <div class="divider"></div>
      <div class="card-title">Aset Non-Likuid</div>
      <div class="form">
        ${numberField("Kendaraan (Motor/mobil/konsumsi)","assets.nonLiquid.konsumsi.motor",d.assets.nonLiquid.konsumsi.motor,"Aset sulit dicairkan cepat.")}
        ${numberField("BPJS (investasi)","assets.nonLiquid.investasi.bpjs",d.assets.nonLiquid.investasi.bpjs,"Saldo/manfaat jangka panjang.")}
      </div>
    `;
  }

  if(meta.key==="liabilities"){
    formWrap.innerHTML = `
      <div class="card-title">Utang Jangka Pendek</div>
      <div class="form">
        ${numberField("Kartu Kredit / Paylater","liabilities.shortTerm.creditCard",d.liabilities.shortTerm.creditCard,"Outstanding tagihan berjalan.")}
      </div>
      <div class="divider"></div>
      <div class="card-title">Utang Jangka Panjang</div>
      <div class="form">
        ${numberField("KPR / Home Loan","liabilities.longTerm.homeLoan",d.liabilities.longTerm.homeLoan,"Sisa pokok utang.")}
      </div>
    `;
  }

  if(meta.key==="income"){
    formWrap.innerHTML = `
      <div class="card-title">Pendapatan Bulanan</div>
      <div class="form">
        ${numberField("Gaji (rutin)","income.salary",d.income.salary,"Take-home pay bulanan rata-rata.")}
      </div>
    `;
  }

  if(meta.key==="expenses"){
    formWrap.innerHTML = `
      <div class="card-title">Pengeluaran Bulanan</div>
      <div class="form">
        ${numberField("Saving (alokasi tujuan)","expenses.saving",d.expenses.saving,"Alokasi untuk tabungan/investasi/goals.")}
        ${numberField("Zakat","expenses.zakat",d.expenses.zakat,"Rata-rata bulanan (tetap dihitung total & cashflow).")}
        ${numberField("Utilities","expenses.utilities",d.expenses.utilities,"Listrik, air, internet, pulsa.")}
        ${numberField("Groceries","expenses.groceries",d.expenses.groceries,"Belanja bulanan / makan harian.")}
        ${numberField("Transport","expenses.transport",d.expenses.transport,"Bensin/ojol, parkir, tol.")}
        ${numberField("Cicilan (monthly installment)","expenses.installment",d.expenses.installment,"Total cicilan bulanan.")}
      </div>
    `;
  }

  // bind inputs
  formWrap.querySelectorAll("input[data-path]").forEach(inp=>{
    inp.addEventListener("input", ()=>{
      const path = inp.dataset.path;
      const val = Number(inp.value || 0);
      setByPath(stepsState["step-financial"].data, path, isNaN(val)?0:val);
      saveState();
      updateLastSavedPill();
      renderQuickMetrics();
    });
  });

  // buttons
  const prev = $("btnPrev"), next = $("btnNext");
  if(prev) prev.disabled = wizardIndex===0;
  if(next) next.textContent = wizardIndex===wizardMeta.length-1 ? "Selesai → Dashboard" : "Berikutnya →";

  renderQuickMetrics();
}

function renderQuickMetrics(){
  const wrap = $("quickMetrics");
  if(!wrap) return;

  const data = getData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);

  const liqS = liquidityStatus(d.liquidityOperational);
  const savS = savingStatus(fin.savingRatio);
  const debS = debtStatus(fin.debtRatio);
  const cfS = cashflowStatus(fin.cashflow);

  wrap.innerHTML = `
    ${metricCard("Likuiditas (Operasional)", `${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"}x`, liqS.type, liqS.title, liqS.impact)}
    ${metricCard("Saving Ratio", `${fin.savingRatio.toFixed(0)}%`, savS.type, savS.title, savS.impact)}
    ${metricCard("Debt Ratio (Cicilan)", `${fin.debtRatio.toFixed(0)}%`, debS.type, debS.title, debS.impact)}
    ${metricCard("Net Worth", formatIDR(fin.netWorth), fin.netWorth>=0?"good":"warn", fin.netWorth>=0?"Positif":"Negatif", `Aset ${formatIDR(fin.totalAssets)} - Utang ${formatIDR(fin.totalDebt)}.`)}
    ${metricCard("Cashflow", formatIDR(fin.cashflow), cfS.type, cfS.title, cfS.impact)}
    ${metricCard("Total Aset", formatIDR(fin.totalAssets), "info", "Komposisi penting", "Seimbangkan likuiditas vs investasi sesuai tujuan." )}
  `;
}

/* =========================
   RESULTS PAGE
========================= */
function renderResults(){
  const wrap = $("resultsMetrics");
  if(!wrap) return;

  const data = getData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);

  const liqS = liquidityStatus(d.liquidityOperational);
  const savS = savingStatus(fin.savingRatio);
  const debS = debtStatus(fin.debtRatio);
  const cfS = cashflowStatus(fin.cashflow);

  wrap.innerHTML = `
    ${metricCard("Rasio Likuiditas (Operasional)", `${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"}x`, liqS.type, liqS.title, `Dampak: ${liqS.impact}`)}
    ${metricCard("Rasio Menabung", `${fin.savingRatio.toFixed(0)}%`, savS.type, savS.title, `Dampak: ${savS.impact}`)}
    ${metricCard("Rasio Utang (Cicilan)", `${fin.debtRatio.toFixed(0)}%`, debS.type, debS.title, `Dampak: ${debS.impact}`)}
    ${metricCard("Net Worth", formatIDR(fin.netWorth), fin.netWorth>=0?"good":"warn", fin.netWorth>=0?"Bersih positif":"Bersih negatif", `Aset ${formatIDR(fin.totalAssets)} - Utang ${formatIDR(fin.totalDebt)}.`)}
    ${metricCard("Cashflow Bulanan", formatIDR(fin.cashflow), cfS.type, cfS.title, `Dampak: ${cfS.impact}`)}
    ${metricCard("Aset Likuid (Kas/RDPU)", formatIDR(fin.assetCash), "info", "Fondasi", "Aset likuid menentukan ketahanan dana darurat." )}
  `;

  const detail = $("resultsDetail");
  if(detail){
    detail.innerHTML = `
      <div class="pill info"><strong>Total Aset:</strong> ${formatIDR(fin.totalAssets)}</div>
      <div class="space"></div>
      <div class="pill info"><strong>Total Utang:</strong> ${formatIDR(fin.totalDebt)}</div>
      <div class="space"></div>
      <div class="pill info"><strong>Cash:</strong> ${formatIDR(fin.assetCash)}</div>
      <div class="space"></div>
      <div class="pill info"><strong>Investasi:</strong> ${formatIDR(fin.assetInvest)}</div>
      <div class="space"></div>
      <div class="pill info"><strong>Non-likuid:</strong> ${formatIDR(fin.assetNonLiquid)}</div>
    `;
  }

  const narr = $("resultsNarrative");
  if(narr){
    const liq = isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞";
    narr.innerHTML = `
      <div style="line-height:1.75">
        • Likuiditas operasional: <strong>${liq} bulan</strong> (kas ÷ pengeluaran operasional).<br/>
        • Saving ratio: <strong>${fin.savingRatio.toFixed(0)}%</strong>. Debt ratio: <strong>${fin.debtRatio.toFixed(0)}%</strong>.<br/>
        • Cashflow: <strong>${formatIDR(fin.cashflow)}</strong> per bulan.<br/>
        <div class="space"></div>
        Fokus prioritas biasanya begini: <strong>cashflow → dana darurat → utang mahal → investasi → goals besar</strong>.
      </div>
    `;
  }
}

/* =========================
   AI RECOMMENDATION ENGINE (WAJIB)
========================= */
function getInvestmentAllocationStrategy(fin, data){
  const d = calculateDerived(fin, data);
  const liqOp = d.liquidityOperational;
  const sr = fin.savingRatio;
  const dr = fin.debtRatio;

  const bullets = [];
  bullets.push("Pondasi dulu: dana darurat operasional minimal ≥ 3 bulan.");
  bullets.push("Setelah pondasi aman, baru bagi alokasi berdasar horizon tujuan.");

  if(liqOp < 3){
    bullets.push("Karena likuiditas rendah: fokus RDPU/deposito/tabungan sampai aman. Tahan porsi saham tinggi dulu.");
    bullets.push("Mulai DCA kecil boleh, tapi jangan sampai mengorbankan dana darurat.");
    return { bullets, note:"Risiko terbesar sekarang bukan ketinggalan cuan, tapi kepepet lalu utang mahal/jual rugi." };
  }

  bullets.push("Alokasi umum:");
  bullets.push("• Dana darurat: tabungan/RDPU/deposito (likuid).");
  bullets.push("• Tujuan 3–5 tahun: RDPT/obligasi (lebih stabil).");
  bullets.push("• >5 tahun: RDS/saham bertahap (DCA) sesuai risiko.");

  if(sr >= 30 && dr <= 30) bullets.push("Saving kuat: kamu bisa DCA growth lebih konsisten (tetap disiplin).");
  if(dr > 30) bullets.push("Debt ratio tinggi: lebih baik percepat pelunasan utang mahal sebelum agresif investasi berisiko.");

  return { bullets, note:"Kunci investasi: cocokkan instrumen dengan jangka waktu. Disiplin bulanan > timing." };
}

function getDebtPrioritizationStrategy(fin, data){
  const shortDebt = sum(data.liabilities.shortTerm);
  const longDebt = sum(data.liabilities.longTerm);
  const dr = fin.debtRatio;

  const bullets = [];
  bullets.push("List semua utang: bunga efektif, minimum payment, sisa pokok, tenor.");
  bullets.push("Metode utama: Avalanche (bayar minimum semua, ekstra fokus ke bunga tertinggi).");
  bullets.push("Snowball boleh untuk motivasi, tapi jangan biarkan utang bunga tinggi jalan lama.");

  if(shortDebt > 0) bullets.push("Kartu kredit/paylater biasanya paling mahal: prioritas #1.");
  if(longDebt > 0) bullets.push("KPR: kalau bunganya kompetitif dan cashflow aman, tidak perlu dipaksa lunas dulu.");

  let tone = "good";
  let note = "Utang bisa dikelola. Fokus utama: hentikan bunga berjalan & lunasi yang paling mahal.";
  if(dr > 30){
    tone = "bad";
    bullets.push("Karena debt ratio tinggi: arahkan mayoritas surplus (60–80%) untuk lunasi utang mahal sampai rasio turun aman.");
    note = "Saat debt ratio tinggi, fokusnya stabilitas. Setelah aman, baru agresif ke investasi/goals.";
  } else if(dr > 20){
    tone = "warn";
    bullets.push("Debt ratio agak ketat: lakukan pelunasan ekstra kecil tapi konsisten (mis. 5–10% income) untuk utang mahal.");
    note = "Tujuannya memperlebar ruang cashflow untuk goals besar.";
  }
  return { tone, bullets, note };
}

function buildTop3(fin, d){
  const liqOp = d.liquidityOperational;
  const sr = fin.savingRatio;
  const dr = fin.debtRatio;
  const cf = fin.cashflow;

  const lines = [];
  if(liqOp < 3) lines.push("1) Kejar dana darurat operasional sampai ≥ 3 bulan.");
  else lines.push("1) Pertahankan dana darurat, lalu rapikan alokasi investasi sesuai tujuan.");

  if(dr > 30) lines.push("2) Turunkan debt ratio: lunasi utang berbunga tinggi pakai avalanche.");
  else if(dr > 20) lines.push("2) Kunci cicilan: jangan tambah cicilan baru, lakukan pelunasan ekstra konsisten.");
  else lines.push("2) Debt ratio aman: pastikan kartu kredit selalu dibayar penuh.");

  if(cf < 0) lines.push("3) Benahi cashflow dulu (audit bocor + optimasi pos wajib).");
  else if(sr < 20) lines.push("3) Naikkan saving ratio bertahap (2–5%) lewat autopay.");
  else lines.push("3) Bagi saving jadi 3 ember: darurat, investasi, goals.");

  return `<ul class="tips">${lines.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

function generateAIRecommendation(fin) {
  const data = getData();
  const d = calculateDerived(fin, data);
  const liqOp = d.liquidityOperational;

  const cards = [];

  // rules mandatory
  if(liqOp < 3){
    cards.push({
      tone:"warn",
      title:"Likuiditas < 3 bulan (Warning)",
      bullets:[
        "Target minimal: dana darurat operasional = 3 bulan pengeluaran operasional.",
        "Tahan dulu investasi berisiko tinggi sampai pondasi aman.",
        "Kalau saving terlalu besar sampai mengorbankan likuiditas, geser sebagian saving ke dana darurat dulu."
      ],
      note:"Dampak: kamu nggak perlu ngutang mahal saat kejadian tak terduga."
    });
  } else {
    cards.push({
      tone:"good",
      title:"Likuiditas aman",
      bullets:[
        `Likuiditas operasional kamu sekitar ${isFinite(liqOp)?liqOp.toFixed(1):"∞"} bulan.`,
        "Pertahankan dana darurat di instrumen likuid (tabungan, RDPU, deposito pendek).",
        "Kalau sudah >6 bulan, optimasi return bertahap."
      ],
      note:"Dampak: keputusan investasi jadi lebih tenang dan rasional."
    });
  }

  // saving > 30 -> info rule
  if(fin.savingRatio > 30){
    cards.push({
      tone:"info",
      title:"Saving ratio > 30% (Info)",
      bullets:[
        `Saving ratio kamu sekitar ${fin.savingRatio.toFixed(0)}%.`,
        "Bagus untuk goals, tapi pastikan tidak mengorbankan kebutuhan esensial & likuiditas.",
        "Pisahkan saving: darurat, investasi, goals."
      ],
      note:"Saving tinggi itu power—yang penting tetap sehat dan konsisten."
    });
  } else {
    const tone = fin.savingRatio < 20 ? "warn" : "good";
    cards.push({
      tone,
      title:"Optimasi saving (bertahap)",
      bullets:[
        `Saving ratio kamu sekitar ${fin.savingRatio.toFixed(0)}%.`,
        "Audit 3 pos yang sering bocor: langganan, impuls (makan/coffee), transport.",
        "Autopay saving tepat setelah gajian."
      ],
      note:"Naik bertahap lebih sustain daripada ekstrem lalu menyerah."
    });
  }

  // debt > 30 -> danger rule
  if(fin.debtRatio > 30){
    cards.push({
      tone:"bad",
      title:"Debt ratio > 30% (Danger)",
      bullets:[
        `Debt ratio kamu sekitar ${fin.debtRatio.toFixed(0)}%.`,
        "Stop nambah cicilan baru sampai rasio turun aman.",
        "Prioritas: lunasi utang bunga tinggi (kartu kredit/paylater) pakai avalanche."
      ],
      note:"Debt tinggi bikin goals jadi berat dan rawan gagal saat ada gangguan cashflow."
    });
  } else {
    const tone = fin.debtRatio > 20 ? "warn" : "good";
    cards.push({
      tone,
      title:"Utang terkendali — tetap disiplin",
      bullets:[
        `Debt ratio kamu sekitar ${fin.debtRatio.toFixed(0)}%.`,
        "Bayar kartu kredit full setiap bulan (hindari bunga berjalan).",
        "Kalau ada utang bunga tinggi: lakukan pelunasan ekstra kecil tapi konsisten."
      ],
      note:"Utang yang sehat itu alat, utang bunga tinggi itu kebocoran."
    });
  }

  const cfS = cashflowStatus(fin.cashflow);
  cards.push({
    tone: cfS.type,
    title:"Cashflow bulanan",
    bullets:[
      `Cashflow (income - total expenses) = ${formatIDR(fin.cashflow)}.`,
      "Kalau defisit: fokus benahi pengeluaran dulu sebelum nambah goals.",
      "Kalau surplus: pakai sistem alokasi otomatis."
    ],
    note: cfS.impact
  });

  // always include investment allocation strategy + debt prioritization strategy
  const alloc = getInvestmentAllocationStrategy(fin, data);
  cards.push({
    tone:"info",
    title:"Strategi alokasi investasi (wajib ada)",
    bullets: alloc.bullets,
    note: alloc.note
  });

  const debtPlan = getDebtPrioritizationStrategy(fin, data);
  cards.push({
    tone: debtPlan.tone,
    title:"Strategi prioritas utang (wajib ada)",
    bullets: debtPlan.bullets,
    note: debtPlan.note
  });

  return { cards, top3: buildTop3(fin, d) };
}

function renderAI(){
  const wrap = $("aiCards");
  const top3 = $("aiTop3");
  if(!wrap || !top3) return;

  const fin = calculateFinancial(getData());
  const res = generateAIRecommendation(fin);

  wrap.innerHTML = res.cards.map(c=>`
    <div class="rec-card ${c.tone}">
      <h4>${c.title}</h4>
      <ul>${c.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>
      <div class="small-muted">${c.note}</div>
    </div>
  `).join("");

  top3.innerHTML = res.top3;
}

/* =========================
   GOALS S2 (WAJIB)
========================= */
function monthsBetween(a, b){
  const ay = a.getFullYear(), am = a.getMonth(), ad = a.getDate();
  const by = b.getFullYear(), bm = b.getMonth(), bd = b.getDate();
  let months = (by - ay) * 12 + (bm - am);
  if(bd < ad) months -= 1;
  return Math.max(0, months);
}

function calculateS2Goal(input, fin) {
  const data = getData();
  const d = calculateDerived(fin, data);

  const baseTotal =
    (Number(input.tuition)||0) +
    (Number(input.living)||0) +
    (Number(input.visaInsurance)||0) +
    (Number(input.flight)||0) +
    (Number(input.buffer)||0);

  let adjustedTotal = baseTotal;
  if(input.scholarshipChance === "partial") adjustedTotal = Math.max(0, baseTotal * 0.6);
  if(input.scholarshipChance === "full") adjustedTotal = Math.max(0, baseTotal * 0.2);

  const currentFund = Number(input.currentFund)||0;
  const sideIncome = Number(input.sideIncome)||0;

  // monthly saving capacity: saving + surplus + side income
  const monthlyCapacity = Math.max(
    0,
    (Number(data.expenses.saving)||0) + Math.max(0, fin.cashflow) + sideIncome
  );

  const gap = Math.max(0, adjustedTotal - currentFund);
  const monthsNeeded = monthlyCapacity > 0 ? Math.ceil(gap / monthlyCapacity) : Infinity;

  const now = new Date();
  const target = new Date(input.startDate);
  const targetMonths = monthsBetween(now, target);

  const feasible = isFinite(monthsNeeded) && monthsNeeded <= targetMonths;

  const strategy = [];
  if(!isFinite(monthsNeeded) || monthlyCapacity <= 0){
    strategy.push("Saat ini kapasitas saving goals = 0. Fokus dulu benahi cashflow dan bikin ruang saving.");
    strategy.push("Langkah cepat: kurangi pengeluaran bocor + tambah side income.");
  } else if(!feasible){
    strategy.push(`Gap kamu ${formatIDR(gap)}. Dengan kapasitas ${formatIDR(monthlyCapacity)}/bulan, butuh ~${monthsNeeded} bulan.`);
    strategy.push(`Target start kamu ${targetMonths} bulan lagi, jadi belum feasible dengan setting sekarang.`);
    strategy.push("Opsi: naikkan kapasitas saving, tekan biaya (beasiswa/negara lebih murah), atau geser start date.");
  } else {
    strategy.push(`Feasible. Gap ${formatIDR(gap)} bisa dikejar dalam ~${monthsNeeded} bulan dengan kapasitas ${formatIDR(monthlyCapacity)}/bulan.`);
    strategy.push("Kunci: autopay saving goals + pisahkan rekening/portofolio khusus goals S2.");
  }

  if(d.liquidityOperational < 3){
    strategy.push("Catatan: likuiditas operasional <3 bulan. Jangan ambil dana darurat untuk goals. Bangun pondasi dulu.");
  }

  const timeline = [
    "Bulan 1–3: rapikan budget, pastikan dana darurat aman, tetapkan autopay goals.",
    "Bulan 4–12: disiplin saving + cari beasiswa + kunci biaya (kurs/komitmen biaya)."
  ];
  if(isFinite(monthsNeeded) && monthsNeeded > 12) timeline.push("Tahun berikutnya: lanjutkan akumulasi dan kurangi risiko kurs secara bertahap.");

  return {
    baseTotal, adjustedTotal, currentFund, gap,
    monthlyCapacity, monthsNeeded, targetMonths, feasible,
    strategy, timeline
  };
}

function goalS2Field(label, key, value, mini, type="number"){
  if(type==="date"){
    return `
      <div class="field">
        <label>${label}</label>
        <input type="date" data-s2="${key}" value="${value}">
        <div class="mini">${mini}</div>
      </div>
    `;
  }
  return `
    <div class="field">
      <label>${label}</label>
      <input type="number" min="0" step="1000" data-s2="${key}" value="${Number(value)||0}">
      <div class="mini">${mini}</div>
    </div>
  `;
}

let s2LineChart = null;

function renderS2Chart(out){
  const canvas = $("s2Line");
  if(!canvas || typeof Chart === "undefined") return;

  const months = isFinite(out.targetMonths) ? out.targetMonths : 24;
  const cap = out.monthlyCapacity;
  const start = out.currentFund;

  const labels = [];
  const points = [];
  let acc = start;

  for(let i=0;i<=months;i++){
    labels.push(`B${i}`);
    if(i>0) acc += cap;
    points.push(acc);
  }

  if(s2LineChart) s2LineChart.destroy();
  s2LineChart = new Chart(canvas, {
    type:'line',
    data:{ labels, datasets:[{ label:'Akumulasi Dana Goals S2', data:points, tension:0.25, fill:true }] },
    options:{ responsive:true, maintainAspectRatio:false }
  });
}

function renderGoalsS2(){
  const form = $("goalsForm");
  const result = $("goalsResult");
  const notes = $("goalsRealisticNotes");
  if(!form || !result || !notes) return;

  form.innerHTML = `
    ${goalS2Field("Tuition (total)","tuition",goalsS2State.tuition,"Total biaya kuliah sampai lulus.")}
    ${goalS2Field("Living cost (total)","living",goalsS2State.living,"Total biaya hidup selama studi.")}
    ${goalS2Field("Visa + Asuransi","visaInsurance",goalsS2State.visaInsurance,"Visa, insurance, administrasi.")}
    ${goalS2Field("Flight","flight",goalsS2State.flight,"Estimasi tiket utama.")}
    ${goalS2Field("Buffer (kurs/kejutan)","buffer",goalsS2State.buffer,"Buffer fluktuasi kurs & biaya tak terduga.")}
    ${goalS2Field("Dana saat ini (khusus S2)","currentFund",goalsS2State.currentFund,"Dana yang sudah disiapkan khusus S2.")}
    ${goalS2Field("Target mulai S2","startDate",goalsS2State.startDate,"Dipakai untuk hitung waktu tersedia.","date")}
    <div class="field">
      <label>Estimasi beasiswa</label>
      <select data-s2="scholarshipChance">
        <option value="none" ${goalsS2State.scholarshipChance==="none"?"selected":""}>Tidak ada / belum ada</option>
        <option value="partial" ${goalsS2State.scholarshipChance==="partial"?"selected":""}>Parsial</option>
        <option value="full" ${goalsS2State.scholarshipChance==="full"?"selected":""}>Hampir penuh</option>
      </select>
      <div class="mini">Total biaya di-adjust konservatif.</div>
    </div>
    ${goalS2Field("Side income khusus goals/bulan","sideIncome",goalsS2State.sideIncome,"Opsional: income tambahan untuk ngejar goals.")}
  `;

  form.querySelectorAll("input[data-s2], select[data-s2]").forEach(el=>{
    el.addEventListener("input", ()=>{
      const key = el.dataset.s2;
      let val = el.value;
      if(el.tagName==="SELECT") goalsS2State[key] = val;
      else if(el.type==="date") goalsS2State[key] = val;
      else goalsS2State[key] = Number(val||0);
      saveGoalsS2();
      renderGoalsS2Result();
    });
  });

  renderGoalsS2Result();
}

function renderGoalsS2Result(){
  const result = $("goalsResult");
  const notes = $("goalsRealisticNotes");
  if(!result || !notes) return;

  const fin = calculateFinancial(getData());
  const d = calculateDerived(fin, getData());
  const out = calculateS2Goal(goalsS2State, fin);

  const feasiblePill = out.feasible ? statusPill("good","Feasible (masuk akal)") : statusPill("warn","Belum feasible (butuh strategi)");
  const monthsText = isFinite(out.monthsNeeded) ? `${out.monthsNeeded} bulan` : "— (kapasitas 0)";

  result.innerHTML = `
    <div class="pill info"><strong>Total biaya (base):</strong> ${formatIDR(out.baseTotal)}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Total biaya (after beasiswa):</strong> ${formatIDR(out.adjustedTotal)}</div>
    <div class="space"></div>
    ${feasiblePill}
    <div class="divider"></div>
    <div class="pill info"><strong>Gap:</strong> ${formatIDR(out.gap)}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Kapasitas/bulan:</strong> ${formatIDR(out.monthlyCapacity)}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Butuh waktu:</strong> ${monthsText}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Waktu tersedia:</strong> ${out.targetMonths} bulan</div>
    <div class="divider"></div>
    <div class="card-title">Strategi</div>
    <ul class="tips">${out.strategy.map(s=>`<li>${s}</li>`).join("")}</ul>
    <div class="divider"></div>
    <div class="card-title">Timeline</div>
    <ul class="tips">${out.timeline.map(t=>`<li>${t}</li>`).join("")}</ul>
  `;

  const liqS = liquidityStatus(d.liquidityOperational);
  const debS = debtStatus(fin.debtRatio);
  const savS = savingStatus(fin.savingRatio);

  const extra = [];
  extra.push(`Likuiditas operasional: ${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"} bulan (${liqS.title}).`);
  extra.push(`Debt ratio: ${fin.debtRatio.toFixed(0)}% (${debS.title}).`);
  extra.push(`Saving ratio: ${fin.savingRatio.toFixed(0)}% (${savS.title}).`);
  if(!out.feasible && out.targetMonths > 0){
    const needed = Math.ceil(out.gap / out.targetMonths);
    extra.push(`Agar feasible sesuai deadline, kira-kira butuh ${formatIDR(needed)}/bulan (estimasi kasar).`);
  }

  notes.innerHTML = extra.map(x=>`• ${x}`).join("<br/>");

  renderS2Chart(out);
}

/* =========================
   GOALS MULTI (nikah/anak/rumah)
========================= */
function calculateMultiGoals(state, fin){
  const data = getData();
  const d = calculateDerived(fin, data);

  // kapasitas goals: saving + surplus (konservatif)
  const monthlyCapacity = Math.max(0, (Number(data.expenses.saving)||0) + Math.max(0, fin.cashflow));

  const now = new Date();
  const prRank = { tinggi: 1, sedang: 2, rendah: 3 };

  const results = (state.items || []).map(g=>{
    const target = Math.max(0, Number(g.target)||0);
    const current = Math.max(0, Number(g.current)||0);
    const gap = Math.max(0, target - current);
    const monthsAvail = monthsBetween(now, new Date(g.date));
    const requiredMonthly = monthsAvail > 0 ? Math.ceil(gap / monthsAvail) : (gap>0 ? Infinity : 0);
    const feasible = (gap===0) ? true : (monthlyCapacity>0 && requiredMonthly <= monthlyCapacity);
    return { ...g, target, current, gap, monthsAvail, requiredMonthly, feasible };
  });

  const sorted = [...results].sort((a,b)=>{
    const pa = prRank[a.priority] || 9;
    const pb = prRank[b.priority] || 9;
    if(pa !== pb) return pa - pb;
    return (new Date(a.date) - new Date(b.date));
  });

  const totalRequired = results.reduce((a,r)=> a + (isFinite(r.requiredMonthly)?r.requiredMonthly:0), 0);

  const strategy = [];
  if(fin.cashflow < 0) strategy.push("Cashflow masih defisit. Jangan paksain goals dulu—benahi pengeluaran atau tambah income sampai surplus.");
  if(d.liquidityOperational < 3) strategy.push("Likuiditas <3 bulan. Jangan ambil dana darurat buat goals. Bangun pondasi dulu.");
  if(monthlyCapacity <= 0) strategy.push("Kapasitas goals saat ini 0. Start dari autopay kecil (mis. 5% income), lalu naik bertahap.");
  if(monthlyCapacity > 0){
    strategy.push(`Kapasitas goals sekarang ~${formatIDR(monthlyCapacity)}/bulan (saving + surplus).`);
    strategy.push(`Total kebutuhan kalau semua dikejar bareng ~${formatIDR(totalRequired)}/bulan.`);
    if(totalRequired > monthlyCapacity){
      strategy.push("Kalau dikejar bareng, kamu kewalahan. Gunakan prioritas & fase (mis. DP rumah dulu).");
    } else {
      strategy.push("Secara angka, semua goal bisa jalan bareng. Tetap disiplin: autopay setelah gajian, pisahkan pos tiap goal.");
    }
  }

  // suggested allocation (simple 70/20/10)
  const allocation = [];
  if(monthlyCapacity > 0 && sorted.length){
    const top = sorted[0];
    const second = sorted[1];
    allocation.push(`Saran alokasi: 70% ke "${top.name}" (prioritas utama).`);
    if(second) allocation.push(`Saran alokasi: 20% ke "${second.name}" (jaga momentum).`);
    if(sorted.length > 2) allocation.push(`Sisa 10% dibagi rata untuk goal lainnya (biar tetap jalan).`);
  }

  return { monthlyCapacity, totalRequired, results, sorted, strategy, allocation };
}

function renderGoalsMultiCreate(){
  const wrap = $("goals2Create");
  if(!wrap) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');

  wrap.innerHTML = `
    <div class="field">
      <label>Jenis Goal</label>
      <select id="g2_type">
        <option value="nikah">Nikah</option>
        <option value="anak">Punya Anak</option>
        <option value="rumah">Rumah / DP Rumah</option>
        <option value="lainnya">Lainnya</option>
      </select>
      <div class="mini">Jenis dipakai untuk strategi otomatis.</div>
    </div>

    <div class="field">
      <label>Nama Goal</label>
      <input id="g2_name" type="text" value="Nikah" />
      <div class="mini">Contoh: “DP Rumah”, “Dana Persalinan”, “Biaya Nikah”.</div>
    </div>

    <div class="field">
      <label>Target total (Rp)</label>
      <input id="g2_target" type="number" min="0" step="100000" value="80000000" />
      <div class="mini">Estimasi konservatif (lebih aman kalau agak dilebihkan).</div>
    </div>

    <div class="field">
      <label>Dana saat ini (Rp)</label>
      <input id="g2_current" type="number" min="0" step="100000" value="0" />
      <div class="mini">Dana yang sudah khusus untuk goal ini.</div>
    </div>

    <div class="field">
      <label>Target tanggal</label>
      <input id="g2_date" type="date" value="${y+1}-${m}-${d}" />
      <div class="mini">Deadline kapan goal mau tercapai.</div>
    </div>

    <div class="field">
      <label>Prioritas</label>
      <select id="g2_priority">
        <option value="tinggi">Tinggi</option>
        <option value="sedang">Sedang</option>
        <option value="rendah">Rendah</option>
      </select>
      <div class="mini">Kalau semua dikejar, prioritas bantu alokasi.</div>
    </div>
  `;

  const typeSel = document.getElementById("g2_type");
  const nameInp = document.getElementById("g2_name");
  if(typeSel && nameInp){
    typeSel.addEventListener("change", ()=>{
      const map = { nikah:"Nikah", anak:"Punya Anak", rumah:"DP Rumah", lainnya:"Goal Lainnya" };
      const v = map[typeSel.value] || "Goal";
      if(!nameInp.value || ["Nikah","Punya Anak","DP Rumah","Goal Lainnya"].includes(nameInp.value)) nameInp.value = v;
    });
  }
}

function renderGoalsMultiList(out){
  const list = $("goals2List");
  if(!list) return;

  if(!out.results.length){
    list.innerHTML = `<div class="muted">Belum ada goal. Tambah dulu di panel kiri.</div>`;
    return;
  }

  list.innerHTML = out.results.map(g=>{
    const pill = g.feasible ? statusPill("good","Feasible") : statusPill("warn","Belum feasible");
    const need = isFinite(g.requiredMonthly) ? formatIDR(g.requiredMonthly) : "—";
    const avail = `${g.monthsAvail} bulan`;
    return `
      <div class="goal-item">
        <div class="top">
          <div>
            <p class="title">${g.name}</p>
            <div class="meta">
              Target: <strong>${formatIDR(g.target)}</strong><br/>
              Dana saat ini: <strong>${formatIDR(g.current)}</strong><br/>
              Gap: <strong>${formatIDR(g.gap)}</strong><br/>
              Deadline: <strong>${new Date(g.date).toLocaleDateString("id-ID")}</strong> (${avail})<br/>
              Butuh: <strong>${need}/bulan</strong> — ${pill}
            </div>
          </div>
          <div class="goal-actions">
            <button class="btn small" data-edit="${g.id}">Edit</button>
            <button class="btn small" data-del="${g.id}">Hapus</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.del;
      goalsMultiState.items = goalsMultiState.items.filter(x=>x.id !== id);
      saveGoalsMulti();
      renderGoalsMulti();
      toast("Goal dihapus.");
    });
  });

  list.querySelectorAll("button[data-edit]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.edit;
      const g = goalsMultiState.items.find(x=>x.id===id);
      if(!g) return;

      const newName = prompt("Nama goal:", g.name);
      if(newName === null) return;

      const newTarget = prompt("Target total (Rp):", String(g.target));
      if(newTarget === null) return;

      const newCurrent = prompt("Dana saat ini (Rp):", String(g.current));
      if(newCurrent === null) return;

      const newDate = prompt("Target tanggal (YYYY-MM-DD):", String(g.date));
      if(newDate === null) return;

      const newPriority = prompt("Prioritas (tinggi/sedang/rendah):", String(g.priority));
      if(newPriority === null) return;

      g.name = (newName || "Goal").trim();
      g.target = Number(newTarget)||0;
      g.current = Number(newCurrent)||0;
      g.date = newDate;
      g.priority = ["tinggi","sedang","rendah"].includes(newPriority) ? newPriority : g.priority;

      saveGoalsMulti();
      renderGoalsMulti();
      toast("Goal diupdate.");
    });
  });
}

function renderGoalsMultiSummary(out){
  const sumEl = $("goals2Summary");
  if(!sumEl) return;

  const feasibleCount = out.results.filter(x=>x.feasible).length;
  const total = out.results.length;

  sumEl.innerHTML = `
    <div class="pill info"><strong>Kapasitas goals/bulan:</strong> ${formatIDR(out.monthlyCapacity)}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Total kebutuhan/bulan (semua):</strong> ${formatIDR(out.totalRequired)}</div>
    <div class="space"></div>
    <div class="pill ${feasibleCount===total ? "good" : "warn"}"><strong>Status:</strong> ${feasibleCount}/${total} feasible</div>
  `;
}

function renderGoalsMultiStrategy(out){
  const el = $("goals2Strategy");
  if(!el) return;

  const lines = [];
  out.strategy.forEach(s=> lines.push(`• ${s}`));
  if(out.allocation.length){
    lines.push("");
    out.allocation.forEach(a=> lines.push(`• ${a}`));
  }

  const hasHouse = out.results.some(x=>x.type==="rumah");
  const hasWedding = out.results.some(x=>x.type==="nikah");
  const hasChild = out.results.some(x=>x.type==="anak");

  if(hasHouse){
    lines.push("");
    lines.push("• Rumah: pecah fase (DP → akad/kredit → furnitur/renov). DP biasanya paling berat, jadikan prioritas jelas.");
    lines.push("• Rumah: hindari tambah cicilan baru kalau likuiditas belum aman atau debt ratio ketat.");
  }
  if(hasWedding){
    lines.push("");
    lines.push("• Nikah: bedakan wajib vs nice-to-have. Tetapkan budget cap dan negosiasi vendor berdasarkan plafon.");
  }
  if(hasChild){
    lines.push("");
    lines.push("• Anak: siapkan 3 ember: persalinan, tahun pertama, proteksi (BPJS/asuransi sesuai kebutuhan).");
  }

  el.style.whiteSpace = "pre-line";
  el.innerHTML = lines.join("\n");
}

function renderGoalsMulti(){
  renderGoalsMultiCreate();

  const fin = calculateFinancial(getData());
  const out = calculateMultiGoals(goalsMultiState, fin);

  renderGoalsMultiList(out);
  renderGoalsMultiSummary(out);
  renderGoalsMultiStrategy(out);
}

/* =========================
   VISUAL DASHBOARD (Charts)
========================= */
let assetPieChart = null;
let cashBarChart = null;

function renderVisuals(){
  const pie = $("assetPie");
  const bar = $("cashBar");
  if(!pie || !bar || typeof Chart === "undefined") return;

  const data = getData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);

  if(assetPieChart) assetPieChart.destroy();
  assetPieChart = new Chart(pie, {
    type:'pie',
    data:{
      labels:["Kas/Likuid","Investasi","Non-Likuid"],
      datasets:[{ data:[fin.assetCash, fin.assetInvest, fin.assetNonLiquid] }]
    },
    options:{ responsive:true, maintainAspectRatio:false }
  });

  const income = d.income;
  const expenses = d.expensesTotal;
  const third = fin.cashflow >= 0 ? Math.max(0, fin.cashflow) : Math.max(0, -fin.cashflow);

  if(cashBarChart) cashBarChart.destroy();
  cashBarChart = new Chart(bar, {
    type:'bar',
    data:{
      labels:["Income","Expenses", fin.cashflow>=0 ? "Surplus" : "Defisit"],
      datasets:[{ label:"Nilai", data:[income, expenses, third] }]
    },
    options:{ responsive:true, maintainAspectRatio:false }
  });

  const v = $("visualNarrative");
  if(v){
    v.innerHTML = `
      • Pie: struktur aset (berapa yang likuid vs investasi vs non-likuid).<br/>
      • Bar: apakah income cukup menutup expenses dan menghasilkan surplus.<br/>
      • Kalau kas kecil & non-likuid besar, kamu bisa “kaya di aset” tapi tetap rentan cashflow.
    `;
  }
}

/* =========================
   ROADMAP (adaptive + goals autopay)
========================= */
function buildRoadmap(fin, d){
  const liqOp = d.liquidityOperational;
  const sr = fin.savingRatio;
  const dr = fin.debtRatio;
  const cf = fin.cashflow;

  const m3 = [];
  const m6 = [];
  const m12 = [];

  // base must-have
  m3.push("Stabilkan dana darurat dan rapikan budget.");
  m3.push("Audit pengeluaran (langganan, impuls, transport) + autopay saving setelah gajian.");

  if(liqOp < 3) m3.push("Kejar dana darurat operasional sampai ≥ 3 bulan (prioritas utama).");
  if(cf < 0) m3.push("Cashflow defisit: stop kebocoran dulu, tunda goals besar sementara.");
  if(dr > 30) m3.push("Stop tambah cicilan baru; fokus lunasi utang bunga tinggi.");

  m6.push("Optimasi alokasi investasi sesuai horizon tujuan (3–5 tahun vs >5 tahun).");
  if(dr > 30) m6.push("Kurangi utang berbunga tinggi dengan metode avalanche sampai debt ratio turun aman.");
  else m6.push("Pelunasan ekstra kecil tapi konsisten untuk utang mahal (kalau ada).");

  m12.push("Capai rasio sehat: likuiditas ≥3, debt ≤30, saving ≥20.");
  if(cf >= 0) m12.push("Mulai funding goals besar secara sistematis (S2/rumah/nikah/anak) dengan pos terpisah.");

  // adjust by saving ratio
  if(sr < 20){
    m3.push("Naikkan saving ratio bertahap 2–5% (targetkan ≥20%).");
    m6.push("Tambah income (freelance/side hustle) untuk mempercepat goals tanpa mengorbankan kebutuhan.");
  } else if(sr >= 30){
    m6.push("Saving sudah kuat: rapikan strategi investasi agar return selaras tujuan (bukan cuma menumpuk kas).");
  }

  return { m3, m6, m12 };
}

function suggestAutopay(fin){
  const data = getData();
  const saving = Number(data.expenses.saving)||0;
  const surplus = Math.max(0, fin.cashflow);
  const capacity = Math.max(0, saving + surplus);

  // build autopay suggestions using goals
  const lines = [];
  lines.push(`Kapasitas goals (saving + surplus) ~ <strong>${formatIDR(capacity)}/bulan</strong>.`);

  // S2 suggestion
  const s2 = calculateS2Goal(goalsS2State, fin);
  const s2Need = (s2.targetMonths>0) ? Math.ceil(s2.gap / s2.targetMonths) : 0;
  if(s2.gap > 0 && s2.targetMonths>0){
    lines.push(`Estimasi autopay untuk Goals S2 agar sesuai deadline: <strong>${formatIDR(s2Need)}/bulan</strong>.`);
  }

  // multi goals suggestion
  const multi = calculateMultiGoals(goalsMultiState, fin);
  if(multi.sorted.length){
    const top = multi.sorted[0];
    const topNeed = isFinite(top.requiredMonthly) ? top.requiredMonthly : 0;
    if(topNeed > 0){
      lines.push(`Prioritas goals terdekat/tertinggi: "<strong>${top.name}</strong>" butuh ~ <strong>${formatIDR(topNeed)}/bulan</strong>.`);
    }
    if(multi.totalRequired > multi.monthlyCapacity && multi.monthlyCapacity > 0){
      lines.push(`Kalau semua dikejar bareng, butuh <strong>${formatIDR(multi.totalRequired)}/bulan</strong> (lebih besar dari kapasitas). Pertimbangkan prioritas/fase.`);
    }
  }

  if(capacity <= 0){
    lines.push("Saat ini kapasitas goals kamu 0. Fokus dulu benahi cashflow dan bikin autopay kecil sebagai start.");
  }

  return lines.join("<br/>");
}

function renderPlan(){
  const priorityEl = $("planPriority");
  const checklistEl = $("planChecklist");
  const roadmapEl = $("roadmapBlocks");
  const autopayEl = $("planGoalsAutopay");
  if(!priorityEl || !checklistEl || !roadmapEl || !autopayEl) return;

  const data = getData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);

  const pri = [];
  if(fin.cashflow < 0) pri.push("Cashflow defisit → benahi struktur pengeluaran dulu.");
  if(d.liquidityOperational < 3) pri.push("Likuiditas <3 bulan → bangun dana darurat operasional.");
  if(fin.debtRatio > 30) pri.push("Debt ratio >30% → turunkan utang berbunga tinggi.");
  if(pri.length === 0) pri.push("Kondisi relatif sehat → fokus goals besar + optimasi investasi.");

  priorityEl.innerHTML = `<ul class="tips">${pri.map(x=>`<li>${x}</li>`).join("")}</ul>`;

  checklistEl.innerHTML = `
    <div class="pill info"><strong>Net Worth:</strong> ${formatIDR(fin.netWorth)}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Likuiditas (operasional):</strong> ${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"} bulan</div>
    <div class="space"></div>
    <div class="pill info"><strong>Saving / Debt:</strong> ${fin.savingRatio.toFixed(0)}% / ${fin.debtRatio.toFixed(0)}%</div>
  `;

  autopayEl.innerHTML = suggestAutopay(fin);

  const road = buildRoadmap(fin, d);
  roadmapEl.innerHTML = `
    <div class="cards">
      <div class="rec-card warn">
        <h4>3 Bulan</h4>
        <ul>${road.m3.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="rec-card info">
        <h4>6 Bulan</h4>
        <ul>${road.m6.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="rec-card good">
        <h4>12 Bulan</h4>
        <ul>${road.m12.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
    </div>
  `;
}

/* =========================
   BUTTON WIRING
========================= */
function wireButtons(){
  // landing buttons
  const btnStartWizard = $("btnStartWizard");
  if(btnStartWizard) btnStartWizard.addEventListener("click", ()=> setActiveSection("checkup"));

  const btnRefreshAll = $("btnRefreshAll");
  if(btnRefreshAll) btnRefreshAll.addEventListener("click", ()=>{
    renderLanding(); renderWizard(); renderResults(); renderAI(); renderGoalsS2(); renderGoalsMulti(); renderVisuals(); renderPlan();
    toast("Semua tampilan di-refresh.");
  });

  const btnResetAll = $("btnResetAll");
  if(btnResetAll) btnResetAll.addEventListener("click", ()=>{
    stepsState = getDefaultSteps();
    goalsS2State = loadGoalsS2();
    goalsMultiState = loadGoalsMulti();
    saveState(); saveGoalsS2(); saveGoalsMulti();
    toast("Di-reset ke data contoh.");
    renderLanding(); renderWizard(); renderResults(); renderAI(); renderGoalsS2(); renderGoalsMulti(); renderVisuals(); renderPlan();
  });

  const btnLandingToResults = $("btnLandingToResults");
  if(btnLandingToResults) btnLandingToResults.addEventListener("click", ()=> setActiveSection("results"));

  const btnLandingToGoals2 = $("btnLandingToGoals2");
  if(btnLandingToGoals2) btnLandingToGoals2.addEventListener("click", ()=> setActiveSection("goals2"));

  // wizard controls
  const btnWizardRecalc = $("btnWizardRecalc");
  if(btnWizardRecalc) btnWizardRecalc.addEventListener("click", ()=>{ renderWizard(); toast("Wizard di-refresh."); });

  const btnPrev = $("btnPrev");
  if(btnPrev) btnPrev.addEventListener("click", ()=>{ wizardIndex = clamp(wizardIndex-1, 0, wizardMeta.length-1); renderWizard(); });

  const btnNext = $("btnNext");
  if(btnNext) btnNext.addEventListener("click", ()=>{
    if(wizardIndex === wizardMeta.length-1) setActiveSection("results");
    else { wizardIndex = clamp(wizardIndex+1, 0, wizardMeta.length-1); renderWizard(); }
  });

  const btnGoResults = $("btnGoResults");
  if(btnGoResults) btnGoResults.addEventListener("click", ()=> setActiveSection("results"));

  const btnGoAI = $("btnGoAI");
  if(btnGoAI) btnGoAI.addEventListener("click", ()=> setActiveSection("ai"));

  const btnToAIFromCheckup = $("btnToAIFromCheckup");
  if(btnToAIFromCheckup) btnToAIFromCheckup.addEventListener("click", ()=> setActiveSection("ai"));

  const btnToGoalsFromCheckup = $("btnToGoalsFromCheckup");
  if(btnToGoalsFromCheckup) btnToGoalsFromCheckup.addEventListener("click", ()=> setActiveSection("goals"));

  const btnToGoals2FromCheckup = $("btnToGoals2FromCheckup");
  if(btnToGoals2FromCheckup) btnToGoals2FromCheckup.addEventListener("click", ()=> setActiveSection("goals2"));

  // results
  const btnResultsRecalc = $("btnResultsRecalc");
  if(btnResultsRecalc) btnResultsRecalc.addEventListener("click", ()=>{ renderResults(); toast("Dashboard hasil di-refresh."); });

  const btnResultsToAI = $("btnResultsToAI");
  if(btnResultsToAI) btnResultsToAI.addEventListener("click", ()=> setActiveSection("ai"));

  const btnToVisuals = $("btnToVisuals");
  if(btnToVisuals) btnToVisuals.addEventListener("click", ()=> setActiveSection("visuals"));

  const btnToPlan = $("btnToPlan");
  if(btnToPlan) btnToPlan.addEventListener("click", ()=> setActiveSection("plan"));

  // AI
  const btnAIRecalc = $("btnAIRecalc");
  if(btnAIRecalc) btnAIRecalc.addEventListener("click", ()=>{ renderAI(); toast("Rekomendasi di-refresh."); });

  const btnAIToGoals = $("btnAIToGoals");
  if(btnAIToGoals) btnAIToGoals.addEventListener("click", ()=> setActiveSection("goals"));

  const btnAIToGoals2 = $("btnAIToGoals2");
  if(btnAIToGoals2) btnAIToGoals2.addEventListener("click", ()=> setActiveSection("goals2"));

  // Goals S2
  const btnGoalsRecalc = $("btnGoalsRecalc");
  if(btnGoalsRecalc) btnGoalsRecalc.addEventListener("click", ()=>{ renderGoalsS2Result(); toast("Goals S2 dihitung ulang."); });

  const btnGoalsCalc = $("btnGoalsCalc");
  if(btnGoalsCalc) btnGoalsCalc.addEventListener("click", ()=>{ renderGoalsS2Result(); toast("Feasibility S2 dicek."); });

  const btnGoalsReset = $("btnGoalsReset");
  if(btnGoalsReset) btnGoalsReset.addEventListener("click", ()=>{
    goalsS2State = loadGoalsS2();
    saveGoalsS2();
    renderGoalsS2();
    toast("Input Goals S2 di-reset.");
  });

  const btnGoalsToGoals2 = $("btnGoalsToGoals2");
  if(btnGoalsToGoals2) btnGoalsToGoals2.addEventListener("click", ()=> setActiveSection("goals2"));

  const btnGoalsToAI = $("btnGoalsToAI");
  if(btnGoalsToAI) btnGoalsToAI.addEventListener("click", ()=> setActiveSection("ai"));

  const btnGoalsToPlan = $("btnGoalsToPlan");
  if(btnGoalsToPlan) btnGoalsToPlan.addEventListener("click", ()=> setActiveSection("plan"));

  const btnGoalsToVisuals = $("btnGoalsToVisuals");
  if(btnGoalsToVisuals) btnGoalsToVisuals.addEventListener("click", ()=> setActiveSection("visuals"));

  // Goals Multi
  const btnGoals2Recalc = $("btnGoals2Recalc");
  if(btnGoals2Recalc) btnGoals2Recalc.addEventListener("click", ()=>{ renderGoalsMulti(); toast("Goals lainnya dihitung ulang."); });

  const btnGoals2ToPlan = $("btnGoals2ToPlan");
  if(btnGoals2ToPlan) btnGoals2ToPlan.addEventListener("click", ()=> setActiveSection("plan"));

  const btnGoals2Reset = $("btnGoals2Reset");
  if(btnGoals2Reset) btnGoals2Reset.addEventListener("click", ()=>{
    goalsMultiState = loadGoalsMulti();
    saveGoalsMulti();
    renderGoalsMulti();
    toast("Goals lainnya di-reset.");
  });

  const btnGoals2ToGoalsS2 = $("btnGoals2ToGoalsS2");
  if(btnGoals2ToGoalsS2) btnGoals2ToGoalsS2.addEventListener("click", ()=> setActiveSection("goals"));

  const btnGoals2Add = $("btnGoals2Add");
  if(btnGoals2Add) btnGoals2Add.addEventListener("click", ()=>{
    const type = document.getElementById("g2_type")?.value || "lainnya";
    const name = (document.getElementById("g2_name")?.value || "Goal").trim();
    const target = Number(document.getElementById("g2_target")?.value || 0);
    const current = Number(document.getElementById("g2_current")?.value || 0);
    const date = document.getElementById("g2_date")?.value || new Date().toISOString().slice(0,10);
    const priority = document.getElementById("g2_priority")?.value || "sedang";

    goalsMultiState.items.push({
      id: genId(),
      type, name,
      target: isNaN(target)?0:target,
      current: isNaN(current)?0:current,
      date,
      priority
    });

    saveGoalsMulti();
    renderGoalsMulti();
    toast("Goal ditambahkan.");
  });

  // visuals
  const btnVisualsRecalc = $("btnVisualsRecalc");
  if(btnVisualsRecalc) btnVisualsRecalc.addEventListener("click", ()=>{ renderVisuals(); toast("Grafik di-refresh."); });

  const btnVisualsToPlan = $("btnVisualsToPlan");
  if(btnVisualsToPlan) btnVisualsToPlan.addEventListener("click", ()=> setActiveSection("plan"));

  // plan
  const btnPlanRecalc = $("btnPlanRecalc");
  if(btnPlanRecalc) btnPlanRecalc.addEventListener("click", ()=>{ renderPlan(); toast("Roadmap di-refresh."); });

  const btnPlanToLanding = $("btnPlanToLanding");
  if(btnPlanToLanding) btnPlanToLanding.addEventListener("click", ()=> setActiveSection("landing"));
}

/* =========================
   INIT
========================= */
function init(){
  wireButtons();
  renderLanding();
  renderWizard();
  renderResults();
  renderAI();
  renderGoalsS2();
  renderGoalsMulti();
  renderVisuals();
  renderPlan();
}
init();
