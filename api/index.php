<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

allow_cors();

/* ============================================================
   CONFIGURACIÓN DE TARIFAS POR TIPO DE SESIÓN Y ESTADO
============================================================ */

$SESSION_TARIFFS = [
    'exterior' => [
        'Prioridad2' => 30.00, // sesión sencilla, económica
        'Confirmado' => 45.00, // estándar
        'Prioridad1' => 65.00, // urgente / prioridad alta
    ],
    'estudio' => [
        'Prioridad2' => 35.00,
        'Confirmado' => 55.00,
        'Prioridad1' => 75.00,
    ],
];

/**
 * Calcula el precio según tipo de sesión y estado/prioridad.
 * Si no encuentra combinación, devuelve 0.0
 */
function calcular_tarifa(string $tipoSesion, string $estado): float {
    global $SESSION_TARIFFS;

    $tipoSesion = strtolower(trim($tipoSesion)); // 'exterior' o 'estudio'

    if (!isset($SESSION_TARIFFS[$tipoSesion])) {
        return 0.0;
    }
    if (!isset($SESSION_TARIFFS[$tipoSesion][$estado])) {
        return 0.0;
    }
    return (float)$SESSION_TARIFFS[$tipoSesion][$estado];
}

/* ============================================================
   RUTEO BÁSICO
============================================================ */

$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalizar ruta base, útil cuando el index está en /api/index.php
$scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME']);
$base       = rtrim(dirname($scriptName), '/');

$route = substr($path, strlen($base));
if ($route === false) {
    $route = '/';
}
$route = '/' . ltrim($route, '/');
$route = preg_replace('#/+#', '/', $route);

/* ============================================================
   ROOT / STATUS
============================================================ */

if ($route === '/' && $method === 'GET') {
    json([
        'app'   => 'ModricEstudio API v3',
        'db'    => 'ModricEstudio00',
        'time'  => date('Y-m-d H:i:s'),
        'ok'    => true
    ]);
}

/* ============================================================
   USUARIOS
============================================================ */

// GET /usuarios
if ($route === '/usuarios' && $method === 'GET') {
    $sql = "SELECT ID_Usuario, NombreCompleto, Correo, TipoUsuario, GrupoGrado, CorreoCorporativo, Foto
            FROM Usuario
            ORDER BY ID_Usuario ASC";
    $res = $mysqli->query($sql);
    if (!$res) {
        json(['error' => 'Error consultando usuarios', 'detail' => $mysqli->error], 500);
    }
    json($res->fetch_all(MYSQLI_ASSOC));
}

// GET /usuarios/{id}
$params = [];
if (match('/usuarios/{id}', $route, $params) && $method === 'GET') {
    $id = (int)$params['id'];

    $sql = "SELECT ID_Usuario, NombreCompleto, Correo, TipoUsuario, GrupoGrado, CorreoCorporativo, Foto
            FROM Usuario
            WHERE ID_Usuario = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_assoc();

    if (!$data) {
        json(['error' => 'Usuario no encontrado'], 404);
    }
    json($data);
}

// POST /usuarios (crear)
if ($route === '/usuarios' && $method === 'POST') {
    $body = read_json_body();

    $nombre = $body['NombreCompleto']    ?? null;
    $correo = $body['Correo']            ?? null;
    $pass   = $body['Contrasena']        ?? null;
    $tipo   = $body['TipoUsuario']       ?? null;
    $grupo  = $body['GrupoGrado']        ?? null;
    $corp   = $body['CorreoCorporativo'] ?? null;
    $foto   = $body['Foto']              ?? null;

    if (!$nombre || !$tipo) {
        json(['error' => 'NombreCompleto y TipoUsuario son obligatorios'], 400);
    }

    $sql = "INSERT INTO Usuario (NombreCompleto, Correo, Contrasena, TipoUsuario, GrupoGrado, CorreoCorporativo, Foto)
            VALUES (?,?,?,?,?,?,?)";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('sssssss', $nombre, $correo, $pass, $tipo, $grupo, $corp, $foto);

    if (!$stmt->execute()) {
        json([
            'error'  => 'No se pudo crear el usuario',
            'detail' => $stmt->error
        ], 500);
    }

    json([
        'message'    => 'Usuario creado',
        'ID_Usuario' => $stmt->insert_id
    ], 201);
}

