<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

allow_cors();

$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Detectar base path /api
$base  = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$route = '/' . ltrim(substr($path, strlen($base)), '/');

/* ============================================================
   SALUD
============================================================ */
if ($method === 'GET' && $route === '/api/health') {
    json([
        'ok' => true,
        'service' => 'ModricEstudio API',
        'time' => date('c')
    ]);
}

/* ============================================================
   USUARIOS
============================================================ */
if ($method === 'GET' && $route === '/api/usuarios') {
    $sql = "SELECT ID_Usuario, NombreCompleto, Correo, TipoUsuario, 
                   GrupoGrado, CorreoCorporativo, Foto
            FROM Usuario ORDER BY ID_Usuario DESC";

    $res = $mysqli->query($sql);
    json($res ? $res->fetch_all(MYSQLI_ASSOC) : []);
}

/* ============================================================
   PEDIDOS
============================================================ */
// GET /api/pedidos
if ($method === 'GET' && $route === '/api/pedidos') {
    $sql = "SELECT p.ID_Pedido, p.Fecha, p.Estado, p.Total,
                   c.ID_Usuario AS ID_Cliente, c.NombreCompleto AS Cliente,
                   v.ID_Usuario AS ID_Vendedor, v.NombreCompleto AS Vendedor,
                   p.ID_Servicio, p.ID_Paquete
            FROM Pedido p
            JOIN Usuario c ON c.ID_Usuario = p.ID_Usuario
            JOIN Usuario v ON v.ID_Usuario = p.ID_Vendedor
            ORDER BY p.ID_Pedido DESC";

    $res = $mysqli->query($sql);
    json($res ? $res->fetch_all(MYSQLI_ASSOC) : []);
}

// GET /api/pedidos/{id}
if ($method === 'GET' && match('/api/pedidos/{id}', $route, $params)) {
    $id = (int)$params['id'];

    $sql = "SELECT p.*,
                   c.NombreCompleto AS Cliente,
                   v.NombreCompleto AS Vendedor
            FROM Pedido p
            JOIN Usuario c ON c.ID_Usuario = p.ID_Usuario
            JOIN Usuario v ON v.ID_Usuario = p.ID_Vendedor
            WHERE p.ID_Pedido = ?";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();

    $res = $stmt->get_result()->fetch_assoc();
    json($res ?: ['error' => 'Pedido no encontrado'], $res ? 200 : 404);
}

