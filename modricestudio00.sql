-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 18-12-2025 a las 15:11:54
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12
-- SQL BACKUP PARA IMPORTAR EN PHPMYADMIN 

CREATE DATABASE IF NOT EXISTS modricestudio00;
USE modricestudio00;

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

--
-- Volcado de datos para la tabla `asignacionvendedor`
--

INSERT INTO `asignacionvendedor` (`ID_Asignacion`, `ID_Vendedor`, `ID_Colegio`, `FechaAsignacion`, `Estado`, `FechaCreacion`) VALUES
(2, 2, 2, '2025-11-28', 'Finalizado', '2025-11-27 23:17:55'),
(3, 9, 2, '2025-11-28', 'Finalizado', '2025-11-27 23:26:43'),
(5, 5, 2, '2025-11-29', 'Finalizado', '2025-11-29 12:07:36'),
(12, 9, 5, '2025-12-01', 'Activo', '2025-11-30 19:48:46'),
(13, 2, 5, '2025-12-01', 'Activo', '2025-11-30 19:48:49'),
(14, 9, 5, '2025-11-30', 'Activo', '2025-11-30 19:49:25'),
(15, 2, 5, '2025-11-30', 'Activo', '2025-11-30 19:49:28'),
(16, 5, 2, '2025-12-01', 'Finalizado', '2025-11-30 20:20:02'),
(35, 9, 8, '2025-12-06', 'Activo', '2025-12-06 20:50:00'),
(36, 5, 8, '2025-12-06', 'Activo', '2025-12-06 20:50:22'),
(38, 9, 8, '2025-12-11', 'Activo', '2025-12-11 22:40:50'),
(39, 21, 8, '2025-12-11', 'Activo', '2025-12-11 22:41:00'),
(40, 21, 5, '2025-12-12', 'Activo', '2025-12-12 02:20:37'),
(41, 19, 5, '2025-12-12', 'Activo', '2025-12-12 02:20:45'),
(42, 19, 8, '2025-12-18', 'Activo', '2025-12-18 08:46:24');

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

--
-- Volcado de datos para la tabla `bloqueofecha`
--

INSERT INTO `bloqueofecha` (`ID_Bloqueo`, `FechaInicio`, `FechaFin`, `Motivo`, `Estado`, `FechaCreacion`) VALUES
(1, '2025-12-24', '2025-12-26', 'Navidad', 'Activo', '2025-12-06 17:38:20'),
(2, '2025-12-31', '2026-01-01', 'Año Nuevo', 'Activo', '2025-12-06 17:38:20');

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
(2, 'Colegio Javier', 'Vía España, Ciudad de Panamá', NULL, '2025-11-22 14:55:41', 'Cerrado', NULL),
(5, 'UTP', 'Sede central en la central', '64334531', '2025-11-30 19:48:35', 'Activo', 'Solo se atenderan a los estudiantes de tercer año'),
(8, 'Instituto Nacional', 'Av. Balboa, Ciudad de Panamá', '6000-1111', '2025-12-05 19:50:18', 'Activo', NULL);

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

--
-- Volcado de datos para la tabla `cotizacion`
--

INSERT INTO `cotizacion` (`ID_Cotizacion`, `ID_Cliente`, `NombreCliente`, `CorreoCliente`, `TelefonoCliente`, `TipoSesion`, `DescripcionSesion`, `FechaSolicitada`, `HoraSolicitada`, `Estado`, `PrecioEstimado`, `NotasAdmin`, `Prioridad`, `FechaCreacion`, `FechaRespuesta`, `FechaConfirmacion`, `ID_Pedido`) VALUES
(1, NULL, 'María González', 'maria@example.com', '6000-0001', 'Exterior', 'Necesito una sesión de fotos familiar en el parque. Somos 5 personas (2 adultos, 3 niños). Preferiblemente en la mañana con luz natural.', '2025-12-15', NULL, 'Pendiente', NULL, NULL, 0, '2025-12-06 17:38:20', NULL, NULL, NULL),
(2, NULL, 'Carlos Ruiz', 'carlos@example.com', '6000-0002', 'Estudio', 'Sesión profesional para LinkedIn y redes sociales. Necesito 10-15 fotos editadas en alta resolución.', '2025-12-18', NULL, 'En_Revision', NULL, NULL, 0, '2025-12-06 17:38:20', NULL, NULL, NULL),
(3, NULL, 'Ana Torres', 'ana@example.com', '6000-0003', 'Interior', 'Fotos de cumpleaños infantil en mi casa. Evento de 3 horas aproximadamente.', '2025-12-20', NULL, 'Aprobada', NULL, NULL, 0, '2025-12-06 17:38:20', NULL, NULL, NULL);

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

--
-- Volcado de datos para la tabla `historialabonos`
--