// POST /usuarios/login
if ($route === '/usuarios/login' && $method === 'POST') {
    $body = read_json_body();

    $correo = $body['Correo']     ?? null;
    $pass   = $body['Contrasena'] ?? null;

    if (!$correo || !$pass) {
        json(['error' => 'Correo y Contrasena son obligatorios'], 400);
    }

    $sql = "SELECT ID_Usuario, NombreCompleto, Correo, TipoUsuario
            FROM Usuario
            WHERE Correo = ? AND Contrasena = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('ss', $correo, $pass);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user) {
        json(['error' => 'Credenciales inválidas'], 401);
    }

    json([
        'message' => 'Login correcto',
        'usuario' => $user
    ]);
}

/* ============================================================
   SERVICIOS
============================================================ */

// GET /servicios
if ($route === '/servicios' && $method === 'GET') {
    $sql = "SELECT ID_Servicio, NombreServicio, Descripcion, Precio, Estado, Tipo
            FROM Servicio
            ORDER BY ID_Servicio ASC";
    $res = $mysqli->query($sql);
    if (!$res) {
        json(['error' => 'Error consultando servicios', 'detail' => $mysqli->error], 500);
    }
    json($res->fetch_all(MYSQLI_ASSOC));
}

/* ============================================================
   PAQUETES
============================================================ */

// GET /paquetes
if ($route === '/paquetes' && $method === 'GET') {
    $sql = "SELECT 
                p.ID_Paquete,
                p.NombrePaquete,
                p.Contenido,
                p.Precio,
                s.ID_Servicio,
                s.NombreServicio,
                s.Tipo AS TipoServicio
            FROM Paquete p
            INNER JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
            ORDER BY p.ID_Paquete ASC";
    $res = $mysqli->query($sql);
    if (!$res) {
        json(['error' => 'Error consultando paquetes', 'detail' => $mysqli->error], 500);
    }
    json($res->fetch_all(MYSQLI_ASSOC));
}

// GET /paquetes/{id}
$params = [];
if (match('/paquetes/{id}', $route, $params) && $method === 'GET') {
    $id = (int)$params['id'];

    $sql = "SELECT 
                p.ID_Paquete,
                p.NombrePaquete,
                p.Contenido,
                p.Precio,
                s.ID_Servicio,
                s.NombreServicio,
                s.Tipo AS TipoServicio
            FROM Paquete p
            INNER JOIN Servicio s ON p.ID_Servicio = s.ID_Servicio
            WHERE p.ID_Paquete = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_assoc();

    if (!$data) {
        json(['error' => 'Paquete no encontrado'], 404);
    }
    json($data);
}

/* ============================================================
   PRODUCTOS (opcional)
============================================================ */

// GET /productos
if ($route === '/productos' && $method === 'GET') {
    $sql = "SELECT 
                pr.ID_Producto,
                pr.Nombre,
                pr.Talla,
                pr.Color,
                pr.Precio,
                s.ID_Servicio,
                s.NombreServicio
            FROM Producto pr
            INNER JOIN Servicio s ON pr.ID_Servicio = s.ID_Servicio
            ORDER BY pr.ID_Producto ASC";
    $res = $mysqli->query($sql);
    if (!$res) {
        json(['error' => 'Error consultando productos', 'detail' => $mysqli->error], 500);
    }
    json($res->fetch_all(MYSQLI_ASSOC));
}

/* ============================================================
   CATEGORÍAS (temporadas / campañas)
============================================================ */

