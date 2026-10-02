/**
 * GOW-GO-26-005 — Semáforos en mapa (Arequipa)
 * Dos versiones de cabezal (V1 / V2) × 3 modelos × 2 colores × 4 estados.
 * Realismo: carcasa + 3 focos; solo UNO activo (rojo | ámbar | verde).
 * Sin API: estados manuales para validar diseño.
 */

const AREQUIPA = { lng: -71.5375, lat: -16.409 };

/**
 * Cruces aproximados del centro (referencia visual sobre OSM).
 * El semáforo es un PUNTO orientado a un approach — no un polígono.
 */
const LIGHTS = [
  { id: "s1", lng: -71.5369, lat: -16.3989, name: "Plaza · Portal", bearing: 45 },
  { id: "s2", lng: -71.5356, lat: -16.4010, name: "San Francisco / Merced", bearing: 120 },
  { id: "s3", lng: -71.5339, lat: -16.4044, name: "Palacio Viejo", bearing: 200 },
  { id: "s4", lng: -71.5310, lat: -16.4075, name: "Víctor Lira / Venezuela", bearing: 90 },
  { id: "s5", lng: -71.5395, lat: -16.4065, name: "Ejército / San Camilo", bearing: 310 },
];

const STATES = {
  rojo: { label: "Rojo", color: "#DC2626" },
  ambar: { label: "Ámbar", color: "#F59E0B" },
  verde: { label: "Verde", color: "#16A34A" },
  apagado: { label: "Apagado", color: "#64748B" },
};

const ON   = { rojo: "#DC2626", ambar: "#F59E0B", verde: "#16A34A" };
const ONHI = { rojo: "#fca5a5", ambar: "#fde68a", verde: "#86efac" };
const ONLO = { rojo: "#7f1d1d", ambar: "#92400e", verde: "#14532d" };

/* Amarillo = solo el cabezal (carcasa + viseras). Todo lo que lo sostiene
   (poste, peana, caña, muñón, brazo y cuello) va a negro.
   `sup` es la paleta del sostén de cada variante. */
const COLORS = {
  negro: {
    label: "Negro",
    bodyHi: "#8b8b95", body: "#41414b", bodyLo: "#232329",
    edge: "#0c0c0f", visor: "#101015",
    sup: { hi: "#8b8b95", mid: "#4a4a54", lo: "#232329", edge: "#0c0c0f" },
  },
  amarillo: {
    label: "Amarillo",
    bodyHi: "#fef08a", body: "#fde047", bodyLo: "#facc15",
    edge: "#a16207", visor: "#f59e0b",
    sup: { hi: "#6b6b75", mid: "#232329", lo: "#101014", edge: "#08080a" },
  },
};

let currentVersion = "v1";
let currentModel = "A";
let currentColor = "negro";
let currentState = "rojo";
let map;

function svgImg(svg, size = 128) {
  const img = new Image(size, size);
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  return img;
}

/* ------------------------------------------------------------------ *
 * Generación de iconos (SVG inline → map.addImage)
 * ------------------------------------------------------------------ */

let N = 0, CTX = null;

/* Foco con visera-cresciente: la mitad horizontal es 0·76·(r+4) ≈ 10·5 px
   y la separación mínima entre focos es 21 → nunca se tocan. */
function lamp(cx, cy, r, state, key, c) {
  const active = state === key;
  const fill = active ? `url(#${CTX.lamp[key]})` : `url(#${CTX.off})`;
  const Ro = r + 4, Ri = r + 0.4, KX = 0.76, KY = 0.65;
  const ox = Ro * KX, oy = Ro * KY, ix = Ri * KX, iy = Ri * KY;
  let s = "";
  if (active) s += `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="url(#${CTX.halo})"/>`;
  s += `<path d="M ${cx - ox} ${cy - oy} A ${Ro} ${Ro} 0 0 1 ${cx + ox} ${cy - oy}` +
       ` L ${cx + ix} ${cy - iy} A ${Ri} ${Ri} 0 0 0 ${cx - ix} ${cy - iy} Z" fill="${c.visor}"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="#0b0b0d" stroke-width="1.4"/>`;
  if (active)
    s += `<circle cx="${cx - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.3}" fill="#ffffff" opacity="0.5"/>`;
  return s;
}

