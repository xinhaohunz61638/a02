// 商品管理功能实现

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupForm();
    setupSearch();
});

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