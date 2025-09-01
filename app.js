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
const CANVAS_SIZE = 1024;

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

/* ==== Envío a Google Sheets + mensaje inline (sin card) ==== */
document.querySelectorAll('form[data-lead]').forEach(form => {
  if (form.dataset.bound) return;     // evita doble binding si el script carga dos veces
  form.dataset.bound = '1';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopImmediatePropagation();     // impide que otros listeners de submit se ejecuten

    const fd = new FormData(form);

    // Honeypot: si está relleno, abortar silenciosamente
    if ((fd.get('website') || '').trim()) return;
    fd.delete('website');

    // Desactivar botón y mostrar "Enviando…"
    const btn = form.querySelector('button[type="submit"]');
    const originalBtn = btn?.textContent;
    if (btn) {
      btn.disabled = true;
      btn.textContent = (window.t?.('popup.sending')) || 'Enviando…';
    }

    // Datos + origen
    const data = Object.fromEntries(fd.entries());
    data.origin = form.dataset.origin || 'Formulario Web';

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycby3PQdKTs3PXdPnGGCyDAP0NKCzjPJTIRJxyChAf3aOxNgWO5DvClKjNRINOSPhA6iHFg/exec',
        { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) }
      );

      // Mensaje de confirmación simple y permanente
      const inline = document.createElement('p');
      inline.className = 'lead-success';
      inline.setAttribute('role', 'status');
      inline.setAttribute('aria-live', 'polite');
      // Si quieres personalizar el texto por formulario, añade data-success-text="..."
      const custom = form.dataset.successText;
      inline.setAttribute('data-i18n', 'contact.thanksInline');
      inline.textContent = custom || '¡Datos enviados! En breve un comercial te contactará.';

      form.replaceWith(inline); // quita el formulario y deja el texto

      // Reaplicar i18n si lo usas en runtime
      if (window.i18next?.isInitialized && window.applyI18n) {
        window.applyI18n();
      }
    } catch (err) {
      console.error(err);
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalBtn || 'Enviar';
      }
      showInlineAlert(form, 'No se pudo enviar. Inténtalo de nuevo o escríbenos.');
    }
  });
});