/* Alas laterales del A5 de V2 (van detrás de la carcasa) */
function wings(cy, c) {
  return `<rect x="34" y="${cy - 8}" width="12" height="16" rx="4" fill="${c.visor}"/>` +
         `<rect x="82" y="${cy - 8}" width="12" height="16" rx="4" fill="${c.visor}"/>`;
}

function build(fn, state, c) {
  const n = ++N;
  /* El sostén (poste vertical, peana, muñón) toma la paleta `sup` de la
     variante: gris con la carcasa gris, NEGRO con la carcasa amarilla. */
  const s = c.sup;
  CTX = {
    body: `b${n}`, arm: `m${n}`, pole: `p${n}`,
    off: `o${n}`, halo: `h${n}`,
    lamp: { rojo: `r${n}`, ambar: `a${n}`, verde: `v${n}` },
    edgeBody: c.edge, edgeSup: s.edge,
  };
  const grad = (id, a, b, cc) => `
      <linearGradient id="${id}">
        <stop offset="0" stop-color="${a}"/>
        <stop offset="0.45" stop-color="${b}"/>
        <stop offset="1" stop-color="${cc}"/>
      </linearGradient>`;
  const halo = state === "apagado" ? "" : `
      <radialGradient id="${CTX.halo}">
        <stop offset="0.3" stop-color="${ON[state]}" stop-opacity="0.75"/>
        <stop offset="1" stop-color="${ON[state]}" stop-opacity="0"/>
      </radialGradient>`;
  const defs = `<defs>
      ${grad(CTX.body, c.bodyHi, c.body, c.bodyLo)}
      ${grad(CTX.arm, s.hi, s.mid, s.lo)}
      ${grad(CTX.pole, s.hi, s.mid, s.lo)}
      <radialGradient id="${CTX.off}" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stop-color="#4b4b55"/>
        <stop offset="1" stop-color="#16161a"/>
      </radialGradient>
      ${["rojo", "ambar", "verde"].map((k) => `
      <radialGradient id="${CTX.lamp[k]}" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stop-color="${ONHI[k]}"/>
        <stop offset="0.55" stop-color="${ON[k]}"/>
        <stop offset="1" stop-color="${ONLO[k]}"/>
      </radialGradient>`).join("")}
      ${halo}
    </defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">` +
         defs + fn(state, c) + `</svg>`;
}

/* ------------------------------ V1 ------------------------------ */

/** V1·A5 — poste con base (carcasa, caña y peana) */
function v1Poste(state, c) {
  const B = `url(#${CTX.body})`, P = `url(#${CTX.pole})`;
  const eB = CTX.edgeBody, eS = CTX.edgeSup;
  return `
    <rect x="59" y="84" width="10" height="26" fill="${P}"/>
    <rect x="50" y="106" width="28" height="14" rx="3" fill="${P}" stroke="${eS}" stroke-width="2"/>
    <rect x="42" y="117" width="44" height="9" rx="3" fill="${P}" stroke="${eS}" stroke-width="1.5"/>
    <rect x="46" y="6" width="36" height="80" rx="7" fill="${B}" stroke="${eB}" stroke-width="2"/>
    <rect x="50" y="11" width="5" height="70" rx="2.5" fill="#ffffff" opacity="0.12"/>
    ${lamp(64, 22, 9.5, state, "rojo", c)}
    ${lamp(64, 46, 9.5, state, "ambar", c)}
    ${lamp(64, 70, 9.5, state, "verde", c)}`;
}

/** V1·B5 — perfil delgado (compacto, carcasa cuadrada) */
function v1Compacto(state, c) {
  const B = `url(#${CTX.body})`, P = `url(#${CTX.pole})`;
  const eB = CTX.edgeBody, eS = CTX.edgeSup;
  return `
    <rect x="60" y="82" width="8" height="30" fill="${P}"/>
    <rect x="50" y="110" width="28" height="8" rx="3" fill="${P}" stroke="${eS}" stroke-width="1.5"/>
    <rect x="46" y="6" width="36" height="78" rx="3" fill="${B}" stroke="${eB}" stroke-width="2"/>
    <rect x="50" y="11" width="4" height="68" rx="2" fill="#ffffff" opacity="0.12"/>
    ${lamp(64, 25, 9.5, state, "rojo", c)}
    ${lamp(64, 47, 9.5, state, "ambar", c)}
    ${lamp(64, 69, 9.5, state, "verde", c)}`;
}