// GET /categorias
if ($route === '/categorias' && $method === 'GET') {
    $sql = "SELECT ID_Categoria, NombreCategoria, Descripcion, FechaInicio, FechaFin, Estado
            FROM Categoria
            ORDER BY FechaInicio ASC";
    $res = $mysqli->query($sql);
    if (!$res) {
        json(['error' => 'Error consultando categorías', 'detail' => $mysqli->error], 500);
    }
    json($res->fetch_all(MYSQLI_ASSOC));
}

/* ============================================================
   PEDIDOS: CREACIÓN + LISTADO + SEGUIMIENTO + CAMBIO DE ESTADO
============================================================ */

/**
 * POST /pedidos
 * Body JSON:
 * {
 *   "ID_Usuario": 3,
 *   "ID_Vendedor": 2,
 *   "ID_Servicio": 1,
 *   "ID_Paquete": 1,
 *   "TipoSesion": "exterior",   // exterior | estudio
 *   "Estado": "Prioridad2",     // Pendiente | Confirmado | Prioridad1 | Prioridad2
 *   "Total": null               // opcional, si viene null se calcula
 * }
 */
if ($route === '/pedidos' && $method === 'POST') {
    $body = read_json_body();

    $idCliente = $body['ID_Usuario']  ?? null;
    $idVend    = $body['ID_Vendedor'] ?? null;
    $idServ    = $body['ID_Servicio'] ?? null;
    $idPaq     = $body['ID_Paquete']  ?? null;
    $tipoSess  = $body['TipoSesion']  ?? null;  // exterior / estudio
    $estado    = $body['Estado']      ?? 'Pendiente';
    $total     = $body['Total']       ?? null;

    if (!$idCliente || !$idVend || !$tipoSess) {
        json(['error' => 'ID_Usuario, ID_Vendedor y TipoSesion son obligatorios'], 400);
    }

    // calcular si no mandan total
    if ($total === null) {
        $total = calcular_tarifa($tipoSess, $estado);
    }

    $fecha = date('Y-m-d H:i:s');

    $sql = "INSERT INTO Pedido (Fecha, Estado, TipoSesion, ID_Usuario, ID_Vendedor, ID_Servicio, ID_Paquete, Total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param(
        'sssiiiid',
        $fecha,
        $estado,
        $tipoSess,
        $idCliente,
        $idVend,
        $idServ,
        $idPaq,
        $total
    );

    if (!$stmt->execute()) {
        json(['error' => 'No se pudo crear el pedido', 'detail' => $stmt->error], 500);
    }

    json([
        'message'   => 'Pedido creado',
        'ID_Pedido' => $stmt->insert_id,
        'Estado'    => $estado,
        'TipoSesion'=> $tipoSess,
        'Total'     => $total
    ], 201);
}

// GET /pedidos (con filtros opcionales ?id_cliente=&estado=)
if ($route === '/pedidos' && $method === 'GET') {
    $idCliente = query_param('id_cliente');
    $estado    = query_param('estado');

    $where  = [];
    $params = [];
    $types  = '';

    if ($idCliente) {
        $where[]  = 'p.ID_Usuario = ?';
        $params[] = (int)$idCliente;
        $types   .= 'i';
    }
    if ($estado) {
        $where[]  = 'p.Estado = ?';
        $params[] = $estado;
        $types   .= 's';
    }

    $sql = "SELECT 
                p.ID_Pedido,
                p.Fecha,
                p.Estado,
                p.TipoSesion,
                p.Total,
                cli.NombreCompleto AS Cliente,
                ven.NombreCompleto AS Vendedor,
                s.NombreServicio,
                paq.NombrePaquete
            FROM Pedido p
            INNER JOIN Usuario cli ON p.ID_Usuario  = cli.ID_Usuario
            INNER JOIN Usuario ven ON p.ID_Vendedor = ven.ID_Usuario
            LEFT JOIN Servicio s   ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN Paquete paq  ON p.ID_Paquete  = paq.ID_Paquete";

    if (!empty($where)) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY p.Fecha DESC';

    $stmt = $mysqli->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    json($rows);
}

