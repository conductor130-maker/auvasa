let DATOS = { lineas: [] };
let favoritos = JSON.parse(localStorage.getItem('auvasa_favoritos') || '{"grupos":[]}');
let historial = [];
let lineaActual = null;
let grupoActual = null;
let cocheIndexActual = 0;
let listaGruposFiltrada = [];
let favoritoPendiente = null;
let manualActual = null;

// ---------- CARGA DE DATOS MÚLTIPLE ----------
async function cargarDatos() {
  const grid = document.getElementById('grid-tipos');
  grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:20px;">Cargando horarios...</p>';
  
  const archivos = [
    'horarios_ordinarias.json',
    'horarios_madrugada.json',
    'horarios_lanzaderas.json',
    'horarios_buho.json',
    'horarios_servicios.json',
    'horarios_personal.json',
    'horarios_manual.json'
  ];

  try {
    let todasLasLineas = [];
    for (const archivo of archivos) {
      try {
        const res = await fetch('./' + archivo + '?v=3');
        if (res.ok) {
          const texto = await res.text();
          const json = JSON.parse(texto);
          if (json.lineas && Array.isArray(json.lineas)) {
            todasLasLineas = todasLasLineas.concat(json.lineas);
          }
        }
      } catch (e) { console.warn('Error en ' + archivo + ': ' + e.message); }
    }

    DATOS.lineas = todasLasLineas;
    if (!DATOS.lineas || DATOS.lineas.length === 0) throw new Error('No se pudo cargar ninguna línea.');
    renderTipos();
  } catch (e) {
    grid.innerHTML = '<div style="grid-column:1/-1;padding:20px;background:#fff;color:#E30613;border-radius:10px;"><h3>Error cargando horarios</h3><p>' + e.message + '</p></div>';
  }
}

// ---------- CONFIGURACIÓN DE LOS BOTONES ----------
const TIPOS = [
  { id: 'ordinaria', emoji: '🚌', nombre: 'Líneas Ordinarias' },
  { id: 'matinal', emoji: '🌙', nombre: 'Madrugada' },
  { id: 'laboral', emoji: '🏭', nombre: 'Polígonos' },
  { id: 'buho', emoji: '🦉', nombre: 'Líneas Búho' },
  { id: 'futbol', emoji: '⚽', nombre: 'Fútbol' },
  { id: 'lanzadera', emoji: '🎓', nombre: 'Lanzaderas' },
  { id: 'personal', emoji: '🚐', nombre: 'Personal' },
  { id: 'manual', emoji: '📖', nombre: 'Manual y Normativa' }
];

function renderTipos() {
  const grid = document.getElementById('grid-tipos');
  grid.innerHTML = TIPOS.map(t =>
    '<button class="boton-tipo tipo-' + t.id + '" onclick="mostrarLineas(\'' + t.id + '\')">' +
      '<span class="emoji">' + t.emoji + '</span><span>' + t.nombre + '</span>' +
    '</button>'
  ).join('');
}

// ---------- NAVEGACIÓN CON HISTORIAL ----------
function irA(id, pushHistory = true) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');
  window.scrollTo(0, 0);
  
  // Mostrar u ocultar el botón flotante (no se muestra en la pantalla de inicio)
  const btnFlotante = document.getElementById('btn-volver-flotante');
  if (id === 'pantalla-tipos') {
    btnFlotante.classList.add('oculto');
  } else {
    btnFlotante.classList.remove('oculto');
  }

  // Manejo del historial del navegador
  if (pushHistory) {
    history.pushState({ pantalla: id }, '', '#' + id);
  }
}

function volverAtras() {
  history.back(); // Esto dispara el evento popstate
}

// Escuchar el botón "Atrás" del navegador
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.pantalla) {
    irA(event.state.pantalla, false); // false para no crear un bucle infinito
  } else {
    irA('pantalla-tipos', false);
  }
});