/** V1·C2 — brazo curvo (carcasa ajustada a las luces) */
function v1Brazo(state, c) {
  const B = `url(#${CTX.body})`, P = `url(#${CTX.pole})`, A = `url(#${CTX.arm})`;
  const eB = CTX.edgeBody, eS = CTX.edgeSup;
  return `
    <rect x="102" y="16" width="8" height="106" fill="${P}"/>
    <ellipse cx="106" cy="15" rx="7" ry="4" fill="${P}"/>
    <rect x="96" y="117" width="20" height="9" rx="3" fill="${P}" stroke="${eS}" stroke-width="1.5"/>
    <path d="M70 30 H84 C98 30 106 34 106 42" fill="none" stroke="${A}"
          stroke-width="6" stroke-linecap="round"/>
    <rect x="66" y="23" width="8" height="14" rx="2" fill="${A}"/>
    <rect x="2" y="13" width="70" height="32" rx="5" fill="${B}" stroke="${eB}" stroke-width="2"/>
    <rect x="6" y="17" width="4" height="24" rx="2" fill="#ffffff" opacity="0.12"/>
    ${lamp(14, 30, 9.5, state, "rojo", c)}
    ${lamp(37, 30, 9.5, state, "ambar", c)}
    ${lamp(60, 30, 9.5, state, "verde", c)}`;
}

/* ------------------------------ V2 ------------------------------ */

/** V2·A5 — poste con base (alas laterales) */
function v2Poste(state, c) {
  const B = `url(#${CTX.body})`, P = `url(#${CTX.pole})`;
  const eB = CTX.edgeBody, eS = CTX.edgeSup;
  return `
    <rect x="56" y="83" width="16" height="8" rx="2" fill="${P}" stroke="${eS}" stroke-width="1.5"/>
    <rect x="59" y="89" width="10" height="24" fill="${P}"/>
    <path d="M 54 111 H 74 L 78 123 H 50 Z" fill="${P}" stroke="${eS}" stroke-width="1.5"/>
    <rect x="45" y="119" width="38" height="7" rx="3" fill="${P}" stroke="${eS}" stroke-width="1.5"/>
    ${wings(22, c)}${wings(46, c)}${wings(70, c)}
    <rect x="44" y="4" width="40" height="80" rx="9" fill="${B}" stroke="${eB}" stroke-width="2"/>
    <rect x="48" y="9" width="5" height="70" rx="2.5" fill="#ffffff" opacity="0.14"/>
    ${lamp(64, 22, 10.5, state, "rojo", c)}
    ${lamp(64, 46, 10.5, state, "ambar", c)}
    ${lamp(64, 70, 10.5, state, "verde", c)}`;
}

/** V2·B5 — estilo moderno (carcasa muy redondeada + muñón) */
function v2Moderno(state, c) {
  const B = `url(#${CTX.body})`, P = `url(#${CTX.pole})`;
  const eB = CTX.edgeBody, eS = CTX.edgeSup;
  return `
    <rect x="57" y="84" width="14" height="12" rx="5" fill="${P}" stroke="${eS}" stroke-width="1.5"/>
    <rect x="45" y="6" width="38" height="82" rx="15" fill="${B}" stroke="${eB}" stroke-width="2"/>
    <rect x="50" y="13" width="5" height="68" rx="2.5" fill="#ffffff" opacity="0.14"/>
    ${lamp(64, 26, 9.5, state, "rojo", c)}
    ${lamp(64, 47, 9.5, state, "ambar", c)}
    ${lamp(64, 68, 9.5, state, "verde", c)}`;
}

