<?php
require_once 'config.php';

try {
    $pdo = getDBConnection();
    
    // 添加registration_key字段到users表
    $sql = "ALTER TABLE users ADD COLUMN registration_key VARCHAR(255)";
    $pdo->exec($sql);
    
    echo "成功添加registration_key字段到users表";
    
} catch (PDOException $e) {
    echo "错误: " . $e->getMessage();
}
?>