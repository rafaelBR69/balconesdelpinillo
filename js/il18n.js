/* ===========================================================
   i18n.js → inicializa i18next y gestiona el selector idioma
   =========================================================== */

/* 1. Renderiza textos y placeholders cada vez que cambie el idioma */
function renderPage(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    el.innerHTML = i18next.t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    el.placeholder = i18next.t(el.dataset.i18nPlaceholder);
  });

  /* Sincroniza el <select> con el idioma actual */
  const sel = document.getElementById('langSwitcher');
  if (sel) sel.value = i18next.resolvedLanguage;
}

/* 2. Carga i18next y detecta idioma guardado */
i18next
  .use(i18nextHttpBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    fallbackLng: 'es',
    backend: { loadPath: '/langs/{{lng}}.json' },
    detection:{
      order:  ['querystring','localStorage','cookie','navigator'],
      caches: ['localStorage','cookie']
    }
  }, renderPage);

/* 3. Cambiar idioma cuando el usuario toca el <select> */
document.addEventListener('change', e=>{
  if (e.target.id === 'langSwitcher'){
    i18next.changeLanguage(e.target.value);
  }
});

/* 4. Reactualiza la página si el idioma cambia por cualquier otro medio */
i18next.on('languageChanged', renderPage);