// GET /pedidos/{id}
$params = [];
if (match('/pedidos/{id}', $route, $params) && $method === 'GET') {
    $id = (int)$params['id'];

    $sql = "SELECT 
                p.ID_Pedido,
                p.Fecha,
                p.Estado,
                p.TipoSesion,
                p.Total,
                cli.ID_Usuario       AS ID_Cliente,
                cli.NombreCompleto   AS Cliente,
                ven.ID_Usuario       AS ID_Vendedor,
                ven.NombreCompleto   AS Vendedor,
                s.ID_Servicio,
                s.NombreServicio,
                paq.ID_Paquete,
                paq.NombrePaquete
            FROM Pedido p
            INNER JOIN Usuario cli ON p.ID_Usuario  = cli.ID_Usuario
            INNER JOIN Usuario ven ON p.ID_Vendedor = ven.ID_Usuario
            LEFT JOIN Servicio s   ON p.ID_Servicio = s.ID_Servicio
            LEFT JOIN Paquete paq  ON p.ID_Paquete  = paq.ID_Paquete
            WHERE p.ID_Pedido = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_assoc();

    if (!$data) {
        json(['error' => 'Pedido no encontrado'], 404);
    }

    json($data);
}

// PUT /pedidos/{id}/estado
$params = [];
if (match('/pedidos/{id}/estado', $route, $params) && $method === 'PUT') {
    $id   = (int)$params['id'];
    $body = read_json_body();

    $estado = $body['Estado'] ?? null;

    if (!$estado) {
        json(['error' => 'Estado es obligatorio'], 400);
    }

    $sql = "UPDATE Pedido SET Estado = ? WHERE ID_Pedido = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('si', $estado, $id);

    if (!$stmt->execute()) {
        json(['error' => 'No se pudo actualizar el estado', 'detail' => $stmt->error], 500);
    }

    json(['message' => 'Estado actualizado', 'ID_Pedido' => $id, 'Estado' => $estado]);
}

/* ============================================================
   AGENDA / CALENDARIO
============================================================ */

/**
 * POST /agenda/reservar
 * Body JSON:
 * {
 *   "ID_Cliente": 3,
 *   "ID_Vendedor": 2,
 *   "ID_Servicio": 1,
 *   "ID_Paquete": 1,
 *   "ID_Categoria": 2,
 *   "TipoSesion": "estudio",
 *   "Estado": "Confirmado",
 *   "FechaEvento": "2025-04-10 15:00:00",
 *   "Notas": "Sesión de fotos graduación",
 *   "Total": null
 * }
 */
