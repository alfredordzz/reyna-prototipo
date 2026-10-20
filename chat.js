// Asistente Reyna: prototipo académico de chatbot guiado (sin servidor, sin IA de pago).
// No envía ni guarda datos: todo ocurre en el navegador del usuario.
(function () {
  const COLORS = {
    Terracota: "#C65A3A", Amarillo: "#E9B824", Lila: "#B9A7E0",
    Negro: "#2B2B2B", Grafito: "#5E5E5E", Blanco: "#F2F2F0"
  };
  const ACABADOS = ["Brillante", "Mate", "Texturizada", "Martillada"];
  const MATERIALES = ["Lámina", "Encino", "Aluminio", "Madera maciza", "Vidrio"];
  // Catálogo del prototipo. ar = modelo en ar.html
  const CAT = [
    { id: "mesa_centro", n: "Mesa de centro armable", t: "Sala", c: ["Negro", "Grafito", "Blanco"], a: ["Mate", "Texturizada"], m: ["Lámina", "Aluminio", "Encino"], ar: "mesa_centro_armable", pk: "Honeymoon" },
    { id: "lateral_c", n: "Mesa lateral en C", t: "Sala", c: ["Amarillo"], a: ["Brillante"], m: ["Lámina"], ar: "mesa_lateral_c", pk: "Estudiante" },
    { id: "pedestal", n: "Mesa auxiliar de pedestal", t: "Sala", c: ["Terracota"], a: ["Mate"], m: ["Lámina", "Encino"] },
    { id: "desarmable", n: "Mesa lateral desarmable", t: "Sala", c: ["Terracota"], a: ["Mate"], m: ["Lámina"], ar: "mesa_lateral_desarmable", pk: "Honeymoon" },
    { id: "librero", n: "Librero de lámina", t: "Almacenamiento", c: ["Amarillo"], a: ["Brillante"], m: ["Lámina"], ar: "librero_lamina", pk: "Estudiante" },
    { id: "tv", n: "Mueble para TV (tres niveles)", t: "Almacenamiento", c: ["Grafito", "Negro"], a: ["Martillada"], m: ["Lámina"], ar: "mueble_tv", pk: "Honeymoon" },
    { id: "vidrio_color", n: "Mesa de vidrio con base de colores", t: "Comedor", c: ["Lila", "Terracota"], a: ["Brillante"], m: ["Vidrio", "Lámina"] },
    { id: "vidrio_viga", n: "Mesa de vidrio con base de acero y viga", t: "Comedor", c: ["Negro"], a: ["Mate"], m: ["Vidrio", "Encino"] },
    { id: "banca", n: "Banca con repisas perforadas", t: "Entrada", c: ["Lila"], a: ["Texturizada"], m: ["Lámina"] },
    { id: "recibidor", n: "Recibidor con espejo", t: "Entrada", c: ["Negro"], a: ["Mate"], m: ["Lámina", "Encino"] },
    { id: "canto", n: "Banca de canto vivo", t: "Entrada", c: ["Negro"], a: ["Mate"], m: ["Madera maciza"] },
    { id: "escritorio", n: "Escritorio (pieza nueva)", t: "Estudio", c: ["Negro", "Terracota"], a: ["Mate"], m: ["Lámina", "Encino"], ar: "escritorio", pk: "Estudiante" },
    { id: "repisas", n: "Repisas de encino (pieza nueva)", t: "Estudio", c: ["Negro", "Terracota", "Amarillo"], a: ["Mate"], m: ["Encino", "Lámina"], pk: "Estudiante" },
    { id: "panel", n: "Panel Retícula (pieza nueva)", t: "Estudio", c: ["Terracota", "Amarillo", "Negro"], a: ["Mate"], m: ["Lámina"] },
    { id: "archivero", n: "Archivero Folio (pieza nueva)", t: "Estudio", c: ["Negro", "Grafito"], a: ["Mate"], m: ["Lámina"] }
  ];
  const PAQ = {
    Estudiante: { perfil: "uni", piezas: ["escritorio", "repisas", "librero", "lateral_c"], txt: "Lo básico para estudiar y guardar en un cuarto chico, fácil de mudar." },
    Honeymoon: { perfil: "pareja", piezas: ["mesa_centro", "tv", "desarmable"], txt: "Amuebla la sala completa y llega desarmado, fácil de transportar." }
  };
  const byId = id => CAT.find(x => x.id === id);
  const st = { perfil: null, tipo: null, color: null, acabado: null, material: null, ultimo: [], nombre: "" };

  // ---------- UI ----------
  const css = `
  #rb-open{position:fixed;right:20px;bottom:20px;z-index:50;background:#2B1E17;color:#F4EDE3;border:0;border-radius:999px;padding:13px 20px;font:800 15px Nunito,system-ui,sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.25);cursor:pointer;display:flex;gap:8px;align-items:center}
  #rb-open i{width:12px;height:12px;border-radius:6px;background:#A8BBA0;display:inline-block}
  #rb{position:fixed;right:20px;bottom:20px;z-index:60;width:390px;max-width:calc(100vw - 24px);height:640px;max-height:calc(100vh - 40px);background:#F4EDE3;border-radius:24px;box-shadow:0 18px 50px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;font-family:Nunito,system-ui,sans-serif;color:#2B1E17}
  #rb.on{display:flex}#rb .rb-msgs>*{flex-shrink:0}
  #rb .rb-hd{background:#2B1E17;color:#F4EDE3;padding:14px 16px;display:flex;align-items:center;gap:10px}
  #rb .rb-hd b{font-family:Fredoka,Nunito,sans-serif;font-size:18px;font-weight:600}#rb .rb-hd small{opacity:.75;font-size:12px}
  #rb .rb-hd button{margin-left:auto;background:transparent;border:0;color:#F4EDE3;font-size:22px;cursor:pointer}
  #rb .rb-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
  #rb .rb-m{max-width:88%;padding:10px 13px;border-radius:16px;font-size:14.5px;line-height:1.38}
  #rb .rb-bot{background:#fff;align-self:flex-start;border-radius:16px 16px 16px 4px}
  #rb .rb-me{background:#E6DCC3;align-self:flex-end;border-radius:16px 16px 4px 16px}
  #rb .rb-opts{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start}
  #rb .rb-opt{border:1.5px solid #2B1E17;background:#fff;border-radius:999px;padding:7px 12px;font:700 13.5px Nunito,sans-serif;cursor:pointer;color:#2B1E17;text-decoration:none}
  #rb .rb-opt.rb-pri{background:#7D6B45;border-color:#7D6B45;color:#fff}#rb .rb-opt.rb-wa{background:#25A244;border-color:#25A244;color:#fff}
  #rb .rb-opt:disabled{opacity:.45;cursor:default}
  #rb .rb-grid{background:#fff;border-radius:16px;padding:10px 12px;align-self:stretch;display:flex;flex-direction:column;gap:8px}
  #rb .rb-grid .rb-lbl{font-weight:800;font-size:13px}
  #rb .rb-row{display:flex;flex-wrap:wrap;gap:6px}
  #rb .rb-sw{width:34px;height:34px;border-radius:9px;border:2px solid #E3D7C6;cursor:pointer;padding:0}
  #rb .rb-sw.rb-sel{outline:3px solid #2B1E17;outline-offset:1px}
  #rb .rb-pill{border:1.5px solid #D9C6AE;background:#F4EDE3;border-radius:999px;padding:5px 10px;font:700 12.5px Nunito,sans-serif;cursor:pointer;color:#2B1E17}
  #rb .rb-pill.rb-sel{background:#2B1E17;color:#F4EDE3;border-color:#2B1E17}
  #rb .rb-card{background:#fff;border-radius:16px;padding:10px 12px;align-self:stretch;display:flex;flex-direction:column;gap:6px;border-left:6px solid #A8BBA0}
  #rb .rb-card b{font-size:15px}#rb .rb-card .rb-pr{color:#7D6B45;font-weight:800;font-size:13px}#rb .rb-card .rb-ds{font-size:13px;color:#6B5A4C}
  #rb .rb-card .rb-act{display:flex;gap:6px;flex-wrap:wrap}
  #rb .rb-in{display:flex;gap:8px;padding:10px;border-top:1px solid #E3D7C6;background:#fff}
  #rb .rb-in input{flex:1;border:1.5px solid #D9C6AE;border-radius:999px;padding:10px 14px;font:600 14px Nunito,sans-serif}
  #rb .rb-in button{background:#7D6B45;color:#fff;border:0;border-radius:999px;padding:0 16px;font:800 14px Nunito,sans-serif;cursor:pointer}
  #rb .rb-note{font-size:11px;color:#6B5A4C;text-align:center;padding:4px 10px 8px;background:#fff}
  @media (max-width:560px){#rb{right:12px;bottom:12px;height:calc(100vh - 24px)}}`;
  const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  document.querySelectorAll("body > .bot").forEach(e => { if (!e.closest("#rb")) e.remove(); });

  const openBtn = document.createElement("button");
  openBtn.id = "rb-open"; openBtn.innerHTML = "<i></i>Asistente Reyna";
  document.body.appendChild(openBtn);
  const box = document.createElement("div"); box.id = "rb";
  box.innerHTML = `<div class="rb-hd"><span style="width:26px;height:26px;border-radius:13px;background:#A8BBA0;display:inline-block"></span><div><b>Asistente Reyna</b><br><small>Prototipo · responde al instante</small></div><button aria-label="Cerrar">×</button></div>
  <div class="rb-msgs"></div>
  <form class="rb-in"><input placeholder="Escribe tu pregunta…" aria-label="Mensaje"><button>Enviar</button></form>
  <div class="rb-note">Prototipo académico: no envía ni guarda tus datos.</div>`;
  document.body.appendChild(box);
  const msgs = box.querySelector(".rb-msgs"), form = box.querySelector("form"), input = form.querySelector("input");
  let started = false, waitingFor = null;
  openBtn.onclick = () => { box.classList.add("on"); openBtn.style.display = "none"; if (!started) { started = true; inicio(); } };
  box.querySelector(".rb-hd button").onclick = () => { box.classList.remove("on"); openBtn.style.display = "flex"; };

  const scroll = () => setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 30);
  function bot(html, delay = 350) { return new Promise(r => setTimeout(() => { const d = document.createElement("div"); d.className = "rb-m rb-bot"; d.innerHTML = html; msgs.appendChild(d); scroll(); r(d); }, delay)); }
  function me(t) { const d = document.createElement("div"); d.className = "rb-m rb-me"; d.textContent = t; msgs.appendChild(d); scroll(); }
  function opts(list) {
    const w = document.createElement("div"); w.className = "rb-opts";
    list.forEach(o => {
      if (o.href) { const a = document.createElement("a"); a.className = "rb-opt " + (o.cls ? "rb-" + o.cls : ""); a.textContent = o.t; a.href = o.href; if (o.blank) a.target = "_blank"; w.appendChild(a); return; }
      const b = document.createElement("button"); b.className = "rb-opt " + (o.cls ? "rb-" + o.cls : ""); b.textContent = o.t;
      b.onclick = () => { w.querySelectorAll("button").forEach(x => x.disabled = true); me(o.say || o.t); o.go(); };
      w.appendChild(b);
    });
    msgs.appendChild(w); scroll(); return w;
  }
  const price = '<span class="rb-pr">$[por confirmar]</span>';

  // ---------- Flujo ----------
  async function inicio() {
    await bot("¡Hola! Soy el asistente de Reyna Design. ¿Te estás mudando? Cuéntame para quién es tu compra.", 200);
    opts([
      { t: "Me mudo por la uni", go: () => { st.perfil = "uni"; tipo(); } },
      { t: "Primer depa en pareja", go: () => { st.perfil = "pareja"; tipo(); } },
      { t: "Solo estoy viendo", go: () => { st.perfil = null; tipo(); } }
    ]);
  }
  async function tipo() {
    const intro = st.perfil === "uni" ? "¡Qué emoción, nueva ciudad! " : st.perfil === "pareja" ? "¡Felicidades por su nuevo hogar! " : "";
    await bot(intro + "¿Qué estás buscando?");
    const l = ["Sala", "Almacenamiento", "Estudio", "Comedor", "Entrada"].map(t => ({ t, go: () => { st.tipo = t; muestras(); } }));
    l.unshift({ t: "Un paquete completo", cls: "pri", go: paquete });
    opts(l);
  }
  async function muestras() {
    await bot("Elige del catálogo lo que te gusta. Puedes tocar una opción por fila (o dejar alguna en blanco).");
    const g = document.createElement("div"); g.className = "rb-grid";
    const sel = { color: null, acabado: null, material: null };
    const row = (lbl, items, key, render) => {
      const L = document.createElement("div"); L.className = "rb-lbl"; L.textContent = lbl; g.appendChild(L);
      const R = document.createElement("div"); R.className = "rb-row"; g.appendChild(R);
      items.forEach(it => { const b = render(it); b.onclick = () => { R.querySelectorAll(".rb-sel").forEach(x => x.classList.remove("rb-sel")); if (sel[key] === it) { sel[key] = null; } else { sel[key] = it; b.classList.add("rb-sel"); } }; R.appendChild(b); });
    };
    row("Color", Object.keys(COLORS), "color", c => { const b = document.createElement("button"); b.className = "rb-sw"; b.title = c; b.setAttribute("aria-label", c); b.style.background = COLORS[c]; return b; });
    row("Acabado", ACABADOS, "acabado", t => { const b = document.createElement("button"); b.className = "rb-pill"; b.textContent = t; return b; });
    row("Material", MATERIALES, "material", t => { const b = document.createElement("button"); b.className = "rb-pill"; b.textContent = t; return b; });
    const go = document.createElement("button"); go.className = "rb-opt rb-pri"; go.textContent = "Ver mi recomendación"; go.style.alignSelf = "flex-start";
    go.onclick = () => {
      g.querySelectorAll("button").forEach(x => x.disabled = true);
      Object.assign(st, sel);
      me([st.tipo, st.color, st.acabado, st.material].filter(Boolean).join(" · ").toLowerCase());
      recomendar();
    };
    g.appendChild(go); msgs.appendChild(g); scroll();
  }
  function score(p) { let s = 0; if (st.color && p.c.includes(st.color)) s += 3; if (st.material && p.m.includes(st.material)) s += 2; if (st.acabado && p.a.includes(st.acabado)) s += 1; return s; }
  function card(p, extra) {
    const d = document.createElement("div"); d.className = "rb-card";
    d.innerHTML = `<b>${p.n}</b><div class="rb-ds">${p.t} · ${p.c.join(", ")} · ${p.m.join(" y ")}</div>${price}${extra ? `<div class="rb-ds">${extra}</div>` : ""}<div class="rb-act"></div>`;
    const act = d.querySelector(".rb-act");
    if (p.ar) { const a = document.createElement("a"); a.className = "rb-opt rb-pri"; a.textContent = "Verlo en mi cuarto"; a.href = "ar.html#" + p.ar; act.appendChild(a); }
    const v = document.createElement("a"); v.className = "rb-opt"; v.textContent = "Ver en el catálogo"; v.href = "index.html#" + ({ Sala: "sala", Almacenamiento: "almacenamiento", Comedor: "comedor", Entrada: "entrada", Estudio: "nuevas" })[p.t]; v.onclick = () => { box.classList.remove("on"); openBtn.style.display = "flex"; }; act.appendChild(v);
    msgs.appendChild(d); scroll();
  }
  async function recomendar() {
    let pool = CAT.filter(p => p.t === st.tipo).map(p => ({ p, s: score(p) })).sort((a, b) => b.s - a.s);
    const fuera = st.color && !CAT.some(p => p.t === st.tipo && p.c.includes(st.color));
    const top = pool.filter(x => x.s > 0).slice(0, 2);
    const lista = (top.length ? top : pool.slice(0, 2)).map(x => x.p);
    st.ultimo = lista.map(p => p.id);
    if (fuera) await bot(`En ${st.tipo.toLowerCase()} no tenemos ese color en catálogo, pero lo podemos cotizar. Mientras, esto es lo más cercano:`);
    else await bot(top.length ? "Esto es lo que te recomiendo, con el acabado que elegiste:" : "Estas son las piezas de esa categoría:");
    lista.forEach(p => card(p));
    if (!fuera && st.perfil) {
      const pk = st.perfil === "uni" ? "Estudiante" : "Honeymoon";
      if (lista.some(p => p.pk === pk)) { st.pkSug = pk; await bot(`Esa pieza forma parte del <b>Paquete ${pk}</b>. ¿Quieres verlo completo?`); }
    }
    despues(fuera);
  }
  async function paquete() {
    const pk = st.perfil === "pareja" ? "Honeymoon" : st.perfil === "uni" ? "Estudiante" : null;
    if (!pk) {
      await bot("Tenemos dos paquetes. ¿Cuál te interesa?");
      opts([{ t: "Paquete Estudiante", go: () => { st.perfil = "uni"; paquete(); } }, { t: "Paquete Honeymoon", go: () => { st.perfil = "pareja"; paquete(); } }]);
      return;
    }
    const P = PAQ[pk];
    await bot(`Te recomiendo el <b>Paquete ${pk}</b>: ${P.txt} Precio del paquete: ${price}`);
    P.piezas.forEach(id => card(byId(id)));
    st.ultimo = P.piezas;
    despues(false);
  }
  async function despues(fuera) {
    await bot("¿Qué te gustaría hacer ahora?", 500);
    const l = [];
    if (st.pkSug) { const pk = st.pkSug; st.pkSug = null; l.push({ t: `Ver Paquete ${pk}`, cls: "pri", go: paquete }); }
    if (fuera) l.push({ t: "Cotizar en mi color", cls: "pri", go: () => asesora("Cotizar un color fuera de catálogo") });
    l.push({ t: "¿Qué más me recomiendas?", go: complementos });
    l.push({ t: "Quiero otro material o medida", go: () => asesora("Mueble a la medida") });
    l.push({ t: "Hablar con asesora", cls: "wa", go: () => asesora("Duda de compra") });
    l.push({ t: "Empezar de nuevo", go: () => { Object.assign(st, { tipo: null, color: null, acabado: null, material: null }); tipo(); } });
    opts(l);
  }
  async function complementos() {
    const pk = st.perfil === "pareja" ? "Honeymoon" : "Estudiante";
    const extra = PAQ[pk].piezas.filter(id => !st.ultimo.includes(id)).slice(0, 2);
    if (!extra.length) { await bot("Ya tienes las piezas principales. ¿Te ayudo con algo más?"); return despues(false); }
    await bot("Para completar tu espacio, combinan bien:");
    extra.forEach(id => card(byId(id)));
    st.ultimo = st.ultimo.concat(extra);
    await bot(`Juntas forman el <b>Paquete ${pk}</b>.`);
    despues(false);
  }
  async function asesora(motivo) {
    st.motivo = motivo;
    await bot("Con gusto te paso con una asesora. Usaremos tu nombre y teléfono solo para atender tu solicitud (aviso de privacidad). ¿Aceptas?");
    opts([{ t: "Acepto", cls: "pri", go: async () => { await bot("¿Cómo te llamas?"); waitingFor = "nombre"; input.focus(); } }, { t: "Ahora no", go: () => despues(false) }]);
  }
  async function cerrarSolicitud(tel) {
    await bot(`¡Gracias, ${st.nombre}! Registré tu solicitud (“${st.motivo}”). Una asesora te escribirá por WhatsApp en máximo 2 horas hábiles.`);
    await bot("<i>Nota del prototipo: en esta versión de prueba tus datos no se envían ni se guardan.</i>", 300);
    opts([{ t: "Seguir viendo el catálogo", go: tipo }]);
  }

  // ---------- Texto libre ----------
  const FAQ = [
    [/env[ií]o|entrega|llega|paqueter/i, "Los muebles llegan desarmados en caja, fáciles de transportar. El costo y los tiempos de envío los confirma Reyna."],
    [/precio|cu[aá]nto|cuesta|costo/i, "Los precios del prototipo están por confirmar con Reyna. Si quieres, una asesora te comparte el precio exacto."],
    [/armar|armado|herramient|instal/i, "Las piezas están pensadas para armarse fácil en casa. Los detalles de armado de cada pieza te los confirma una asesora."],
    [/cabe|medida|tama[nñ]o|espacio/i, "Para saber si cabe, toca “Verlo en mi cuarto” en la pieza: la cámara la coloca a escala real en tu espacio."],
    [/garant[ií]a|devoluc|cambio/i, "Las políticas de garantía y devolución las confirma una asesora."],
    [/pago|tarjeta|meses|transfer/i, "El pago se hace en la pasarela del sitio. Las formas de pago las confirma Reyna."],
    [/paquete/i, null], [/hola|buenas/i, "¡Hola! ¿Te ayudo a elegir un mueble?"]
  ];
  form.onsubmit = async e => {
    e.preventDefault(); const t = input.value.trim(); if (!t) return; input.value = ""; me(t);
    if (waitingFor === "nombre") { st.nombre = t.split(" ")[0]; waitingFor = "tel"; await bot("¿A qué teléfono te escribimos por WhatsApp?"); return; }
    if (waitingFor === "tel") { waitingFor = null; return cerrarSolicitud(t); }
    for (const [re, ans] of FAQ) if (re.test(t)) { if (ans === null) return paquete(); await bot(ans); opts([{ t: "Hablar con asesora", cls: "wa", go: () => asesora("Pregunta: " + t) }, { t: "Elegir del catálogo", go: tipo }]); return; }
    const KEYS = [[/librero/i,"librero"],[/escritorio/i,"escritorio"],[/repisa/i,"repisas"],[/panel/i,"panel"],[/archivero/i,"archivero"],[/tele|tv/i,"tv"],[/recibidor|espejo/i,"recibidor"],[/canto vivo/i,"canto"],[/banca/i,"banca"],[/mesa de centro|centro/i,"mesa_centro"],[/en c\b/i,"lateral_c"],[/desarmable/i,"desarmable"],[/pedestal/i,"pedestal"],[/vidrio|comedor/i,"vidrio_viga"]];
    const k = KEYS.find(([re]) => re.test(t)); const hit = k && byId(k[1]);
    if (hit) { await bot("Esto es lo que tenemos:"); card(hit); return despues(false); }
    await bot("No tengo ese dato en el catálogo y prefiero no inventarlo. ¿Quieres que una asesora te ayude?");
    opts([{ t: "Sí, hablar con asesora", cls: "wa", go: () => asesora("Pregunta: " + t) }, { t: "Elegir del catálogo", go: tipo }]);
  };
  if (location.hash === "#asistente") openBtn.click();
})();