function showInlineAlert(container, msg) {
  let box = container.querySelector?.('.form-alert');
  if (!box) {
    box = document.createElement('div');
    box.className = 'form-alert';
    container.prepend(box);
  }
  box.textContent = msg;
}

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

  /*═════════════  2 · PÁGINAS  BLOQUE A / B  ═════════════*/
  const CANVAS_SIZE = 1024;                // tamaño máximo permitido

  const $section = $('.section_1--availability');
  const jsonURL  = $section.data('json');
  const $out     = $('#info-text');

  if (!jsonURL || !$img.length) { return; }

  $.getJSON(jsonURL)
    .done(viviendas => iniciarMapster(viviendas))
    .fail(() => console.error('[JSON] No se pudo leer', jsonURL));

  /* ---------------- MAPSTER del plano del bloque ---------------- */
  function iniciarMapster (viviendas) {

    const amarillo = 'FFC300';
    const rojo     = 'B63E3E';

    /* Opciones por-área + vendidos -------------------------------- */
    const vendidos = [];
    const areaOpts = Object.entries(viviendas).map(([key, v]) => {
      if (v.estado === 'reservado') {            // —RESERVADO
        return {
          key,
          render_highlight: { fillColor: amarillo, fillOpacity: 0.55,
                              stroke:true, strokeColor: amarillo, strokeWidth:3 },
          render_select   : { fillColor: amarillo, fillOpacity: 0.45,
                              stroke:true, strokeColor: amarillo, strokeWidth:3 }
        };
      }
      if (v.estado === 'vendido') {              // —VENDIDO
        vendidos.push(key);
        return {
          key,
          isSelectable   : false,
          staticState    : true,
          render_highlight: { fillColor: rojo, fillOpacity: 0.55,
                              stroke:true, strokeColor: rojo, strokeWidth:3 },
          render_select   : { fillColor: rojo, fillOpacity: 0.55,
                              stroke:true, strokeColor: rojo, strokeWidth:3 }
        };
      }
      /* —DISPONIBLE— */
      return {
        key,
        render_highlight: { fillColor: base, fillOpacity: 0.55,
                            stroke:true, strokeColor: base, strokeWidth:3 },
        render_select   : { fillColor: base, fillOpacity: 0.35,
                            stroke:true, strokeColor: base, strokeWidth:3 }
      };
    });

    let currentSelection = null;          // recuerdas la última selección

    $img.mapster({
      /* 🔥 ya NO fijamos width/height: Mapster tomará el tamaño real
        de la imagen y luego la reduciremos con resize() */
      wrapClass      : 'plan-wrapper',

      mapKey         : 'data-key',
      singleSelect   : false,
      clickNavigate  : false,
      scaleMap       : true,
      areas          : areaOpts,

      render_select   : { fillColor: base, fillOpacity: 0.35,
                          stroke:true, strokeColor: border, strokeWidth:3 },
      render_highlight: { fillColor: base, fillOpacity: 0.55,
                          stroke:true, strokeColor: border, strokeWidth:3 },

      onClick (area) {
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
        return false;                           // evita scroll
      },

      onConfigured () {
        if (vendidos.length) {
          $img.mapster('set', true, vendidos.join(','));
        }
        ajustarPlano();                        // ⬅️  primer ajuste al arrancar
      }
    });

    /* ───── Función de ajuste + oyente de ‘resize’ ───── */
    function ajustarPlano () {
      const w = Math.min(CANVAS_SIZE, $img.parent().width()); // nunca >1024
      $img.mapster('resize', w, w, 0);       // alto = ancho → cuadrado
    }
    $(window).on('resize', ajustarPlano);    // se ejecuta al rotar/estirar
  }

  /* ------- 3 · Tarjeta de información + PDF + contador ------- */
  function mostrarInfo (viviendas, key) {
    const d = viviendas[key];
    if (!d) {
      $out.html(`<p>${i18next.t('blockInfo.noData')}</p>`);
      return;
    }

    const orient = i18next.t('orientationMap.' + d.orientacion);

    $out.html(`
      <div class="info-card">
        <h3>
          ${d.nombre}
          <span class="badge badge-${d.estado}">
            ${i18next.t('blockInfo.status.' + d.estado)}
          </span>
        </h3>

        <ul>
          <li>${i18next.t('blockInfo.rooms',      { count: d.habit   })}</li>
          <li>${i18next.t('blockInfo.builtArea',  { value: d.m2      })}</li>
          <li>${i18next.t('blockInfo.terrace',    { value: d.terraza })}</li>
          <li>${i18next.t('blockInfo.orientation',{ dir  : orient    })}</li>
          <li class="precio"><span id="price-value">0 €</span></li>
        </ul>

        <div id="plano-preview" class="pdf-preview"></div>
      </div>
    `);

    /* mini-vista del PDF */
    if (d.pdf) {
      renderPdfPreview(d.pdf, $('#plano-preview'));
    } else {
      $('#plano-preview').text(i18next.t('blockInfo.pdfUnavailable'));
    }

    /* contador animado del precio */
    animatePrice('#price-value', d.precio, 800, 700000);
  }

  /* -------- contador startValue → finalValue -------- */
  function animatePrice(selector, finalValue, duration, startValue = 0) {
    const el    = document.querySelector(selector);
    const start = performance.now();
    const delta = finalValue - startValue;

    const fmt = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });

    function tick (now) {
      const p       = Math.min(1, (now - start) / duration); // 0 → 1
      const current = startValue + delta * p;
      el.textContent = fmt.format(Math.round(current));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* -------- primera página del PDF a mini-canvas -------- */
  function renderPdfPreview (url, $container) {
    $container.empty();
    pdfjsLib.getDocument(url).promise.then(pdf => {
      pdf.getPage(1).then(page => {
        const scale    = 0.05;
        const viewport = page.getViewport({ scale });
        const canvas   = $('<canvas>').get(0);
        const ctx      = canvas.getContext('2d');

        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        canvas.style.cursor = 'pointer';
        canvas.style.border = '1px solid #ccc';
        canvas.addEventListener('click', () => window.open(url, '_blank'));

        $container.append(canvas);
        page.render({ canvasContext: ctx, viewport });
      });
    });
  }


});