if ($route === '/agenda/reservar' && $method === 'POST') {
    $body = read_json_body();

    $idCliente = $body['ID_Cliente']   ?? null;
    $idVend    = $body['ID_Vendedor']  ?? null;
    $idServ    = $body['ID_Servicio']  ?? null;
    $idPaq     = $body['ID_Paquete']   ?? null;
    $idCat     = $body['ID_Categoria'] ?? null;
    $tipoSess  = $body['TipoSesion']   ?? null;
    $estado    = $body['Estado']       ?? 'Confirmado';
    $fechaEv   = $body['FechaEvento']  ?? null;
    $notas     = $body['Notas']        ?? null;
    $total     = $body['Total']        ?? null;

    if (!$idCliente || !$idVend || !$idServ || !$idPaq || !$idCat || !$tipoSess || !$fechaEv) {
        json(['error' => 'Campos obligatorios faltantes para la reserva'], 400);
    }

    // Si no mandan total, usar la lógica de tarifas
    if ($total === null) {
        $total = calcular_tarifa($tipoSess, $estado);
    }

    // Verificar si ya hay reserva en esa fecha para esa categoría
    $checkSql = "SELECT cp.ID_CategoriaPedido
                 FROM CategoriaPedido cp
                 INNER JOIN Pedido p ON cp.ID_Pedido = p.ID_Pedido
                 WHERE cp.ID_Categoria = ? AND p.Fecha = ?";
    $stmt = $mysqli->prepare($checkSql);
    $stmt->bind_param('is', $idCat, $fechaEv);
    $stmt->execute();
    $exists = $stmt->get_result()->fetch_assoc();

    if ($exists) {
        json(['error' => 'Ya existe una reserva en esa fecha para esta categoría'], 409);
    }

    // Transacción: crear Pedido + CategoriaPedido
    $mysqli->begin_transaction();
    try {
        // Insertar pedido
        $sqlPedido = "INSERT INTO Pedido (Fecha, Estado, TipoSesion, ID_Usuario, ID_Vendedor, ID_Servicio, ID_Paquete, Total)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $mysqli->prepare($sqlPedido);
        $stmt->bind_param(
            'sssiiiid',
            $fechaEv,
            $estado,
            $tipoSess,
            $idCliente,
            $idVend,
            $idServ,
            $idPaq,
            $total
        );
        if (!$stmt->execute()) {
            throw new Exception('Error al crear Pedido: ' . $stmt->error);
        }
        $idPedido = $stmt->insert_id;

        // Insertar relación en CategoriaPedido
        $sqlCat = "INSERT INTO CategoriaPedido (ID_Categoria, ID_Pedido, ID_Cliente, Notas)
                   VALUES (?, ?, ?, ?)";
        $stmt = $mysqli->prepare($sqlCat);
        $stmt->bind_param('iiis', $idCat, $idPedido, $idCliente, $notas);
        if (!$stmt->execute()) {
            throw new Exception('Error al crear CategoriaPedido: ' . $stmt->error);
        }

        $mysqli->commit();

        json([
            'message'   => 'Reserva creada correctamente',
            'ID_Pedido' => $idPedido,
            'Total'     => $total,
            'Estado'    => $estado,
            'TipoSesion'=> $tipoSess
        ], 201);

    } catch (Exception $e) {
        $mysqli->rollback();
        json(['error' => 'No se pudo crear la reserva', 'detail' => $e->getMessage()], 500);
    }
}

/**
 * GET /agenda
 * Parámetros opcionales:
 *   from=YYYY-MM-DD
 *   to=YYYY-MM-DD
 */
if ($route === '/agenda' && $method === 'GET') {
    $from = query_param('from', '2000-01-01');
    $to   = query_param('to',   '2100-12-31');

    $sql = "SELECT
                p.ID_Pedido,
                p.Fecha        AS FechaEvento,
                p.Estado,
                p.TipoSesion,
                p.Total,
                c.ID_Categoria,
                c.NombreCategoria,
                c.FechaInicio,
                c.FechaFin,
                cli.ID_Usuario      AS ID_Cliente,
                cli.NombreCompleto  AS Cliente,
                ven.ID_Usuario      AS ID_Vendedor,
                ven.NombreCompleto  AS Vendedor,
                s.NombreServicio,
                paq.NombrePaquete
            FROM CategoriaPedido cp
            INNER JOIN Categoria c ON cp.ID_Categoria = c.ID_Categoria
            INNER JOIN Pedido   p ON cp.ID_Pedido    = p.ID_Pedido
            INNER JOIN Usuario cli ON cp.ID_Cliente  = cli.ID_Usuario
            INNER JOIN Usuario ven ON p.ID_Vendedor  = ven.ID_Usuario
            LEFT  JOIN Servicio s ON p.ID_Servicio   = s.ID_Servicio
            LEFT  JOIN Paquete paq ON p.ID_Paquete   = paq.ID_Paquete
            WHERE p.Fecha BETWEEN ? AND ?
            ORDER BY p.Fecha ASC";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('ss', $from, $to);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    json($rows);
}

/* ============================================================
   404 POR DEFECTO
============================================================ */
json(['error' => 'Ruta no encontrada', 'route' => $route], 404);
