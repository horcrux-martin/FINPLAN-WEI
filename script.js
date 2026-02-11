/* script.js */
/* NOTE: Ini versi terpisah (JS external). Semua logic tetap jalan, termasuk:
   - getDefaultSteps()
   - sum() dan calculateFinancial() EXACT
   - generateAIRecommendation()
   - calculateS2Goal()
   - Chart.js render
   - Wizard flow + navigation
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
              motor: 4000000
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

/* ====== STATE & STORAGE ====== */
const STORAGE_KEY = "cfp_financial_planner_v1";
const GOALS_KEY = "cfp_financial_planner_goals_v1";

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{ return JSON.parse(raw); }catch(e){}
  }
  return getDefaultSteps();
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(STORAGE_KEY + "_lastSaved", String(Date.now()));
}

function loadGoals(){
  const raw = localStorage.getItem(GOALS_KEY);
  if(raw){
    try{ return JSON.parse(raw); }catch(e){}
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
function saveGoals(g){ localStorage.setItem(GOALS_KEY, JSON.stringify(g)); }

let stepsState = loadState();
let goalsState = loadGoals();

/* ====== NAV ====== */
const nav = document.getElementById("nav");
const sections = {
  landing: document.getElementById("section-landing"),
  checkup: document.getElementById("section-checkup"),
  results: document.getElementById("section-results"),
  ai: document.getElementById("section-ai"),
  goals: document.getElementById("section-goals"),
  visuals: document.getElementById("section-visuals"),
  plan: document.getElementById("section-plan"),
};

function setActiveSection(key){
  Object.entries(sections).forEach(([k, el])=>{
    el.classList.toggle("active", k===key);
  });
  Array.from(nav.querySelectorAll("button")).forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.target===key);
  });
  window.scrollTo({top:0, behavior:"smooth"});
  if(key === "landing") renderLanding();
  if(key === "checkup") renderWizard();
  if(key === "results") renderResults();
  if(key === "ai") renderAI();
  if(key === "goals") renderGoals();
  if(key === "visuals") renderVisuals();
  if(key === "plan") renderPlan();
}

nav.addEventListener("click", (e)=>{
  const btn = e.target.closest("button[data-target]");
  if(!btn) return;
  setActiveSection(btn.dataset.target);
});

document.addEventListener("keydown", (e)=>{
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="k"){
    e.preventDefault();
    setActiveSection("checkup");
  }
});

/* ====== UTIL ====== */
function formatIDR(n){
  const num = Number(n) || 0;
  return "Rp " + num.toLocaleString("id-ID");
}
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove("show"), 2200);
}
function getFinancialData(){ return stepsState["step-financial"].data; }
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

/* Derived: liquidity operasional exclude saving */
function calculateDerived(fin, data){
  const income = sum(data.income);
  const expensesTotal = sum(data.expenses);
  const essentialExpenses = Math.max(0, expensesTotal - (Number(data.expenses.saving)||0));
  const liquidityOperational = essentialExpenses > 0 ? (fin.assetCash / essentialExpenses) : Infinity;
  return { income, expensesTotal, essentialExpenses, liquidityOperational };
}

/* ====== STATUS HELPERS ====== */
function statusPill(type, text){
  const emoji = type==="good"?"🟢":type==="warn"?"🟡":type==="bad"?"🔴":"🔵";
  return `<span class="pill ${type}"><strong>${emoji}</strong> ${text}</span>`;
}
function getLiquidityStatus(liqOp){
  if(!isFinite(liqOp)) return {type:"good", title:"Dana likuid jauh di atas kebutuhan", desc:"Pengeluaran esensial tercatat 0. Pastikan data pengeluaran sudah benar."};
  if(liqOp < 3) return {type:"warn", title:"Likuiditas kurang dari 3 bulan", desc:"Kamu rentan kalau ada kejadian tak terduga (kesehatan, keluarga, pekerjaan)."};
  if(liqOp < 6) return {type:"good", title:"Likuiditas aman (3–6 bulan)", desc:"Cukup untuk menahan guncangan umum tanpa buru-buru berutang."};
  return {type:"good", title:"Likuiditas kuat (≥ 6 bulan)", desc:"Kamu punya bantalan besar. Pastikan tidak semuanya parkir di instrumen ber-return rendah."};
}
function getSavingStatus(sr){
  if(sr < 10) return {type:"bad", title:"Saving ratio rendah", desc:"Kemajuan goals akan lambat. Biasanya ada 2 jalan: tekan pengeluaran bocor atau naikkan pendapatan."};
  if(sr < 20) return {type:"warn", title:"Saving ratio sedang", desc:"Cukup untuk stabil, tapi untuk goals besar (S2/rumah) kamu butuh strategi tambahan."};
  if(sr < 30) return {type:"good", title:"Saving ratio bagus", desc:"Kamu punya ruang untuk goals, investasi, dan peningkatan kualitas hidup yang tetap terukur."};
  return {type:"good", title:"Saving ratio sangat kuat", desc:"Kamu agresif menabung. Pastikan likuiditas & kesehatan mental tetap seimbang."};
}
function getDebtStatus(dr){
  if(dr > 30) return {type:"bad", title:"Debt ratio berbahaya (>30%)", desc:"Cicilan makan porsi besar pendapatan. Risiko gagal bayar meningkat saat ada gangguan cashflow."};
  if(dr > 20) return {type:"warn", title:"Debt ratio agak ketat (20–30%)", desc:"Masih bisa jalan, tapi ruang untuk goals & investasi jadi sempit."};
  return {type:"good", title:"Debt ratio aman (≤20%)", desc:"Cicilan relatif terkendali. Tinggal pastikan bunga & tenor tidak menyedot banyak biaya."};
}
function cashflowStatus(cf){
  if(cf < 0) return {type:"bad", title:"Cashflow negatif", desc:"Pengeluaran lebih besar dari pendapatan. Ini harus dibenahi dulu sebelum nambah goals/investasi."};
  if(cf < 500000) return {type:"warn", title:"Cashflow tipis", desc:"Masih surplus, tapi shock kecil bisa bikin defisit. Perlu buffer lebih."};
  return {type:"good", title:"Cashflow surplus", desc:"Ada ruang bernapas. Kamu bisa atur alokasi: dana darurat, investasi, dan goals."};
}

