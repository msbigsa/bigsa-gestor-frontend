-- Datos de los modulos que arman el menu (GET /menu).
-- Refleja el contenido actual de sidebar-data.ts.
-- ICON_NAME usa nombres de ligatura de Angular Material (mat-icon), no Iconify/Tabler.
--
-- Idempotente via MERGE keyed por DISPLAY_NAME: correrlo las veces que sea necesario, tanto en una
-- base nueva como para sincronizar cambios (icono/ruta/children) en una que ya tiene datos -- nunca
-- duplica ni reinserta (ID se mantiene estable), asi que no rompe la FK de GLO_USUARIO_CARGAS.MODULO_ID.

MERGE GLO_MODULOS_GESTOR AS destino
USING (VALUES
  (N'HTML', N'code', N'/menu-level', N'Gestión',
    N'[
      { "displayName": "Convertir Word a HTML",
        "iconName": "description",
        "route": "/inicio/html/conversor-doc-html"},

      { "displayName": "HTML Generados",
        "iconName": "html",
        "route": "/inicio/html/listar-doc-html"}
    ]', CAST(NULL AS INT)),

  (N'Avisos de Cobranza', N'mail', N'/menu-level', N'Cargas Masivas',
    N'[
      { "displayName": "Cargar Planilla",
        "iconName": "upload",
        "route": "/inicio/avisos-cobranza/cargar-lote"},

      { "displayName": "Listado de Lotes",
        "iconName": "list",
        "route": "/inicio/avisos-cobranza/listar-lotes"}
    ]', 3),

  (N'Emisión Masiva', N'send', N'/menu-level', N'Cargas Masivas',
    N'[
      { "displayName": "Cargar Planilla",
        "iconName": "upload",
        "route": "/inicio/emision-masiva/cargar-lote"},

      { "displayName": "Listado de Lotes",
        "iconName": "list",
        "route": "/inicio/emision-masiva/listar-lotes"}
    ]', 4),

  (N'Administración', N'admin_panel_settings', N'/menu-level', N'Sistema',
    N'[
      { "displayName": "Administración",
        "iconName": "admin_panel_settings",
        "route": "/inicio/administracion"}
    ]', CAST(NULL AS INT))
) AS origen (DISPLAY_NAME, ICON_NAME, RUTA, CATEGORY, CHILDREN, APLI_CODIGO)
ON destino.DISPLAY_NAME = origen.DISPLAY_NAME

WHEN MATCHED THEN
  UPDATE SET
    ICON_NAME   = origen.ICON_NAME,
    RUTA        = origen.RUTA,
    CATEGORY    = origen.CATEGORY,
    CHILDREN    = origen.CHILDREN,
    APLI_CODIGO = origen.APLI_CODIGO

WHEN NOT MATCHED THEN
  INSERT (DISPLAY_NAME, ICON_NAME, RUTA, CATEGORY, CHILDREN, APLI_CODIGO)
  VALUES (origen.DISPLAY_NAME, origen.ICON_NAME, origen.RUTA, origen.CATEGORY, origen.CHILDREN, origen.APLI_CODIGO);

-- Verificacion rapida de que el JSON insertado/actualizado es valido.
--SELECT ID, DISPLAY_NAME, ISJSON(CHILDREN) AS children_es_json_valido FROM GLO_MODULOS_GESTOR;
