-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 30, 2026 at 12:44 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `restaurante`
--

-- --------------------------------------------------------

--
-- Table structure for table `cargos`
--

CREATE TABLE `cargos` (
  `idCargo` int(11) NOT NULL,
  `nombre` varchar(80) NOT NULL COMMENT 'CLIENTE | MESERO | COCINERO | ADMINISTRADOR'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categoria`
--

CREATE TABLE `categoria` (
  `idCategoria` int(11) NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  `activa` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gasto`
--

CREATE TABLE `gasto` (
  `idGasto` int(11) NOT NULL,
  `categoria` varchar(80) NOT NULL COMMENT 'arriendo, servicios, insumos, otros',
  `descripcion` varchar(255) DEFAULT NULL,
  `valor` decimal(10,2) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `metodo` enum('EFECTIVO','TARJETA','NEQUI','DAVIPLATA','OTRO') DEFAULT NULL,
  `registrado_por_idUsuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ingrediente`
--

CREATE TABLE `ingrediente` (
  `idIngrediente` int(11) NOT NULL,
  `nombreIngrediente` varchar(160) NOT NULL,
  `unidad` varchar(40) NOT NULL COMMENT 'kg, g, L, ml, unidad, etc.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventarioingrediente`
--

CREATE TABLE `inventarioingrediente` (
  `ingrediente_idIngrediente` int(11) NOT NULL,
  `stock` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `stock_minimo` decimal(12,4) NOT NULL DEFAULT 0.0000 COMMENT 'Alerta cuando stock <= mínimo',
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mesa`
--

CREATE TABLE `mesa` (
  `idMesa` int(11) NOT NULL,
  `numero` int(11) NOT NULL,
  `nombre` varchar(80) DEFAULT NULL,
  `capacidad` int(11) DEFAULT NULL,
  `estado` enum('LIBRE','OCUPADA') NOT NULL DEFAULT 'LIBRE',
  `activa` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `movimientoingrediente`
--

CREATE TABLE `movimientoingrediente` (
  `idMovimiento` int(11) NOT NULL,
  `tipo` enum('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  `cantidad` decimal(12,4) NOT NULL,
  `motivo` varchar(120) NOT NULL,
  `referencia` varchar(120) DEFAULT NULL COMMENT 'Ej. id pedido, factura proveedor',
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `ingrediente_idIngrediente` int(11) NOT NULL,
  `usuario_idUsuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pago`
--

CREATE TABLE `pago` (
  `idPago` int(11) NOT NULL,
  `venta_idVenta` int(11) NOT NULL,
  `metodo` enum('EFECTIVO','TARJETA','NEQUI','DAVIPLATA') NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `referencia` varchar(120) DEFAULT NULL,
  `pagado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pedido`
--

CREATE TABLE `pedido` (
  `idPedido` int(11) NOT NULL,
  `mesa_idMesa` int(11) NOT NULL,
  `mesero_idUsuario` int(11) NOT NULL,
  `reserva_idReserva` int(11) DEFAULT NULL,
  `estado` enum('PENDIENTE','EN_PREPARACION','LISTO','ENTREGADO','CERRADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `notas` varchar(500) DEFAULT NULL,
  `motivo_cancelacion` varchar(500) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cerrado_en` datetime DEFAULT NULL,
  `cancelado_en` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pedido_detalle`
--

CREATE TABLE `pedido_detalle` (
  `idPedidoDetalle` int(11) NOT NULL,
  `pedido_idPedido` int(11) NOT NULL,
  `producto_idProducto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL COMMENT 'Snapshot del precio al pedir',
  `nota` varchar(255) DEFAULT NULL COMMENT 'Sin cebolla, término, etc.',
  `estado_item` enum('PENDIENTE','EN_PREPARACION','LISTO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `producto`
--

CREATE TABLE `producto` (
  `idProducto` int(11) NOT NULL,
  `nombreProducto` varchar(160) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `tipo` enum('PLATO','BEBIDA','COMBO') NOT NULL DEFAULT 'PLATO',
  `categoria_idCategoria` int(11) NOT NULL,
  `receta_idReceta` int(11) DEFAULT NULL COMMENT 'NULL si no descuenta inventario por receta',
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receta`
--

CREATE TABLE `receta` (
  `idReceta` int(11) NOT NULL,
  `nombre` varchar(160) DEFAULT NULL,
  `rendimiento` int(11) DEFAULT NULL COMMENT 'Porciones u otra unidad de negocio'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recetadetalle`
--

CREATE TABLE `recetadetalle` (
  `idDetalle` int(11) NOT NULL,
  `cantidad` decimal(12,4) NOT NULL,
  `receta_idReceta` int(11) NOT NULL,
  `ingrediente_idIngrediente` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reserva`
--

CREATE TABLE `reserva` (
  `idReserva` int(11) NOT NULL,
  `cliente_idUsuario` int(11) NOT NULL,
  `mesa_idMesa` int(11) DEFAULT NULL COMMENT 'Asignación opcional al confirmar',
  `fecha_hora` datetime NOT NULL,
  `num_personas` int(11) NOT NULL DEFAULT 2,
  `estado` enum('SOLICITADA','CONFIRMADA','CANCELADA','COMPLETADA','NO_ASISTIO') NOT NULL DEFAULT 'SOLICITADA',
  `notas` varchar(500) DEFAULT NULL,
  `motivo_cancelacion` varchar(500) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `restaurante_config`
--

CREATE TABLE `restaurante_config` (
  `idConfig` int(11) NOT NULL,
  `nombre_comercial` varchar(160) NOT NULL,
  `nit_o_documento` varchar(40) DEFAULT NULL,
  `telefono` varchar(40) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `logo_url` varchar(512) DEFAULT NULL,
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `usuario`
--

CREATE TABLE `usuario` (
  `idUsuario` int(11) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `apellido` varchar(120) NOT NULL,
  `cedula` varchar(32) NOT NULL,
  `telefono` varchar(40) NOT NULL,
  `correo` varchar(190) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Hash (bcrypt/argon2) desde la aplicación',
  `cargos_idCargo` int(11) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `venta`
--

CREATE TABLE `venta` (
  `idVenta` int(11) NOT NULL,
  `pedido_idPedido` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `impuesto_o_servicio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `registrada_en` datetime NOT NULL DEFAULT current_timestamp(),
  `cajero_idUsuario` int(11) DEFAULT NULL COMMENT 'Administrador o usuario autorizado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cargos`
--
ALTER TABLE `cargos`
  ADD PRIMARY KEY (`idCargo`),
  ADD UNIQUE KEY `uq_cargos_nombre` (`nombre`);

--
-- Indexes for table `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`idCategoria`),
  ADD UNIQUE KEY `uq_categoria_nombre` (`nombre`);

--
-- Indexes for table `gasto`
--
ALTER TABLE `gasto`
  ADD PRIMARY KEY (`idGasto`),
  ADD KEY `idx_gasto_fecha` (`fecha`),
  ADD KEY `fk_gasto_usuario` (`registrado_por_idUsuario`);

--
-- Indexes for table `ingrediente`
--
ALTER TABLE `ingrediente`
  ADD PRIMARY KEY (`idIngrediente`),
  ADD UNIQUE KEY `uq_ingrediente_nombre` (`nombreIngrediente`);

--
-- Indexes for table `inventarioingrediente`
--
ALTER TABLE `inventarioingrediente`
  ADD PRIMARY KEY (`ingrediente_idIngrediente`);

--
-- Indexes for table `mesa`
--
ALTER TABLE `mesa`
  ADD PRIMARY KEY (`idMesa`),
  ADD UNIQUE KEY `uq_mesa_numero` (`numero`);

--
-- Indexes for table `movimientoingrediente`
--
ALTER TABLE `movimientoingrediente`
  ADD PRIMARY KEY (`idMovimiento`),
  ADD KEY `fk_mov_ingrediente` (`ingrediente_idIngrediente`),
  ADD KEY `idx_mov_fecha` (`fecha`),
  ADD KEY `fk_mov_usuario` (`usuario_idUsuario`);

--
-- Indexes for table `pago`
--
ALTER TABLE `pago`
  ADD PRIMARY KEY (`idPago`),
  ADD KEY `fk_pago_venta` (`venta_idVenta`),
  ADD KEY `idx_pago_fecha` (`pagado_en`),
  ADD KEY `idx_pago_metodo` (`metodo`);

--
-- Indexes for table `pedido`
--
ALTER TABLE `pedido`
  ADD PRIMARY KEY (`idPedido`),
  ADD KEY `fk_pedido_mesa` (`mesa_idMesa`),
  ADD KEY `fk_pedido_mesero` (`mesero_idUsuario`),
  ADD KEY `fk_pedido_reserva` (`reserva_idReserva`),
  ADD KEY `idx_pedido_estado` (`estado`),
  ADD KEY `idx_pedido_creado` (`creado_en`);

--
-- Indexes for table `pedido_detalle`
--
ALTER TABLE `pedido_detalle`
  ADD PRIMARY KEY (`idPedidoDetalle`),
  ADD KEY `fk_pd_pedido` (`pedido_idPedido`),
  ADD KEY `fk_pd_producto` (`producto_idProducto`),
  ADD KEY `idx_pd_estado` (`estado_item`);

--
-- Indexes for table `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`idProducto`),
  ADD KEY `fk_producto_categoria` (`categoria_idCategoria`),
  ADD KEY `fk_producto_receta` (`receta_idReceta`);

--
-- Indexes for table `receta`
--
ALTER TABLE `receta`
  ADD PRIMARY KEY (`idReceta`);

--
-- Indexes for table `recetadetalle`
--
ALTER TABLE `recetadetalle`
  ADD PRIMARY KEY (`idDetalle`),
  ADD UNIQUE KEY `uq_receta_ingrediente` (`receta_idReceta`,`ingrediente_idIngrediente`),
  ADD KEY `fk_rd_ingrediente` (`ingrediente_idIngrediente`);

--
-- Indexes for table `reserva`
--
ALTER TABLE `reserva`
  ADD PRIMARY KEY (`idReserva`),
  ADD KEY `fk_reserva_cliente` (`cliente_idUsuario`),
  ADD KEY `fk_reserva_mesa` (`mesa_idMesa`),
  ADD KEY `idx_reserva_fecha` (`fecha_hora`);

--
-- Indexes for table `restaurante_config`
--
ALTER TABLE `restaurante_config`
  ADD PRIMARY KEY (`idConfig`);

--
-- Indexes for table `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`idUsuario`),
  ADD UNIQUE KEY `uq_usuario_correo` (`correo`),
  ADD UNIQUE KEY `uq_usuario_cedula` (`cedula`),
  ADD KEY `fk_usuario_cargos` (`cargos_idCargo`);

--
-- Indexes for table `venta`
--
ALTER TABLE `venta`
  ADD PRIMARY KEY (`idVenta`),
  ADD UNIQUE KEY `uq_venta_pedido` (`pedido_idPedido`),
  ADD KEY `idx_venta_fecha` (`registrada_en`),
  ADD KEY `fk_venta_cajero` (`cajero_idUsuario`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cargos`
--
ALTER TABLE `cargos`
  MODIFY `idCargo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categoria`
--
ALTER TABLE `categoria`
  MODIFY `idCategoria` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gasto`
--
ALTER TABLE `gasto`
  MODIFY `idGasto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ingrediente`
--
ALTER TABLE `ingrediente`
  MODIFY `idIngrediente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mesa`
--
ALTER TABLE `mesa`
  MODIFY `idMesa` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `movimientoingrediente`
--
ALTER TABLE `movimientoingrediente`
  MODIFY `idMovimiento` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pago`
--
ALTER TABLE `pago`
  MODIFY `idPago` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pedido`
--
ALTER TABLE `pedido`
  MODIFY `idPedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pedido_detalle`
--
ALTER TABLE `pedido_detalle`
  MODIFY `idPedidoDetalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `producto`
--
ALTER TABLE `producto`
  MODIFY `idProducto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `receta`
--
ALTER TABLE `receta`
  MODIFY `idReceta` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recetadetalle`
--
ALTER TABLE `recetadetalle`
  MODIFY `idDetalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reserva`
--
ALTER TABLE `reserva`
  MODIFY `idReserva` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `usuario`
--
ALTER TABLE `usuario`
  MODIFY `idUsuario` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `venta`
--
ALTER TABLE `venta`
  MODIFY `idVenta` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `gasto`
--
ALTER TABLE `gasto`
  ADD CONSTRAINT `fk_gasto_usuario` FOREIGN KEY (`registrado_por_idUsuario`) REFERENCES `usuario` (`idUsuario`);

--
-- Constraints for table `inventarioingrediente`
--
ALTER TABLE `inventarioingrediente`
  ADD CONSTRAINT `fk_inv_ingrediente` FOREIGN KEY (`ingrediente_idIngrediente`) REFERENCES `ingrediente` (`idIngrediente`);

--
-- Constraints for table `movimientoingrediente`
--
ALTER TABLE `movimientoingrediente`
  ADD CONSTRAINT `fk_mov_ingrediente` FOREIGN KEY (`ingrediente_idIngrediente`) REFERENCES `ingrediente` (`idIngrediente`),
  ADD CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`usuario_idUsuario`) REFERENCES `usuario` (`idUsuario`);

--
-- Constraints for table `pago`
--
ALTER TABLE `pago`
  ADD CONSTRAINT `fk_pago_venta` FOREIGN KEY (`venta_idVenta`) REFERENCES `venta` (`idVenta`) ON DELETE CASCADE;

--
-- Constraints for table `pedido`
--
ALTER TABLE `pedido`
  ADD CONSTRAINT `fk_pedido_mesa` FOREIGN KEY (`mesa_idMesa`) REFERENCES `mesa` (`idMesa`),
  ADD CONSTRAINT `fk_pedido_mesero` FOREIGN KEY (`mesero_idUsuario`) REFERENCES `usuario` (`idUsuario`),
  ADD CONSTRAINT `fk_pedido_reserva` FOREIGN KEY (`reserva_idReserva`) REFERENCES `reserva` (`idReserva`);

--
-- Constraints for table `pedido_detalle`
--
ALTER TABLE `pedido_detalle`
  ADD CONSTRAINT `fk_pd_pedido` FOREIGN KEY (`pedido_idPedido`) REFERENCES `pedido` (`idPedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pd_producto` FOREIGN KEY (`producto_idProducto`) REFERENCES `producto` (`idProducto`);

--
-- Constraints for table `producto`
--
ALTER TABLE `producto`
  ADD CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`categoria_idCategoria`) REFERENCES `categoria` (`idCategoria`),
  ADD CONSTRAINT `fk_producto_receta` FOREIGN KEY (`receta_idReceta`) REFERENCES `receta` (`idReceta`);

--
-- Constraints for table `recetadetalle`
--
ALTER TABLE `recetadetalle`
  ADD CONSTRAINT `fk_rd_ingrediente` FOREIGN KEY (`ingrediente_idIngrediente`) REFERENCES `ingrediente` (`idIngrediente`),
  ADD CONSTRAINT `fk_rd_receta` FOREIGN KEY (`receta_idReceta`) REFERENCES `receta` (`idReceta`);

--
-- Constraints for table `reserva`
--
ALTER TABLE `reserva`
  ADD CONSTRAINT `fk_reserva_cliente` FOREIGN KEY (`cliente_idUsuario`) REFERENCES `usuario` (`idUsuario`),
  ADD CONSTRAINT `fk_reserva_mesa` FOREIGN KEY (`mesa_idMesa`) REFERENCES `mesa` (`idMesa`);

--
-- Constraints for table `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_cargos` FOREIGN KEY (`cargos_idCargo`) REFERENCES `cargos` (`idCargo`);

--
-- Constraints for table `venta`
--
ALTER TABLE `venta`
  ADD CONSTRAINT `fk_venta_cajero` FOREIGN KEY (`cajero_idUsuario`) REFERENCES `usuario` (`idUsuario`),
  ADD CONSTRAINT `fk_venta_pedido` FOREIGN KEY (`pedido_idPedido`) REFERENCES `pedido` (`idPedido`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