/* ====== UI HELPERS ====== */
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

/* ====== WIZARD ====== */
const wizardMeta = [
  { key:"assets", title:"Step 1: Aset", desc:"Isi aset kas/likuid, investasi, dan aset non-likuid. Fokus: berapa yang cepat dicairkan kalau darurat." },
  { key:"liabilities", title:"Step 2: Kewajiban (Utang)", desc:"Isi utang jangka pendek dan jangka panjang. Fokus: yang bunganya mahal dulu." },
  { key:"income", title:"Step 3: Pendapatan", desc:"Isi pendapatan bulanan rutin (gaji/side income). Kalau pendapatan tidak rutin, pakai rata-rata konservatif." },
  { key:"expenses", title:"Step 4: Pengeluaran", desc:"Isi pengeluaran bulanan. Catatan: 'saving' dianggap alokasi tujuan, bukan pengeluaran esensial." }
];
let wizardIndex = 0;

function calcCompletionFlags(){
  const d = getFinancialData();
  const flags = {};
  flags.assets = (sum(d.assets.cash)+sum(d.assets.investments)+sum(d.assets.nonLiquid.konsumsi)+sum(d.assets.nonLiquid.investasi)) > 0;
  flags.liabilities = (sum(d.liabilities.shortTerm)+sum(d.liabilities.longTerm)) >= 0;
  flags.income = sum(d.income) > 0;
  flags.expenses = sum(d.expenses) > 0;
  return flags;
}

function updateLastSavedPill(){
  const t = localStorage.getItem(STORAGE_KEY + "_lastSaved");
  const el = document.getElementById("pillLastSaved");
  if(!el) return;
  if(!t){ el.innerHTML = `<strong>Terakhir simpan:</strong> —`; return; }
  const dt = new Date(Number(t));
  el.innerHTML = `<strong>Terakhir simpan:</strong> ${dt.toLocaleString("id-ID")}`;
}

