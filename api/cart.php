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
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

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

// 初始化购物车
if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 获取购物车内容
        echo json_encode([
            'success' => true,
            'data' => $_SESSION['cart']
        ]);
        break;
        
    case 'POST':
        // 添加商品到购物车或更新数量
        $input = json_decode(file_get_contents('php://input'), true);
        $productId = $input['product_id'] ?? null;
        $quantity = $input['quantity'] ?? 1;
        
        if ($productId) {
            // 检查商品是否已在购物车中
            $existingItemIndex = null;
            foreach ($_SESSION['cart'] as $index => $item) {
                if ($item['product_id'] == $productId) {
                    $existingItemIndex = $index;
                    break;
                }
            }
            
            if ($existingItemIndex !== null) {
                // 更新现有商品数量
                $newQuantity = $_SESSION['cart'][$existingItemIndex]['quantity'] + $quantity;
                // 确保数量不会小于1
                $_SESSION['cart'][$existingItemIndex]['quantity'] = max(1, $newQuantity);
            } else {
                // 添加新商品到购物车
                $_SESSION['cart'][] = [
                    'product_id' => $productId,
                    'quantity' => max(1, $quantity) // 确保数量至少为1
                ];
            }
            
            // 确保会话数据被保存
            $_SESSION['cart'] = $_SESSION['cart'];
            
            echo json_encode([
                'success' => true,
                'message' => '商品已添加到购物车',
                'data' => $_SESSION['cart']
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => '缺少商品ID'
            ]);
        }
        break;
        
    case 'DELETE':
        // 从购物车中移除商品
        $input = json_decode(file_get_contents('php://input'), true);
        $productId = $input['product_id'] ?? null;
        
        if ($productId) {
            // 过滤掉要删除的商品
            $_SESSION['cart'] = array_filter($_SESSION['cart'], function($item) use ($productId) {
                return $item['product_id'] != $productId;
            });
            
            // 重新索引数组
            $_SESSION['cart'] = array_values($_SESSION['cart']);
            
            echo json_encode([
                'success' => true,
                'message' => '商品已从购物车移除',
                'data' => $_SESSION['cart']
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => '缺少商品ID'
            ]);
        }
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'message' => '不支持的请求方法'
        ]);
}

// 清理输出缓冲区并结束
ob_end_flush();
?>