/*════════ PROMO: lista + contador al hacer scroll ═════════════════=*/

// ---- 1. Config de los ítems --------------------------------------
const PROMO_ITEMS = [
  { key: 'units',     icon: 'edificio.webp'   },
  { key: 'parking',   icon: 'parking.webp'    },
  { key: 'beds',      icon: 'dormitorio.webp', extra: 'icon-dorm' },
  { key: 'plot',      icon: 'plano.webp',      extra: 'icon-plano' },
  { key: 'sunnydays', icon: 'tiempo.webp'     }
];

// ---- 2. Construye la lista (con “0” inicial) ---------------------
function buildPromoList() {
  const box = document.getElementById('promoStats');
  if (!box) return;

  const ul = document.createElement('ul');

  PROMO_ITEMS.forEach(({ key, icon, extra = '' }) => {
    ul.insertAdjacentHTML('beforeend', `
      <li class="promo-pair" data-key="${key}">
        <img src="/images/iconos/${icon}" class="promo-icon ${extra}" alt="">
        <span id="${key}-count" class="promo-count">0</span>
        <span class="promo-label"></span>
        
      </li>`);
  });

  box.appendChild(ul);
}

  // ---- 3. Contador robusto ----------------------------------------
  function animateCount(selector, finalValue, duration = 800) {
    const el = document.querySelector(selector);
    if (!el || !Number.isFinite(finalValue)) return;

    const start = performance.now();
    const fmt   = new Intl.NumberFormat('es-ES');

    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = fmt.format(Math.round(finalValue * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---- 4. Traduce label + anima valor ------------------------------
  function initPromoCounters() {
    PROMO_ITEMS.forEach(({ key }) => {
      const data = i18next.t(`home.promo.${key}`, { returnObjects: true });
      if (!data || typeof data !== 'object') return;

      document.querySelector(`.promo-pair[data-key="${key}"] .promo-label`)
              .textContent = data.label;

      const n = Number(String(data.value).replace(/[^\d.-]/g, ''));
      if (Number.isFinite(n)) animateCount(`#${key}-count`, n, 800);
    });
  }

  // ---- 5. IO: sólo dispara la animación ----------------------------
  function observePromoCounters() {
    const section = document.getElementById('promoStats');
    if (!section) return;

    const io = new IntersectionObserver((entries, obs) => {
      const first = entries[0];
      if (first.isIntersecting) {
        console.log('🟢 promo visible: %', (first.intersectionRatio * 100).toFixed(1));
        initPromoCounters();     // traduce + anima
        obs.disconnect();        // sólo una vez
      }
    }, {
      threshold: 0.10            // ← 10 % del elemento visible
      // Si prefieres la otra fórmula:
      // threshold: 0,
      // rootMargin: '0px 0px -90% 0px'
    });

    io.observe(section);
  }

  /* ---------- Orquestación de la promo ---------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const startPromo = () => {
    buildPromoList();        // crea el <ul> con los “0”
    observePromoCounters();  // espera al 10 % de visibilidad y anima
  };

  if (i18next.isInitialized) {
    startPromo();            // i18next ya estaba listo
  } else {
    i18next.on('initialized', startPromo); // se ejecutará cuando acabe
  }
});


