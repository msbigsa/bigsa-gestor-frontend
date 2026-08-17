-- Estructura de tablas para menu dinamico y permisos por modulo.
CREATE TABLE GLO_MODULOS_GESTOR (
    ID           INT IDENTITY(1,1) PRIMARY KEY,
    DISPLAY_NAME NVARCHAR(255) NOT NULL,
    ICON_NAME    NVARCHAR(255) NOT NULL,
    ROUTE        NVARCHAR(255) NOT NULL,
    CATEGORY     NVARCHAR(255) NOT NULL,
    CHILDREN     NVARCHAR(MAX) NOT NULL
);

CREATE TABLE GLO_USUARIO_CARGAS (
    ID          INT IDENTITY(1,1) PRIMARY KEY,
    USUARIO_ID  VARCHAR(6) NOT NULL,
    MODULO_ID   INT NOT NULL,
    RUTA        NVARCHAR(255) NOT NULL,
    CONSTRAINT FK_usuario_cargas_modulo FOREIGN KEY (MODULO_ID) REFERENCES GLO_MODULOS_GESTOR(ID),
    CONSTRAINT UQ_usuario_cargas_grant UNIQUE (USUARIO_ID, MODULO_ID, RUTA)
);

-- RUTA = '*' significa acceso a todos los CHILDREN del modulo; cualquier otro valor
-- debe coincidir exactamente con un route dentro del JSON de CHILDREN.

CREATE INDEX IX_usuario_cargas_usuario_id ON GLO_USUARIO_CARGAS (USUARIO_ID);