function renderWizardSteps(){
  const el = document.getElementById("wizardSteps");
  const flags = calcCompletionFlags();
  const totalComplete = wizardMeta.filter(m=>flags[m.key]).length;
  document.getElementById("wizardProgressPill").innerHTML = `<strong>Progress:</strong> ${totalComplete}/4`;

  el.innerHTML = wizardMeta.map((m, idx)=>{
    const ok = flags[m.key];
    const badgeClass = ok ? "good" : "warn";
    const badgeText = ok ? "✓" : (idx+1);
    return `
      <div class="step ${idx===wizardIndex?"active":""}" data-idx="${idx}">
        <div>
          <div class="t">${m.title}</div>
          <div class="s">${ok ? "Terisi" : "Belum lengkap"}</div>
        </div>
        <div class="badge ${badgeClass}">${badgeText}</div>
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
  if(!document.getElementById("wizardForm")) return;
  renderWizardSteps();

  const meta = wizardMeta[wizardIndex];
  document.getElementById("wizardStepTitle").textContent = meta.title;
  document.getElementById("wizardStepDesc").textContent = meta.desc;

  const formWrap = document.getElementById("wizardForm");
  const d = getFinancialData();

  if(meta.key === "assets"){
    formWrap.innerHTML = `
      <div class="h3">Aset Kas / Likuid</div>
      <div class="form">
        ${numberField("Cash di tangan","assets.cash.cashOnHand",d.assets.cash.cashOnHand,"Termasuk cash & e-wallet yang bisa langsung dipakai.")}
        ${numberField("Tabungan","assets.cash.savings",d.assets.cash.savings,"Tabungan bank yang bisa dicairkan kapan pun.")}
        ${numberField("Deposito","assets.cash.deposito",d.assets.cash.deposito,"Deposito jangka pendek.")}
        ${numberField("RDPU","assets.cash.rdpu",d.assets.cash.rdpu,"Reksa Dana Pasar Uang (likuid & relatif stabil).")}
      </div>
      <div class="space"></div>
      <div class="h3">Aset Investasi</div>
      <div class="form">
        ${numberField("Emas","assets.investments.emas",d.assets.investments.emas,"Nilai pasar saat ini.")}
        ${numberField("RDPT","assets.investments.rdpt",d.assets.investments.rdpt,"Reksa Dana Pendapatan Tetap.")}
        ${numberField("RDC","assets.investments.rdc",d.assets.investments.rdc,"Reksa Dana Campuran.")}
        ${numberField("RDS","assets.investments.rds",d.assets.investments.rds,"Reksa Dana Saham.")}
        ${numberField("Obligasi","assets.investments.obligasi",d.assets.investments.obligasi,"Nilai pasar obligasi saat ini.")}
        ${numberField("Saham","assets.investments.saham",d.assets.investments.saham,"Nilai pasar portfolio saham.")}
      </div>
      <div class="space"></div>
      <div class="h3">Aset Non-Likuid</div>
      <div class="form">
        ${numberField("Motor (konsumsi)","assets.nonLiquid.konsumsi.motor",d.assets.nonLiquid.konsumsi.motor,"Aset sulit dicairkan cepat.")}
        ${numberField("BPJS (investasi)","assets.nonLiquid.investasi.bpjs",d.assets.nonLiquid.investasi.bpjs,"Saldo/manfaat jangka panjang.")}
      </div>
    `;
  }

  if(meta.key === "liabilities"){
    formWrap.innerHTML = `
      <div class="h3">Utang Jangka Pendek</div>
      <div class="form">
        ${numberField("Kartu Kredit / Paylater","liabilities.shortTerm.creditCard",d.liabilities.shortTerm.creditCard,"Outstanding (tagihan berjalan).")}
      </div>
      <div class="space"></div>
      <div class="h3">Utang Jangka Panjang</div>
      <div class="form">
        ${numberField("KPR / Home Loan","liabilities.longTerm.homeLoan",d.liabilities.longTerm.homeLoan,"Sisa pokok utang.")}
      </div>
    `;
  }

  if(meta.key === "income"){
    formWrap.innerHTML = `
      <div class="h3">Pendapatan Bulanan</div>
      <div class="form">
        ${numberField("Gaji (rutin)","income.salary",d.income.salary,"Take-home pay bulanan rata-rata.")}
      </div>
    `;
  }

  if(meta.key === "expenses"){
    formWrap.innerHTML = `
      <div class="h3">Pengeluaran Bulanan</div>
      <div class="form">
        ${numberField("Saving (alokasi tujuan)","expenses.saving",d.expenses.saving,"Alokasi untuk tabungan/investasi/goals.")}
        ${numberField("Zakat","expenses.zakat",d.expenses.zakat,"Rata-rata bulanan.")}
        ${numberField("Utilities","expenses.utilities",d.expenses.utilities,"Listrik, air, internet, pulsa.")}
        ${numberField("Groceries","expenses.groceries",d.expenses.groceries,"Belanja bulanan / makan harian.")}
        ${numberField("Transport","expenses.transport",d.expenses.transport,"Bensin/ojol, parkir, tol.")}
        ${numberField("Cicilan (monthly installment)","expenses.installment",d.expenses.installment,"Total cicilan bulanan.")}
      </div>
    `;
  }

  formWrap.querySelectorAll("input[data-path]").forEach(inp=>{
    inp.addEventListener("input", ()=>{
      const path = inp.dataset.path;
      const val = Number(inp.value || 0);
      setByPath(stepsState["step-financial"].data, path, isNaN(val)?0:val);
      saveState(stepsState);
      updateLastSavedPill();
      renderQuickMetrics();
    });
  });

  document.getElementById("btnPrev").disabled = wizardIndex===0;
  document.getElementById("btnNext").textContent = wizardIndex===wizardMeta.length-1 ? "Selesai → Dashboard" : "Berikutnya →";

  updateLastSavedPill();
  renderQuickMetrics();
}

function renderLanding(){
  const data = getFinancialData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);
  const liqS = getLiquidityStatus(d.liquidityOperational);
  const savS = getSavingStatus(fin.savingRatio);
  const debtS = getDebtStatus(fin.debtRatio);
  const cfS = cashflowStatus(fin.cashflow);

  const kpi = document.getElementById("kpiLanding");
  if(!kpi) return;
  kpi.innerHTML = `
    <div class="card">
      <div class="label">Net Worth</div>
      <div class="val">${formatIDR(fin.netWorth)}</div>
      <div class="hint">Aset (${formatIDR(fin.totalAssets)}) - Utang (${formatIDR(fin.totalDebt)}).</div>
    </div>
    <div class="card">
      <div class="label">Cashflow Bulanan</div>
      <div class="val">${formatIDR(fin.cashflow)}</div>
      <div class="hint">${cfS.title}: ${cfS.desc}</div>
    </div>
    <div class="card">
      <div class="label">Rasio Likuiditas (Operasional)</div>
      <div class="val">${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"}x</div>
      <div class="hint">${liqS.title}. Dampak: ${liqS.desc}</div>
    </div>
    <div class="card">
      <div class="label">Saving & Debt Ratio</div>
      <div class="val">${fin.savingRatio.toFixed(0)}% / ${fin.debtRatio.toFixed(0)}%</div>
      <div class="hint">Saving: ${savS.title}. Utang: ${debtS.title}.</div>
    </div>
  `;
}

function renderQuickMetrics(){
  const wrap = document.getElementById("quickMetrics");
  if(!wrap) return;
  const data = getFinancialData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);

  const liqS = getLiquidityStatus(d.liquidityOperational);
  const savS = getSavingStatus(fin.savingRatio);
  const debtS = getDebtStatus(fin.debtRatio);
  const cfS = cashflowStatus(fin.cashflow);

  wrap.innerHTML = `
    ${metricCard("Likuiditas Operasional", `${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"}x`, liqS.type, liqS.title, liqS.desc)}
    ${metricCard("Saving Ratio", `${fin.savingRatio.toFixed(0)}%`, savS.type, savS.title, savS.desc)}
    ${metricCard("Debt Ratio (Cicilan)", `${fin.debtRatio.toFixed(0)}%`, debtS.type, debtS.title, debtS.desc)}
    ${metricCard("Net Worth", formatIDR(fin.netWorth), fin.netWorth >= 0 ? "good" : "warn", fin.netWorth >= 0 ? "Positif" : "Negatif", "Net worth menunjukkan akumulasi kekayaan bersih.")}
    ${metricCard("Cashflow", formatIDR(fin.cashflow), cfS.type, cfS.title, cfS.desc)}
    ${metricCard("Total Aset", formatIDR(fin.totalAssets), "info", "Komposisi aset penting", "Pastikan proporsi kas cukup untuk darurat dan investasi selaras tujuan.")}
  `;
}

/* ====== AI RECOMMENDATION (WAJIB) ====== */
function getInvestmentAllocationStrategy(fin, data){
  const d = calculateDerived(fin, data);
  const liqOp = d.liquidityOperational;
  const sr = fin.savingRatio;
  const dr = fin.debtRatio;

  const bullets = [];
  let note = "";

  bullets.push("Langkah 1: Pastikan dana darurat operasional aman (≥ 3 bulan). Ini fondasi.");
  bullets.push("Langkah 2: Setelah aman, baru bagi alokasi konservatif vs growth sesuai horizon.");

  if(liqOp < 3){
    bullets.push("Alokasi awal: fokus RDPU/deposito jangka pendek untuk dana darurat; tahan dulu porsi saham tinggi.");
    note = "Likuiditas rendah: risiko terbesar bukan ketinggalan cuan, tapi kepepet butuh uang lalu jual rugi/ngutang mahal.";
  } else {
    bullets.push("Alokasi umum:");
    bullets.push("• Dana darurat: tabungan/RDPU/deposito (likuid).");
    bullets.push("• Tujuan 3–5 tahun: RDPT/obligasi.");
    bullets.push("• >5 tahun: RDS/saham bertahap (DCA) sesuai profil risiko.");
    if(sr >= 30 && dr <= 30){
      bullets.push("Saving kuat: kamu bisa DCA konsisten untuk growth (tetap disiplin).");
    } else {
      bullets.push("Saving terbatas: kecilkan porsi growth dulu, naikkan perlahan setelah stabil.");
    }
    note = "Sesuaikan instrumen dengan tujuan & jangka waktu. Disiplin bulanan > timing pasar.";
  }

  if(dr > 30){
    bullets.push("Jika debt ratio >30%, prioritaskan turunkan utang mahal sebelum tambah investasi berisiko.");
  }

  return { bullets, note };
}

function getDebtPrioritizationStrategy(fin, data){
  const shortDebt = sum(data.liabilities.shortTerm);
  const longDebt = sum(data.liabilities.longTerm);
  const dr = fin.debtRatio;

  const bullets = [];
  bullets.push("Bikin daftar utang: jenis, bunga efektif, sisa pokok, tenor, dan minimum payment.");
  bullets.push("Metode: Avalanche → bayar minimum semua, lalu ekstra fokus ke bunga tertinggi dulu.");
  bullets.push("Snowball boleh untuk motivasi, tapi jangan biarkan utang bunga tinggi jalan lama.");

  if(shortDebt > 0) bullets.push("Utang jangka pendek (kartu kredit/paylater) biasanya paling mahal: prioritas #1.");
  if(longDebt > 0) bullets.push("Utang panjang (KPR): evaluasi bunga. Kalau kompetitif dan aman, tidak perlu dipaksa lunas dulu.");

  let tone = "good";
  let note = "Utang bisa dikelola. Yang penting: jangan biarkan bunga tinggi berjalan.";
  if(dr > 30){
    tone = "bad";
    bullets.push("Karena debt ratio tinggi, arahkan 60–80% surplus ke pelunasan utang mahal sampai rasio turun aman.");
    note = "Saat rasio utang tinggi, fokusnya survival & stabilitas. Setelah aman, baru agresif investasi/goals.";
  } else if(dr > 20){
    tone = "warn";
    bullets.push("Debt ratio agak ketat: targetkan pelunasan ekstra 5–10% income ke utang mahal.");
    note = "Tujuannya bikin ruang cashflow supaya goals S2 lebih feasible.";
  }
  return { tone, bullets, note };
}

function buildTop3(liqOp, sr, dr, cf){
  const lines = [];
  if(liqOp < 3) lines.push("1) Naikkan dana darurat operasional sampai ≥ 3 bulan.");
  else lines.push("1) Pertahankan dana darurat, lalu rapikan alokasi investasi sesuai tujuan.");

  if(dr > 30) lines.push("2) Turunkan debt ratio: lunasi utang berbunga tinggi pakai avalanche.");
  else if(dr > 20) lines.push("2) Kunci cicilan: jangan tambah cicilan baru, lakukan pelunasan ekstra konsisten.");
  else lines.push("2) Debt ratio aman: pertahankan, hindari bunga berjalan kartu kredit.");

  if(cf < 0) lines.push("3) Benahi cashflow dulu. Investasi & goals nunggu stabil.");
  else if(sr < 20) lines.push("3) Naikkan saving ratio bertahap (2–5%) dengan autopay.");
  else lines.push("3) Pisahkan saving jadi 3 ember: darurat, investasi, goals S2.");

  return `<ul style="margin:0; padding-left:18px; line-height:1.65; font-size:12px">${lines.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

function generateAIRecommendation(fin) {
  const data = getFinancialData();
  const d = calculateDerived(fin, data);
  const liqOp = d.liquidityOperational;
  const sr = fin.savingRatio;
  const dr = fin.debtRatio;
  const cf = fin.cashflow;

  const cards = [];

  if(liqOp < 3){
    cards.push({tone:"warn",title:"Prioritas 1 — Naikkan Dana Darurat Operasional",bullets:[
      "Target minimal: dana darurat = 3 bulan pengeluaran esensial (tanpa saving).",
      "Tahan dulu investasi berisiko tinggi sampai dana darurat aman.",
      "Kalau saving terlalu besar sampai mengorbankan likuiditas, geser sebagian saving ke dana darurat dulu."
    ],note:"Dampak: kamu nggak perlu ngutang mahal saat kejadian tak terduga."});
  } else {
    cards.push({tone:"good",title:"Dana Darurat — Arah yang benar",bullets:[
      `Likuiditas operasional kamu sekitar ${isFinite(liqOp)?liqOp.toFixed(1):"∞"} bulan.`,
      "Pertahankan dana darurat di instrumen sangat likuid (tabungan, RDPU, deposito pendek).",
      "Kalau likuiditas sudah >6 bulan, optimasi return bertahap."
    ],note:"Dampak: keputusan investasi jadi lebih tenang dan rasional."});
  }

  if(sr > 30){
    cards.push({tone:"info",title:"Saving Ratio Tinggi — Bagus, tapi pastikan sehat",bullets:[
      `Saving ratio kamu sekitar ${sr.toFixed(0)}%.`,
      "Cek apakah saving mengorbankan kebutuhan esensial & kesehatan.",
      "Pisahkan saving berdasarkan tujuan: darurat, investasi, goals."
    ],note:"Saving besar itu power, tapi jangan sampai bikin likuiditas rapuh."});
  } else {
    cards.push({tone: sr < 20 ? "warn" : "good",title:"Optimasi Saving — Naikkan 2–5% dulu",bullets:[
      `Saving ratio kamu sekitar ${sr.toFixed(0)}%.`,
      "Audit 3 pos: langganan, impuls makan/coffee, dan transport.",
      "Autopay saving tepat setelah gajian."
    ],note:"Naik bertahap itu lebih sustain daripada ekstrem lalu menyerah."});
  }

  if(dr > 30){
    cards.push({tone:"bad",title:"Utang — Zona Bahaya: Perlu Strategi Penyelamatan",bullets:[
      `Debt ratio kamu sekitar ${dr.toFixed(0)}%.`,
      "Prioritas: lunasi utang berbunga tinggi dulu (kartu kredit/paylater) dengan avalanche.",
      "Stop nambah cicilan baru sampai rasio turun aman."
    ],note:"Debt tinggi bikin kamu rapuh saat ada gangguan cashflow."});
  } else {
    cards.push({tone: dr > 20 ? "warn" : "good",title:"Utang — Tetap Kendalikan",bullets:[
      `Debt ratio kamu sekitar ${dr.toFixed(0)}%.`,
      "Bayar kartu kredit full tiap bulan (hindari bunga berjalan).",
      "Kalau ada utang bunga tinggi, lakukan pelunasan ekstra."
    ],note:"Utang yang terkontrol itu alat, utang bunga tinggi itu kebocoran."});
  }

  const cfS = cashflowStatus(cf);
  cards.push({tone: cfS.type,title:"Cashflow — Kondisi Bulanan Kamu",bullets:[
    `Cashflow (income - total expenses) = ${formatIDR(cf)}.`,
    "Kalau negatif: perbaiki struktur pengeluaran dulu.",
    "Kalau positif: pakai sistem alokasi otomatis."
  ],note: cfS.desc});

  const alloc = getInvestmentAllocationStrategy(fin, data);
  cards.push({tone:"info",title:"Strategi Alokasi Investasi (Selalu Ada)",bullets: alloc.bullets,note: alloc.note});

  const debtPlan = getDebtPrioritizationStrategy(fin, data);
  cards.push({tone: debtPlan.tone,title:"Strategi Prioritasi Utang (Selalu Ada)",bullets: debtPlan.bullets,note: debtPlan.note});

  const top3 = buildTop3(liqOp, sr, dr, cf);
  return { cards, top3 };
}

function renderAI(){
  const wrap = document.getElementById("aiCards");
  if(!wrap) return;
  const fin = calculateFinancial(getFinancialData());
  const res = generateAIRecommendation(fin);
  wrap.innerHTML = res.cards.map(c=>`
    <div class="rec-card ${c.tone}">
      <h4>${c.title}</h4>
      <ul>${c.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>
      <div class="mini" style="margin-top:10px;color:var(--muted);font-size:12px;line-height:1.45">${c.note}</div>
    </div>
  `).join("");
  document.getElementById("aiTop3").innerHTML = res.top3;
}

/* ====== GOALS (WAJIB) ====== */
function monthsBetween(a, b){
  const ay = a.getFullYear(), am = a.getMonth(), ad = a.getDate();
  const by = b.getFullYear(), bm = b.getMonth(), bd = b.getDate();
  let months = (by - ay) * 12 + (bm - am);
  if(bd < ad) months -= 1;
  return Math.max(0, months);
}
function calculateS2Goal(input, fin) {
  const data = getFinancialData();
  const d = calculateDerived(fin, data);

  const baseTotal = (Number(input.tuition)||0) + (Number(input.living)||0) + (Number(input.visaInsurance)||0) + (Number(input.flight)||0) + (Number(input.buffer)||0);

  let adjustedTotal = baseTotal;
  if(input.scholarshipChance === "partial") adjustedTotal = Math.max(0, baseTotal * 0.6);
  if(input.scholarshipChance === "full") adjustedTotal = Math.max(0, baseTotal * 0.2);

  const currentFund = Number(input.currentFund)||0;
  const sideIncome = Number(input.sideIncome)||0;
  const monthlyCapacity = Math.max(0, (Number(data.expenses.saving)||0) + Math.max(0, fin.cashflow) + sideIncome);

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
    strategy.push(`Gap kamu sebesar ${formatIDR(gap)}. Dengan kapasitas ${formatIDR(monthlyCapacity)}/bulan, butuh sekitar ${monthsNeeded} bulan.`);
    strategy.push(`Target start kamu ${targetMonths} bulan lagi, jadi belum feasible dengan setting sekarang.`);
    strategy.push("Opsi: naikkan kapasitas saving, tekan biaya (beasiswa/negara lebih murah), atau geser start date.");
  } else {
    strategy.push(`Feasible. Gap ${formatIDR(gap)} bisa dikejar dalam ~${monthsNeeded} bulan dengan kapasitas ${formatIDR(monthlyCapacity)}/bulan.`);
    strategy.push("Kunci: autopay saving goals + pisahkan rekening/portofolio khusus goals S2.");
  }

  if(d.liquidityOperational < 3){
    strategy.push("Catatan: likuiditas operasional <3 bulan. Jangan ambil dana darurat untuk goals. Bangun pondasi dulu.");
  }

  const timeline = [];
  timeline.push("Bulan 1–3: rapikan budget, pastikan dana darurat minimal aman, tetapkan autopay goals.");
  timeline.push("Bulan 4–12: jalankan disiplin saving, cari opsi beasiswa & potong biaya.");
  if(isFinite(monthsNeeded) && monthsNeeded > 12) timeline.push("Tahun berikutnya: lanjutkan akumulasi dan kunci biaya sedini mungkin (kurangi risiko kurs).");

  return {
    baseTotal, adjustedTotal, currentFund, gap,
    monthlyCapacity, monthsNeeded, targetMonths, feasible,
    strategy, timeline
  };
}

function goalField(label, key, value, mini){
  return `
    <div class="field">
      <label>${label}</label>
      <input type="number" min="0" step="1000" data-gpath="${key}" value="${Number(value)||0}">
      <div class="mini">${mini}</div>
    </div>
  `;
}

let s2LineChart = null;
function renderGoalsForm(){
  const wrap = document.getElementById("goalsForm");
  if(!wrap) return;
  const g = goalsState;
  wrap.innerHTML = `
    ${goalField("Tuition (biaya kuliah total)","tuition",g.tuition,"Total biaya kuliah sampai lulus.")}
    ${goalField("Living cost (biaya hidup total)","living",g.living,"Total biaya hidup selama studi.")}
    ${goalField("Visa + Asuransi","visaInsurance",g.visaInsurance,"Visa, insurance, administrasi.")}
    ${goalField("Flight","flight",g.flight,"Estimasi tiket utama.")}
    ${goalField("Buffer (kurs/kejutan biaya)","buffer",g.buffer,"Buffer fluktuasi kurs & biaya tak terduga.")}
    ${goalField("Dana saat ini (khusus S2)","currentFund",g.currentFund,"Tabungan yang memang sudah disiapkan untuk S2.")}
    <div class="field">
      <label>Target mulai S2</label>
      <input type="date" data-gpath="startDate" value="${g.startDate}">
      <div class="mini">Dipakai untuk menghitung waktu yang tersedia.</div>
    </div>
    <div class="field">
      <label>Estimasi beasiswa</label>
      <select data-gpath="scholarshipChance">
        <option value="none" ${g.scholarshipChance==="none"?"selected":""}>Tidak ada / belum ada</option>
        <option value="partial" ${g.scholarshipChance==="partial"?"selected":""}>Parsial</option>
        <option value="full" ${g.scholarshipChance==="full"?"selected":""}>Hampir penuh</option>
      </select>
      <div class="mini">Total biaya akan di-adjust konservatif.</div>
    </div>
    ${goalField("Side income khusus goals (per bulan)","sideIncome",g.sideIncome,"Kalau mau tambah income khusus S2, isi di sini.")}
  `;

  wrap.querySelectorAll("input[data-gpath], select[data-gpath]").forEach(inp=>{
    inp.addEventListener("input", ()=>{
      const key = inp.dataset.gpath;
      let val = inp.value;
      if(inp.type === "number") val = Number(val || 0);
      goalsState[key] = (inp.tagName==="SELECT") ? val : (inp.type==="date" ? val : (isNaN(val)?0:val));
      saveGoals(goalsState);
      renderGoalsResult();
    });
  });
}

function recommendedMonthly(gap, monthsAvail){
  if(!isFinite(monthsAvail) || monthsAvail<=0) return 0;
  return Math.ceil((Number(gap)||0) / monthsAvail);
}

function renderS2ProjectionChart(out){
  const ctx = document.getElementById("s2Line");
  if(!ctx || typeof Chart === "undefined") return;

  const months = isFinite(out.targetMonths) ? out.targetMonths : 24;
  const cap = out.monthlyCapacity;
  const start = out.currentFund;

  const labels = [];
  const dataPoints = [];
  let acc = start;

  for(let i=0;i<=months;i++){
    labels.push(`B${i}`);
    if(i>0) acc += cap;
    dataPoints.push(acc);
  }

  if(s2LineChart) s2LineChart.destroy();

  s2LineChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label:'Akumulasi Dana Goals', data:dataPoints, tension:0.25, fill:true }] },
    options: { responsive:true, maintainAspectRatio:false }
  });
}

