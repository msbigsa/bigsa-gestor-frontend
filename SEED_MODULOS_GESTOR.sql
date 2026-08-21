-- Datos de los modulos que arman el menu (GET /menu).
-- Refleja el contenido actual de sidebar-data.ts.
-- ICON_NAME usa nombres de ligatura de Angular Material (mat-icon), no Iconify/Tabler.

INSERT INTO GLO_MODULOS_GESTOR (DISPLAY_NAME, ICON_NAME, RUTA, CATEGORY, CHILDREN, APLI_CODIGO) VALUES
(N'HTML', N'code', N'/menu-level', N'Gestión',
  N'[
    { "displayName": "Convertir Word a HTML",
      "iconName": "description",
      "route": "/inicio/html/conversor-doc-html"},

    { "displayName": "HTML Generados",
      "iconName": "html",
      "route": "/inicio/html/listar-doc-html"}
  ]', NULL),

(N'Avisos de Cobranza', N'mail', N'/menu-level', N'Cargas Masivas',
  N'[
    { "displayName": "Cargar Planilla",
      "iconName": "upload",
      "route": "/inicio/avisos-cobranza/cargar-lote"},

    { "displayName": "Listado de Lotes",
      "iconName": "list",
      "route": "/inicio/avisos-cobranza/listar-lotes"}
  ]', 3),

(N'Administración', N'admin_panel_settings', N'/menu-level', N'Sistema',
  N'[
    { "displayName": "Administración",
      "iconName": "admin_panel_settings",
      "route": "/inicio/administracion"}
  ]', NULL);

-- Verificacion rapida de que el JSON insertado es valido.
SELECT ID, DISPLAY_NAME, ISJSON(CHILDREN) AS children_es_json_valido FROM GLO_MODULOS_GESTOR;

-- ----------------------------------------------------------------------------
-- UPDATE de ICON_NAME: si esta seed ya se corrio antes (con nombres tipo
-- Iconify/Tabler, ej. 'solar:home-angle-line-duotone'), usar este bloque para
-- migrar los valores existentes a nombres de ligatura de Angular Material sin
-- tener que truncar/reinsertar la tabla.
-- ----------------------------------------------------------------------------

/*
UPDATE GLO_MODULOS_GESTOR
SET ICON_NAME = N'code',
    CHILDREN = JSON_MODIFY(
      JSON_MODIFY(CHILDREN, '$[0].iconName', N'description'),
      '$[1].iconName', N'html'
    )
WHERE DISPLAY_NAME = N'HTML';

UPDATE GLO_MODULOS_GESTOR
SET ICON_NAME = N'mail',
    CHILDREN = JSON_MODIFY(
      JSON_MODIFY(CHILDREN, '$[0].iconName', N'upload'),
      '$[1].iconName', N'list'
    )
WHERE DISPLAY_NAME = N'Avisos de Cobranza';

UPDATE GLO_MODULOS_GESTOR
SET ICON_NAME = N'admin_panel_settings',
    CHILDREN = JSON_MODIFY(CHILDREN, '$[0].iconName', N'admin_panel_settings')
WHERE DISPLAY_NAME = N'Administración';
*/
