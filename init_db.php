<?php
require_once 'config.php';

try {
    $pdo = getDBConnection();
    
    // 创建商品表
    $sql = "CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255),
        tags VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    echo "商品表创建成功<br>";
    
    // 创建用户表
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        registration_key VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    echo "用户表创建成功<br>";
    
    // 创建订单表
    $sql = "CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'paid', 'shipped', 'delivered') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )";
    
    $pdo->exec($sql);
    echo "订单表创建成功<br>";
    
    // 创建订单项表
    $sql = "CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )";
    
    $pdo->exec($sql);
    echo "订单项表创建成功<br>";
    
    // 插入示例商品数据
    $sql = "INSERT IGNORE INTO products (id, name, description, price, image) VALUES 
        (1, '商品名称1', '这是商品1的详细描述信息。高质量材料，耐用性强。', 199.99, 'images/product1.jpg'),
        (2, '商品名称2', '这是商品2的详细描述信息。设计时尚，功能齐全。', 299.99, 'images/product2.jpg'),
        (3, '商品名称3', '这是商品3的详细描述信息。性能卓越，用户体验佳。', 399.99, 'images/product3.jpg'),
        (4, '商品名称4', '这是商品4的详细描述信息。创新设计，满足多种需求。', 499.99, 'images/product4.jpg'),
        (5, '商品名称5', '这是商品5的详细描述信息。经典款式，永不过时。', 599.99, 'images/product5.jpg'),
        (6, '商品名称6', '这是商品6的详细描述信息。高端材质，精致工艺。', 699.99, 'images/product6.jpg')";
    
    $pdo->exec($sql);
    echo "示例商品数据插入成功<br>";
    
    echo "<h2>数据库初始化完成!</h2>";
    echo "<p><a href='index.html'>返回网站首页</a></p>";
    
} catch(PDOException $e) {
    echo "错误: " . $e->getMessage();
}
?>