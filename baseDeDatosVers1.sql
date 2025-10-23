 CREATE DATABASE ModricEstudio00;

USE ModricEstudio00;

/* ===========================================
   TABLA USUARIO
=========================================== */
CREATE TABLE dbo.Usuario (
    ID_Usuario        INT IDENTITY(1,1) PRIMARY KEY,
    NombreCompleto    NVARCHAR(100) NOT NULL,
    Correo            NVARCHAR(100) NULL,
    Contrasena        NVARCHAR(100) NULL,  -- sin tilde
    TipoUsuario       NVARCHAR(20)  NOT NULL 
        CHECK (TipoUsuario IN ('CEO','Vendedor','Cliente')),
    GrupoGrado        NVARCHAR(50)  NULL,
    CorreoCorporativo NVARCHAR(100) NULL,
    Foto              NVARCHAR(255) NULL
);
-- Evita correos duplicados si los usas para login
CREATE UNIQUE INDEX UQ_Usuario_Correo ON dbo.Usuario(Correo) WHERE Correo IS NOT NULL;
CREATE UNIQUE INDEX UQ_Usuario_CorreoCorp ON dbo.Usuario(CorreoCorporativo) WHERE CorreoCorporativo IS NOT NULL;

/* ===========================================
   TABLA SERVICIO
=========================================== */
CREATE TABLE dbo.Servicio (
    ID_Servicio     INT IDENTITY(1,1) PRIMARY KEY,
    NombreServicio  NVARCHAR(100) NOT NULL,
    Descripcion     NVARCHAR(MAX) NULL,
    Precio          DECIMAL(10,2) NOT NULL CHECK (Precio >= 0),
    Estado          NVARCHAR(20)  NOT NULL CHECK (Estado IN ('Activo','Inactivo')) DEFAULT 'Activo',
    Tipo            NVARCHAR(50)  NULL
);

