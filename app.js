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
   3. Pop‑up  (formulario → Google Sheets)
──────────────────────────────── */

/* Configuración */
const TIME_DELAY = 19_000;     // 19 s

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

/* Helpers pop‑up */
const openModal  = () => modal      && modal.classList.add('show');
const closeModal = () => modal      && modal.classList.remove('show');
const openThank  = () => thankModal && thankModal.classList.add('show');
const closeThank = () => thankModal && thankModal.classList.remove('show');

/* Cerrar modales */
on(btnClose   , 'click', closeModal);
on(overlay    , 'click', closeModal);
on(thankClose , 'click', closeThank);
on(thankOk    , 'click', closeThank);
on(thankOverlay,'click', closeThank);

/* Apertura automática SOLO por tiempo */
if (modal) {
  setTimeout(openModal, TIME_DELAY);
}


/* ==== Envío a Google Sheets para TODOS los formularios data‑lead ==== */
document.querySelectorAll('form[data-lead]').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();

    /* ➊ Recogemos los campos (name, email, …) */
    const fd   = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    /* ➋ Campo extra para saber de dónde llegó la solicitud */
    data.origin = form.dataset.origin || 'Formulario Web';

    try {
      /* cierra pop‑up o muestra gracias, si existen */
      if (typeof closeModal === 'function') closeModal();
      if (typeof openThank  === 'function') openThank();

      /* ➌ Envío sin CORS */
      await fetch(
        'https://script.google.com/macros/s/AKfycbxlBgB28gJM1LyutP76PLlsJy9dWhuZTgwFwT3fYZrEH4CBZu0UQ8peW3hkz8Nnsukjqw/exec',
        { method:'POST', mode:'no-cors', body:JSON.stringify(data) }
      );

      form.reset();
    } catch (err) {
      console.error(err);
      alert('Ups, no se pudo enviar. Inténtalo de nuevo.');
    }
  });
});

/* ──────────────────────────────
   4. Draw‑Attention · Image‑Mapster
──────────────────────────────── */
console.log('[Debug] Mapster OK?',
            !!(window.jQuery && $.fn.mapster));