INSERT INTO `historialabonos` (`ID_Abono`, `ID_Pedido`, `Monto`, `MetodoPago`, `Notas`, `FechaRegistro`, `ID_RegistradoPor`) VALUES
(1, 13, 60.00, 'Efectivo', 'Abono inicial registrado por el vendedor', '2025-12-18 09:05:29', 19),
(2, 14, 340.00, 'Yappy', 'Abono inicial registrado por el vendedor', '2025-12-18 09:06:29', 19),
(3, 13, 90.00, 'Yappy', '', '2025-12-18 09:08:47', 1);

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
(1, 'Pack Graduación', 'Fotos + diplomas', 150.00, 1),
(2, 'Pack Graduación Premium', '50 fotos digitales + 20 impresas + álbum', 450.00, 2),
(3, 'Pack Graduación Básico', '30 fotos digitales + 10 impresas', 280.00, 2),
(4, 'Pack Familiar Completo', '40 fotos + álbum familiar + cuadro 30x40', 380.00, 3),
(5, 'Pack Retrato Profesional', '15 fotos editadas + 5 impresas', 200.00, 4);

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
  `ID_Usuario` int(11) NOT NULL,
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
(2, '2025-11-29 12:35:15', 'Completado', 0, NULL, NULL, 5, NULL, 5, NULL, 1, 2, 150.00),
(3, '2025-11-29 12:39:49', 'Completado', 0, NULL, NULL, 5, NULL, 5, 1, NULL, 2, 500.00),
(4, '2025-11-29 13:22:15', 'Completado', 0, NULL, NULL, 5, NULL, 5, NULL, 1, 2, 150.00),
(5, '2025-11-29 14:53:44', 'Cancelado', 0, NULL, NULL, 5, 'Limon Dulce', 5, NULL, 1, 2, 150.00),
(6, '2025-11-30 19:52:01', 'Completado', 0, NULL, NULL, 2, 'Ramona pilgrin', 2, NULL, 1, 5, 150.00),
(9, '2025-12-11 23:09:33', 'Completado', 1, NULL, NULL, 9, 'Don cangrejo', 9, 1, NULL, 8, 500.00),
(10, '2025-12-12 02:23:30', 'Cancelado', 1, NULL, NULL, 19, 'oldarei', 19, 2, NULL, 5, 350.00),
(11, '2025-12-12 02:25:30', 'Cancelado', 2, NULL, NULL, 19, 'jigmaei', 19, NULL, 1, 5, 150.00),
(13, '2025-12-18 09:05:29', 'Pendiente', 2, NULL, NULL, 19, 'cliente a', 19, NULL, 1, 8, 150.00),
(14, '2025-12-18 09:06:29', 'Pendiente', 1, NULL, NULL, 19, 'cliente b', 19, NULL, 2, 8, 450.00);

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
(1, 'Fotografía de bodas', 'Servicio completo de fotografía', 500.00, 'Activo', 'Fotografía'),
(2, 'Fotografía de Graduación', 'Sesión fotográfica completa para graduados', 350.00, 'Activo', 'Fotografía'),
(3, 'Sesión Familiar', 'Fotografía familiar profesional', 250.00, 'Activo', 'Fotografía'),
(4, 'Retrato Profesional', 'Sesión de retratos para CV y redes', 150.00, 'Activo', 'Fotografía'),
(5, 'Evento Corporativo', 'Cobertura fotográfica de eventos', 600.00, 'Activo', 'Fotografía');

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
(1, 'CEO Admin', 'ceo@modric.com', 'modric', 'password123', 'CEO', NULL, NULL, NULL, NULL, NULL, 0),
(2, 'Luis Vendedor', 'vendedor@modric.com', NULL, 'password123', 'Vendedor', NULL, NULL, NULL, NULL, NULL, 0),
(3, 'Ana Cliente', 'ana@cliente.com', NULL, 'password123', 'Cliente', NULL, NULL, NULL, NULL, NULL, 0),
(5, 'Limon Vendedor', 'limonagrio@modric.com', NULL, 'password123', 'Vendedor', NULL, 'A/12', 'Escuela pedro pablo sanchez', NULL, NULL, 0),
(7, 'Asucar Salada', '', NULL, 'password123', 'Cliente', NULL, NULL, NULL, 'temp8410', '2025-11-10 16:07:32', 1),
(9, 'Delfin Morado', 'delfin12@modric.com', 'delfin vendedor', 'password123', 'Vendedor', NULL, 'Grupo E.Pedro', 'Pedro Pablo Sanchez', NULL, NULL, 0),
(12, 'arroz conpollo(temporal)', 'arrozconpollo@cliente.com', 'arrozconpollo(temporal)455', 'password123', 'Cliente', NULL, NULL, NULL, 'temp9669', '2025-11-30 20:09:09', 1),
(18, 'pepino demar', 'pepinodemar@modric.com', 'pepinodemar648', 'password123', 'Cliente', NULL, NULL, NULL, 'temp2750', '2025-11-30 20:13:33', 1),
(19, 'Carlos Martínez', 'carlos@modric.com', 'cmartinez', 'password123', 'Vendedor', NULL, NULL, NULL, NULL, NULL, 0),
(21, 'Pedro Sánchez', 'pedro@modric.com', 'psanchez', 'password123', 'Vendedor', NULL, NULL, NULL, NULL, NULL, 0),
(24, 'Roberto Silva', 'roberto@cliente.com', NULL, 'password123', 'Cliente', NULL, NULL, NULL, NULL, NULL, 0),
(25, 'Laura Martínez', 'laura@cliente.com', NULL, 'password123', 'Cliente', NULL, NULL, NULL, NULL, NULL, 0),
(27, 'Carmen Ruiz', 'carmen@cliente.com', NULL, 'password123', 'Cliente', NULL, NULL, NULL, NULL, NULL, 0),
(30, 'Andrés Castro', 'andres@cliente.com', NULL, 'password123', 'Cliente', NULL, NULL, NULL, NULL, NULL, 0),
(47, 'Delfín Morado', 'delfin1@modric.com', 'delfinazul', 'password123', 'Vendedor', NULL, 'Grupo D', 'Colegio Abel Bravo', NULL, NULL, 0),
(60, 'genji cliente', 'genticliente@modric.com', 'genjicliente696', 'password123', 'Cliente', NULL, NULL, NULL, 'temp2727', '2025-12-10 20:07:53', 1);

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
-- Volcado de datos para la tabla `ventainfo`
--

