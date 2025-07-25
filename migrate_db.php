<?php
require_once 'config.php';

try {
    $pdo = getDBConnection();
    
    // 检查tags字段是否已存在
    $stmt = $pdo->prepare("SHOW COLUMNS FROM products LIKE 'tags'");
    $stmt->execute();
    $columnExists = $stmt->fetch();
    
    if (!$columnExists) {
        // 添加tags字段
        $sql = "ALTER TABLE products ADD COLUMN tags VARCHAR(255)";
        $pdo->exec($sql);
        echo "成功向products表添加tags字段<br>";
    } else {
        echo "tags字段已存在<br>";
    }
    
    echo "<h2>数据库迁移完成!</h2>";
    echo "<p><a href='index.html'>返回网站首页</a></p>";
    
} catch(PDOException $e) {
    echo "错误: " . $e->getMessage();
}
?>