/* ===========================================
   TABLA PAQUETE (siempre ligado a un Servicio)
=========================================== */
CREATE TABLE dbo.Paquete (
    ID_Paquete     INT IDENTITY(1,1) PRIMARY KEY,
    NombrePaquete  NVARCHAR(100) NOT NULL,
    Contenido      NVARCHAR(MAX) NULL,
    Precio         DECIMAL(10,2) NOT NULL CHECK (Precio >= 0),
    ID_Servicio    INT NOT NULL,
    CONSTRAINT FK_Paquete_Servicio FOREIGN KEY (ID_Servicio)
        REFERENCES dbo.Servicio(ID_Servicio)
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

/* ===========================================
   TABLA PRODUCTO (siempre ligado a un Servicio)
=========================================== */
CREATE TABLE dbo.Producto (
    ID_Producto  INT IDENTITY(1,1) PRIMARY KEY,
    Nombre       NVARCHAR(100) NOT NULL,
    Talla        NVARCHAR(20)  NULL,
    Color        NVARCHAR(20)  NULL,
    Precio       DECIMAL(10,2) NOT NULL CHECK (Precio >= 0),
    ID_Servicio  INT NOT NULL,
    CONSTRAINT FK_Producto_Servicio FOREIGN KEY (ID_Servicio)
        REFERENCES dbo.Servicio(ID_Servicio)
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

/* ===========================================
   TABLA PEDIDO (encabezado)
   - Cliente y Vendedor obligatorios
   - Servicio/Paquete opcionales (si vendes eso "al vuelo")
=========================================== */
CREATE TABLE dbo.Pedido (
    ID_Pedido   INT IDENTITY(1,1) PRIMARY KEY,
    Fecha       DATETIME     NOT NULL DEFAULT GETDATE(),
    Estado      NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','Confirmado','Cancelado')) DEFAULT 'Pendiente',
    ID_Usuario  INT NOT NULL,  -- Cliente
    ID_Vendedor INT NOT NULL,  -- Vendedor
    ID_Servicio INT NULL,
    ID_Paquete  INT NULL,
    Total       DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (Total >= 0),

    CONSTRAINT FK_Pedido_Cliente  FOREIGN KEY (ID_Usuario)
        REFERENCES dbo.Usuario(ID_Usuario)
        ON UPDATE CASCADE
        ON DELETE NO ACTION,

    CONSTRAINT FK_Pedido_Vendedor FOREIGN KEY (ID_Vendedor)
        REFERENCES dbo.Usuario(ID_Usuario)
        ON UPDATE CASCADE
        ON DELETE NO ACTION,

    CONSTRAINT FK_Pedido_Servicio FOREIGN KEY (ID_Servicio)
        REFERENCES dbo.Servicio(ID_Servicio)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT FK_Pedido_Paquete FOREIGN KEY (ID_Paquete)
        REFERENCES dbo.Paquete(ID_Paquete)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

/* ===========================================
   TABLA DETALLEPEDIDO (renglones de productos)
=========================================== */
CREATE TABLE dbo.DetallePedido (
    ID_Detalle  INT IDENTITY(1,1) PRIMARY KEY,
    ID_Pedido   INT NOT NULL,
    ID_Producto INT NOT NULL,
    Cantidad    INT NOT NULL CHECK (Cantidad > 0),
    -- precio capturado al momento (opcional, pero es buena práctica)
    PrecioUnitario DECIMAL(10,2) NOT NULL CHECK (PrecioUnitario >= 0),

    CONSTRAINT FK_Detalle_Pedido FOREIGN KEY (ID_Pedido)
        REFERENCES dbo.Pedido(ID_Pedido)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT FK_Detalle_Producto FOREIGN KEY (ID_Producto)
        REFERENCES dbo.Producto(ID_Producto)
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

CREATE INDEX IX_Detalle_Pedido   ON dbo.DetallePedido(ID_Pedido);
CREATE INDEX IX_Detalle_Producto ON dbo.DetallePedido(ID_Producto);

/* ===========================================
   TABLA PAGO
=========================================== */
CREATE TABLE dbo.Pago (
    ID_Pago     INT IDENTITY(1,1) PRIMARY KEY,
    Monto       DECIMAL(10,2) NOT NULL CHECK (Monto > 0),
    Metodo      NVARCHAR(20)  NOT NULL CHECK (Metodo IN ('Transferencia','Efectivo','Yappy')),
    Fecha       DATETIME      NOT NULL DEFAULT GETDATE(),
    Comprobante NVARCHAR(255) NULL,
    Estado      NVARCHAR(20)  NOT NULL CHECK (Estado IN ('Confirmado','No confirmado')) DEFAULT 'No confirmado',
    ID_Pedido   INT NOT NULL,

    CONSTRAINT FK_Pago_Pedido FOREIGN KEY (ID_Pedido)
        REFERENCES dbo.Pedido(ID_Pedido)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX IX_Pago_Pedido ON dbo.Pago(ID_Pedido);

/* ===========================================
   TABLA FACTURA (1 a 1 con Pedido)
=========================================== */
CREATE TABLE dbo.Factura (
    ID_Factura  INT IDENTITY(1,1) PRIMARY KEY,
    NumeroOrden NVARCHAR(50) NOT NULL,
    Fecha       DATETIME     NOT NULL DEFAULT GETDATE(),
    MedioEnvio  NVARCHAR(20) NOT NULL CHECK (MedioEnvio IN ('Email','WhatsApp')),
    ID_Pedido   INT NOT NULL UNIQUE,  -- asegura 1 factura por pedido

    CONSTRAINT FK_Factura_Pedido FOREIGN KEY (ID_Pedido)
        REFERENCES dbo.Pedido(ID_Pedido)
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

CREATE UNIQUE INDEX UQ_Factura_NumeroOrden ON dbo.Factura(NumeroOrden);

 /*1 .Crea usuarios (uno “Cliente”, otro “Vendedor”):*/
INSERT dbo.Usuario (NombreCompleto, Correo, TipoUsuario)
VALUES ('Ana Cliente','ana@x.com','Cliente'),
       ('Luis Vendedor','luis@x.com','Vendedor');
/*2.  Crea un servicio y un producto:*/
INSERT dbo.Servicio (NombreServicio, Descripcion, Precio, Estado, Tipo)
VALUES ('Diseño de logo','Logo básico',150,'Activo','Diseño');
INSERT dbo.Producto (Nombre, Talla, Color, Precio, ID_Servicio)
VALUES ('Camiseta básica','M','Negro',12.50, 1);
/*3. (Opcional) Crea un paquete: */
INSERT dbo.Paquete (NombrePaquete, Contenido, Precio, ID_Servicio)
VALUES ('Pack Branding','Logo + guía básica',160, 1);
/*4. Crea un pedido (cliente y vendedor obligatorios; servicio/paquete son opcionales):*/
-- Pedido que incluye un servicio Y además tendrá productos en el detalle
INSERT dbo.Pedido (ID_Usuario, ID_Vendedor, ID_Servicio)
VALUES (1, 2, 1);
/*5. Agrega productos al detalle:*/
INSERT dbo.DetallePedido (ID_Pedido, ID_Producto, Cantidad, PrecioUnitario)
VALUES (1, 1, 2, 12.50); -- 2 camisetas
 /*6. Actualiza el total (suma servicio+paquete+detalle):*/
 -- Suma de productos del detalle
WITH Sumas AS (
  SELECT ID_Pedido, SUM(Cantidad * PrecioUnitario) AS SumaDetalle
  FROM dbo.DetallePedido
  GROUP BY ID_Pedido
)
UPDATE p
SET p.Total = ISNULL(s.SumaDetalle,0)
            + ISNULL(sv.Precio,0)
            + ISNULL(pk.Precio,0)
FROM dbo.Pedido p
LEFT JOIN Sumas s       ON s.ID_Pedido = p.ID_Pedido
LEFT JOIN dbo.Servicio sv ON sv.ID_Servicio = p.ID_Servicio
LEFT JOIN dbo.Paquete  pk ON pk.ID_Paquete  = p.ID_Paquete
WHERE p.ID_Pedido = 1;
 /*7. Registra un pago:*/   
 INSERT dbo.Pago (ID_Pedido, Monto, Metodo, Estado)
VALUES (1, 50.00, 'Yappy', 'Confirmado');
 /*8. Genera la factura (1 por pedido):*/
 INSERT dbo.Factura (NumeroOrden, ID_Pedido, MedioEnvio)
VALUES ('FAC-0001', 1, 'Email');
