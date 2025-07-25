// 商品管理功能实现

document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    if (isLoggedIn()) {
        showManagementPanel();
        loadProducts();
        setupForm();
        setupSearch();
        // 默认打开商品管理标签页
        document.getElementById("defaultOpen").click();
    } else {
        showLoginForm();
    }
    
    // 设置登录表单事件
    setupLoginForm();
});

// 标签页切换功能
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    
    // 隐藏所有标签内容
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    
    // 移除所有标签按钮的active类
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    // 显示当前标签内容，并给当前标签按钮添加active类
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    
    // 如果是订单标签，则加载订单数据
    if (tabName === 'orders') {
        loadOrders();
    }
}

// 检查登录状态
function isLoggedIn() {
    const token = localStorage.getItem('admin_token');
    // 在实际应用中，可能需要验证token的有效性
    // 这里我们只检查是否存在token
    return token !== null && token !== '';
}

// 显示登录表单
function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('management-panel').style.display = 'none';
}

// 显示管理面板
function showManagementPanel() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('management-panel').style.display = 'block';
}

// 设置登录表单事件
function setupLoginForm() {
    const loginForm = document.getElementById('admin-login');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
}

// 登录功能
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Attempting login with:', { username, password });
    
    // 检查用户名和密码是否为空
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    // 调用后端API进行验证
    fetch('api/auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            // 保存token到localStorage
            localStorage.setItem('admin_token', data.token);
            showManagementPanel();
            loadProducts();
            setupForm();
            setupSearch();
        } else {
            alert('登录失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('登录时发生错误:', error);
        alert('登录时发生错误: ' + error.message);
        
        // 提供更详细的错误信息
        if (error instanceof TypeError && error.message.includes('fetch')) {
            alert('网络错误：无法连接到服务器，请检查网络连接或服务器状态');
        }
    });
}

// 退出登录
function logout() {
    localStorage.removeItem('admin_token');
    showLoginForm();
}

// 设置搜索事件
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-search-btn');
    
    // 点击搜索按钮
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        loadProducts(searchTerm);
    });
    
    // 回车键搜索
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            loadProducts(searchTerm);
        }
    });
    
    // 清空搜索
    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        loadProducts();
    });
}

// 加载所有商品
function loadProducts(searchTerm = '') {
    let url = 'api/products.php';
    if (searchTerm) {
        url += '?search=' + encodeURIComponent(searchTerm);
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayProducts(data.data);
            } else {
                console.error('加载商品失败:', data.message);
            }
        })
        .catch(error => {
            console.error('加载商品时发生错误:', error);
        });
}

