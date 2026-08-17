-- Asignacion de modulos a un usuario de pruebas en GLO_USUARIO_CARGAS.


-- script temporal para testing, se elimina cuando la pantalla en bigsa web quede lista.
DECLARE @username VARCHAR(100) = N'JRP';

DECLARE @usuarioId VARCHAR(6) = (SELECT USR_CODIGO_PK FROM GLO_USUARIOS WHERE USR_NOMBRE = @username);

DELETE FROM GLO_USUARIO_CARGAS WHERE USUARIO_ID = @usuarioId;

-- Acceso total ('*') a todos los modulos existentes.
INSERT INTO GLO_USUARIO_CARGAS (USUARIO_ID, MODULO_ID, RUTA)
SELECT @usuarioId, m.ID, '*'
FROM GLO_MODULOS_GESTOR m;

SELECT uc.USUARIO_ID, m.DISPLAY_NAME, uc.RUTA
FROM GLO_USUARIO_CARGAS uc
JOIN GLO_MODULOS_GESTOR m ON m.ID = uc.MODULO_ID;

/*
-- Ejemplo caso puntual: acceso total a HTML, pero solo a "Listado de Lotes" dentro de Avisos de Cobranza.

DELETE FROM GLO_USUARIO_CARGAS WHERE USUARIO_ID = @usuarioId;

INSERT INTO GLO_USUARIO_CARGAS (USUARIO_ID, MODULO_ID, RUTA)
SELECT @usuarioId, m.ID, '*'
FROM GLO_MODULOS_GESTOR m
WHERE m.DISPLAY_NAME = N'HTML';

INSERT INTO GLO_USUARIO_CARGAS (USUARIO_ID, MODULO_ID, RUTA)
SELECT @usuarioId, m.ID, N'/inicio/avisos-cobranza/listar-lotes'
FROM GLO_MODULOS_GESTOR m
WHERE m.DISPLAY_NAME = N'Avisos de Cobranza';
*/