// POST /api/pedidos
if ($method === 'POST' && $route === '/api/pedidos') {
    $b = read_json_body();

    $ID_Usuario  = (int)($b['ID_Usuario'] ?? 0);
    $ID_Vendedor = (int)($b['ID_Vendedor'] ?? 0);

    $ID_Servicio = isset($b['ID_Servicio']) ? (int)$b['ID_Servicio'] : null;
    $ID_Paquete  = isset($b['ID_Paquete'])  ? (int)$b['ID_Paquete']  : null;

    if (!$ID_Usuario || !$ID_Vendedor) {
        json(['error' => 'ID_Usuario e ID_Vendedor son obligatorios'], 400);
    }

    if ($ID_Servicio === null && $ID_Paquete === null) {
        $stmt = $mysqli->prepare("
            INSERT INTO Pedido (ID_Usuario, ID_Vendedor, Total)
            VALUES (?,?,0)
        ");
        $stmt->bind_param('ii', $ID_Usuario, $ID_Vendedor);

    } elseif ($ID_Servicio !== null && $ID_Paquete === null) {
        $stmt = $mysqli->prepare("
            INSERT INTO Pedido (ID_Usuario, ID_Vendedor, ID_Servicio, Total)
            VALUES (?,?,?,0)
        ");
        $stmt->bind_param('iii', $ID_Usuario, $ID_Vendedor, $ID_Servicio);

    } elseif ($ID_Servicio === null && $ID_Paquete !== null) {
        $stmt = $mysqli->prepare("
            INSERT INTO Pedido (ID_Usuario, ID_Vendedor, ID_Paquete, Total)
            VALUES (?,?,?,0)
        ");
        $stmt->bind_param('iii', $ID_Usuario, $ID_Vendedor, $ID_Paquete);

    } else {
        $stmt = $mysqli->prepare("
            INSERT INTO Pedido (ID_Usuario, ID_Vendedor, ID_Servicio, ID_Paquete, Total)
            VALUES (?,?,?,?,0)
        ");
        $stmt->bind_param('iiii', $ID_Usuario, $ID_Vendedor, $ID_Servicio, $ID_Paquete);
    }

    if (!$stmt->execute()) {
        json([
            'error' => 'No se pudo crear el pedido',
            'detail' => $stmt->error
        ], 500);
    }

    json([
        'message' => 'Pedido creado correctamente',
        'ID_Pedido' => $mysqli->insert_id
    ], 201);
}

/* ============================================================
   DETALLE PEDIDO
============================================================ */
if ($method === 'GET' && match('/api/detallepedido/{id}', $route, $params)) {
    $id = (int)$params['id'];

    $sql = "SELECT d.ID_Detalle, d.ID_Pedido, d.ID_Producto, d.Cantidad, d.PrecioUnitario,
                   pr.Nombre AS Producto, pr.Precio AS PrecioLista
            FROM DetallePedido d
            JOIN Producto pr ON pr.ID_Producto = d.ID_Producto
            WHERE d.ID_Pedido = ?";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();

    json($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
}

if ($method === 'POST' && $route === '/api/detallepedido') {
    $b = read_json_body();

    $ID_Pedido   = (int)($b['ID_Pedido'] ?? 0);
    $ID_Producto = (int)($b['ID_Producto'] ?? 0);
    $Cantidad    = (int)($b['Cantidad'] ?? 0);

    if (!$ID_Pedido || !$ID_Producto || $Cantidad <= 0) {
        json(['error'=>'ID_Pedido, ID_Producto y Cantidad>0 son obligatorios'],400);
    }

    $stmt0 = $mysqli->prepare("SELECT Precio FROM Producto WHERE ID_Producto=?");
    $stmt0->bind_param('i', $ID_Producto);
    $stmt0->execute();
    $precioRes = $stmt0->get_result()->fetch_assoc();
    if (!$precioRes) {
        json(['error'=>'Producto no existe'],404);
    }
    $PrecioUnitario = (float)$precioRes['Precio'];

    $stmt = $mysqli->prepare("
        INSERT INTO DetallePedido (ID_Pedido, ID_Producto, Cantidad, PrecioUnitario)
        VALUES (?,?,?,?)
    ");
    $stmt->bind_param('iiid', $ID_Pedido,$ID_Producto,$Cantidad,$PrecioUnitario);
    $stmt->execute();

    // Recalcular total del pedido (servicio + paquete + detalle)
    $sqlTotal = "
      UPDATE Pedido p
      LEFT JOIN (
        SELECT ID_Pedido, SUM(Cantidad*PrecioUnitario) AS SumaDetalle
        FROM DetallePedido WHERE ID_Pedido=? GROUP BY ID_Pedido
      ) d ON d.ID_Pedido=p.ID_Pedido
      LEFT JOIN Servicio s ON s.ID_Servicio = p.ID_Servicio
      LEFT JOIN Paquete k  ON k.ID_Paquete  = p.ID_Paquete
      SET p.Total = IFNULL(d.SumaDetalle,0) + IFNULL(s.Precio,0) + IFNULL(k.Precio,0)
      WHERE p.ID_Pedido=?
    ";
    $stmt2 = $mysqli->prepare($sqlTotal);
    $stmt2->bind_param('ii', $ID_Pedido, $ID_Pedido);
    $stmt2->execute();

    json(['message'=>'Detalle agregado y total actualizado']);
}

/* ============================================================
   PAGOS
============================================================ */
if ($method === 'GET' && $route === '/api/pagos') {
    if (isset($_GET['pedido'])) {
        $id = (int)$_GET['pedido'];
        $stmt = $mysqli->prepare("SELECT * FROM Pago WHERE ID_Pedido=?");
        $stmt->bind_param('i',$id);
        $stmt->execute();
        json($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    }
    $res = $mysqli->query("SELECT * FROM Pago ORDER BY Fecha DESC");
    json($res->fetch_all(MYSQLI_ASSOC));
}

if ($method === 'POST' && $route === '/api/pagos') {
    $b = read_json_body();

    $pedido = (int)($b['ID_Pedido'] ?? 0);
    $monto  = (float)($b['Monto'] ?? 0);
    $metodo = $b['Metodo'] ?? 'Efectivo';
    $estado = $b['Estado'] ?? 'No confirmado';

    if (!$pedido || $monto <= 0) {
        json(['error'=>'ID_Pedido y Monto>0 son obligatorios'],400);
    }

    $stmt = $mysqli->prepare("
        INSERT INTO Pago (ID_Pedido, Monto, Metodo, Estado)
        VALUES (?,?,?,?)
    ");
    $stmt->bind_param('idss', $pedido,$monto,$metodo,$estado);
    $stmt->execute();

    json(['message'=>'Pago registrado','ID_Pago'=>$mysqli->insert_id],201);
}

/* ============================================================
   FACTURAS
============================================================ */
if ($method === 'GET' && $route === '/api/facturas') {
    if (isset($_GET['pedido'])) {
        $id = (int)$_GET['pedido'];
        $stmt = $mysqli->prepare("SELECT * FROM Factura WHERE ID_Pedido=?");
        $stmt->bind_param('i',$id);
        $stmt->execute();
        json($stmt->get_result()->fetch_assoc() ?: []);
    }
    $res = $mysqli->query("SELECT * FROM Factura ORDER BY Fecha DESC");
    json($res->fetch_all(MYSQLI_ASSOC));
}

if ($method === 'POST' && $route === '/api/facturas') {
    $b = read_json_body();

    $pedido = (int)($b['ID_Pedido'] ?? 0);
    $num    = trim($b['NumeroOrden'] ?? '');
    $medio  = $b['MedioEnvio'] ?? 'Email';

    if (!$pedido || $num === '') {
        json(['error'=>'ID_Pedido y NumeroOrden son obligatorios'],400);
    }

    $stmt = $mysqli->prepare("
        INSERT INTO Factura (NumeroOrden,ID_Pedido,MedioEnvio)
        VALUES (?,?,?)
    ");
    $stmt->bind_param('sis',$num,$pedido,$medio);
    $stmt->execute();

    json(['message'=>'Factura creada','ID_Factura'=>$mysqli->insert_id],201);
}

/* ============================================================
   CATEGORÍAS
============================================================ */
if ($method === 'GET' && $route === '/api/categorias') {
    $sql = "
        SELECT c.*,
        (SELECT COUNT(*) FROM CategoriaPedido cp WHERE cp.ID_Categoria=c.ID_Categoria) 
        AS TotalPedidos
        FROM Categoria c ORDER BY c.ID_Categoria DESC
    ";
    $res = $mysqli->query($sql);
    json($res->fetch_all(MYSQLI_ASSOC));
}

if ($method === 'POST' && $route === '/api/categorias') {
    $b = read_json_body();

    $Nombre = trim($b['NombreCategoria'] ?? '');
    $Descripcion = $b['Descripcion'] ?? null;
    $FechaInicio = $b['FechaInicio'] ?? null;
    $FechaFin    = $b['FechaFin'] ?? null;
    $Estado      = $b['Estado'] ?? 'Activa';

    if ($Nombre === '' || !$FechaInicio || !$FechaFin) {
        json(['error'=>'NombreCategoria, FechaInicio y FechaFin son obligatorios'],400);
    }

    $stmt = $mysqli->prepare("
        INSERT INTO Categoria (NombreCategoria,Descripcion,FechaInicio,FechaFin,Estado)
        VALUES (?,?,?,?,?)
    ");
    $stmt->bind_param('sssss',$Nombre,$Descripcion,$FechaInicio,$FechaFin,$Estado);
    $stmt->execute();

    json(['message'=>'Categoría creada','ID_Categoria'=>$mysqli->insert_id],201);
}

/* ============================================================
   VINCULAR PEDIDOS A CATEGORÍA
============================================================ */
if ($method === 'POST' && match('/api/categorias/{id}/vincular', $route, $params)) {
    $id = (int)$params['id'];
    $b = read_json_body();

    $ID_Pedido  = (int)($b['ID_Pedido'] ?? 0);
    $ID_Cliente = (int)($b['ID_Cliente'] ?? 0);
    $Prioridad  = $b['Prioridad'] ?? 'Media';
    $Fecha      = $b['FechaEvento'] ?? null;
    $Notas      = $b['Notas'] ?? null;

    if (!$ID_Pedido || !$ID_Cliente) {
        json(['error'=>'ID_Pedido e ID_Cliente son obligatorios'],400);
    }

    if (!in_array($Prioridad,['Alta','Media','Baja'])) {
        $Prioridad='Media';
    }

    $stmt = $mysqli->prepare("
        INSERT INTO CategoriaPedido (ID_Categoria,ID_Pedido,ID_Cliente,Prioridad,FechaEvento,Notas)
        VALUES (?,?,?,?,?,?)
    ");
    $stmt->bind_param('iiisss',$id,$ID_Pedido,$ID_Cliente,$Prioridad,$Fecha,$Notas);
    $stmt->execute();

    json(['message'=>'Registro vinculado','ID_CategoriaPedido'=>$mysqli->insert_id],201);
}

/* ============================================================
   AGENDA
============================================================ */
if ($method === 'GET' && $route === '/api/agenda') {
    $from = $_GET['from'] ?? null;
    $to   = $_GET['to'] ?? null;
    $cli  = isset($_GET['cliente']) ? (int)$_GET['cliente'] : 0;

    if (!$from || !$to) {
        json(['error'=>'from y to son obligatorios'],400);
    }

    $sql = "
      SELECT cp.*, c.NombreCategoria, p.Total, u.NombreCompleto AS Cliente
      FROM CategoriaPedido cp
      JOIN Categoria c ON c.ID_Categoria = cp.ID_Categoria
      JOIN Pedido p ON p.ID_Pedido = cp.ID_Pedido
      JOIN Usuario u ON u.ID_Usuario = cp.ID_Cliente
      WHERE cp.FechaEvento BETWEEN ? AND ?
    ";

    if ($cli > 0) {
        $sql .= " AND cp.ID_Cliente=$cli";
    }

    $sql .= "
      ORDER BY cp.FechaEvento ASC,
      FIELD(cp.Prioridad,'Alta','Media','Baja')
    ";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('ss',$from,$to);
    $stmt->execute();

    json($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
}

/* ============================================================
   DASHBOARD
============================================================ */
if ($method === 'GET' && $route === '/api/dashboard/overview') {
    $sql1 = "SELECT COUNT(*) AS TotalPedidos, SUM(Total) AS TotalVentas FROM Pedido";
    $tot = $mysqli->query($sql1)->fetch_assoc();

    $sql2 = "
      SELECT c.NombreCategoria,
             COUNT(cp.ID_Pedido) AS Pedidos,
             SUM(p.Total) AS Ventas
      FROM Categoria c
      LEFT JOIN CategoriaPedido cp ON cp.ID_Categoria=c.ID_Categoria
      LEFT JOIN Pedido p ON p.ID_Pedido=cp.ID_Pedido
      GROUP BY c.ID_Categoria
    ";
    $cat = $mysqli->query($sql2)->fetch_all(MYSQLI_ASSOC);

    $sql3 = "
      SELECT Prioridad, COUNT(*) AS Cantidad
      FROM CategoriaPedido
      GROUP BY Prioridad
    ";
    $pri = $mysqli->query($sql3)->fetch_all(MYSQLI_ASSOC);

    json([
        'totales' => $tot,
        'porCategoria' => $cat,
        'porPrioridad' => $pri
    ]);
}

/* ============================================================
   404 
============================================================ */
json(['error'=>'Ruta no encontrada','route'=>$route],404);
?>