-- Datos de los modulos que arman el menu (GET /menu).
-- Refleja el contenido actual de sidebar-data.ts.

INSERT INTO GLO_MODULOS_GESTOR (DISPLAY_NAME, ICON_NAME, RUTA, CATEGORY, CHILDREN, APLI_CODIGO) VALUES
(N'HTML', N'solar:align-horizontal-center-line-duotone', N'/menu-level', N'Gestión',
  N'[
    { "displayName": "Convertir Word a HTML",
      "iconName": "bi:filetype-docx",
      "route": "/inicio/html/conversor-doc-html"},

    { "displayName": "HTML Generados",
      "iconName": "streamline-ultimate:file-html",
      "route": "/inicio/html/listar-doc-html"}
  ]', NULL),

(N'Avisos de Cobranza', N'solar:letter-line-duotone', N'/menu-level', N'Cargas Masivas',
  N'[
    { "displayName": "Cargar Planilla",
      "iconName": "solar:upload-line-duotone",
      "route": "/inicio/avisos-cobranza/cargar-lote"},

    { "displayName": "Listado de Lotes",
      "iconName": "solar:list-line-duotone",
      "route": "/inicio/avisos-cobranza/listar-lotes"}
  ]', 3),

(N'Administración', N'solar:shield-user-line-duotone', N'/menu-level', N'Sistema',
  N'[
    { "displayName": "Administración",
      "iconName": "solar:shield-user-line-duotone",
      "route": "/inicio/administracion"}
  ]', NULL);

-- Verificacion rapida de que el JSON insertado es valido.
SELECT ID, DISPLAY_NAME, ISJSON(CHILDREN) AS children_es_json_valido FROM GLO_MODULOS_GESTOR;
