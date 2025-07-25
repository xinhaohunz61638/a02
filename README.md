# 简易电商网站项目

这是一个使用PHP、HTML、CSS和JavaScript构建的简易电商网站。

## 项目结构

```
.
├── api/                 # 后端API接口
│   ├── products.php     # 商品相关接口
│   ├── cart.php         # 购物车相关接口
│   └── orders.php       # 订单相关接口
├── css/                 # 样式文件
│   └── style.css        # 主样式文件
├── js/                  # JavaScript文件
│   ├── script.js        # 主页面交互脚本
│   └── cart.js          # 购物车页面脚本
├── images/              # 图片资源目录
├── index.html           # 网站首页
├── products.html        # 商品列表页面
├── cart.html            # 购物车页面
├── contact.html         # 联系我们页面
├── config.php           # 数据库配置文件
└── init_db.php          # 数据库初始化脚本
```

## 功能特点

1. **商品展示**: 在首页和商品页面展示商品信息
2. **购物车功能**: 添加商品到购物车、修改数量、删除商品
3. **订单处理**: 创建订单并提交
4. **响应式设计**: 适配不同屏幕尺寸
5. **商品搜索**: 支持按商品名称、描述和标签搜索商品
6. **推荐商品**: 在首页展示销量最高的商品
7. **用户注册和登录**: 用户可以通过注册功能创建账户，并使用登录功能访问系统
8. **订单安全**: 只有已登录的用户才能创建订单

## 运行环境要求

- PHP 7.0 或更高版本
- MySQL 5.0 或更高版本
- Web服务器 (Apache/Nginx)

## 安装和配置

1. 将所有文件复制到您的Web服务器目录中（例如WAMP的www目录）
2. 确保您的服务器支持PHP 7.0+和MySQL 5.0+
3. 启动WAMP服务器
4. 打开phpMyAdmin（通常在 http://localhost/phpmyadmin）
5. 创建一个名为`ecommerce_db`的MySQL数据库
6. 修改`config.php`文件中的数据库连接信息（如果需要）
7. 通过浏览器访问`http://localhost/a02/init_db.php`来初始化数据库结构和示例数据
8. 初始化成功后，您会看到成功消息
9. 删除或保护`init_db.php`文件以防止重复执行

## 数据库迁移（添加商品标签功能）

如果您是从旧版本升级到支持商品标签功能的新版本，需要执行以下步骤：

1. 通过浏览器访问`http://localhost/a02/migrate_db.php`来执行数据库迁移
2. 如果看到成功消息，说明tags字段已添加到products表中
3. 删除或保护`migrate_db.php`文件以防止重复执行

## API接口说明

### 商品接口

- `GET /api/products.php` - 获取所有商品信息
- `GET /api/products.php?search=关键词` - 搜索商品（支持在商品名称、描述和标签中搜索）
- `GET /api/products.php?recommended=true` - 获取推荐商品（按销量排序）

### 购物车接口

- `GET /api/cart.php` - 获取购物车内容
- `POST /api/cart.php` - 添加商品到购物车
  - 参数: `product_id`, `quantity`
- `DELETE /api/cart.php` - 从购物车移除商品
  - 参数: `product_id`

### 订单接口

- `POST /api/orders.php` - 创建新订单
  - 参数: `cart` (购物车项目数组), `user_id` (用户ID)
  - 注意: 只有已登录的用户才能创建订单

## 测试API

为了帮助验证API是否正常工作，项目包含了一个API测试页面:

1. 在浏览器中打开 `http://localhost/a02/api_test.html`
2. 点击不同的按钮来测试各个API端点
3. 查看响应结果以确认API是否按预期工作

您也可以使用浏览器的开发者工具来查看网络请求和响应的详细信息。

### 测试标签搜索功能

1. 确保数据库中有一些带标签的商品
2. 在浏览器中访问 `http://localhost/a02/api/products.php?search=标签名` 来测试标签搜索
3. 查看返回的JSON数据是否包含匹配的商品

## 注意事项

1. 本项目仅用于演示目的，在生产环境中需要添加安全性措施
2. 建议在实际部署时使用HTTPS协议
3. 需要对用户输入进行验证和过滤以防止SQL注入等安全问题
4. 后台用户名：admin
   密码：123456
5. 用户注册需要特殊密钥，以防止未经授权的用户注册

## 许可证

本项目仅供学习和参考使用。