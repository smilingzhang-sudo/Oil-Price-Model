const DATA_MODE = "sample"; // "sample" | "api"

const API = {
  latest: "/api/latest",
  history: "/api/history?days=365",
};

async function loadJSON(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}

function scoreLabel(score){
  if(score === null || score === undefined || Number.isNaN(score)) return {text:"未知", tone:"warn"};
  if(score >= 75) return {text:"偏多", tone:"good"};
  if(score >= 55) return {text:"略偏多", tone:"good"};
  if(score >= 45) return {text:"中性", tone:"warn"};
  if(score >= 25) return {text:"略偏空", tone:"bad"};
  return {text:"偏空", tone:"bad"};
}

function toneColor(tone){
  if(tone==="good") return "var(--good)";
  if(tone==="bad") return "var(--bad)";
  return "var(--warn)";
}
function el(id){ return document.getElementById(id); }

function buildIndicatorRows(cfg, snapshot){
  const rows = [];
  const byName = {};
  (snapshot?.indicators || []).forEach(x => byName[x.name] = x);

  cfg.buckets.forEach(b => {
    b.subgroups.forEach(sg => {
      sg.indicators.forEach(ind => {
        const rec = byName[ind.name] || {};
        rows.push({
          bucket: b.code,
          subgroup: sg.code,
          name: ind.name,
          weight: ind.weight,
          score: rec.score,
          value: rec.current_value,
          updated_at: rec.updated_at
        });
      });
    });
  });
  return rows;
}

function renderScorecard(cfg, snapshot){
  const total = snapshot?.total_score ?? null;
  el("kpiScore").textContent = total===null ? "—" : Math.round(total);
  const sl = scoreLabel(total);
  const pill = el("kpiLabel");
  pill.querySelector("b").textContent = sl.text;
  pill.style.borderColor = toneColor(sl.tone);

  el("asOf").textContent = snapshot?.as_of ? snapshot.as_of : "—";

  const bucketScores = snapshot?.buckets || [];
  const tbody = el("bucketBody");
  tbody.innerHTML = "";
  cfg.buckets.forEach(b => {
    const s = bucketScores.find(x => x.code===b.code)?.score ?? null;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="badge">${b.code}</span></td>
      <td>${b.weight}%</td>
      <td class="right">${s===null ? "—" : Math.round(s)}</td>
    `;
    tbody.appendChild(tr);
  });

  const indRows = buildIndicatorRows(cfg, snapshot);
  const itbody = el("indicatorBody");
  itbody.innerHTML="";
  indRows.forEach(r => {
    const tr=document.createElement("tr");
    tr.innerHTML = `
      <td><span class="badge">${r.bucket}</span> <span class="badge">${r.subgroup}</span></td>
      <td>${r.name}</td>
      <td class="right">${r.weight}%</td>
      <td class="right">${r.score===null||r.score===undefined ? "—" : r.score}</td>
      <td class="right">${r.value===null||r.value===undefined ? "—" : r.value}</td>
      <td class="small">${r.updated_at || "—"}</td>
    `;
    itbody.appendChild(tr);
  });
}

function renderChart(history){
  const chartEl = el("chart");
  if(!chartEl) return;
  const chart = echarts.init(chartEl);
  const xs = (history || []).map(x => x.as_of);
  const ys = (history || []).map(x => x.total_score);

  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type:'category', data: xs, axisLabel: {color:'rgba(255,255,255,0.65)'} },
    yAxis: { type:'value', min:0, max:100, axisLabel:{color:'rgba(255,255,255,0.65)'} },
    series: [{ type:'line', data: ys, smooth:true }]
  });
  window.addEventListener("resize", () => chart.resize());
}

async function getData(){
  if(DATA_MODE === "api"){
    const latest = await loadJSON(API.latest);
    const history = await loadJSON(API.history);
    return {latest, history};
  }
  const latest = await loadJSON("assets/sample_latest.json");
  const history = await loadJSON("assets/sample_history.json");
  return {latest, history};
}

async function init(){
  try{
    const cfg = await loadJSON("assets/oups_config_v1.json");
    const {latest, history} = await getData();
    renderScorecard(cfg, latest);
    renderChart(history);
    el("configPath").textContent = "assets/oups_config_v1.json";
  }catch(err){
    console.error(err);
    el("errorBox").style.display="block";
    el("errorBox").textContent = "加载失败：" + err.message;
  }
}
document.addEventListener("DOMContentLoaded", init);