function renderGoalsResult(){
  const box = document.getElementById("goalsResult");
  if(!box) return;

  const fin = calculateFinancial(getFinancialData());
  const out = calculateS2Goal(goalsState, fin);

  const feasiblePill = out.feasible
    ? statusPill("good", "Feasible (masuk akal)")
    : statusPill("warn", "Belum feasible (butuh strategi)");

  const monthsText = isFinite(out.monthsNeeded) ? `${out.monthsNeeded} bulan` : "— (kapasitas 0)";

  box.innerHTML = `
    <div class="row" style="justify-content:space-between; align-items:flex-start">
      <div>
        <div class="pill info"><strong>Total biaya (base):</strong> ${formatIDR(out.baseTotal)}</div>
        <div class="space"></div>
        <div class="pill info"><strong>Total biaya (setelah beasiswa):</strong> ${formatIDR(out.adjustedTotal)}</div>
      </div>
      <div>${feasiblePill}</div>
    </div>

    <div class="divider"></div>

    <div class="pill info"><strong>Gap:</strong> ${formatIDR(out.gap)}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Kapasitas saving goals / bulan:</strong> ${formatIDR(out.monthlyCapacity)}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Waktu dibutuhkan:</strong> ${monthsText}</div>
    <div class="space"></div>
    <div class="pill info"><strong>Waktu tersedia:</strong> ${out.targetMonths} bulan</div>

    <div class="divider"></div>

    <div class="h3">Strategi</div>
    <div class="muted" style="line-height:1.65; font-size:12px">
      <ul style="margin:0; padding-left:18px">${out.strategy.map(s=>`<li>${s}</li>`).join("")}</ul>
    </div>

    <div class="space"></div>
    <div class="h3">Timeline</div>
    <div class="muted" style="line-height:1.65; font-size:12px">
      <ul style="margin:0; padding-left:18px">${out.timeline.map(t=>`<li>${t}</li>`).join("")}</ul>
    </div>
  `;

  // realistic notes
  const d = calculateDerived(fin, getFinancialData());
  const liqS = getLiquidityStatus(d.liquidityOperational);
  const debtS = getDebtStatus(fin.debtRatio);
  const savS = getSavingStatus(fin.savingRatio);

  const notes = [];
  notes.push(`Likuiditas operasional: ${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"} bulan (${liqS.title}).`);
  notes.push(`Debt ratio: ${fin.debtRatio.toFixed(0)}% (${debtS.title}).`);
  notes.push(`Saving ratio: ${fin.savingRatio.toFixed(0)}% (${savS.title}).`);
  if(!out.feasible){
    const rec = recommendedMonthly(out.gap, out.targetMonths);
    if(rec > 0) notes.push(`Agar feasible di timeline sekarang, kira-kira butuh ${formatIDR(rec)}/bulan.`);
  }

  const noteEl = document.getElementById("goalsRealisticNotes");
  if(noteEl){
    noteEl.innerHTML = `<div style="line-height:1.65; font-size:12px">${notes.map(n=>`• ${n}`).join("<br>")}</div>`;
  }

  renderS2ProjectionChart(out);
}

