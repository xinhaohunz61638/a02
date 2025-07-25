<?php
require_once 'config.php';

echo "<h2>用户表数据检查</h2>";

echo "<h3>Users表数据:</h3>";
try {
    $pdo = getDBConnection();
    
    // 查询所有用户
    $stmt = $pdo->query("SELECT id, username, email FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "<p>用户表为空</p>";
    } else {
        echo "<table border='1'>";
        echo "<tr><th>ID</th><th>用户名</th><th>邮箱</th></tr>";
        
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>" . $user['id'] . "</td>";
            echo "<td>" . $user['username'] . "</td>";
            echo "<td>" . $user['email'] . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    }
    
} catch (Exception $e) {
    echo "错误: " . $e->getMessage();
}

echo "<br><a href='index.html'>返回首页</a>";
?>