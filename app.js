const { regions, sites, defaultRegion } = window.ATLAS_DATA;

const els = {
  siteCount: document.getElementById("siteCount"),
  regionTitle: document.getElementById("regionTitle"),
  regionMeta: document.getElementById("regionMeta"),
  regionBadge: document.getElementById("regionBadge"),
  variabilityMap: document.getElementById("variabilityMap"),
  mapHotspots: document.getElementById("mapHotspots"),
  regionToggle: document.getElementById("regionToggle"),
  siteSearch: document.getElementById("siteSearch"),
  selectedSiteName: document.getElementById("selectedSiteName"),
  selectedRegion: document.getElementById("selectedRegion"),
  selectedCoords: document.getElementById("selectedCoords"),
  iceMapPreview: document.getElementById("iceMapPreview"),
  previewButton: document.getElementById("previewButton"),
  openImage: document.getElementById("openImage"),
  regimeLabel: document.getElementById("regimeLabel"),
  bathyBars: document.getElementById("bathyBars"),
  listTitle: document.getElementById("listTitle"),
  listCount: document.getElementById("listCount"),
  siteList: document.getElementById("siteList"),
  modal: document.getElementById("imageModal"),
  modalImage: document.getElementById("modalImage"),
  modalClose: document.getElementById("modalClose"),
};

const regionByKey = new Map(regions.map((region) => [region.key, region]));
let currentRegion = defaultRegion || regions[0].key;
let selectedSiteKey = null;

function assetPath(kind, file) {
  return `assets/${kind}/${file}`;
}

function formatCoords(site) {
  const ns = site.lat >= 0 ? "N" : "S";
  const ew = site.lon >= 0 ? "E" : "W";
  return `${Math.abs(site.lat).toFixed(2)}${ns}, ${Math.abs(site.lon).toFixed(2)}${ew}`;
}

function sitesForCurrentRegion() {
  const query = els.siteSearch.value.trim().toLowerCase();
  return sites
    .filter((site) => site.regions.includes(currentRegion))
    .filter((site) => !query || site.name.toLowerCase().includes(query) || site.key.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function setRegion(regionKey) {
  const region = regionByKey.get(regionKey);
  if (!region) return;

  currentRegion = regionKey;
  document.documentElement.style.setProperty("--accent", region.color || "#38b6a6");

  els.regionTitle.textContent = region.title;
  els.regionMeta.textContent = "Regional variability map";
  els.regionBadge.textContent = region.label;
  els.regionBadge.style.borderColor = region.color || "";
  els.variabilityMap.src = assetPath("variability", region.file);
  els.variabilityMap.alt = `${region.title} variability map`;
  els.listTitle.textContent = `${region.label} sites`;

  renderRegionToggle();
  renderHotspots();
  renderSiteList();

  const visible = sitesForCurrentRegion();
  const selectedStillVisible = visible.some((site) => site.key === selectedSiteKey);
  if (!selectedStillVisible && visible.length) {
    selectSite(visible[0].key);
  } else if (selectedStillVisible) {
    selectSite(selectedSiteKey);
  }
}

function renderRegionToggle() {
  els.regionToggle.innerHTML = "";
  regions.forEach((region) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = region.label;
    button.style.setProperty("--accent", region.color || "#38b6a6");
    button.className = region.key === currentRegion ? "active" : "";
    button.setAttribute("aria-pressed", String(region.key === currentRegion));
    button.addEventListener("click", () => setRegion(region.key));
    els.regionToggle.appendChild(button);
  });
}

function renderSiteList() {
  const visible = sitesForCurrentRegion();
  els.listCount.textContent = String(visible.length);
  els.siteList.innerHTML = "";

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No matching sites";
    els.siteList.appendChild(empty);
    return;
  }

  visible.forEach((site) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `site-row${site.key === selectedSiteKey ? " active" : ""}`;
    row.dataset.site = site.key;
    row.innerHTML = `
      <span class="site-name">${site.name}</span>
      <span class="site-chart">${site.chart || "chart"}</span>
    `;
    row.addEventListener("mouseenter", () => selectSite(site.key));
    row.addEventListener("focus", () => selectSite(site.key));
    row.addEventListener("click", () => selectSite(site.key));
    els.siteList.appendChild(row);
  });
}