window.addEventListener('load', () => {

  if (!window.jQuery || !$.fn.mapster) { return; }

  /* ── ¿en availability.html o en bloque‑A/bloque‑B? ───────── */
  const isAvailability = !!document.getElementById('avail-img');
  const $img = isAvailability
                 ? $('#avail-img')                 // availability
                 : $('#blockA-img, #blockB-img');  // bloques

  if (!$img.length) { return; }

  /* Colores básicos */
  const base   = '2F4F4F';
  const border = '2F4F4F';

  /*═════════════  1 · PÁGINA “DISPONIBILIDAD”  ═════════════*/
  if (isAvailability) {

    $img.mapster({
      mapKey        : 'data-key',
      singleSelect  : false,    // mantener A y B marcados
      clickNavigate : true,     // sigue el href del <area>
      scaleMap      : true,

      render_select   : {fillColor:base, fillOpacity:0.40,
                         stroke:true, strokeColor:border, strokeWidth:3},
      render_highlight: {fillColor:base, fillOpacity:0.55,
                         stroke:true, strokeColor:border, strokeWidth:3},

      onConfigured() {
        /* sombrear bloqueA y bloqueB al cargar */
        $img.mapster('set', true, 'bloqueA,bloqueB');
      }
    });

    return;          // ⬅️  lo que queda debajo sólo para páginas de bloque
  }

  /*═════════════  2 · PÁGINAS  BLOQUE A / B  ═════════════*/
  const $section = $('.section_1--availability');
  const jsonURL  = $section.data('json');
  const $out     = $('#info-text');

  if (!jsonURL || !$img.length) { return; }

  $.getJSON(jsonURL)
    .done(viviendas => iniciarMapster(viviendas))
    .fail(() => console.error('[JSON] No se pudo leer', jsonURL));

  /* ---------------- MAPSTER del plano del bloque ---------------- */
  function iniciarMapster(viviendas) {

    const amarillo = 'FFC300';
    const rojo     = 'B63E3E';

    /* Opciones por‑área + vendidos */
    const vendidos = [];
    const areaOpts = Object.entries(viviendas).map(([key, v]) => {
      if (v.estado === 'reservado') {
        return {
          key,
          render_highlight: {fillColor:amarillo, fillOpacity:0.55,
                             stroke:true, strokeColor:amarillo, strokeWidth:3},
          render_select  : {fillColor:amarillo, fillOpacity:0.45,
                             stroke:true, strokeColor:amarillo, strokeWidth:3}
        };
      }
      if (v.estado === 'vendido') {
        vendidos.push(key);
        return {
          key,
          isSelectable  : false,
          staticState   : true,
          render_highlight: {fillColor:rojo, fillOpacity:0.55,
                             stroke:true, strokeColor:rojo, strokeWidth:3},
          render_select  : {fillColor:rojo, fillOpacity:0.55,
                             stroke:true, strokeColor:rojo, strokeWidth:3}
        };
      }
      /* disponible */
      return {
        key,
        render_highlight: {fillColor:base, fillOpacity:0.55,
                           stroke:true, strokeColor:base, strokeWidth:3},
        render_select  : {fillColor:base, fillOpacity:0.35,
                           stroke:true, strokeColor:base, strokeWidth:3}
      };
    });

    let currentSelection = null;     // recuerdas la última selección

    $img.mapster({
      mapKey        : 'data-key',
      singleSelect  : false,         // exclusión manual
      clickNavigate : false,
      scaleMap      : true,
      areas         : areaOpts,

      render_select   : {fillColor:base, fillOpacity:0.35,
                         stroke:true, strokeColor:border, strokeWidth:3},
      render_highlight: {fillColor:base, fillOpacity:0.55,
                         stroke:true, strokeColor:border, strokeWidth:3},

      onClick(area) {
        const v = viviendas[area.key];
        if (v && v.estado === 'vendido') { return false; }

        /* desmarca la anterior */
        if (currentSelection) {
          $img.mapster('set', false, currentSelection);
        }
        /* marca la nueva */
        $img.mapster('set', true, area.key);
        currentSelection = area.key;

        mostrarInfo(viviendas, area.key);
        return false;                // evita scroll
      },

      onConfigured() {
        if (vendidos.length) {
          $img.mapster('set', true, vendidos.join(','));
        }
      }
    });

    /* reescala al cambiar tamaño */
    $(window).on('resize', () => {
      $img.mapster('resize', $img.parent().width(), 0, 0);
    });
  }

  /* ------- 3 · Tarjeta de información + PDF + contador ------- */

  /* rutas a los PDF por planta */
  const PLANOS = {
    bajo    : 'planos/plano-bajo.pdf',
    primero : 'planos/plano-primero.pdf',
    segundo : 'planos/plano-segundo.pdf',
    tercero : 'planos/plano-tercero.pdf'
  };

  function mostrarInfo(viviendas, key) {
    const d = viviendas[key];
    if (!d) { $out.html('<p>Sin datos…</p>'); return; }

    const planta = /bajo/i.test(key) ? 'bajo'     :
                   /prim/i.test(key) ? 'primero'  :
                   /seg/i.test(key)  ? 'segundo'  :
                   /ter/i.test(key)  ? 'tercero'  : null;

    $out.html(`
      <div class="info-card">
        <h3>
          ${d.nombre}
          <span class="badge badge-${d.estado}">
            ${d.estado.toUpperCase()}
          </span>
        </h3>

        <ul>
          <li>${d.habit} habitaciones</li>
          <li>${d.m2} m² construidos</li>
          <li>${d.terraza} m² terraza</li>
          <li>Orientación ${d.orientacion}</li>
          <li class="precio">
            <span id="price-value">0 €</span>
          </li>
        </ul>

        <div id="plano-preview" class="pdf-preview"></div>
      </div>
    `);

    /* mini‑vista PDF */
    if (planta && PLANOS[planta]) {
      renderPdfPreview(PLANOS[planta], $('#plano-preview'));
    } else {
      $('#plano-preview').text('Plano no disponible');
    }

    /* contador animado del precio */
    animatePrice('#price-value', d.precio, 800, 700000);
  }

  /* contador startValue → finalValue  */
  function animatePrice(selector, finalValue, duration, startValue = 0) {
    const el    = document.querySelector(selector);
    const start = performance.now();
    const delta = finalValue - startValue;           // diferencia a recorrer

    const fmt = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });

    function tick(now) {
      const p = Math.min(1, (now - start) / duration);     // 0 → 1
      const current = startValue + delta * p;              // valor intermedio
      el.textContent = fmt.format(Math.round(current));    // pinta el nº
      if (p < 1) requestAnimationFrame(tick);              // siguiente frame
    }
    requestAnimationFrame(tick);
  }

  /* primera página del PDF a mini‑canvas */
  function renderPdfPreview(url, $container){
    $container.empty();
    pdfjsLib.getDocument(url).promise.then(pdf=>{
      pdf.getPage(1).then(page=>{
        const scale = 0.25;
        const viewport = page.getViewport({ scale });
        const canvas   = $('<canvas>').get(0);
        const ctx      = canvas.getContext('2d');

        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        canvas.style.cursor = 'pointer';
        canvas.style.border = '1px solid #ccc';
        canvas.addEventListener('click', () =>
          window.open(url, '_blank'));

        $container.append(canvas);
        page.render({ canvasContext: ctx, viewport });
      });
    });
  }

});
