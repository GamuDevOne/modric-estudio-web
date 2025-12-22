-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-12-2025 a las 20:22:24
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

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

CREATE DATABASE IF NOT EXISTS `modricestudio00`;
USE `modricestudio00`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `modricestudio00`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `AsignarPrioridadAutomatica` (IN `p_idPedido` INT)   BEGIN
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacionvendedor`
--

CREATE TABLE `asignacionvendedor` (
  `ID_Asignacion` int(11) NOT NULL,
  `ID_Vendedor` int(11) NOT NULL,
  `ID_Colegio` int(11) NOT NULL,
  `FechaAsignacion` date NOT NULL,
  `Estado` varchar(20) NOT NULL DEFAULT 'Activo',
  `FechaCreacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bloqueofecha`
--

CREATE TABLE `bloqueofecha` (
  `ID_Bloqueo` int(11) NOT NULL,
  `FechaInicio` date NOT NULL,
  `FechaFin` date NOT NULL,
  `Motivo` varchar(200) DEFAULT NULL,
  `Estado` varchar(20) NOT NULL DEFAULT 'Activo',
  `FechaCreacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Estructura de tabla para la tabla `colegio`
--

CREATE TABLE `colegio` (
  `ID_Colegio` int(11) NOT NULL,
  `NombreColegio` varchar(150) NOT NULL,
  `Direccion` varchar(255) DEFAULT NULL,
  `Telefono` varchar(20) DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT current_timestamp(),
  `Estado` varchar(20) NOT NULL DEFAULT 'Activo',
  `Notas` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cotizacion`
--

CREATE TABLE `cotizacion` (
  `ID_Cotizacion` int(11) NOT NULL,
  `ID_Cliente` int(11) DEFAULT NULL,
  `NombreCliente` varchar(100) NOT NULL,
  `CorreoCliente` varchar(100) NOT NULL,
  `TelefonoCliente` varchar(20) DEFAULT NULL,
  `TipoSesion` varchar(50) NOT NULL,
  `DescripcionSesion` text NOT NULL,
  `FechaSolicitada` date NOT NULL,
  `HoraSolicitada` time DEFAULT NULL,
  `Estado` varchar(20) NOT NULL DEFAULT 'Pendiente',
  `PrecioEstimado` decimal(10,2) DEFAULT NULL,
  `NotasAdmin` text DEFAULT NULL,
  `Prioridad` int(11) DEFAULT 0,
  `FechaCreacion` datetime NOT NULL DEFAULT current_timestamp(),
  `FechaRespuesta` datetime DEFAULT NULL,
  `FechaConfirmacion` datetime DEFAULT NULL,
  `ID_Pedido` int(11) DEFAULT NULL
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historialabonos`
--

CREATE TABLE `historialabonos` (
  `ID_Abono` int(11) NOT NULL,
  `ID_Pedido` int(11) NOT NULL,
  `Monto` decimal(10,2) NOT NULL,
  `MetodoPago` varchar(50) DEFAULT NULL,
  `Notas` text DEFAULT NULL,
  `FechaRegistro` datetime DEFAULT current_timestamp(),
  `ID_RegistradoPor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido`
--

CREATE TABLE `pedido` (
  `ID_Pedido` int(11) NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `Estado` varchar(20) NOT NULL DEFAULT 'Pendiente',
  `Prioridad` int(11) DEFAULT 0,
  `FechaSesion` date DEFAULT NULL,
  `HoraSesion` time DEFAULT NULL,
  `ID_Usuario` int(11) DEFAULT NULL,
  `NombreCliente` varchar(150) DEFAULT NULL,
  `ID_Vendedor` int(11) NOT NULL,
  `ID_Servicio` int(11) DEFAULT NULL,
  `ID_Paquete` int(11) DEFAULT NULL,
  `ID_Colegio` int(11) DEFAULT NULL,
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
(1, 'Pack Graduación Básico', 'Fotos + diploma', 10.00, 'Activo', 'Fotografia'),
(2, 'Pack Graduación Estandar', 'Foto con diploma y dos familiares', 15.00, 'Activo', 'Fotografia'),
(3, 'Pack Graduación Premuim', 'Foto con diploma más 4 familiares', 20.00, 'Activo', 'Fotografia');

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
(1, 'CEO admin', 'Modricestudio@gmail.com ', 'modric', 'admin', 'CEO', NULL, NULL, NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventainfo`
--

CREATE TABLE `ventainfo` (
  `ID_VentaInfo` int(11) NOT NULL,
  `ID_Pedido` int(11) NOT NULL,
  `NombreCliente` varchar(200) NOT NULL,
  `MetodoPago` varchar(50) DEFAULT NULL,
  `EstadoPago` varchar(20) NOT NULL DEFAULT 'Completo',
  `MontoAbonado` decimal(10,2) DEFAULT NULL,
  `Notas` text DEFAULT NULL,
  `FechaRegistro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_fechasocupadas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_fechasocupadas` (
`Fecha` date
,`Estado` varchar(11)
,`CantidadSesiones` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_fechasocupadas`
--
DROP TABLE IF EXISTS `v_fechasocupadas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_fechasocupadas`  AS SELECT `pedido`.`FechaSesion` AS `Fecha`, 'Confirmada' AS `Estado`, count(0) AS `CantidadSesiones` FROM `pedido` WHERE `pedido`.`FechaSesion` is not null AND `pedido`.`Estado` in ('Confirmado','En_Proceso') GROUP BY `pedido`.`FechaSesion`union all select `cotizacion`.`FechaSolicitada` AS `Fecha`,case when `cotizacion`.`Estado` = 'Aprobada' then 'Confirmada' when `cotizacion`.`Estado` = 'Pendiente' then 'Pendiente' when `cotizacion`.`Estado` = 'En_Revision' then 'En_Revision' else 'Disponible' end AS `Estado`,count(0) AS `CantidadSesiones` from `cotizacion` where `cotizacion`.`FechaSolicitada` >= curdate() group by `cotizacion`.`FechaSolicitada`,`cotizacion`.`Estado`  ;

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
-- Indices de la tabla `asignacionvendedor`
--
ALTER TABLE `asignacionvendedor`
  ADD PRIMARY KEY (`ID_Asignacion`),
  ADD UNIQUE KEY `UQ_Vendedor_Colegio_Fecha` (`ID_Vendedor`,`ID_Colegio`,`FechaAsignacion`),
  ADD KEY `IX_Asignacion_Fecha` (`FechaAsignacion`),
  ADD KEY `IX_Asignacion_Colegio` (`ID_Colegio`);

--
-- Indices de la tabla `bloqueofecha`
--
ALTER TABLE `bloqueofecha`
  ADD PRIMARY KEY (`ID_Bloqueo`),
  ADD KEY `IX_Bloqueo_Fecha` (`FechaInicio`,`FechaFin`);

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
-- Indices de la tabla `colegio`
--
ALTER TABLE `colegio`
  ADD PRIMARY KEY (`ID_Colegio`),
  ADD KEY `IX_Colegio_Estado` (`Estado`),
  ADD KEY `IX_Colegio_Nombre` (`NombreColegio`);

--
-- Indices de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  ADD PRIMARY KEY (`ID_Cotizacion`),
  ADD KEY `FK_Cotizacion_Pedido` (`ID_Pedido`),
  ADD KEY `IX_Cotizacion_Estado` (`Estado`),
  ADD KEY `IX_Cotizacion_Fecha` (`FechaSolicitada`),
  ADD KEY `IX_Cotizacion_Cliente` (`ID_Cliente`);

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
-- Indices de la tabla `historialabonos`
--
ALTER TABLE `historialabonos`
  ADD PRIMARY KEY (`ID_Abono`),
  ADD KEY `ID_RegistradoPor` (`ID_RegistradoPor`),
  ADD KEY `IX_Abono_Pedido` (`ID_Pedido`),
  ADD KEY `IX_Abono_Fecha` (`FechaRegistro`);

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
  ADD KEY `FK_Pedido_Paquete` (`ID_Paquete`),
  ADD KEY `FK_Pedido_Colegio` (`ID_Colegio`);

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
-- Indices de la tabla `ventainfo`
--
ALTER TABLE `ventainfo`
  ADD PRIMARY KEY (`ID_VentaInfo`),
  ADD KEY `IX_VentaInfo_Pedido` (`ID_Pedido`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `albumcliente`
--
ALTER TABLE `albumcliente`
  MODIFY `ID_Album` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `asignacionvendedor`
--
ALTER TABLE `asignacionvendedor`
  MODIFY `ID_Asignacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `bloqueofecha`
--
ALTER TABLE `bloqueofecha`
  MODIFY `ID_Bloqueo` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT de la tabla `colegio`
--
ALTER TABLE `colegio`
  MODIFY `ID_Colegio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  MODIFY `ID_Cotizacion` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `ID_Foto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `historialabonos`
--
ALTER TABLE `historialabonos`
  MODIFY `ID_Abono` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `ID_Paquete` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedido`
--
ALTER TABLE `pedido`
  MODIFY `ID_Pedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `ID_Producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `servicio`
--
ALTER TABLE `servicio`
  MODIFY `ID_Servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_Usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `ventainfo`
--
ALTER TABLE `ventainfo`
  MODIFY `ID_VentaInfo` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `albumcliente`
--
ALTER TABLE `albumcliente`
  ADD CONSTRAINT `FK_Album_Cliente` FOREIGN KEY (`ID_Cliente`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `asignacionvendedor`
--
ALTER TABLE `asignacionvendedor`
  ADD CONSTRAINT `FK_Asignacion_Colegio` FOREIGN KEY (`ID_Colegio`) REFERENCES `colegio` (`ID_Colegio`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Asignacion_Vendedor` FOREIGN KEY (`ID_Vendedor`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `categoriapedido`
--
ALTER TABLE `categoriapedido`
  ADD CONSTRAINT `FK_CatPed_Categoria` FOREIGN KEY (`ID_Categoria`) REFERENCES `categoria` (`ID_Categoria`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_CatPed_Cliente` FOREIGN KEY (`ID_Cliente`) REFERENCES `usuario` (`ID_Usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_CatPed_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  ADD CONSTRAINT `FK_Cotizacion_Cliente` FOREIGN KEY (`ID_Cliente`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Cotizacion_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE SET NULL ON UPDATE CASCADE;

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
-- Filtros para la tabla `historialabonos`
--
ALTER TABLE `historialabonos`
  ADD CONSTRAINT `historialabonos_ibfk_1` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `historialabonos_ibfk_2` FOREIGN KEY (`ID_RegistradoPor`) REFERENCES `usuario` (`ID_Usuario`);

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
  ADD CONSTRAINT `FK_Pedido_Cliente` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Pedido_Colegio` FOREIGN KEY (`ID_Colegio`) REFERENCES `colegio` (`ID_Colegio`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Pedido_Paquete` FOREIGN KEY (`ID_Paquete`) REFERENCES `paquete` (`ID_Paquete`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Pedido_Servicio` FOREIGN KEY (`ID_Servicio`) REFERENCES `servicio` (`ID_Servicio`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Pedido_Vendedor` FOREIGN KEY (`ID_Vendedor`) REFERENCES `usuario` (`ID_Usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto`
--
ALTER TABLE `producto`
  ADD CONSTRAINT `FK_Producto_Servicio` FOREIGN KEY (`ID_Servicio`) REFERENCES `servicio` (`ID_Servicio`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventainfo`
--
ALTER TABLE `ventainfo`
  ADD CONSTRAINT `FK_VentaInfo_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE CASCADE ON UPDATE CASCADE;

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