function mapImageRect() {
  const image = els.variabilityMap.getBoundingClientRect();
  const overlay = els.mapHotspots.getBoundingClientRect();
  return {
    width: image.width,
    height: image.height,
    offsetX: image.left - overlay.left,
    offsetY: image.top - overlay.top,
  };
}

function renderHotspots() {
  const region = regionByKey.get(currentRegion);
  els.mapHotspots.innerHTML = "";
  if (!region || !region.positions) return;

  const rect = mapImageRect();
  Object.entries(region.positions).forEach(([siteKey, pos]) => {
    const site = sites.find((candidate) => candidate.key === siteKey);
    if (!site) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `hotspot${site.key === selectedSiteKey ? " active" : ""}${pos.estimated ? " estimated" : ""}`;
    button.style.left = `${rect.offsetX + (pos.pct_x / 100) * rect.width}px`;
    button.style.top = `${rect.offsetY + (pos.pct_y / 100) * rect.height}px`;
    button.title = site.name;
    button.setAttribute("aria-label", `${site.name} bathymetry percentages`);
    button.dataset.site = site.key;
    button.addEventListener("mouseenter", () => selectSite(site.key));
    button.addEventListener("focus", () => selectSite(site.key));
    button.addEventListener("click", () => selectSite(site.key));
    els.mapHotspots.appendChild(button);
  });
}

function pctText(value) {
  return value === null || value === undefined ? "--" : `${Number(value).toFixed(1)}%`;
}

function renderBathymetry(site) {
  const bathy = site.bathymetry;
  if (!bathy) {
    els.regimeLabel.textContent = "No bathymetry data";
    els.bathyBars.innerHTML = "";
    return;
  }

  els.regimeLabel.textContent = bathy.categoryLabel || "Bathymetric regime";
  const rows = [
    { label: "Bottomfast zone (<2 m)", value: bathy.bottomfastPct, color: "#f2b134" },
    { label: "Keel-grounding zone (2-20 m)", value: bathy.keelGroundingPct, color: "#38b6a6" },
    { label: "Deeper water (>20 m)", value: bathy.deepWaterPct, color: "#8f9aa5" },
  ];

  els.bathyBars.innerHTML = rows.map((row) => {
    const width = Math.max(0, Math.min(100, Number(row.value) || 0));
    return `
      <div class="bar-row">
        <div class="bar-label"><span>${row.label}</span><strong>${pctText(row.value)}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="--bar:${row.color};width:${width}%"></div></div>
      </div>
    `;
  }).join("");
}

function selectSite(siteKey) {
  const site = sites.find((candidate) => candidate.key === siteKey);
  if (!site) return;

  selectedSiteKey = site.key;
  const region = regionByKey.get(currentRegion) || regionByKey.get(site.region);
  const image = assetPath("icemaps", site.iceMap);

  els.selectedSiteName.textContent = site.name;
  els.selectedRegion.textContent = region ? region.label : site.region;
  els.selectedCoords.textContent = formatCoords(site);
  els.iceMapPreview.src = image;
  els.iceMapPreview.alt = `${site.name} landfast ice map`;
  els.openImage.href = image;
  els.previewButton.disabled = !site.hasIceMap;

  [...els.siteList.querySelectorAll(".site-row")].forEach((row) => {
    row.classList.toggle("active", row.dataset.site === site.key);
  });
  [...els.mapHotspots.querySelectorAll(".hotspot")].forEach((spot) => {
    spot.classList.toggle("active", spot.dataset.site === site.key);
  });
  renderBathymetry(site);
}

function openModal() {
  if (!els.iceMapPreview.src) return;
  els.modalImage.src = els.iceMapPreview.src;
  els.modalImage.alt = els.iceMapPreview.alt;
  els.modal.classList.add("open");
  els.modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.modal.classList.remove("open");
  els.modal.setAttribute("aria-hidden", "true");
  els.modalImage.src = "";
}

function init() {
  els.siteCount.textContent = `${sites.length} sites`;
  els.siteSearch.addEventListener("input", () => {
    renderSiteList();
    const visible = sitesForCurrentRegion();
    if (visible.length) selectSite(visible[0].key);
  });
  els.variabilityMap.addEventListener("load", renderHotspots);
  window.addEventListener("resize", renderHotspots);
  els.previewButton.addEventListener("click", openModal);
  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", (event) => {
    if (event.target === els.modal) closeModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  setRegion(currentRegion);
}

init();
