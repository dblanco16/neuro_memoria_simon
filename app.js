(() => {
  "use strict";

  const STORAGE_CONFIG = "mt_dyn_config_v2";
  const STORAGE_RANKING = "mt_dyn_ranking_v2";
  const STORAGE_RANKING_VISIBLE = "mt_dyn_ranking_visible_v2";

  const body = document.body;

  const cuadroSecuencia = document.getElementById("cuadroSecuencia");
  const cuadroJugador = document.getElementById("cuadroJugador");
  const tablero = document.getElementById("tableroColores");

  const nombreInput = document.getElementById("nombre");

  const tiempoSpan = document.getElementById("tiempo");
  const aciertosSpan = document.getElementById("aciertos");
  const maximoSpan = document.getElementById("maximo");

  const configTexto = document.getElementById("configTexto");
  const configPanel = document.getElementById("configPanel");

  const btnAccion = document.getElementById("btnAccion");
  const btnToggleConfig = document.getElementById("btnToggleConfig");
  const btnGuardarConfig = document.getElementById("btnGuardarConfig");

  const chkRanking = document.getElementById("chkRanking");
  const rankingContainer = document.getElementById("rankingContainer");
  const rankingBody = document.getElementById("ranking");

  const overlay = document.getElementById("overlayCountdown");
  const countdownNumero = document.getElementById("countdownNumero");

  const inputTiempoTotal = document.getElementById("tiempoTotal");
  const inputLongitud = document.getElementById("longitud");
  const inputCantColores = document.getElementById("cantColores");
  const inputTiempoCambio = document.getElementById("tiempoCambio");
  const inputIncremental = document.getElementById("incremental");
  const inputModoFondo = document.getElementById("modoFondo");
  const inputRepetidos = document.getElementById("permitirRepetidos");

  const PALETA_BASE = [
    "#FF0000", // rojo
    "#FF8C00", // naranja
    "#084808", // verde
    "#FFFF00", // amarillo
    "#9370D8", // violeta
    "#0000FF", // azul
    "#FFB6C1", // rosa
    "#989898", // gris
    "#34bbe9", // celeste
    "#8B4513"  // marron
  ];

  const CONFIG_DEFAULT = {
    tiempoTotal: 30,        // seg
    longitud: 4,            // 0 => incremental
    incremental: false,
    cantColores: 6,
    tiempoCambio: 1,        // seg ENTEROS
    permitirRepetidos: false,
    modoFondo: "light"
  };

  let config = loadConfig();

  function loadConfig() {
    const raw = localStorage.getItem(STORAGE_CONFIG);
    if (!raw) return { ...CONFIG_DEFAULT };
    try { return { ...CONFIG_DEFAULT, ...JSON.parse(raw) }; }
    catch { return { ...CONFIG_DEFAULT }; }
  }

  function clampInt(n, min, max, fallback) {
    const x = parseInt(n, 10);
    if (!Number.isFinite(x)) return fallback;
    return Math.max(min, Math.min(max, x));
  }

  function saveConfig() {
    const tiempoTotal = clampInt(inputTiempoTotal.value, 10, 3600, CONFIG_DEFAULT.tiempoTotal);
    const cantColores = clampInt(inputCantColores.value, 3, 10, CONFIG_DEFAULT.cantColores);
    const tiempoCambio = clampInt(inputTiempoCambio.value, 1, 10, CONFIG_DEFAULT.tiempoCambio);

    let longitud = clampInt(inputLongitud.value, 0, 20, CONFIG_DEFAULT.longitud);
    let incremental = !!inputIncremental.checked;

    if (incremental) longitud = 0;
    if (longitud === 0) incremental = true;

    config = {
      tiempoTotal,
      cantColores,
      tiempoCambio,
      longitud,
      incremental,
      permitirRepetidos: !!inputRepetidos.checked,
      modoFondo: (inputModoFondo.value === "dark") ? "dark" : "light"
    };

    localStorage.setItem(STORAGE_CONFIG, JSON.stringify(config));
    aplicarTema();
    aplicarConfigUI();
    actualizarTextoConfig();
  }

  function aplicarConfigUI() {
    inputTiempoTotal.value = config.tiempoTotal;
    inputCantColores.value = config.cantColores;
    inputTiempoCambio.value = config.tiempoCambio;
    inputModoFondo.value = config.modoFondo;
    inputRepetidos.checked = !!config.permitirRepetidos;

    inputLongitud.value = config.longitud;
    inputIncremental.checked = !!config.incremental;

    if (config.incremental || Number(config.longitud) === 0) {
      inputIncremental.checked = true;
      inputLongitud.value = 0;
      inputLongitud.disabled = true;
    } else {
      inputLongitud.disabled = false;
    }
  }

  function aplicarTema() {
    body.classList.remove("light", "dark");
    body.classList.add(config.modoFondo);
  }

  function actualizarTextoConfig() {
    const modo = config.incremental ? "Incremental" : `Fija (${config.longitud})`;
    configTexto.innerText =
      `Tiempo: ${config.tiempoTotal} seg | Modo: ${modo} | Colores: ${config.cantColores} | Cambio: ${config.tiempoCambio} seg | Repetidos: ${config.permitirRepetidos ? "Sí" : "No"} | Fondo: ${config.modoFondo === "light" ? "Blanco" : "Negro"}`;
  }

  function colorVacio() {
    return (config.modoFondo === "dark") ? "#000000" : "#FFFFFF";
  }

  function resetCuadros() {
    cuadroSecuencia.style.background = colorVacio();
    cuadroJugador.style.background = colorVacio();
  }

  /* =========================
     RANKING (aciertos + max)
  ========================= */
  function loadRanking() {
    const raw = localStorage.getItem(STORAGE_RANKING);
    if (!raw) return [];
    try { return JSON.parse(raw) || []; }
    catch { return []; }
  }

  function saveRanking(data) {
    localStorage.setItem(STORAGE_RANKING, JSON.stringify(data.slice(0, 10)));
  }

  function agregarRanking(aciertosFinal, maximoFinal) {
    const nombre = (nombreInput.value.trim() || "anonimo");
    const data = loadRanking();
    data.unshift({ nombre, aciertos: aciertosFinal, maximo: maximoFinal });
    saveRanking(data);
    renderRanking();
  }

  function renderRanking() {
    const data = loadRanking();
    rankingBody.innerHTML = "";
    data.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(item.nombre)}</td><td>${item.aciertos}</td><td>${item.maximo}</td>`;
      rankingBody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadRankingVisibility() {
    const saved = localStorage.getItem(STORAGE_RANKING_VISIBLE);
    if (saved === null) return false;
    return saved === "true";
  }

  function saveRankingVisibility(val) {
    localStorage.setItem(STORAGE_RANKING_VISIBLE, String(val));
  }

  function aplicarVisibilidadRanking() {
    const visible = chkRanking.checked;
    rankingContainer.style.display = visible ? "block" : "none";
    saveRankingVisibility(visible);
  }

  /* =========================
     JUEGO
  ========================= */
  let jugando = false;
  let preparando = false;
  let mostrandoSecuencia = false;

  let tiempoFin = 0;
  let timerInterval = null;

  let coloresPartida = [];
  let secuencia = [];

  let fase = "idle"; // idle | mostrando | respuesta
  let inputIndex = 0;

  let largoActual = 0;        // incremental (largo objetivo de la ronda)
  let aciertos = 0;
  let ultimoCorrecto = 0;     // ✅ largo de la última secuencia completada OK
  let maximo = 0;             // ✅ máximo histórico de ultimoCorrecto

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function prepararColoresPartida() {
    const cant = Math.max(3, Math.min(config.cantColores, PALETA_BASE.length));
    coloresPartida = shuffle(PALETA_BASE).slice(0, cant);

    tablero.innerHTML = "";
    coloresPartida.forEach(color => {
      const div = document.createElement("div");
      div.className = "cuadro colorBtn";
      div.style.background = color;
      div.addEventListener("click", () => seleccionarColor(color));
      tablero.appendChild(div);
    });
  }

  function construirSecuencia(largo) {
    if (!config.permitirRepetidos && largo > coloresPartida.length) return false;

    secuencia = [];
    const disp = [...coloresPartida];

    for (let i = 0; i < largo; i++) {
      const r = Math.floor(Math.random() * disp.length);
      secuencia.push(disp[r]);
      if (!config.permitirRepetidos) disp.splice(r, 1);
    }
    return true;
  }

  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  async function mostrarSecuencia() {
    mostrandoSecuencia = true;
    fase = "mostrando";
    resetCuadros();

    const t = config.tiempoCambio * 1000;

    for (let i = 0; i < secuencia.length; i++) {
      if (!jugando) return;
      cuadroSecuencia.style.background = secuencia[i];
      await sleep(t);
    }

    cuadroSecuencia.style.background = colorVacio();

    mostrandoSecuencia = false;
    fase = "respuesta";
    inputIndex = 0;
  }

  let clearJugadorTO = null;
  function mostrarToqueJugador(color) {
    cuadroJugador.style.background = color;
    if (clearJugadorTO) clearTimeout(clearJugadorTO);
    clearJugadorTO = setTimeout(() => {
      cuadroJugador.style.background = colorVacio();
    }, 150);
  }

  function seleccionarColor(color) {
    if (!jugando || preparando) return;
    if (fase !== "respuesta") return;
    if (mostrandoSecuencia) return;
    if (inputIndex >= secuencia.length) return;

    mostrarToqueJugador(color);

    const esperado = secuencia[inputIndex];
    const ok = (color === esperado);
    inputIndex++;

    if (!ok) {
      // ✅ Error: NO actualizar maximo/ultimoCorrecto, y NO incrementar largoActual.
      // Repetimos el mismo largo en incremental (largoActual queda igual).
      inputIndex = 0;
	  const pausa = config.tiempoCambio * 1000;
	  setTimeout(() => iniciarRonda(), pausa);
	  
      return;
    }

    if (inputIndex === secuencia.length) {
      // ✅ Completó toda la secuencia => recién acá cuenta como "última correcta"
      aciertos++;

      ultimoCorrecto = secuencia.length;      // ✅ última completada correcta
      maximo = Math.max(maximo, ultimoCorrecto); // ✅ máximo histórico

      aciertosSpan.innerText = String(aciertos);
      maximoSpan.innerText = String(maximo);

      // ✅ Incremental: solo avanza si completó correctamente
      if (config.incremental) largoActual++;

      inputIndex = 0;
      const pausa = config.tiempoCambio * 1000;
      setTimeout(() => iniciarRonda(), pausa);
    }
  }

  function iniciarRonda() {
    if (!jugando) return;
    if (mostrandoSecuencia) return;

    resetCuadros();
    fase = "idle";

    if (config.incremental && largoActual < 2) largoActual = 2;

    const largo = config.incremental ? largoActual : config.longitud;

    const ok = construirSecuencia(largo);
    if (!ok) {
      alert("Configuración inválida: sin repetidos, el largo no puede superar la cantidad de colores.");
      detenerJuego(true);
      return;
    }

    mostrarSecuencia();
  }

  function iniciarTimer() {
    tiempoFin = Date.now() + config.tiempoTotal * 1000;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const restante = Math.max(0, Math.ceil((tiempoFin - Date.now()) / 1000));
      tiempoSpan.innerText = String(restante);

      if (restante <= 0) detenerJuego(true);
    }, 250);
  }

  /* =========================
     CUENTA REGRESIVA
  ========================= */
  let countdownInterval = null;

  function iniciarCuentaRegresiva(onDone) {
    preparando = true;
    let contador = 3;

    overlay.classList.remove("oculto");
    countdownNumero.innerText = String(contador);

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      contador--;
      if (contador > 0) {
        countdownNumero.innerText = String(contador);
      } else {
        clearInterval(countdownInterval);
        overlay.classList.add("oculto");
        preparando = false;
        onDone();
      }
    }, 1000);
  }

  function cancelarCuentaRegresiva() {
    clearInterval(countdownInterval);
    overlay.classList.add("oculto");
    preparando = false;
  }

  function iniciarJuego() {
    if (jugando) return;

    jugando = true;
    fase = "idle";
    inputIndex = 0;

    aciertos = 0;
    ultimoCorrecto = 0; // ✅
    maximo = 0;

    aciertosSpan.innerText = "0";
    maximoSpan.innerText = "0";

    largoActual = config.incremental ? 2 : config.longitud;

    btnAccion.innerText = "Detener";
    btnToggleConfig.disabled = true;
    nombreInput.disabled = true;

    prepararColoresPartida();
    resetCuadros();

    iniciarCuentaRegresiva(() => {
      iniciarTimer();
      iniciarRonda();
    });
  }

  function detenerJuego(guardar) {
    if (!jugando && !preparando) return;

    if (preparando) cancelarCuentaRegresiva();

    jugando = false;
    fase = "idle";
    inputIndex = 0;
    mostrandoSecuencia = false;

    clearInterval(timerInterval);
    timerInterval = null;

    btnAccion.innerText = "Iniciar";
    btnToggleConfig.disabled = false;
    nombreInput.disabled = false;

    resetCuadros();

    if (guardar) agregarRanking(aciertos, maximo);
  }

  /* =========================
     UI events
  ========================= */
  btnAccion.addEventListener("click", () => {
    if (jugando || preparando) detenerJuego(true);
    else iniciarJuego();
  });

  btnToggleConfig.addEventListener("click", () => {
    if (jugando || preparando) return;
    aplicarConfigUI();
    configPanel.classList.toggle("oculto");
  });

  btnGuardarConfig.addEventListener("click", () => {
    if (jugando || preparando) return;
    saveConfig();
    configPanel.classList.add("oculto");
  });

  chkRanking.addEventListener("change", aplicarVisibilidadRanking);

  inputIncremental.addEventListener("change", () => {
    if (inputIncremental.checked) {
      inputLongitud.value = 0;
      inputLongitud.disabled = true;
    } else {
      if (Number(inputLongitud.value) === 0) inputLongitud.value = 2;
      inputLongitud.disabled = false;
    }
  });

  inputLongitud.addEventListener("input", () => {
    const v = Number(inputLongitud.value);
    if (v === 0) {
      inputIncremental.checked = true;
      inputLongitud.disabled = true;
    } else if (v > 0) {
      inputIncremental.checked = false;
      inputLongitud.disabled = false;
    }
  });

  /* =========================
     INIT
  ========================= */
  aplicarTema();
  aplicarConfigUI();
  actualizarTextoConfig();

  renderRanking();
  chkRanking.checked = loadRankingVisibility();
  aplicarVisibilidadRanking();

  resetCuadros();
})();
