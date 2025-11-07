/* =====================================================
   BASE DE DATOS COMPLETA: ModricEstudio00
   Versión: actualizada con Categorías y Agenda
   Autor: Proyecto Modric Estudio
===================================================== */

CREATE DATABASE IF NOT EXISTS ModricEstudio00;
USE ModricEstudio00;

/* =====================================================
   TABLA USUARIO
===================================================== */
CREATE TABLE Usuario (
    ID_Usuario        INT AUTO_INCREMENT PRIMARY KEY,
    NombreCompleto    VARCHAR(100) NOT NULL,
    Correo            VARCHAR(100) NULL,
    Contrasena        VARCHAR(100) NULL,
    TipoUsuario       VARCHAR(20)  NOT NULL,
    GrupoGrado        VARCHAR(50)  NULL,
    CorreoCorporativo VARCHAR(100) NULL,
    Foto              VARCHAR(255) NULL,
    UNIQUE KEY UQ_Usuario_Correo (Correo),
    UNIQUE KEY UQ_Usuario_CorreoCorp (CorreoCorporativo)
);

/* =====================================================
   TABLA SERVICIO
===================================================== */
CREATE TABLE Servicio (
    ID_Servicio     INT AUTO_INCREMENT PRIMARY KEY,
    NombreServicio  VARCHAR(100) NOT NULL,
    Descripcion     TEXT NULL,
    Precio          DECIMAL(10,2) NOT NULL DEFAULT 0,
    Estado          VARCHAR(20)  NOT NULL DEFAULT 'Activo',
    Tipo            VARCHAR(50)  NULL
);

