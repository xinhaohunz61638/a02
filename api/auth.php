<?php
// 设置响应头
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 获取请求方法
$method = $_SERVER['REQUEST_METHOD'];

// 获取请求数据
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'POST':
        // 处理登录请求
        if (isset($input['username']) && isset($input['password'])) {
            $username = $input['username'];
            $password = $input['password'];
            
            // 连接数据库
            require_once '../config.php';
            
            try {
                $pdo = getDBConnection();
                
                // 查询用户
                $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
                $stmt->execute([$username]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // 验证密码
                if ($user && password_verify($password, $user['password'])) {
                    // 生成token（实际应用中应该使用更安全的方式生成token）
                    $token = bin2hex(random_bytes(16));
                    
                    // 返回成功响应
                    echo json_encode([
                        'success' => true,
                        'message' => '登录成功',
                        'token' => $token,
                        'user_id' => $user['id'],
                        'username' => $user['username']
                    ]);
                } else {
                    // 返回失败响应
                    http_response_code(401);
                    echo json_encode([
                        'success' => false,
                        'message' => '用户名或密码错误'
                    ]);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => '登录过程中发生错误: ' . $e->getMessage()
                ]);
            }
        } else {
            // 返回失败响应
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => '缺少用户名或密码'
            ]);
        }
        break;
        
    default:
        // 不支持的请求方法
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => '不支持的请求方法'
        ]);
        break;
}
?>