INSERT INTO `ventainfo` (`ID_VentaInfo`, `ID_Pedido`, `NombreCliente`, `MetodoPago`, `EstadoPago`, `MontoAbonado`, `Notas`, `FechaRegistro`) VALUES
(1, 2, 'Emiliano perez', 'Yappy', 'Completo', NULL, 'el primer abono fue de 55', '2025-11-29 12:35:15'),
(2, 3, 'Juan Ramires', 'Efectivo', 'Completo', NULL, 'Primer abono fue de 150\n\nMotivo cancelación: polquesi', '2025-11-29 12:39:49'),
(3, 4, 'Layla gomez', 'Efectivo', 'Completo', NULL, 'Pidio informacion adicional', '2025-11-29 13:22:15'),
(5, 6, 'Ramona pilgrin', 'Transferencia', 'Completo', NULL, 'Pidio info sobre el lugar\ntelefono: 65543421\n', '2025-11-30 19:52:01'),
(6, 9, 'Don cangrejo', 'Transferencia', 'Completo', 275.00, 'La clienta pidio que la sesion fuera en el museo nacional (de dia)\n\nMotivo cancelación: ggjh', '2025-12-11 23:09:33'),
(7, 10, 'oldarei', 'Yappy', 'Abono', 167.00, 'La sesion sera en el salon de conferencias de la sede principal', '2025-12-12 02:23:31'),
(8, 11, 'jigmaei', 'Yappy', 'Abono', 90.00, 'La sesion será en el salon D1 edificio 3\n\nMotivo cancelación: No canceló', '2025-12-12 02:25:30'),
(10, 13, 'cliente a', 'Efectivo', 'Completo', 150.00, 'menciono que terminará de cancelar la quincena que viene', '2025-12-18 09:05:29'),
(11, 14, 'cliente b', 'Yappy', 'Abono', 340.00, 'Cancelara la cuota en dos quincenas', '2025-12-18 09:06:29');

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
  MODIFY `ID_Album` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `asignacionvendedor`
--
ALTER TABLE `asignacionvendedor`
  MODIFY `ID_Asignacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de la tabla `bloqueofecha`
--
ALTER TABLE `bloqueofecha`
  MODIFY `ID_Bloqueo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  MODIFY `ID_Colegio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  MODIFY `ID_Cotizacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `ID_Foto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `historialabonos`
--
ALTER TABLE `historialabonos`
  MODIFY `ID_Abono` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `logdescarga`
--
ALTER TABLE `logdescarga`
  MODIFY `ID_Log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT de la tabla `pago`
--
ALTER TABLE `pago`
  MODIFY `ID_Pago` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `paquete`
--
ALTER TABLE `paquete`
  MODIFY `ID_Paquete` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `pedido`
--
ALTER TABLE `pedido`
  MODIFY `ID_Pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `ID_Producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `servicio`
--
ALTER TABLE `servicio`
  MODIFY `ID_Servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_Usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT de la tabla `ventainfo`
--
ALTER TABLE `ventainfo`
  MODIFY `ID_VentaInfo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
  ADD CONSTRAINT `FK_Pedido_Cliente` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON UPDATE CASCADE,
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
