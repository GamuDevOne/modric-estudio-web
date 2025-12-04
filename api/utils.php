<?php
// utils.php - helpers genéricos

function json($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function allow_cors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function query_param(string $name, $default = null) {
    return $_GET[$name] ?? $default;
}

/**
 * match('/usuarios/{id}', '/usuarios/5', $params)
 * => $params['id'] = 5
 */
function match(string $pattern, string $uri, array &$params): bool {
    $params = [];

    $regex = preg_replace(
        '/\{([a-zA-Z0-9_]+)\}/',
        '(?P<$1>[a-zA-Z0-9_-]+)',
        $pattern
    );

    if (!preg_match('#^' . $regex . '$#', $uri, $m)) {
        return false;
    }

    foreach ($m as $key => $value) {
        if (!is_int($key)) {
            $params[$key] = $value;
        }
    }
    return true;
}