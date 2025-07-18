/* ──────────────────────────────
   1. Menú hamburguesa
──────────────────────────────── */
function toggleNav () {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('active');
  navLinks.style.color = 'white';
}

/* ──────────────────────────────
   2. Animaciones “reveal” al hacer scroll
──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);      // quita si quieres repetir
        }
      });
    },
    { threshold: 0.3 }                      // 30 % visible
  );
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});

/* ──────────────────────────────
   3. Pop-up  (formulario → Google Sheets)
──────────────────────────────── */

/* Configuración */
const TIME_DELAY   = 19000; // 12 s
const SCROLL_RATIO = 0.80;  // 55 % de scroll

/* Referencias DOM (pueden NO existir en algunas páginas) */
const modal        = document.getElementById('infoModal');
const overlay      = document.getElementById('modalOverlay');
const btnClose     = document.getElementById('modalClose');
const leadForm     = document.getElementById('leadForm');

const thankModal   = document.getElementById('thankModal');
const thankOverlay = document.getElementById('thankOverlay');
const thankClose   = document.getElementById('thankClose');
const thankOk      = document.getElementById('thankOk');

/* Helper ─ añade listener sólo si el nodo existe */
const on = (el, evt, fn) => el && el.addEventListener(evt, fn);

/* Helpers pop-up */
const openModal  = () => modal  && modal .classList.add('show');
const closeModal = () => modal  && modal .classList.remove('show');
const openThank  = () => thankModal && thankModal.classList.add('show');
const closeThank = () => thankModal && thankModal.classList.remove('show');

/* Cerrar modales */
on(btnClose , 'click', closeModal);
on(overlay  , 'click', closeModal);
on(thankClose , 'click', closeThank);
on(thankOk    , 'click', closeThank);
on(thankOverlay,'click', closeThank);

/* Apertura automática (si existe el modal) */
if (modal){
  const timerID = setTimeout(openModal, TIME_DELAY);
  function handleScroll () {
    const ratio = (window.scrollY + window.innerHeight) /
                  document.documentElement.scrollHeight;
    if (ratio >= SCROLL_RATIO) {
      openModal();
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timerID);
    }
  }
  window.addEventListener('scroll', handleScroll);
}

/* Envío a Google Sheets (solo si leadForm existe) */
if (leadForm){
  leadForm.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      name   : leadForm.name.value.trim(),
      email  : leadForm.email.value.trim(),
      phone  : leadForm.phone.value.trim(),
      message: leadForm.message.value.trim(),
      origin : 'Formulario Web'
    };
    try {
      closeModal();
      openThank();
      await fetch(
        'https://script.google.com/macros/s/AKfycbxlBgB28gJM1LyutP76PLlsJy9dWhuZTgwFwT3fYZrEH4CBZu0UQ8peW3hkz8Nnsukjqw/exec',
        { method:'POST', mode:'no-cors', body:JSON.stringify(data) }
      );
      leadForm.reset();
    } catch (err) {
      console.error(err);
      alert('Ups, no se pudo enviar. Inténtalo de nuevo.');
    }
  });
}

/* ──────────────────────────────
   4. Draw-Attention (Image-Mapster) en availability.html
──────────────────────────────── */
console.log('[Debug] jQuery:', !!window.jQuery);
console.log('[Debug] $.fn.mapster:', !!(window.jQuery && $.fn.mapster));

window.addEventListener('load', () => {
  console.log('[Mapster] 🚀  window load disparado');

  if (!window.jQuery || !$.fn.mapster){
    console.error('[Mapster] ❌  jQuery o Mapster no cargados');
    return;
  }

  const $img = $('#avail-img, #blockA-img');
  if (!$img.length){
    console.log('[Mapster] Página sin #avail-img. Fin.');
    return;
  }
  console.log('[Mapster] ✅  Imagen encontrada:',
              $img[0].naturalWidth, '×', $img[0].naturalHeight);

  const base   = '2F4F4F'; // relleno
  const border = '2F4F4F'; // borde

  $img.mapster({
    mapKey        : 'data-key',
    singleSelect  : false,
    clickNavigate : true,
    scaleMap: true,

    render_select   : { fillColor:base, fillOpacity:0.35,
                        stroke:true,  strokeColor:border, strokeWidth:3 },
    render_highlight: { fillColor:base, fillOpacity:0.55,
                        stroke:true,  strokeColor:border, strokeWidth:3 },

    onClick(area){
      console.log('[Mapster] Click en', area.key, '→', area.href);
      return false;          // evita scroll automático
    },

    onConfigured(){
      console.log('[Mapster] 🔄  Configuración terminada');
      // pinta todas las áreas al cargar
      $img.mapster('set', true, 'bloqueA,bloqueB');
      console.log('[Mapster] Áreas coloreadas por defecto');
    }
  });
});

