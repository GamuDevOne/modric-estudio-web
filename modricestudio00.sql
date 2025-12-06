-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-11-2025 a las 00:53:12
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `modricestudio00`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `albumcliente`
--

CREATE TABLE `albumcliente` (
  `ID_Album` int(11) NOT NULL,
  `ID_Cliente` int(11) NOT NULL,
  `Titulo` varchar(100) NOT NULL,
  `Descripcion` text DEFAULT NULL,
  `FechaSubida` datetime NOT NULL DEFAULT current_timestamp(),
  `FechaCaducidad` datetime NOT NULL,
  `Estado` varchar(20) NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `albumcliente`
--

INSERT INTO `albumcliente` (`ID_Album`, `ID_Cliente`, `Titulo`, `Descripcion`, `FechaSubida`, `FechaCaducidad`, `Estado`) VALUES
(1, 6, 'Sesión Graduación 2025', 'Fotos de la sesión de graduación - Combo Premium', '2025-11-10 14:28:35', '2025-12-10 14:28:35', 'Cerrado'),
(2, 7, 'Sesion graduacion 2026', 'combo 2, no se cuanto cuesta', '2025-11-10 16:09:41', '2026-11-13 22:09:00', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria`
--

CREATE TABLE `categoria` (
  `ID_Categoria` int(11) NOT NULL,
  `NombreCategoria` varchar(100) NOT NULL,
  `Descripcion` text DEFAULT NULL,
  `FechaInicio` date NOT NULL,
  `FechaFin` date NOT NULL,
  `Estado` varchar(20) DEFAULT 'Activa' CHECK (`Estado` in ('Activa','Inactiva'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categoria`
--

INSERT INTO `categoria` (`ID_Categoria`, `NombreCategoria`, `Descripcion`, `FechaInicio`, `FechaFin`, `Estado`) VALUES
(1, 'Temporada de Bodas', 'Promoción especial para bodas', '2025-02-01', '2025-03-31', 'Activa'),
(2, 'Graduaciones 2025', 'Sesiones de graduación con descuento', '2025-04-01', '2025-05-31', 'Activa'),
(3, 'Navidad 2025', 'Sesiones familiares y temáticas', '2025-11-15', '2025-12-31', 'Inactiva');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoriapedido`
--

CREATE TABLE `categoriapedido` (
  `ID_CategoriaPedido` int(11) NOT NULL,
  `ID_Categoria` int(11) NOT NULL,
  `ID_Pedido` int(11) NOT NULL,
  `ID_Cliente` int(11) NOT NULL,
  `Notas` text DEFAULT NULL,
  `FechaRegistro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detallepedido`
--

CREATE TABLE `detallepedido` (
  `ID_Detalle` int(11) NOT NULL,
  `ID_Pedido` int(11) NOT NULL,
  `ID_Producto` int(11) NOT NULL,
  `Cantidad` int(11) NOT NULL,
  `PrecioUnitario` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura`
--

CREATE TABLE `factura` (
  `ID_Factura` int(11) NOT NULL,
  `NumeroOrden` varchar(50) NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `MedioEnvio` varchar(20) NOT NULL,
  `ID_Pedido` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fotoalbum`
--

CREATE TABLE `fotoalbum` (
  `ID_Foto` int(11) NOT NULL,
  `ID_Album` int(11) NOT NULL,
  `NombreArchivo` varchar(255) NOT NULL,
  `RutaArchivo` varchar(500) NOT NULL,
  `TamanoBytes` bigint(20) NOT NULL,
  `FechaSubida` datetime NOT NULL DEFAULT current_timestamp(),
  `Descargada` tinyint(1) DEFAULT 0,
  `FechaDescarga` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `fotoalbum`
--

INSERT INTO `fotoalbum` (`ID_Foto`, `ID_Album`, `NombreArchivo`, `RutaArchivo`, `TamanoBytes`, `FechaSubida`, `Descargada`, `FechaDescarga`) VALUES
(1, 2, 'peroHacker.jpg', '../uploads/clientes/7/album_2/foto_6918ad76c8be06.43459329.jpg', 59765, '2025-11-15 11:42:30', 0, NULL),
(2, 2, 'michiLanzado.jpg', '../uploads/clientes/7/album_2/foto_6918ad76e79256.13355103.jpg', 26506, '2025-11-15 11:42:30', 0, NULL),
(3, 2, 'nazuna.jpg', '../uploads/clientes/7/album_2/foto_6918ad9deefbc9.82318992.jpg', 163486, '2025-11-15 11:43:10', 0, NULL),
(5, 2, 'descarga (1).jpeg', '../uploads/clientes/7/album_2/foto_6918b72faf6871.40681610.jpeg', 70631, '2025-11-15 12:23:59', 0, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logdescarga`
--

CREATE TABLE `logdescarga` (
  `ID_Log` int(11) NOT NULL,
  `ID_Foto` int(11) NOT NULL,
  `ID_Cliente` int(11) NOT NULL,
  `FechaDescarga` datetime NOT NULL DEFAULT current_timestamp(),
  `IPCliente` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago`
--

CREATE TABLE `pago` (
  `ID_Pago` int(11) NOT NULL,
  `Monto` decimal(10,2) NOT NULL,
  `Metodo` varchar(20) NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `Comprobante` varchar(255) DEFAULT NULL,
  `Estado` varchar(20) NOT NULL DEFAULT 'No confirmado',
  `ID_Pedido` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paquete`
--

CREATE TABLE `paquete` (
  `ID_Paquete` int(11) NOT NULL,
  `NombrePaquete` varchar(100) NOT NULL,
  `Contenido` text DEFAULT NULL,
  `Precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ID_Servicio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `paquete`
--

INSERT INTO `paquete` (`ID_Paquete`, `NombrePaquete`, `Contenido`, `Precio`, `ID_Servicio`) VALUES
(1, 'Pack Graduación', 'Fotos + diplomas', 150.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido`
--

CREATE TABLE `pedido` (
  `ID_Pedido` int(11) NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `Estado` varchar(20) NOT NULL DEFAULT 'Pendiente',
  `ID_Usuario` int(11) NOT NULL,
  `ID_Vendedor` int(11) NOT NULL,
  `ID_Servicio` int(11) DEFAULT NULL,
  `ID_Paquete` int(11) DEFAULT NULL,
  `Total` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `ID_Producto` int(11) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Talla` varchar(20) DEFAULT NULL,
  `Color` varchar(20) DEFAULT NULL,
  `Precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ID_Servicio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `producto`
--

INSERT INTO `producto` (`ID_Producto`, `Nombre`, `Talla`, `Color`, `Precio`, `ID_Servicio`) VALUES
(1, 'Camiseta básica', 'M', 'Negro', 12.50, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio`
--

CREATE TABLE `servicio` (
  `ID_Servicio` int(11) NOT NULL,
  `NombreServicio` varchar(100) NOT NULL,
  `Descripcion` text DEFAULT NULL,
  `Precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Estado` varchar(20) NOT NULL DEFAULT 'Activo',
  `Tipo` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicio`
--

INSERT INTO `servicio` (`ID_Servicio`, `NombreServicio`, `Descripcion`, `Precio`, `Estado`, `Tipo`) VALUES
(1, 'Fotografía de bodas', 'Servicio completo de fotografía', 500.00, 'Activo', 'Fotografía');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `ID_Usuario` int(11) NOT NULL,
  `NombreCompleto` varchar(100) NOT NULL,
  `Correo` varchar(100) DEFAULT NULL,
  `Usuario` varchar(50) DEFAULT NULL,
  `Contrasena` varchar(100) DEFAULT NULL,
  `TipoUsuario` varchar(20) NOT NULL,
  `Foto` varchar(255) DEFAULT NULL,
  `GrupoGrado` varchar(50) DEFAULT NULL,
  `LugarTrabajo` varchar(100) DEFAULT NULL,
  `ContrasenaTemporal` varchar(100) DEFAULT NULL,
  `FechaCreacionTemp` datetime DEFAULT NULL,
  `EsUsuarioTemporal` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`ID_Usuario`, `NombreCompleto`, `Correo`, `Usuario`, `Contrasena`, `TipoUsuario`, `Foto`, `GrupoGrado`, `LugarTrabajo`, `ContrasenaTemporal`, `FechaCreacionTemp`, `EsUsuarioTemporal`) VALUES
(1, 'CEO Admin', 'ceo@modric.com', NULL, 'admin123', 'CEO', NULL, NULL, NULL, NULL, NULL, 0),
(2, 'Luis Vendedor', 'vendedor@modric.com', NULL, 'vend123', 'Vendedor', NULL, NULL, NULL, NULL, NULL, 0),
(3, 'Ana Cliente', 'ana@cliente.com', NULL, 'cliente123', 'Cliente', NULL, NULL, NULL, NULL, NULL, 0),
(5, 'Limon Vendedor', 'limonagrio@modric.com', NULL, 'vend123', 'Vendedor', NULL, 'A/12', 'Escuela pedro pablo sanchez', NULL, NULL, 0),
(6, 'María González', 'maria.temp@test.com', NULL, 'temp123', 'Cliente', NULL, NULL, NULL, 'temp123', '2025-11-10 14:28:35', 1),
(7, 'Asucar Salada', '', NULL, 'temp8410', 'Cliente', NULL, NULL, NULL, 'temp8410', '2025-11-10 16:07:32', 1),
(9, 'Delfin Morado', 'delfin12@modric.com', 'delfin vendedor', 'vend123', 'Vendedor', NULL, 'Grupo E.Pedro', 'Pedro Pablo Sanchez', NULL, NULL, 0);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `albumcliente`
--
ALTER TABLE `albumcliente`
  ADD PRIMARY KEY (`ID_Album`),
  ADD KEY `IX_Album_Cliente` (`ID_Cliente`),
  ADD KEY `IX_Album_Estado` (`Estado`);

--
-- Indices de la tabla `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`ID_Categoria`);

--
-- Indices de la tabla `categoriapedido`
--
ALTER TABLE `categoriapedido`
  ADD PRIMARY KEY (`ID_CategoriaPedido`),
  ADD KEY `FK_CatPed_Categoria` (`ID_Categoria`),
  ADD KEY `FK_CatPed_Pedido` (`ID_Pedido`),
  ADD KEY `FK_CatPed_Cliente` (`ID_Cliente`);

--
-- Indices de la tabla `detallepedido`
--
ALTER TABLE `detallepedido`
  ADD PRIMARY KEY (`ID_Detalle`),
  ADD KEY `IX_Detalle_Pedido` (`ID_Pedido`),
  ADD KEY `IX_Detalle_Producto` (`ID_Producto`);

--
-- Indices de la tabla `factura`
--
ALTER TABLE `factura`
  ADD PRIMARY KEY (`ID_Factura`),
  ADD UNIQUE KEY `ID_Pedido` (`ID_Pedido`),
  ADD UNIQUE KEY `UQ_Factura_NumeroOrden` (`NumeroOrden`);

--
-- Indices de la tabla `fotoalbum`
--
ALTER TABLE `fotoalbum`
  ADD PRIMARY KEY (`ID_Foto`),
  ADD KEY `IX_Foto_Album` (`ID_Album`);

--
-- Indices de la tabla `logdescarga`
--
ALTER TABLE `logdescarga`
  ADD PRIMARY KEY (`ID_Log`),
  ADD KEY `FK_Log_Foto` (`ID_Foto`),
  ADD KEY `FK_Log_Cliente` (`ID_Cliente`),
  ADD KEY `IX_Log_Fecha` (`FechaDescarga`);

--
-- Indices de la tabla `pago`
--
ALTER TABLE `pago`
  ADD PRIMARY KEY (`ID_Pago`),
  ADD KEY `IX_Pago_Pedido` (`ID_Pedido`);

--
-- Indices de la tabla `paquete`
--
ALTER TABLE `paquete`
  ADD PRIMARY KEY (`ID_Paquete`),
  ADD KEY `FK_Paquete_Servicio` (`ID_Servicio`);

--
-- Indices de la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD PRIMARY KEY (`ID_Pedido`),
  ADD KEY `FK_Pedido_Cliente` (`ID_Usuario`),
  ADD KEY `FK_Pedido_Vendedor` (`ID_Vendedor`),
  ADD KEY `FK_Pedido_Servicio` (`ID_Servicio`),
  ADD KEY `FK_Pedido_Paquete` (`ID_Paquete`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`ID_Producto`),
  ADD KEY `FK_Producto_Servicio` (`ID_Servicio`);

--
-- Indices de la tabla `servicio`
--
ALTER TABLE `servicio`
  ADD PRIMARY KEY (`ID_Servicio`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`ID_Usuario`),
  ADD UNIQUE KEY `UQ_Usuario_Correo` (`Correo`),
  ADD UNIQUE KEY `Usuario` (`Usuario`),
  ADD KEY `idx_usuario` (`Usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `albumcliente`
--
ALTER TABLE `albumcliente`
  MODIFY `ID_Album` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `categoria`
--
ALTER TABLE `categoria`
  MODIFY `ID_Categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `categoriapedido`
--
ALTER TABLE `categoriapedido`
  MODIFY `ID_CategoriaPedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detallepedido`
--
ALTER TABLE `detallepedido`
  MODIFY `ID_Detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `factura`
--
ALTER TABLE `factura`
  MODIFY `ID_Factura` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `fotoalbum`
--
ALTER TABLE `fotoalbum`
  MODIFY `ID_Foto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `logdescarga`
--
ALTER TABLE `logdescarga`
  MODIFY `ID_Log` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pago`
--
ALTER TABLE `pago`
  MODIFY `ID_Pago` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `paquete`
--
ALTER TABLE `paquete`
  MODIFY `ID_Paquete` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `pedido`
--
ALTER TABLE `pedido`
  MODIFY `ID_Pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `ID_Producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `servicio`
--
ALTER TABLE `servicio`
  MODIFY `ID_Servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_Usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `albumcliente`
--
ALTER TABLE `albumcliente`
  ADD CONSTRAINT `FK_Album_Cliente` FOREIGN KEY (`ID_Cliente`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `categoriapedido`
--
ALTER TABLE `categoriapedido`
  ADD CONSTRAINT `FK_CatPed_Categoria` FOREIGN KEY (`ID_Categoria`) REFERENCES `categoria` (`ID_Categoria`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_CatPed_Cliente` FOREIGN KEY (`ID_Cliente`) REFERENCES `usuario` (`ID_Usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_CatPed_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detallepedido`
--
ALTER TABLE `detallepedido`
  ADD CONSTRAINT `FK_Detalle_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Detalle_Producto` FOREIGN KEY (`ID_Producto`) REFERENCES `producto` (`ID_Producto`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `factura`
--
ALTER TABLE `factura`
  ADD CONSTRAINT `FK_Factura_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `fotoalbum`
--
ALTER TABLE `fotoalbum`
  ADD CONSTRAINT `FK_Foto_Album` FOREIGN KEY (`ID_Album`) REFERENCES `albumcliente` (`ID_Album`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `logdescarga`
--
ALTER TABLE `logdescarga`
  ADD CONSTRAINT `FK_Log_Cliente` FOREIGN KEY (`ID_Cliente`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Log_Foto` FOREIGN KEY (`ID_Foto`) REFERENCES `fotoalbum` (`ID_Foto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pago`
--
ALTER TABLE `pago`
  ADD CONSTRAINT `FK_Pago_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `paquete`
--
ALTER TABLE `paquete`
  ADD CONSTRAINT `FK_Paquete_Servicio` FOREIGN KEY (`ID_Servicio`) REFERENCES `servicio` (`ID_Servicio`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD CONSTRAINT `FK_Pedido_Cliente` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Pedido_Paquete` FOREIGN KEY (`ID_Paquete`) REFERENCES `paquete` (`ID_Paquete`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Pedido_Servicio` FOREIGN KEY (`ID_Servicio`) REFERENCES `servicio` (`ID_Servicio`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Pedido_Vendedor` FOREIGN KEY (`ID_Vendedor`) REFERENCES `usuario` (`ID_Usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto`
--
ALTER TABLE `producto`
  ADD CONSTRAINT `FK_Producto_Servicio` FOREIGN KEY (`ID_Servicio`) REFERENCES `servicio` (`ID_Servicio`) ON UPDATE CASCADE;

DELIMITER $$
--
-- Eventos
--
CREATE DEFINER=`root`@`localhost` EVENT `CerrarAlbumsVencidos` ON SCHEDULE EVERY 1 DAY STARTS '2025-11-10 14:28:34' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    UPDATE AlbumCliente 
    SET Estado = 'Vencido'
    WHERE FechaCaducidad < NOW() 
    AND Estado = 'Activo';
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

/* =====================================================
   ACTUALIZACIÓN: Sistema de Colegios/Bases
   seagregaron estas tablas a la base de datos existente
===================================================== */

USE ModricEstudio00;

-- =====================================================
-- TABLA: Colegios/Bases de trabajo
-- =====================================================
CREATE TABLE Colegio (
    ID_Colegio INT AUTO_INCREMENT PRIMARY KEY,
    NombreColegio VARCHAR(150) NOT NULL,
    Direccion VARCHAR(255) NULL,
    Telefono VARCHAR(20) NULL,
    FechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    -- Estados: 'Activo', 'Cerrado'
    Notas TEXT NULL,
    
    INDEX IX_Colegio_Estado (Estado),
    INDEX IX_Colegio_Nombre (NombreColegio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: Asignaciones de Vendedores a Colegios
-- Una "Base" es una asignación de vendedores a un colegio en una fecha
-- =====================================================
CREATE TABLE AsignacionVendedor (
    ID_Asignacion INT AUTO_INCREMENT PRIMARY KEY,
    ID_Vendedor INT NOT NULL,
    ID_Colegio INT NOT NULL,
    FechaAsignacion DATE NOT NULL,
    Estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    -- Estados: 'Activo', 'Finalizado'
    FechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Asignacion_Vendedor FOREIGN KEY (ID_Vendedor)
        REFERENCES Usuario(ID_Usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    CONSTRAINT FK_Asignacion_Colegio FOREIGN KEY (ID_Colegio)
        REFERENCES Colegio(ID_Colegio)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    -- Evitar duplicados: mismo vendedor en mismo colegio el mismo día
    UNIQUE KEY UQ_Vendedor_Colegio_Fecha (ID_Vendedor, ID_Colegio, FechaAsignacion),
    
    INDEX IX_Asignacion_Fecha (FechaAsignacion),
    INDEX IX_Asignacion_Colegio (ID_Colegio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- MODIFICAR TABLA PEDIDO: Agregar relación con Colegio
-- =====================================================
ALTER TABLE Pedido 
ADD COLUMN ID_Colegio INT NULL AFTER ID_Paquete,
ADD CONSTRAINT FK_Pedido_Colegio FOREIGN KEY (ID_Colegio)
    REFERENCES Colegio(ID_Colegio)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

-- =====================================================
-- DATOS DE PRUEBA
-- =====================================================
-- Colegios de ejemplo
INSERT INTO Colegio (NombreColegio, Direccion, Estado) VALUES
('Instituto Nacional', 'Calle 50, Ciudad de Panamá', 'Activo'),
('Colegio Javier', 'Vía España, Ciudad de Panamá', 'Activo'),
('Pedro Pablo Sánchez', 'La Chorrera, Panamá Oeste', 'Activo');

/* =====================================================
   NOTAS:
   
   1. Colegio: Guarda los colegios/instituciones
   
   2. AsignacionVendedor: Relaciona vendedores con colegios
      - Un vendedor puede estar en diferentes colegios en diferentes días
      - Pero solo en UN colegio por día (UNIQUE KEY)
   
   3. Pedido.ID_Colegio: Cada venta se asocia al colegio
      donde se realizó
   
   FLUJO:
   1. CEO crea colegio (si no existe)
   2. CEO asigna vendedores al colegio para fecha X
   3. Vendedor inicia sesión → ve su asignación del día
   4. Vendedor registra ventas → se asocian al colegio
   5. CEO puede ver/exportar ventas por colegio
===================================================== */

-- =====================================================
-- SISTEMA DE COTIZACIONES Y RESERVACIONES
-- Para que el cliente cotice sesiones de fotos
-- =====================================================

USE ModricEstudio00;

-- =====================================================
-- TABLA: Cotizaciones (Solicitudes de sesión)
-- =====================================================
CREATE TABLE Cotizacion (
    ID_Cotizacion INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del cliente
    ID_Cliente INT NULL, -- Puede ser NULL si el cliente aún no existe
    NombreCliente VARCHAR(100) NOT NULL,
    CorreoCliente VARCHAR(100) NOT NULL,
    TelefonoCliente VARCHAR(20) NULL,
    
    -- Información de la sesión
    TipoSesion VARCHAR(50) NOT NULL, -- 'Interior', 'Exterior', 'Estudio', etc.
    DescripcionSesion TEXT NOT NULL, -- Detalles que escribe el cliente
    FechaSolicitada DATE NOT NULL, -- Fecha que el cliente quiere
    HoraSolicitada TIME NULL, -- Hora preferida (opcional)
    
    -- Estado de la cotización
    Estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    -- Estados: 'Pendiente', 'En_Revision', 'Aprobada', 'Rechazada', 'Cancelada'
    
    -- Precio y confirmación (lo llena el admin)
    PrecioEstimado DECIMAL(10,2) NULL,
    NotasAdmin TEXT NULL, -- Notas del admin sobre la cotización
    
    -- Prioridad automática (basada en precio o tipo)
    Prioridad INT DEFAULT 0,
    -- 0 = Sin asignar, 1 = Alta, 2 = Baja
    
    -- Fechas de control
    FechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaRespuesta DATETIME NULL, -- Cuando el admin responde
    FechaConfirmacion DATETIME NULL, -- Cuando se confirma
    
    -- Relación con pedido (cuando se aprueba)
    ID_Pedido INT NULL, -- Se llena cuando se convierte en pedido real
    
    CONSTRAINT FK_Cotizacion_Cliente FOREIGN KEY (ID_Cliente)
        REFERENCES Usuario(ID_Usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    
    CONSTRAINT FK_Cotizacion_Pedido FOREIGN KEY (ID_Pedido)
        REFERENCES Pedido(ID_Pedido)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    
    INDEX IX_Cotizacion_Estado (Estado),
    INDEX IX_Cotizacion_Fecha (FechaSolicitada),
    INDEX IX_Cotizacion_Cliente (ID_Cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- MODIFICAR TABLA PEDIDO: Agregar campo Prioridad
-- =====================================================
ALTER TABLE Pedido 
ADD COLUMN Prioridad INT DEFAULT 0 AFTER Estado,
ADD COLUMN FechaSesion DATE NULL AFTER Prioridad,
ADD COLUMN HoraSesion TIME NULL AFTER FechaSesion;

-- Comentario sobre prioridades:
-- 0 = Sin prioridad asignada
-- 1 = Prioridad Alta (sesiones complejas, precio alto, >$300)
-- 2 = Prioridad Baja (sesiones sencillas, precio bajo, <$300)

-- =====================================================
-- TABLA: Bloqueos de Fechas (días no disponibles)
-- =====================================================
CREATE TABLE BloqueoFecha (
    ID_Bloqueo INT AUTO_INCREMENT PRIMARY KEY,
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL,
    Motivo VARCHAR(200) NULL, -- 'Vacaciones', 'Mantenimiento', etc.
    Estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    FechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX IX_Bloqueo_Fecha (FechaInicio, FechaFin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- VISTA: Fechas Ocupadas (para el calendario del cliente)
-- =====================================================
CREATE VIEW V_FechasOcupadas AS
SELECT 
    FechaSesion as Fecha,
    'Confirmada' as Estado,
    COUNT(*) as CantidadSesiones
FROM Pedido
WHERE FechaSesion IS NOT NULL
AND Estado IN ('Confirmado', 'En_Proceso')
GROUP BY FechaSesion

UNION ALL

SELECT 
    FechaSolicitada as Fecha,
    CASE 
        WHEN Estado = 'Aprobada' THEN 'Confirmada'
        WHEN Estado = 'Pendiente' THEN 'Pendiente'
        WHEN Estado = 'En_Revision' THEN 'En_Revision'
        ELSE 'Disponible'
    END as Estado,
    COUNT(*) as CantidadSesiones
FROM Cotizacion
WHERE FechaSolicitada >= CURDATE()
GROUP BY FechaSolicitada, Estado;

-- =====================================================
-- DATOS DE PRUEBA
-- =====================================================

-- Bloquear algunas fechas (vacaciones, días festivos)
INSERT INTO BloqueoFecha (FechaInicio, FechaFin, Motivo) VALUES
('2025-12-24', '2025-12-26', 'Navidad'),
('2025-12-31', '2026-01-01', 'Año Nuevo');

-- Cotizaciones de ejemplo
INSERT INTO Cotizacion (
    NombreCliente, 
    CorreoCliente, 
    TelefonoCliente,
    TipoSesion, 
    DescripcionSesion, 
    FechaSolicitada,
    Estado
) VALUES 
(
    'María González',
    'maria@example.com',
    '6000-0001',
    'Exterior',
    'Necesito una sesión de fotos familiar en el parque. Somos 5 personas (2 adultos, 3 niños). Preferiblemente en la mañana con luz natural.',
    '2025-12-15',
    'Pendiente'
),
(
    'Carlos Ruiz',
    'carlos@example.com',
    '6000-0002',
    'Estudio',
    'Sesión profesional para LinkedIn y redes sociales. Necesito 10-15 fotos editadas en alta resolución.',
    '2025-12-18',
    'En_Revision'
),
(
    'Ana Torres',
    'ana@example.com',
    '6000-0003',
    'Interior',
    'Fotos de cumpleaños infantil en mi casa. Evento de 3 horas aproximadamente.',
    '2025-12-20',
    'Aprobada'
);

-- =====================================================
-- PROCEDIMIENTO: Asignar prioridad automáticamente
-- =====================================================
DELIMITER $$

CREATE PROCEDURE AsignarPrioridadAutomatica(IN p_idPedido INT)
BEGIN
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_prioridad INT;
    
    -- Obtener el precio del pedido
    SELECT Total INTO v_precio
    FROM Pedido
    WHERE ID_Pedido = p_idPedido;
    
    -- Asignar prioridad según el precio
    IF v_precio >= 300 THEN
        SET v_prioridad = 1; -- Alta
    ELSE
        SET v_prioridad = 2; -- Baja
    END IF;
    
    -- Actualizar el pedido
    UPDATE Pedido
    SET Prioridad = v_prioridad
    WHERE ID_Pedido = p_idPedido;
    
    SELECT v_prioridad as PrioridadAsignada;
END$$

DELIMITER ;

-- =====================================================
-- TRIGGER: Asignar prioridad al crear pedido
-- =====================================================
DELIMITER $$

CREATE TRIGGER TR_Pedido_AsignarPrioridad
AFTER INSERT ON Pedido
FOR EACH ROW
BEGIN
    DECLARE v_prioridad INT;
    
    -- Asignar prioridad según el precio
    IF NEW.Total >= 300 THEN
        SET v_prioridad = 1; -- Alta
    ELSE
        SET v_prioridad = 2; -- Baja
    END IF;
    
    -- Actualizar el pedido recién insertado
    UPDATE Pedido
    SET Prioridad = v_prioridad
    WHERE ID_Pedido = NEW.ID_Pedido;
END$$

DELIMITER ;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================
/*
FLUJO DEL SISTEMA:

1. CLIENTE (Frontend - Ismael):
   - Ve calendario con fechas disponibles/ocupadas/bloqueadas
   - Selecciona fecha
   - Llena formulario (tipo, descripción, contacto)
   - Envía cotización

2. SISTEMA (Backend - TÚ):
   - Guarda en tabla Cotizacion con estado 'Pendiente'
   - Envía notificación al admin

3. ADMIN/CEO (Vista Admin - TÚ):
   - Ve lista de cotizaciones pendientes
   - Revisa detalles
   - Asigna precio estimado
   - Cambia estado a 'Aprobada' o 'Rechazada'
   - Si aprueba: crea Pedido automáticamente

4. CLIENTE (Notificación):
   - Recibe respuesta por correo
   - Ve precio y confirmación
   - Puede proceder con el pago

ESTADOS DE COTIZACIÓN:
- Pendiente: Recién enviada por el cliente
- En_Revision: El admin la está revisando
- Aprobada: Admin aprobó y asignó precio
- Rechazada: No se puede realizar (fecha no disponible, etc.)
- Cancelada: Cliente canceló la solicitud

ESTADOS DE FECHA (para calendario):
- Disponible: Fecha libre
- Pendiente: Hay cotización(es) pendientes
- En_Revision: Hay cotización(es) en revisión
- Confirmada: Ya hay pedido confirmado (no disponible)
- Bloqueada: Fecha bloqueada manualmente
*/