<?php
// 设置错误报告级别，避免在JSON响应中出现警告
error_reporting(E_ALL);
ini_set('display_errors', 0);

// 开始输出缓冲，确保在出现错误时可以清除输出并返回JSON
ob_start();

// 定义API请求常量，用于配置文件中的错误处理
define('API_REQUEST', true);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 错误处理函数，确保返回JSON格式的错误信息
function handleApiError($message, $code = 500) {
    ob_clean(); // 清除所有之前的输出
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    ob_end_flush();
    exit();
}

// 注册错误处理函数
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return;
    }
    handleApiError('服务器内部错误: ' . $message, 500);
});

// 注册异常处理函数
set_exception_handler(function($exception) {
    handleApiError('未处理的异常: ' . $exception->getMessage(), 500);
});

try {
    require_once '../config.php';
} catch (Exception $e) {
    handleApiError('配置文件加载失败: ' . $e->getMessage(), 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // 处理创建订单请求
    $input = json_decode(file_get_contents('php://input'), true);
    $cartItems = $input['cart'] ?? [];
    $userId = $input['user_id'] ?? null;
    
    // 检查用户是否已登录
    if (!$userId) {
        handleApiError('用户未登录，无法创建订单', 401);
    }
    
    // 验证用户ID是否有效
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            handleApiError('无效的用户ID', 401);
        }
    } catch (Exception $e) {
        handleApiError('用户验证失败: ' . $e->getMessage(), 500);
    }
    
    if (empty($cartItems)) {
        echo json_encode([
            'success' => false,
            'message' => '购物车为空'
        ]);
        exit;
    }
    
    try {
        $pdo = getDBConnection();
        
        // 开始事务
        $pdo->beginTransaction();
        
        // 计算订单总金额
        $totalAmount = 0;
        foreach ($cartItems as $item) {
            $stmt = $pdo->prepare("SELECT price FROM products WHERE id = ?");
            $stmt->execute([$item['product_id']]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($product) {
                $totalAmount += $product['price'] * $item['quantity'];
            }
        }
        
        // 创建订单
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_amount) VALUES (?, ?)");
        $stmt->execute([$userId, $totalAmount]);
        $orderId = $pdo->lastInsertId();
        
        // 添加订单项
        foreach ($cartItems as $item) {
            $stmt = $pdo->prepare("SELECT price FROM products WHERE id = ?");
            $stmt->execute([$item['product_id']]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($product) {
                $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
                $stmt->execute([$orderId, $item['product_id'], $item['quantity'], $product['price']]);
            }
        }
        
        // 提交事务
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => '订单创建成功',
            'order_id' => $orderId,
            'total_amount' => $totalAmount
        ]);
        
    } catch (Exception $e) {
        // 回滚事务
        $pdo->rollback();
        
        handleApiError('订单创建失败: ' . $e->getMessage(), 500);
    }
} else if ($method === 'GET') {
    // 处理查询订单请求
    try {
        $pdo = getDBConnection();
        
        // 查询所有订单
        $stmt = $pdo->prepare("SELECT o.id, o.user_id, o.total_amount, o.status, o.created_at, u.username FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC");
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 查询订单项
        foreach ($orders as &$order) {
            $stmt = $pdo->prepare("SELECT oi.quantity, oi.price, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'data' => $orders
        ]);
        
    } catch (Exception $e) {
        handleApiError('订单查询失败: ' . $e->getMessage(), 500);
    }
} else if ($method === 'PUT') {
    // 处理更新订单状态请求
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $orderId = $input['order_id'] ?? null;
        $status = $input['status'] ?? null;
        
        if (!$orderId || !$status) {
            handleApiError('缺少订单ID或状态', 400);
        }
        
        // 验证状态值
        $validStatuses = ['pending', 'paid', 'shipped', 'delivered'];
        if (!in_array($status, $validStatuses)) {
            handleApiError('无效的状态值', 400);
        }
        
        $pdo = getDBConnection();
        
        // 更新订单状态
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $result = $stmt->execute([$status, $orderId]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => '订单状态更新成功'
            ]);
        } else {
            handleApiError('订单状态更新失败', 500);
        }
        
    } catch (Exception $e) {
        handleApiError('订单状态更新失败: ' . $e->getMessage(), 500);
    }
} else if ($method === 'DELETE') {
    // 处理删除订单请求
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $orderId = $input['order_id'] ?? null;
        
        if (!$orderId) {
            handleApiError('缺少订单ID', 400);
        }
        
        $pdo = getDBConnection();
        
        // 开始事务
        $pdo->beginTransaction();
        
        // 删除订单项
        $stmt = $pdo->prepare("DELETE FROM order_items WHERE order_id = ?");
        $stmt->execute([$orderId]);
        
        // 删除订单
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $result = $stmt->execute([$orderId]);
        
        // 提交事务
        $pdo->commit();
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => '订单删除成功'
            ]);
        } else {
            // 回滚事务
            $pdo->rollback();
            handleApiError('订单删除失败', 500);
        }
        
    } catch (Exception $e) {
        // 回滚事务
        $pdo->rollback();
        handleApiError('订单删除失败: ' . $e->getMessage(), 500);
    }
} else {
    handleApiError('不支持的请求方法', 405);
}

// 清理输出缓冲区并结束
ob_end_flush();
?>