/** V2·C4 — brazo largo: brazo ARRIBA y cabezal colgando (sin cajón lateral) */
function v2BrazoLargo(state, c) {
  const B = `url(#${CTX.body})`, P = `url(#${CTX.pole})`, A = `url(#${CTX.arm})`;
  const eB = CTX.edgeBody, eS = CTX.edgeSup;
  return `
    <rect x="36" y="14" width="78" height="7" rx="3.5" fill="${A}"/>
    <rect x="37" y="19" width="8" height="9" fill="${A}"/>
    <rect x="110" y="14" width="9" height="110" fill="${P}"/>
    <ellipse cx="114.5" cy="13" rx="6" ry="3.5" fill="${P}"/>
    <rect x="104" y="119" width="21" height="7" rx="3" fill="${P}" stroke="${eS}" stroke-width="1.5"/>
    <rect x="4" y="26" width="74" height="31" rx="8" fill="${B}" stroke="${eB}" stroke-width="2"/>
    <rect x="9" y="31" width="4" height="21" rx="2" fill="#ffffff" opacity="0.14"/>
    ${lamp(19, 43, 9.5, state, "rojo", c)}
    ${lamp(41, 43, 9.5, state, "ambar", c)}
    ${lamp(63, 43, 9.5, state, "verde", c)}`;
}

/* ------------------------------ Catálogo ------------------------------ */

const VERSIONS = {
  v1: {
    label: "V1",
    models: {
      A: { code: "A", name: "Poste con base", short: "A Poste", fn: v1Poste },
      B: { code: "B", name: "Perfil delgado", short: "B Compacto", fn: v1Compacto },
      C: { code: "C", name: "Brazo curvo", short: "C Brazo", fn: v1Brazo },
    },
  },
  v2: {
    label: "V2",
    models: {
      A: { code: "A", name: "Poste con base", short: "A Poste", fn: v2Poste },
      B: { code: "B", name: "Estilo moderno", short: "B Compacto", fn: v2Moderno },
      C: { code: "C", name: "Brazo largo", short: "C Brazo", fn: v2BrazoLargo },
    },
  },
};

function currentSpec() {
  const v = VERSIONS[currentVersion];
  return { version: v, model: v.models[currentModel] };
}

function iconFor() {
  const { model } = currentSpec();
  return build(model.fn, currentState, COLORS[currentColor]);
}

/* ------------------------------ Datos / mapa ------------------------------ */

function lightsGeoJSON() {
  return {
    type: "FeatureCollection",
    features: LIGHTS.map((s) => ({
      type: "Feature",
      properties: {
        id: s.id,
        name: s.name,
        bearing: s.bearing,
        icon: "semaforo",
      },
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
    })),
  };
}

function iconSizeForZoom(z) {
  if (z < 12) return 0.28;
  if (z < 13) return 0.36;
  if (z < 14) return 0.48;
  if (z < 15) return 0.58;
  return 0.7;
}

function updateZoomUi() {
  const z = map.getZoom();
  document.getElementById("zoomLabel").textContent = `Zoom ${z.toFixed(1)}`;
  if (map.getLayer("lights")) {
    map.setLayoutProperty("lights", "icon-size", iconSizeForZoom(z));
  }
}

/* ------------------------------ UI ------------------------------ */

function renderLegend() {
  const { version, model } = currentSpec();
  const st = STATES[currentState];
  const color = COLORS[currentColor];
  const on = (key) => (currentState === key ? " on" : "");
  document.getElementById("legend").innerHTML = `
    <strong>${version.label} · ${model.code}</strong>
    <div class="sub">${model.name}</div>
    <div class="row"><span class="lamp${on("rojo")}" style="background:#DC2626;color:#DC2626"></span>Rojo</div>
    <div class="row"><span class="lamp${on("ambar")}" style="background:#F59E0B;color:#F59E0B"></span>Ámbar</div>
    <div class="row"><span class="lamp${on("verde")}" style="background:#16A34A;color:#16A34A"></span>Verde</div>
    <div class="meta-row">Activo: <b style="color:${st.color}">${st.label}</b></div>
    <div class="meta-row">Carrocería: <b style="color:${color.label === "Amarillo" ? "#facc15" : "#cbd5e1"}">${color.label}</b></div>
  `;
}

function syncModelLabels() {
  const v = VERSIONS[currentVersion];
  document.querySelectorAll(".fam").forEach((b) => {
    const m = v.models[b.dataset.model];
    b.textContent = m.short || m.name;   // solo el nombre del modelo
  });
}