// ---------- RESTO DE FUNCIONES ----------
function mostrarLineas(tipoId) {
  if (tipoId === 'manual') {
    mostrarManual();
    return;
  }

  const tipo = TIPOS.find(t => t.id === tipoId);
  document.getElementById('titulo-tipo').textContent = tipo.nombre;
  const lineas = DATOS.lineas.filter(l => l && l.tipo === tipoId);
  const grid = document.getElementById('grid-lineas');
  
  if (lineas.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:40px;">No hay líneas disponibles.</p>';
  } else {
    grid.innerHTML = lineas.map(l =>
      '<div class="tarjeta-linea">' +
        '<div><span class="num">' + (l.id || '?') + '</span><div class="nombre">' + (l.nombre || 'Sin nombre') + '</div></div>' +
        '<div class="botones-linea">' +
          '<button class="btn-recorrido" onclick="verRecorrido(\'' + l.id + '\')">🗺️ Recorrido</button>' +
          '<button class="btn-horario" onclick="verGruposCoches(\'' + l.id + '\')">⏱️ Horarios</button>' +
        '</div>' +
      '</div>'
    ).join('');
  }
  irA('pantalla-lineas');
}

// ... (Aquí irían las funciones verRecorrido, verGruposCoches, abrirGrupo, verDetalleCoche, guardarGrupoFavorito, abrirModalFavorito, cerrarModal, guardarFavorito, renderFavoritos y buscar EXACTAMENTE IGUAL que las tenías en el archivo anterior). 

// ---------- LÓGICA DEL MANUAL ----------
function mostrarManual() {
  // Buscamos la línea "MANUAL" en los datos cargados
  const manual = DATOS.lineas.find(l => l.tipo === 'manual');
  
  if (!manual) {
    document.getElementById('lista-manual').innerHTML = '<p>No hay datos de manual cargados.</p>';
    irA('pantalla-manual');
    return;
  }

  // Para este ejemplo, usaremos la estructura de "recorridos" del manual 
  // para pintar los botones. 
  // En tu archivo horarios_manual.json, tendrás que crear 4 recorridos (Mas datos 1, 2, 3, 4).
  
  let htmlBotones = '';
  let htmlContenido = '';

  if (manual.recorridos && manual.recorridos.length > 0) {
    manual.recorridos.forEach((bloque, i) => {
      htmlBotones += `<button class="btn-manual" onclick="verManualDetalle(${i})">📄 ${bloque.sentido || 'Sección ' + (i+1)}</button>`;
    });
  } else {
    htmlBotones = '<p>No hay secciones en el manual.</p>';
  }

  document.getElementById('lista-manual').innerHTML = htmlBotones;
  document.getElementById('contenido-manual').innerHTML = '<p style="color:var(--texto-secundario);">Selecciona una sección para ver el contenido.</p>';
  irA('pantalla-manual');
}

function verManualDetalle(index) {
  const manual = DATOS.lineas.find(l => l.tipo === 'manual');
  if (!manual || !manual.recorridos || !manual.recorridos[index]) return;

  const bloque = manual.recorridos[index];
  
  // Pintamos el contenido en formato texto
  let html = `<h3 style="color:var(--azul); margin-bottom: 10px;">${bloque.sentido}</h3>`;
  html += `<ul style="padding-left: 20px; line-height: 1.8;">`;
  if (bloque.paradas) {
    bloque.paradas.forEach(texto => {
      html += `<li>${texto}</li>`;
    });
  }
  html += `</ul>`;

  // Si el bloque tiene sub-botones (como el "mas datos 11, 12..."), los pintamos aquí:
  // (Para esto, tendrías que meterlos en el JSON como sub-paradas y detectarlo aquí. 
  // Te he dejado un ejemplo en el JSON más abajo).

  document.getElementById('contenido-manual').innerHTML = html;
  // Hacemos scroll hacia el contenido
  document.getElementById('contenido-manual').scrollIntoView({ behavior: 'smooth' });
}

// ... (El resto de funciones de favoritos y búsqueda van aquí).

document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('auvasa_dark') === '1') document.body.classList.add('dark');
  document.getElementById('btnOscuro').addEventListener('click', function() {
    document.body.classList.toggle('dark');
    localStorage.setItem('auvasa_dark', document.body.classList.contains('dark') ? '1' : '0');
  });
  document.getElementById('btnBuscar').addEventListener('click', function() { document.getElementById('barraBusqueda').classList.toggle('oculto'); });
  document.getElementById('inputBusqueda').addEventListener('input', function(e) { buscar(e.target.value); });
  document.getElementById('btnFavoritos').addEventListener('click', function() { renderFavoritos(); irA('pantalla-favoritos'); });
  
  cargarDatos();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
});
