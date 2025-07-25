<?php
// 设置响应头
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 只允许POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => '不支持的请求方法'
    ]);
    exit();
}

// 获取请求数据
$input = json_decode(file_get_contents('php://input'), true);

// 检查必需字段
if (!isset($input['username']) || !isset($input['email']) || !isset($input['password']) || !isset($input['registration_key'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '缺少必需字段：用户名、邮箱、密码或注册密钥'
    ]);
    exit();
}

$username = $input['username'];
$email = $input['email'];
$password = $input['password'];
$registrationKey = $input['registration_key'];

// 检查注册密钥是否正确
require_once '../config_keys.php';

if ($registrationKey !== SECRET_REGISTRATION_KEY) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '无效的注册密钥'
    ]);
    exit();
}

// 连接数据库
require_once '../config.php';

try {
    $pdo = getDBConnection();
    
    // 检查用户名或邮箱是否已存在
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => '用户名或邮箱已存在'
        ]);
        exit();
    }
    
    // 对密码进行哈希处理
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // 插入新用户
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, registration_key) VALUES (?, ?, ?, ?)");
    $stmt->execute([$username, $email, $hashedPassword, $registrationKey]);
    
    // 返回成功响应
    echo json_encode([
        'success' => true,
        'message' => '用户注册成功',
        'user_id' => $pdo->lastInsertId()
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '注册过程中发生错误: ' . $e->getMessage()
    ]);
}
?>