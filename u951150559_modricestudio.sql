-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 26-12-2025 a las 20:49:08
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
-- Base de datos: `u951150559_modricestudio`
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

--
-- Volcado de datos para la tabla `colegio`
--

INSERT INTO `colegio` (`ID_Colegio`, `NombreColegio`, `Direccion`, `Telefono`, `FechaCreacion`, `Estado`, `Notas`) VALUES
(14, 'ejemplo', 'ejemplo', '66889809', '2025-12-23 08:00:54', 'Activo', 'ejemplo');

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

--
-- Volcado de datos para la tabla `historialabonos`
--

INSERT INTO `historialabonos` (`ID_Abono`, `ID_Pedido`, `Monto`, `MetodoPago`, `Notas`, `FechaRegistro`, `ID_RegistradoPor`) VALUES
(1, 1, 5.00, 'Efectivo', 'Abono inicial', '2025-12-23 08:58:11', 4),
(2, 2, 9.00, 'Yappy', 'Abono inicial', '2025-12-23 09:08:20', 4),
(3, 2, 7.00, 'Efectivo', '', '2025-12-23 09:10:02', 1),
(4, 2, 0.05, 'Efectivo', '', '2025-12-23 09:10:29', 1),
(5, 1, 5.70, 'Yappy', '', '2025-12-23 09:13:00', 1);

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

--
-- Volcado de datos para la tabla `pedido`
--

INSERT INTO `pedido` (`ID_Pedido`, `Fecha`, `Estado`, `Prioridad`, `FechaSesion`, `HoraSesion`, `ID_Usuario`, `NombreCliente`, `ID_Vendedor`, `ID_Servicio`, `ID_Paquete`, `ID_Colegio`, `Total`) VALUES
(1, '2025-12-23 08:58:11', 'Cancelado', 0, NULL, NULL, 1, 'cliente prueba a', 4, 1, NULL, 14, 10.70),
(2, '2025-12-23 09:08:20', 'Completado', 0, NULL, NULL, 1, 'prueba 2 aa', 4, 2, NULL, 14, 16.05);

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
(1, 'CEO admin', 'Modricestudio@gmail.com', 'modric', 'admin', 'CEO', NULL, NULL, NULL, NULL, NULL, 0),
(4, 'vendedor ejemplo', 'vendedor@gmail.com', 'vend', 'vendedor', 'Vendedor', NULL, NULL, NULL, NULL, NULL, 0);

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

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `albumcliente`
--
ALTER TABLE `albumcliente`
  ADD PRIMARY KEY (`ID_Album`),
  ADD KEY `FK_Album_Cliente` (`ID_Cliente`);

--
-- Indices de la tabla `colegio`
--
ALTER TABLE `colegio`
  ADD PRIMARY KEY (`ID_Colegio`);

--
-- Indices de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  ADD PRIMARY KEY (`ID_Cotizacion`),
  ADD KEY `FK_Cotizacion_Cliente` (`ID_Cliente`),
  ADD KEY `FK_Cotizacion_Pedido` (`ID_Pedido`);

--
-- Indices de la tabla `factura`
--
ALTER TABLE `factura`
  ADD PRIMARY KEY (`ID_Factura`),
  ADD UNIQUE KEY `UQ_Factura_NumeroOrden` (`NumeroOrden`),
  ADD UNIQUE KEY `UQ_Factura_Pedido` (`ID_Pedido`);

--
-- Indices de la tabla `fotoalbum`
--
ALTER TABLE `fotoalbum`
  ADD PRIMARY KEY (`ID_Foto`),
  ADD KEY `FK_Foto_Album` (`ID_Album`);

--
-- Indices de la tabla `historialabonos`
--
ALTER TABLE `historialabonos`
  ADD PRIMARY KEY (`ID_Abono`);

--
-- Indices de la tabla `logdescarga`
--
ALTER TABLE `logdescarga`
  ADD PRIMARY KEY (`ID_Log`),
  ADD KEY `FK_Log_Foto` (`ID_Foto`),
  ADD KEY `FK_Log_Cliente` (`ID_Cliente`);

--
-- Indices de la tabla `pago`
--
ALTER TABLE `pago`
  ADD PRIMARY KEY (`ID_Pago`),
  ADD KEY `FK_Pago_Pedido` (`ID_Pedido`);

--
-- Indices de la tabla `paquete`
--
ALTER TABLE `paquete`
  ADD PRIMARY KEY (`ID_Paquete`);

--
-- Indices de la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD PRIMARY KEY (`ID_Pedido`);

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
  ADD UNIQUE KEY `UQ_Usuario_Usuario` (`Usuario`);

--
-- Indices de la tabla `ventainfo`
--
ALTER TABLE `ventainfo`
  ADD PRIMARY KEY (`ID_VentaInfo`),
  ADD KEY `FK_VentaInfo_Pedido` (`ID_Pedido`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `albumcliente`
--
ALTER TABLE `albumcliente`
  MODIFY `ID_Album` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `colegio`
--
ALTER TABLE `colegio`
  MODIFY `ID_Colegio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  MODIFY `ID_Cotizacion` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `ID_Abono` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `ID_Pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `ID_Producto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicio`
--
ALTER TABLE `servicio`
  MODIFY `ID_Servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_Usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
-- Filtros para la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  ADD CONSTRAINT `FK_Cotizacion_Cliente` FOREIGN KEY (`ID_Cliente`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_Cotizacion_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `FK_Log_Cliente` FOREIGN KEY (`ID_Cliente`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_Log_Foto` FOREIGN KEY (`ID_Foto`) REFERENCES `fotoalbum` (`ID_Foto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pago`
--
ALTER TABLE `pago`
  ADD CONSTRAINT `FK_Pago_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE CASCADE;

--
-- Filtros para la tabla `producto`
--
ALTER TABLE `producto`
  ADD CONSTRAINT `FK_Producto_Servicio` FOREIGN KEY (`ID_Servicio`) REFERENCES `servicio` (`ID_Servicio`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventainfo`
--
ALTER TABLE `ventainfo`
  ADD CONSTRAINT `FK_VentaInfo_Pedido` FOREIGN KEY (`ID_Pedido`) REFERENCES `pedido` (`ID_Pedido`) ON DELETE CASCADE;

DELIMITER $$
--
-- Eventos
--
CREATE DEFINER=`root`@`localhost` EVENT `CerrarAlbumsVencidos` ON SCHEDULE EVERY 1 DAY STARTS '2025-12-26 14:41:19' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
  UPDATE albumcliente
  SET Estado = 'Vencido'
  WHERE FechaCaducidad < NOW()
    AND Estado = 'Activo';
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
