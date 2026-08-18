-- Estructura de tablas para menu dinamico y permisos por modulo.
CREATE TABLE GLO_MODULOS_GESTOR (
    ID           INT IDENTITY(1,1) PRIMARY KEY,
    DISPLAY_NAME NVARCHAR(255) NOT NULL,
    ICON_NAME    NVARCHAR(255) NOT NULL,
    RUTA         NVARCHAR(255) NOT NULL, --cambiado de ROUTE por ser palabra reservada
    CATEGORY     NVARCHAR(255) NOT NULL,
    CHILDREN     NVARCHAR(MAX) NOT NULL,
    APLI_CODIGO  INT NULL
    -- APLI_CODIGO no fue definido como primary key en GLO_APLI_SATELITES, asi que no se puede crear la FK
    -- CONSTRAINT FK_modulos_gestor_apli_satelite FOREIGN KEY (APLI_CODIGO) REFERENCES GLO_APLI_SATELITES(APLI_CODIGO)
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