function renderGoals(){
  renderGoalsForm();
  renderGoalsResult();
}

/* ====== RESULTS ====== */
function renderResults(){
  const wrap = document.getElementById("resultsMetrics");
  if(!wrap) return;
  const data = getFinancialData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);

  const liqS = getLiquidityStatus(d.liquidityOperational);
  const savS = getSavingStatus(fin.savingRatio);
  const debtS = getDebtStatus(fin.debtRatio);
  const cfS = cashflowStatus(fin.cashflow);

  wrap.innerHTML = `
    ${metricCard("Rasio Likuiditas (Operasional)", `${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"}x`, liqS.type, liqS.title, liqS.desc)}
    ${metricCard("Rasio Menabung", `${fin.savingRatio.toFixed(0)}%`, savS.type, savS.title, savS.desc)}
    ${metricCard("Rasio Utang (Cicilan)", `${fin.debtRatio.toFixed(0)}%`, debtS.type, debtS.title, debtS.desc)}
    ${metricCard("Net Worth", formatIDR(fin.netWorth), fin.netWorth >= 0 ? "good" : "warn", fin.netWorth>=0?"Bersih positif":"Bersih negatif", `Aset ${formatIDR(fin.totalAssets)} - Utang ${formatIDR(fin.totalDebt)}.`)}
    ${metricCard("Cashflow Bulanan", formatIDR(fin.cashflow), cfS.type, cfS.title, cfS.desc)}
    ${metricCard("Komposisi Aset Likuid", `${formatIDR(fin.assetCash)} dari ${formatIDR(fin.totalAssets)}`, "info", "Kas/Likuid", "Kas penting untuk ketahanan. Setelah aman, optimasi return.")}
  `;

  const detail = document.getElementById("resultsDetailTable");
  if(detail){
    detail.innerHTML = `
      <div class="pill info"><strong>Total Aset:</strong> ${formatIDR(fin.totalAssets)}</div>
      <div class="space"></div>
      <div class="pill info"><strong>Total Utang:</strong> ${formatIDR(fin.totalDebt)}</div>
    `;
  }

  const narr = document.getElementById("resultsNarrative");
  if(narr){
    narr.innerHTML = `<div style="line-height:1.7; font-size:12px">
      • Likuiditas operasional: ${isFinite(d.liquidityOperational)?d.liquidityOperational.toFixed(1):"∞"} bulan.<br>
      • Saving ratio: ${fin.savingRatio.toFixed(0)}%. Debt ratio: ${fin.debtRatio.toFixed(0)}%.<br>
      • Cashflow: ${formatIDR(fin.cashflow)}.
    </div>`;
  }
}

/* ====== VISUALS (Chart.js real data) ====== */
let assetPieChart = null;
let cashBarChart = null;

function renderVisuals(){
  const pie = document.getElementById("assetPie");
  const bar = document.getElementById("cashBar");
  if(!pie || !bar || typeof Chart === "undefined") return;

  const data = getFinancialData();
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

  const v = document.getElementById("visualNarrative");
  if(v){
    v.innerHTML = `<div style="line-height:1.7; font-size:12px">
      • Pie menunjukkan struktur aset kamu: likuid vs investasi vs non-likuid.<br>
      • Bar menunjukkan apakah income kamu cukup menutup expenses dan menghasilkan surplus.<br>
      • Gunakan hasil ini untuk menentukan: fokus pondasi (darurat), bayar utang, atau ngegas goals.
    </div>`;
  }
}

/* ====== ROADMAP (adaptif) ====== */
function buildRoadmap(fin, d){
  const liqOp = d.liquidityOperational;
  const sr = fin.savingRatio;
  const dr = fin.debtRatio;
  const cf = fin.cashflow;

  const m3 = [];
  const m6 = [];
  const m12 = [];

  m3.push("Stabilkan dana darurat.");
  if(liqOp < 3) m3.push("Kejar dana darurat operasional sampai ≥ 3 bulan pengeluaran esensial.");
  m3.push("Audit pengeluaran dan pasang autopay saving.");

  m6.push("Optimasi alokasi investasi sesuai horizon.");
  if(dr > 30) m6.push("Kurangi utang berbunga tinggi dulu (avalanche).");
  else m6.push("Pelunasan ekstra kecil tapi konsisten untuk utang mahal.");

  m12.push("Capai target rasio sehat (liq ≥3, debt ≤30, saving ≥20).");
  if(cf >= 0) m12.push("Siap mulai funding goals besar (S2/rumah/dll) secara terukur.");

  return { m3, m6, m12 };
}

function renderPlan(){
  const p = document.getElementById("planPriority");
  const c = document.getElementById("planChecklist");
  const r = document.getElementById("roadmapBlocks");
  if(!p || !c || !r) return;

  const data = getFinancialData();
  const fin = calculateFinancial(data);
  const d = calculateDerived(fin, data);

  const priority = [];
  if(fin.cashflow < 0) priority.push("Cashflow negatif → benahi struktur pengeluaran dulu.");
  if(d.liquidityOperational < 3) priority.push("Likuiditas <3 bulan → bangun dana darurat operasional.");
  if(fin.debtRatio > 30) priority.push("Debt ratio >30% → turunkan utang berbunga tinggi.");

  if(priority.length === 0) priority.push("Kondisi relatif sehat → mulai fokus goals besar dan optimasi investasi.");

  p.innerHTML = `<ul style="margin:0; padding-left:18px; line-height:1.65; font-size:12px">${priority.map(x=>`<li>${x}</li>`).join("")}</ul>`;

  c.innerHTML = `<div class="pill info"><strong>Net Worth:</strong> ${formatIDR(fin.netWorth)}</div>`;

  const road = buildRoadmap(fin, d);
  r.innerHTML = `
    <div class="cards">
      <div class="rec-card warn"><h4>3 Bulan</h4><ul>${road.m3.map(x=>`<li>${x}</li>`).join("")}</ul></div>
      <div class="rec-card info"><h4>6 Bulan</h4><ul>${road.m6.map(x=>`<li>${x}</li>`).join("")}</ul></div>
      <div class="rec-card good"><h4>12 Bulan</h4><ul>${road.m12.map(x=>`<li>${x}</li>`).join("")}</ul></div>
    </div>
  `;
}

/* ====== BUTTONS ====== */
document.getElementById("btnStartWizard").addEventListener("click", ()=> setActiveSection("checkup"));
document.getElementById("btnLandingToResults").addEventListener("click", ()=> setActiveSection("results"));
document.getElementById("btnRecalcLanding").addEventListener("click", ()=>{ renderLanding(); toast("Hasil di-refresh."); });
document.getElementById("btnResetAll").addEventListener("click", ()=>{
  stepsState = getDefaultSteps();
  saveState(stepsState);
  toast("Data di-reset ke contoh.");
  renderLanding(); renderWizard(); renderResults(); renderAI(); renderGoals(); renderVisuals(); renderPlan();
});

document.getElementById("btnWizardRecalc").addEventListener("click", ()=>{ renderWizard(); toast("Wizard di-refresh."); });
document.getElementById("btnPrev").addEventListener("click", ()=>{ wizardIndex = clamp(wizardIndex-1,0,wizardMeta.length-1); renderWizard(); });
document.getElementById("btnNext").addEventListener("click", ()=>{
  if(wizardIndex === wizardMeta.length-1) setActiveSection("results");
  else { wizardIndex = clamp(wizardIndex+1,0,wizardMeta.length-1); renderWizard(); }
});
document.getElementById("btnGoResults").addEventListener("click", ()=> setActiveSection("results"));

document.getElementById("btnResultsRecalc").addEventListener("click", ()=>{ renderResults(); toast("Dashboard hasil di-refresh."); });
document.getElementById("btnResultsToAI").addEventListener("click", ()=> setActiveSection("ai"));
document.getElementById("btnToVisuals").addEventListener("click", ()=> setActiveSection("visuals"));
document.getElementById("btnToPlan").addEventListener("click", ()=> setActiveSection("plan"));

document.getElementById("btnAIRecalc").addEventListener("click", ()=>{ renderAI(); toast("Rekomendasi di-refresh."); });
document.getElementById("btnAIToGoals").addEventListener("click", ()=> setActiveSection("goals"));

document.getElementById("btnToAIFromCheckup").addEventListener("click", ()=> setActiveSection("ai"));
document.getElementById("btnToGoalsFromCheckup").addEventListener("click", ()=> setActiveSection("goals"));

document.getElementById("btnGoalsRecalc").addEventListener("click", ()=>{ renderGoalsResult(); toast("Goals dihitung ulang."); });
document.getElementById("btnGoalsCalc").addEventListener("click", ()=>{ renderGoalsResult(); toast("Feasibility dicek."); });
document.getElementById("btnGoalsReset").addEventListener("click", ()=>{
  goalsState = loadGoals();
  saveGoals(goalsState);
  renderGoals();
  toast("Input goals di-reset.");
});
document.getElementById("btnGoalsToAI").addEventListener("click", ()=> setActiveSection("ai"));
document.getElementById("btnGoalsToPlan").addEventListener("click", ()=> setActiveSection("plan"));
document.getElementById("btnGoalsToVisuals").addEventListener("click", ()=> setActiveSection("visuals"));

document.getElementById("btnVisualsRecalc").addEventListener("click", ()=>{ renderVisuals(); toast("Grafik di-refresh."); });
document.getElementById("btnVisualsToPlan").addEventListener("click", ()=> setActiveSection("plan"));

document.getElementById("btnPlanRecalc").addEventListener("click", ()=>{ renderPlan(); toast("Roadmap di-refresh."); });
document.getElementById("btnPlanToLanding").addEventListener("click", ()=> setActiveSection("landing"));

/* ====== INIT ====== */
function init(){
  renderLanding();
  renderWizard();
  renderResults();
  renderAI();
  renderGoals();
  renderVisuals();
  renderPlan();
}
init();
