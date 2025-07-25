// 电商网站前端JavaScript代码

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('电商网站页面已加载');
    updateCartDisplay();
    checkLoginStatus(); // 检查用户登录状态
    
    // 检查当前页面类型并相应地初始化功能
    const isHomePage = document.getElementById('featured-products') !== null;
    const isProductPage = document.getElementById('search-input') !== null;
    
    // 只在首页加载推荐商品
    if (isHomePage) {
        loadFeaturedProducts();
    }
    
    // 只在商品页面初始化搜索功能
    if (isProductPage) {
        loadProducts();
        setupSearch();
    }
});

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

// 加载商品
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

// 加载推荐商品
function loadFeaturedProducts() {
    fetch('api/products.php?recommended=true')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 获取前3个商品作为推荐商品
            const featuredProducts = data.data.slice(0, 3);
            displayFeaturedProducts(featuredProducts);
        } else {
            console.error('加载推荐商品失败:', data.message);
        }
    })
    .catch(error => {
        console.error('加载推荐商品时发生错误:', error);
    });
}

// 显示推荐商品
function displayFeaturedProducts(products) {
    const container = document.getElementById('featured-products');
    // 只在首页显示推荐商品
    if (!container) return;
    
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
            <button onclick="addToCart(${product.id})">加入购物车</button>
        `;
        container.appendChild(productElement);
    });
}

// 显示商品
function displayProducts(products) {
    const container = document.getElementById('product-container');
    // 只在商品页面显示商品
    if (!container) return;
    
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
            <button onclick="addToCart(${product.id})">加入购物车</button>
        `;
        container.appendChild(productElement);
    });
}

// 设置搜索功能
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

// 添加商品到购物车
function addToCart(productId) {
    fetch('api/cart.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: 1
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
            // 显示确认消息
            alert(`商品已添加到购物车!`);
            // 更新购物车显示
            updateCartDisplay();
        } else {
            alert('添加到购物车失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('添加到购物车时发生错误: ' + error.message);
    });
}

// 更新购物车显示
function updateCartDisplay() {
    fetch('api/cart.php')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const cartCount = data.data.reduce((total, item) => total + item.quantity, 0);
            console.log(`购物车中有 ${cartCount} 件商品`);
            
            // 如果页面上有购物车计数元素，更新它
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = cartCount;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}