<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'ecommerce_db');

// 创建数据库连接
function getDBConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch(PDOException $e) {
        // 在API环境中，我们不直接输出错误，而是抛出异常让API处理
        if (defined('API_REQUEST')) {
            throw new Exception("数据库连接失败: " . $e->getMessage());
        } else {
            die("数据库连接失败: " . $e->getMessage());
        }
    }
}

// 网站基础URL
define('BASE_URL', 'http://localhost/a02/');

// 启动会话
session_start();
?>