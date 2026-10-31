let DATOS = { lineas: [] };
let favoritos = JSON.parse(localStorage.getItem('auvasa_favoritos') || '{"grupos":[]}');
let historial = [];
let lineaActual = null;
let grupoActual = null;
let cocheIndexActual = 0;
let listaGruposFiltrada = [];
let favoritoPendiente = null;

// ---------- CARGA DE DATOS MÚLTIPLE (7 ARCHIVOS) ----------
async function cargarDatos() {
  const grid = document.getElementById('grid-tipos');
  grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:20px;">Cargando horarios...</p>';
  
  const archivos = [
    'horarios_ordinarias.json',
    'horarios_madrugada.json',
    'horarios_lanzaderas.json',
    'horarios_buho.json',
    'horarios_futbol.json',
    'horarios_personal.json',
    'horarios_manual.json'
  ];

  try {
    let todasLasLineas = [];
    
    // Descargamos los 7 archivos a la vez
    for (const archivo of archivos) {
      try {
        const res = await fetch('./' + archivo);
        if (res.ok) {
          const texto = await res.text();
          const json = JSON.parse(texto);
          if (json.lineas && Array.isArray(json.lineas)) {
            todasLasLineas = todasLasLineas.concat(json.lineas);
          }
        }
      } catch (e) {
        console.warn('Error en ' + archivo + ': ' + e.message);
      }
    }

    DATOS.lineas = todasLasLineas;
    
    if (!DATOS.lineas || !Array.isArray(DATOS.lineas) || DATOS.lineas.length === 0) {
      throw new Error('No se pudo cargar ninguna línea de los archivos.');
    }
    
    renderTipos();
  } catch (e) {
    console.error('Error cargando datos:', e);
    grid.innerHTML = '<div style="grid-column:1/-1;padding:20px;background:#fff;color:#E30613;border-radius:10px;"><h3>Error cargando horarios</h3><p>' + e.message + '</p></div>';
  }
}

// ... El resto de funciones (irA, mostrarLineas, etc.) las dejas igual. 