async function registerIcon() {
  const id = "semaforo";
  if (map.hasImage(id)) map.removeImage(id);
  const img = svgImg(iconFor());
  await new Promise((res) => {
    if (img.complete) res();
    else img.onload = res;
  });
  map.addImage(id, img, { pixelRatio: 2 });
  if (map.getSource("lights")) map.getSource("lights").setData(lightsGeoJSON());
}

async function refresh(hint) {
  await registerIcon();
  renderLegend();
  updateZoomUi();
  document.getElementById("hint").textContent = hint;
}

function setModel(id) {
  currentModel = id;
  document.querySelectorAll(".fam").forEach((b) => {
    b.classList.toggle("active", b.dataset.model === id);
  });
  const { model } = currentSpec();
  refresh(`${model.code} · ${model.name}: ¿se reconoce como semáforo de vía al zoom?`);
}

function setState(id) {
  currentState = id;
  document.querySelectorAll(".state").forEach((b) => {
    b.classList.toggle("active", b.dataset.state === id);
  });
  refresh(
    id === "apagado"
      ? "Apagado / fuera de servicio: sin color activo."
      : `Solo ${STATES[id].label.toLowerCase()} brilla — así se ve en la calle.`
  );
}

function setColor(id) {
  currentColor = id;
  document.querySelectorAll(".color").forEach((b) => {
    b.classList.toggle("active", b.dataset.color === id);
  });
  const label = COLORS[id].label;
  refresh(
    id === "amarillo"
      ? "Amarillo: solo el cabezal; palo, peana y brazo en negro."
      : "Negro: carcasa y poste oscuros, luces con más contraste."
  );
}

function setVersion(id) {
  currentVersion = id;
  document.querySelectorAll(".ver").forEach((b) => {
    b.classList.toggle("active", b.dataset.version === id);
  });
  syncModelLabels();
  const { version, model } = currentSpec();
  refresh(`${version.label} · ${model.code} ${model.name}: cabezal de la ${version.label}.`);
}

async function init() {
  map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap",
        },
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }],
    },
    center: [AREQUIPA.lng, AREQUIPA.lat],
    zoom: 13.6,
    minZoom: 11,
    maxZoom: 17,
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");
  await new Promise((r) => map.on("load", r));

  syncModelLabels();
  await registerIcon();

  map.addSource("lights", { type: "geojson", data: lightsGeoJSON() });
  map.addLayer({
    id: "lights",
    type: "symbol",
    source: "lights",
    layout: {
      "icon-image": "semaforo",
      "icon-size": iconSizeForZoom(map.getZoom()),
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
    },
  });

  map.on("zoom", updateZoomUi);
  updateZoomUi();
  renderLegend();

  map.on("click", "lights", (e) => {
    const f = e.features[0];
    const { version, model } = currentSpec();
    new maplibregl.Popup()
      .setLngLat(f.geometry.coordinates)
      .setHTML(
        `<strong>${f.properties.name}</strong><br/>` +
        `<em>Semáforo · ${STATES[currentState].label}</em><br/>` +
        `<span style="opacity:.8">${version.label} · ${model.code} · ${model.name}<br/>` +
        `${COLORS[currentColor].label}</span>`
      )
      .addTo(map);
  });

  document.querySelectorAll(".fam").forEach((btn) => {
    btn.addEventListener("click", () => setModel(btn.dataset.model));
  });
  document.querySelectorAll(".state").forEach((btn) => {
    btn.addEventListener("click", () => setState(btn.dataset.state));
  });
  document.querySelectorAll(".color").forEach((btn) => {
    btn.addEventListener("click", () => setColor(btn.dataset.color));
  });
  document.querySelectorAll(".ver").forEach((btn) => {
    btn.addEventListener("click", () => setVersion(btn.dataset.version));
  });

  document.getElementById("btnZoomOut").onclick = () => map.easeTo({ zoom: 11.8, duration: 500 });
  document.getElementById("btnZoomCity").onclick = () =>
    map.easeTo({ zoom: 13.6, center: [AREQUIPA.lng, AREQUIPA.lat], duration: 500 });
  document.getElementById("btnZoomIn").onclick = () => map.easeTo({ zoom: 15.6, duration: 500 });
}

init();
