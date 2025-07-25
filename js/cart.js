// 购物车功能实现

// 检查用户登录状态
function checkLoginStatus() {
    const userToken = localStorage.getItem('user_token');
    const username = localStorage.getItem('username');
    
    if (userToken && username) {
        // 用户已登录，显示用户信息和退出按钮
        document.getElementById('username').textContent = username;
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('login-link').style.display = 'none';
    } else {
        // 用户未登录，隐藏用户信息，显示登录链接
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('login-link').style.display = 'block';
    }
}

// 用户退出功能
function logout() {
    // 从localStorage中移除用户信息
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    
    // 隐藏用户信息，显示登录链接
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('login-link').style.display = 'block';
    
    // 重定向到登录页面
    window.location.href = 'login.html';
}

// 商品数据存储
let products = {};

// 从服务器获取所有商品数据
function loadProducts() {
    return fetch('api/products.php')
        .then(response => {
            // 检查响应是否为有效的JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('服务器返回了无效的响应格式');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // 将商品数据转换为以ID为键的对象
                products = {};
                data.data.forEach(product => {
                    products[product.id] = {
                        name: product.name,
                        price: parseFloat(product.price),
                        image: product.image
                    };
                });
                return products;
            } else {
                throw new Error('获取商品数据失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('获取商品数据失败:', error);
            throw error;
        });
}

// 从服务器获取购物车数据
function getCart() {
    return fetch('api/cart.php')
        .then(response => {
            // 检查响应是否为有效的JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('服务器返回了无效的响应格式');
            }
            return response.json();
        })
        .then(data => data.success ? data.data : [])
        .catch(error => {
            console.error('获取购物车数据失败:', error);
            throw error;
        });
}

// 更新购物车显示
function updateCartDisplay() {
    // 先加载商品数据，再更新购物车显示
    loadProducts().then(() => {
        return getCart();
    }).then(cart => {
        const cartItemsElement = document.getElementById('cart-items');
        const emptyCartMessage = document.getElementById('empty-cart-message');
        const totalItemsElement = document.getElementById('total-items');
        const totalPriceElement = document.getElementById('total-price');
        
        // 清空当前显示
        cartItemsElement.innerHTML = '';
        
        if (cart.length === 0) {
            // 显示空购物车消息
            cartItemsElement.innerHTML = '<p id="empty-cart-message">您的购物车是空的。</p>';
            totalItemsElement.textContent = '0';
            totalPriceElement.textContent = '0.00';
            return;
        }
        
        // 隐藏空购物车消息
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'none';
        }
        
        // 计算总计
        let totalItems = 0;
        let totalPrice = 0;
        
        // 为每个商品创建显示元素
        cart.forEach(item => {
            const product = products[item.product_id];
            if (product) {
                totalItems += item.quantity;
                totalPrice += product.price * item.quantity;
                
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="cart-item-details">
                        <h3>${product.name}</h3>
                        <p>单价: ¥${product.price.toFixed(2)}</p>
                        <div class="quantity-controls">
                            <button onclick="changeQuantity(${item.product_id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="changeQuantity(${item.product_id}, 1)">+</button>
                        </div>
                    </div>
                    <div class="cart-item-total">
                        <p>小计: ¥${(product.price * item.quantity).toFixed(2)}</p>
                        <button class="remove-btn" onclick="removeFromCart(${item.product_id})">删除</button>
                    </div>
                `;
                cartItemsElement.appendChild(itemElement);
            }
        });
        
        // 更新总计显示
        totalItemsElement.textContent = totalItems;
        totalPriceElement.textContent = totalPrice.toFixed(2);
    }).catch(error => {
        console.error('更新购物车显示失败:', error);
        // 即使加载商品数据失败，也尝试显示购物车数据
        getCart().then(cart => {
            // 显示错误信息
            const cartItemsElement = document.getElementById('cart-items');
            cartItemsElement.innerHTML = '<p>加载商品数据失败，无法正确显示购物车内容。</p>';
        }).catch(cartError => {
            console.error('获取购物车数据也失败:', cartError);
            const cartItemsElement = document.getElementById('cart-items');
            cartItemsElement.innerHTML = '<p>无法获取购物车数据，请稍后重试。</p>';
        });
    });
}

// 更改商品数量
function changeQuantity(productId, change) {
    getCart().then(cart => {
        // 查找商品项
        const itemIndex = cart.findIndex(item => item.product_id == productId);
        
        if (itemIndex !== -1) {
            const newQuantity = cart[itemIndex].quantity + change;
            
            if (newQuantity <= 0) {
                // 如果数量小于等于0，移除商品
                removeFromCart(productId);
            } else {
                // 发送更新到服务器
                fetch('api/cart.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product_id: productId,
                        quantity: change // 发送变化量而不是新数量
                    })
                })
                .then(response => {
                    // 检查响应是否为有效的JSON
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('服务器返回了无效的响应格式');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        updateCartDisplay();
                    } else {
                        console.error('更新购物车失败:', data.message);
                        alert('更新购物车失败: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('更新购物车时发生错误:', error);
                    alert('更新购物车时发生错误: ' + error.message);
                });
            }
        }
    });
}

// 从购物车移除商品
function removeFromCart(productId) {
    fetch('api/cart.php', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId
        })
    })
    .then(response => {
        // 检查响应是否为有效的JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('服务器返回了无效的响应格式');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartDisplay();
        } else {
            console.error('从购物车移除商品失败:', data.message);
            alert('从购物车移除商品失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('从购物车移除商品时发生错误:', error);
        alert('从购物车移除商品时发生错误: ' + error.message);
    });
}

// 结算功能
function checkout() {
    // 检查用户是否已登录
    const userId = localStorage.getItem('user_id');
    const userToken = localStorage.getItem('user_token');
    
    if (!userId || !userToken) {
        alert('请先登录后再下单！');
        window.location.href = 'login.html';
        return;
    }
    
    getCart().then(cart => {
        if (cart.length === 0) {
            alert('您的购物车是空的，请先添加商品！');
            return;
        }
        
        // 发送订单数据到服务器
        fetch('api/orders.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cart: cart,
                user_id: userId
            })
        })
        .then(response => {
            // 检查响应是否为有效的JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('服务器返回了无效的响应格式');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('感谢您的购买！订单已提交。订单号: ' + data.order_id);
                // 清空购物车
                fetch('api/cart.php', {
                    method: 'DELETE'
                })
                .then(response => {
                    // 检查响应是否为有效的JSON
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('服务器返回了无效的响应格式');
                    }
                    return response.json();
                })
                .then(() => {
                    updateCartDisplay();
                })
                .catch(error => {
                    console.error('清空购物车时发生错误:', error);
                    alert('清空购物车时发生错误: ' + error.message);
                });
            } else {
                alert('订单提交失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('提交订单时发生错误:', error);
            alert('提交订单时发生错误: ' + error.message);
        });
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus(); // 检查用户登录状态
    updateCartDisplay();
});