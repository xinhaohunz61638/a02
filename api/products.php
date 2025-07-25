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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
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

// 获取请求方法
$method = $_SERVER['REQUEST_METHOD'];

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

try {
    $pdo = getDBConnection();
    
    switch ($method) {
        case 'GET':
            // 获取所有商品或搜索商品
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            
            if (!empty($search)) {
                // 执行搜索查询，包括标签搜索
                $stmt = $pdo->prepare("SELECT * FROM products WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?");
                $searchTerm = "%{$search}%";
                $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
            } else {
                // 获取所有商品
                $stmt = $pdo->query("SELECT * FROM products");
            }
            
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 处理标签字段，将其从逗号分隔的字符串转换为数组
            foreach ($products as &$product) {
                if (isset($product['tags']) && !empty($product['tags'])) {
                    $product['tags'] = explode(',', $product['tags']);
                } else {
                    $product['tags'] = [];
                }
                // 添加销量字段，通过查询订单项表计算
                $stmt_sales = $pdo->prepare("SELECT SUM(quantity) as sales FROM order_items WHERE product_id = ?");
                $stmt_sales->execute([$product['id']]);
                $sales_result = $stmt_sales->fetch(PDO::FETCH_ASSOC);
                $product['sales'] = $sales_result['sales'] ?? 0;
            }
            
            // 如果是获取推荐商品的请求，则按销量排序
            if (isset($_GET['recommended']) && $_GET['recommended'] === 'true') {
                usort($products, function($a, $b) {
                    return $b['sales'] <=> $a['sales'];
                });
            }
            
            echo json_encode([
                'success' => true,
                'data' => $products
            ]);
            break;
            
        case 'POST':
            // 添加新商品
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name']) || !isset($input['price'])) {
                handleApiError('商品名称和价格是必需的', 400);
            }
            
            $name = $input['name'];
            $description = isset($input['description']) ? $input['description'] : '';
            $price = $input['price'];
            $image = isset($input['image']) ? $input['image'] : '';
            $tags = isset($input['tags']) ? implode(',', $input['tags']) : '';
            
            $stmt = $pdo->prepare("INSERT INTO products (name, description, price, image, tags) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$name, $description, $price, $image, $tags]);
            
            $productId = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => '商品添加成功',
                'data' => [
                    'id' => $productId,
                    'name' => $name,
                    'description' => $description,
                    'price' => $price,
                    'image' => $image,
                    'tags' => isset($input['tags']) ? $input['tags'] : []
                ]
            ]);
            break;
            
        case 'PUT':
            // 更新商品
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id']) || !isset($input['name']) || !isset($input['price'])) {
                handleApiError('商品ID、名称和价格是必需的', 400);
            }
            
            $id = $input['id'];
            $name = $input['name'];
            $description = isset($input['description']) ? $input['description'] : '';
            $price = $input['price'];
            $image = isset($input['image']) ? $input['image'] : '';
            $tags = isset($input['tags']) ? implode(',', $input['tags']) : '';
            
            $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, image = ?, tags = ? WHERE id = ?");
            $result = $stmt->execute([$name, $description, $price, $image, $tags, $id]);
            
            if ($result) {
                echo json_encode([
                'success' => true,
                'message' => '商品更新成功',
                'data' => [
                    'id' => $id,
                    'name' => $name,
                    'description' => $description,
                    'price' => $price,
                    'image' => $image,
                    'tags' => isset($input['tags']) ? $input['tags'] : []
                ]
            ]);
            } else {
                handleApiError('商品更新失败', 500);
            }
            break;
            
        case 'DELETE':
            // 删除商品
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                handleApiError('商品ID是必需的', 400);
            }
            
            $id = $input['id'];
            
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => '商品删除成功'
                ]);
            } else {
                handleApiError('商品删除失败', 500);
            }
            break;
            
        default:
            handleApiError('不支持的请求方法', 405);
    }
    
} catch(PDOException $e) {
    handleApiError('数据库操作失败: ' . $e->getMessage(), 500);
}

// 清理输出缓冲区并结束
ob_end_flush();
?>