/* ─────────  Plano interactivo · cualquier bloque  ───────── */
$(function () {

  /* ░░ 1. LOCALIZAR ELEMENTOS ░░ */
  const $section = $('.section_1--availability');
  if (!$section.length) return;                       // página sin plano

  const jsonURL = $section.data('json');              // viviendas-*.json
  const $img    = $section.find('img[usemap]');       // plano dentro
  const $out    = $('#info-text');                    // div de la ficha

  if (!jsonURL || !$img.length) {
    console.warn('Falta data-json o <img> con usemap');
    return;
  }

  /* ░░ 2. CARGAR JSON y luego iniciar Mapster ░░ */
  let viviendas = {};
  $.getJSON(jsonURL)
    .done(data => { viviendas = data; iniciarMapster(); })
    .fail(()   => console.error(`[JSON] No se pudo leer ${jsonURL}`));

  /* ░░ 3. INICIALIZAR MAPSTER ░░ */
  function iniciarMapster(){

    const base      = '2F4F4F';
    const border    = '2F4F4F';
    const amarillo  = 'FFC300';
    const rojo      = 'B63E3E';

    /* ① Opciones por-área y lista de “vendidos” para pintarlos de inicio */
    const vendidos   = [];
    const areaOpts = Object.entries(viviendas).map(([key, v])=>{
      if (v.estado === 'reservado'){
        return {
          key,
          isSelectable:true,
          render_highlight:{fillColor:amarillo,fillOpacity:0.55,
                            stroke:true,strokeColor:border,strokeWidth:3},
          render_select  :{fillColor:amarillo,fillOpacity:0.45,
                            stroke:true,strokeColor:border,strokeWidth:3}
        };
      }
      if (v.estado === 'vendido'){
        vendidos.push(key);          // ← guardamos para pintarlo al cargar
        return {
          key,
          isSelectable:false,
          staticState:true,           // siempre rojo
          render_highlight:{fillColor:rojo,fillOpacity:0.55,
                            stroke:true,strokeColor:border,strokeWidth:3},
          render_select  :{fillColor:rojo,fillOpacity:0.55,
                            stroke:true,strokeColor:border,strokeWidth:3}
        };
      }
      return { key };                // disponible → solo gris al hover
    });

    /* ② Inicializar Mapster */
    $img.mapster({
      mapKey       :'data-key',
      singleSelect : false,
      clickNavigate: false,
      scaleMap     : true,

      /* estilo por defecto (disponibles) */
      render_select   :{fillColor:base,fillOpacity:0.35,
                        stroke:true,strokeColor:border,strokeWidth:3},
      render_highlight:{fillColor:base,fillOpacity:0.55,
                        stroke:true,strokeColor:border,strokeWidth:3},

      areas: areaOpts,

      onClick(area){
        const v = viviendas[area.key];
        if (v && v.estado === 'vendido') return false;   // bloquea click
        mostrarInfo(area.key);
        return false;
      },

      onConfigured(){
        /* ③ Pinta SOLO los “vendidos” al cargar */
        if (vendidos.length){
          $img.mapster('set', true, vendidos.join(','));
        }
      }
    });

    /* ④ Reescala en resize */
    $(window).on('resize', ()=>{
      const w = $img.parent().width();
      $img.mapster('resize', w, 0, 0);
    });
  }

  /* ░░ 4. PINTAR LA FICHA ░░ */
  function mostrarInfo (key) {
    const d = viviendas[key];
    if (!d) { $out.html('<p>Sin datos…</p>'); return; }

    const precio = new Intl.NumberFormat(
                     'es-ES', {style:'currency', currency:'EUR'}
                   ).format(d.precio);

    $out.html(`
      <h3>${d.nombre}</h3>
      <p class="estado-${d.estado}">${d.estado.toUpperCase()}</p>
      <ul>
        <li>${d.habit} habitaciones</li>
        <li>${d.m2} m² construidos</li>
        <li>${d.terraza} m² terraza</li>
        <li>Orientación ${d.orientacion}</li>
        <li>${precio}</li>
      </ul>
      <p><a href="${d.pdf}" target="_blank">Descargar ficha PDF</a></p>
    `);
  }
});