// 显示商品列表
function displayProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <span class="price">¥${parseFloat(product.price).toFixed(2)}</span>
            ${product.tags && product.tags.length > 0 ? 
              `<div class="product-tags">
                 ${product.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
               </div>` : ''}
            <div class="admin-actions">
                <button onclick="editProduct(${product.id})">编辑</button>
                <button onclick="deleteProduct(${product.id})">删除</button>
            </div>
        `;
        container.appendChild(productElement);
    });
}

// 加载订单数据
function loadOrders() {
    fetch('api/orders.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayOrders(data.data);
            } else {
                console.error('加载订单失败:', data.message);
                document.getElementById('orders-container').innerHTML = '<p>加载订单失败: ' + data.message + '</p>';
            }
        })
        .catch(error => {
            console.error('加载订单时发生错误:', error);
            document.getElementById('orders-container').innerHTML = '<p>加载订单时发生错误: ' + error.message + '</p>';
        });
}

// 显示订单列表
function displayOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<p>暂无订单</p>';
        return;
    }
    
    // 创建订单表格
    const table = document.createElement('table');
    table.className = 'orders-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>订单ID</th>
                <th>用户</th>
                <th>总金额</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>商品详情</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        const orderDate = new Date(order.created_at).toLocaleString('zh-CN');
        
        // 格式化商品详情
        let itemsDetails = '';
        order.items.forEach(item => {
            itemsDetails += `${item.product_name} x ${item.quantity} (¥${parseFloat(item.price).toFixed(2)})<br>`;
        });
        
        // 获取下一个状态
        const nextStatus = getNextStatus(order.status);
        const nextStatusText = getStatusText(nextStatus);
        
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.username || '匿名用户'}</td>
            <td>¥${parseFloat(order.total_amount).toFixed(2)}</td>
            <td>
                <span class="status-${order.status}">${getStatusText(order.status)}</span>
            </td>
            <td>${orderDate}</td>
            <td>${itemsDetails}</td>
            <td>
                <button onclick="changeOrderStatus(${order.id}, '${nextStatus}')">${nextStatusText}</button>
                <button onclick="deleteOrder(${order.id})" class="delete-btn">删除</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    container.appendChild(table);
}

// 获取订单状态文本
function getStatusText(status) {
    switch(status) {
        case 'pending': return '待付款';
        case 'paid': return '已付款';
        case 'shipped': return '打单中';
        case 'delivered': return '已完成';
        default: return status;
    }
}

// 获取下一个状态
function getNextStatus(currentStatus) {
    switch(currentStatus) {
        case 'pending': return 'paid';
        case 'paid': return 'shipped';
        case 'shipped': return 'delivered';
        case 'delivered': return 'pending';
        default: return 'pending';
    }
}

// 切换订单状态
function changeOrderStatus(orderId, newStatus) {
    fetch('api/orders.php', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            order_id: orderId,
            status: newStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('订单状态更新成功');
            loadOrders();
        } else {
            alert('订单状态更新失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('更新订单状态时发生错误:', error);
        alert('更新订单状态时发生错误: ' + error.message);
    });
}

// 删除订单
function deleteOrder(orderId) {
    if (confirm('确定要删除这个订单吗？')) {
        fetch('api/orders.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_id: orderId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('订单删除成功');
                loadOrders();
            } else {
                alert('订单删除失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('删除订单时发生错误:', error);
            alert('删除订单时发生错误: ' + error.message);
        });
    }
}

// 设置表单事件
function setupForm() {
    const form = document.getElementById('product-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduct();
    });
    
    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn.addEventListener('click', cancelEdit);
}

// 保存商品（添加或更新）
function saveProduct() {
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = document.getElementById('product-price').value;
    const image = document.getElementById('product-image').value;
    const tags = document.getElementById('product-tags').value;
    
    const product = {
        name: name,
        description: description,
        price: parseFloat(price),
        image: image,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    let method = 'POST';
    let url = 'api/products.php';
    
    if (id) {
        product.id = parseInt(id);
        method = 'PUT';
    }
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(method === 'POST' ? '商品添加成功' : '商品更新成功');
            loadProducts();
            resetForm();
        } else {
            alert('操作失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('保存商品时发生错误:', error);
        alert('保存商品时发生错误: ' + error.message);
    });
}

// 编辑商品
function editProduct(id) {
    fetch('api/products.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const product = data.data.find(p => p.id == id);
                if (product) {
                    document.getElementById('product-id').value = product.id;
                    document.getElementById('product-name').value = product.name;
                    document.getElementById('product-description').value = product.description;
                    document.getElementById('product-price').value = product.price;
                    document.getElementById('product-image').value = product.image || '';
                    document.getElementById('product-tags').value = product.tags ? product.tags.join(', ') : '';
                    
                    document.getElementById('form-title').textContent = '编辑商品';
                    document.querySelector('#product-form button[type="submit"]').textContent = '更新商品';
                }
            }
        })
        .catch(error => {
            console.error('加载商品详情时发生错误:', error);
        });
}

// 删除商品
function deleteProduct(id) {
    if (confirm('确定要删除这个商品吗？')) {
        fetch('api/products.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id: id})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('商品删除成功');
                loadProducts();
            } else {
                alert('删除失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('删除商品时发生错误:', error);
            alert('删除商品时发生错误: ' + error.message);
        });
    }
}

// 取消编辑
function cancelEdit() {
    resetForm();
}

// 重置表单
function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('form-title').textContent = '添加新商品';
    document.querySelector('#product-form button[type="submit"]').textContent = '保存商品';
}