/* =====================================================
   TABLA PAQUETE
===================================================== */
CREATE TABLE Paquete (
    ID_Paquete     INT AUTO_INCREMENT PRIMARY KEY,
    NombrePaquete  VARCHAR(100) NOT NULL,
    Contenido      TEXT NULL,
    Precio         DECIMAL(10,2) NOT NULL DEFAULT 0,
    ID_Servicio    INT NOT NULL,
    CONSTRAINT FK_Paquete_Servicio FOREIGN KEY (ID_Servicio)
        REFERENCES Servicio(ID_Servicio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

/* =====================================================
   TABLA PRODUCTO
===================================================== */
CREATE TABLE Producto (
    ID_Producto  INT AUTO_INCREMENT PRIMARY KEY,
    Nombre       VARCHAR(100) NOT NULL,
    Talla        VARCHAR(20)  NULL,
    Color        VARCHAR(20)  NULL,
    Precio       DECIMAL(10,2) NOT NULL DEFAULT 0,
    ID_Servicio  INT NOT NULL,
    CONSTRAINT FK_Producto_Servicio FOREIGN KEY (ID_Servicio)
        REFERENCES Servicio(ID_Servicio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

/* =====================================================
   TABLA PEDIDO
===================================================== */
CREATE TABLE Pedido (
    ID_Pedido   INT AUTO_INCREMENT PRIMARY KEY,
    Fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Estado      VARCHAR(20)  NOT NULL DEFAULT 'Pendiente',
    ID_Usuario  INT NOT NULL,
    ID_Vendedor INT NOT NULL,
    ID_Servicio INT NULL,
    ID_Paquete  INT NULL,
    Total       DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    CONSTRAINT FK_Pedido_Cliente  FOREIGN KEY (ID_Usuario)
        REFERENCES Usuario(ID_Usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    
    CONSTRAINT FK_Pedido_Vendedor FOREIGN KEY (ID_Vendedor)
        REFERENCES Usuario(ID_Usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    
    CONSTRAINT FK_Pedido_Servicio FOREIGN KEY (ID_Servicio)
        REFERENCES Servicio(ID_Servicio)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    
    CONSTRAINT FK_Pedido_Paquete FOREIGN KEY (ID_Paquete)
        REFERENCES Paquete(ID_Paquete)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

/* =====================================================
   TABLA DETALLEPEDIDO
===================================================== */
CREATE TABLE DetallePedido (
    ID_Detalle  INT AUTO_INCREMENT PRIMARY KEY,
    ID_Pedido   INT NOT NULL,
    ID_Producto INT NOT NULL,
    Cantidad    INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    CONSTRAINT FK_Detalle_Pedido FOREIGN KEY (ID_Pedido)
        REFERENCES Pedido(ID_Pedido)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    CONSTRAINT FK_Detalle_Producto FOREIGN KEY (ID_Producto)
        REFERENCES Producto(ID_Producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    
    INDEX IX_Detalle_Pedido (ID_Pedido),
    INDEX IX_Detalle_Producto (ID_Producto)
);

/* =====================================================
   TABLA PAGO
===================================================== */
CREATE TABLE Pago (
    ID_Pago     INT AUTO_INCREMENT PRIMARY KEY,
    Monto       DECIMAL(10,2) NOT NULL,
    Metodo      VARCHAR(20)  NOT NULL,
    Fecha       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Comprobante VARCHAR(255) NULL,
    Estado      VARCHAR(20)  NOT NULL DEFAULT 'No confirmado',
    ID_Pedido   INT NOT NULL,
    
    CONSTRAINT FK_Pago_Pedido FOREIGN KEY (ID_Pedido)
        REFERENCES Pedido(ID_Pedido)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    INDEX IX_Pago_Pedido (ID_Pedido)
);

/* =====================================================
   TABLA FACTURA
===================================================== */
CREATE TABLE Factura (
    ID_Factura  INT AUTO_INCREMENT PRIMARY KEY,
    NumeroOrden VARCHAR(50) NOT NULL,
    Fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MedioEnvio  VARCHAR(20) NOT NULL,
    ID_Pedido   INT NOT NULL UNIQUE,
    
    CONSTRAINT FK_Factura_Pedido FOREIGN KEY (ID_Pedido)
        REFERENCES Pedido(ID_Pedido)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    
    UNIQUE KEY UQ_Factura_NumeroOrden (NumeroOrden)
);

/* =====================================================
   TABLA CATEGORIA (para temporadas o agenda)
===================================================== */
CREATE TABLE Categoria (
    ID_Categoria INT AUTO_INCREMENT PRIMARY KEY,
    NombreCategoria VARCHAR(100) NOT NULL,
    Descripcion TEXT NULL,
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL,
    Estado VARCHAR(20) DEFAULT 'Activa'
        CHECK (Estado IN ('Activa','Inactiva'))
);

/* =====================================================
   TABLA INTERMEDIA CATEGORIA - PEDIDO - CLIENTE
===================================================== */
CREATE TABLE CategoriaPedido (
    ID_CategoriaPedido INT AUTO_INCREMENT PRIMARY KEY,
    ID_Categoria INT NOT NULL,
    ID_Pedido INT NOT NULL,
    ID_Cliente INT NOT NULL,
    Notas TEXT NULL,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_CatPed_Categoria FOREIGN KEY (ID_Categoria)
        REFERENCES Categoria(ID_Categoria)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    CONSTRAINT FK_CatPed_Pedido FOREIGN KEY (ID_Pedido)
        REFERENCES Pedido(ID_Pedido)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    CONSTRAINT FK_CatPed_Cliente FOREIGN KEY (ID_Cliente)
        REFERENCES Usuario(ID_Usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

/* =====================================================
   DATOS DE PRUEBA (usuarios, servicio, producto, paquete)
===================================================== */
INSERT INTO Usuario (NombreCompleto, Correo, Contrasena, TipoUsuario)
VALUES 
    ('CEO Admin', 'ceo@modric.com', 'admin123', 'CEO'),
    ('Luis Vendedor', 'vendedor@modric.com', 'vend123', 'Vendedor'),
    ('Ana Cliente', 'ana@cliente.com', 'cliente123', 'Cliente');

INSERT INTO Servicio (NombreServicio, Descripcion, Precio, Estado, Tipo)
VALUES ('Fotografía de bodas', 'Servicio completo de fotografía', 500.00, 'Activo', 'Fotografía');

INSERT INTO Producto (Nombre, Talla, Color, Precio, ID_Servicio)
VALUES ('Camiseta básica', 'M', 'Negro', 12.50, 1);

INSERT INTO Paquete (NombrePaquete, Contenido, Precio, ID_Servicio)
VALUES ('Pack Graduación', 'Fotos + diplomas', 150.00, 1);

/* =====================================================
   DATOS DE CATEGORÍAS Y RELACIONES DE PRUEBA
===================================================== */
INSERT INTO Categoria (NombreCategoria, Descripcion, FechaInicio, FechaFin, Estado)
VALUES 
('Temporada de Bodas', 'Promoción especial para bodas', '2025-02-01', '2025-03-31', 'Activa'),
('Graduaciones 2025', 'Sesiones de graduación con descuento', '2025-04-01', '2025-05-31', 'Activa'),
('Navidad 2025', 'Sesiones familiares y temáticas', '2025-11-15', '2025-12-31', 'Inactiva');