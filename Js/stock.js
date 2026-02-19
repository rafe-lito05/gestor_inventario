// stock.js - Lógica de la pantalla de inventario

console.log('📦 stock.js cargado');

let currentProducts = [];
let productToDelete = null;
let productToEdit = null;

/**
 * Renderiza las tarjetas de productos en el grid
 * @param {Array} products - Lista de productos a renderizar
 */
function renderStockProducts(products) {
    console.log('Renderizando productos:', products?.length || 0);
    
    const gridContainer = document.querySelector('.stock_grid_container');
    
    if (!gridContainer) {
        console.error('❌ No se encontró .stock_grid_container');
        return;
    }
    
    if (!products || products.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty_stock_message">
                <i class="bi bi-box" style="font-size: 48px; color: #ccc;"></i>
                <p>No hay productos en el inventario</p>
                <p style="font-size: 14px; color: #999;">Agrega tu primer producto</p>
            </div>
        `;
        updateStockCounters([]);
        return;
    }
    
    gridContainer.innerHTML = '';
    
    products.forEach(product => {
        // Determinar clases según el stock
        let stockClass = '';
        let badgeClass = '';
        
        if (product.quantity === 0) {
            stockClass = 'out_stock';
            badgeClass = 'danger';
        } else if (product.quantity < 5) {
            stockClass = 'low_stock';
            badgeClass = 'warning';
        }
        
        // Determinar imagen a mostrar
        const imageHtml = product.image 
            ? `<img src="${product.image}" alt="${product.name}" class="product_card_image ${stockClass}">`
            : `<div class="product_card_image_placeholder"><i class="bi bi-image"></i></div>`;
        
        const productCard = document.createElement('div');
        productCard.className = `product_card ${stockClass}`;
        productCard.dataset.id = product.id;
        
        productCard.innerHTML = `
            <div class="product_card_image_container">
                ${imageHtml}
                <div class="product_card_quantity_badge ${badgeClass}">${product.quantity}</div>
            </div>
            <div class="product_card_info">
                <h4 class="product_card_name" title="${product.name}">${product.name}</h4>
                <span class="product_card_cost">${formatCurrency(product.costPrice)}</span>
            </div>
            <div class="product_card_actions">
                <button class="product_action_btn edit_product" data-id="${product.id}" title="Editar producto">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="product_action_btn delete_product" data-id="${product.id}" title="Eliminar producto">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        gridContainer.appendChild(productCard);
    });
    
    console.log('✅ Productos renderizados, asignando eventos...');
    
    updateStockCounters(products);
    assignButtonEvents();
}

/**
 * Asigna eventos directamente a los botones
 */
function assignButtonEvents() {
    console.log('Asignando eventos a botones...');
    
    // Botones de editar
    const editButtons = document.querySelectorAll('.edit_product');
    console.log(`🔍 Encontrados ${editButtons.length} botones de editar`);
    
    editButtons.forEach((button) => {
        button.removeEventListener('click', handleEditClick);
        button.addEventListener('click', handleEditClick);
    });
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('.delete_product');
    console.log(`🔍 Encontrados ${deleteButtons.length} botones de eliminar`);
    
    deleteButtons.forEach((button) => {
        button.removeEventListener('click', handleDeleteClick);
        button.addEventListener('click', handleDeleteClick);
    });
}

/**
 * Manejador de clic para editar
 */
function handleEditClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const button = e.currentTarget;
    const productId = button.dataset.id;
    console.log('✏️ Click en editar producto:', productId);
    if (productId) {
        openEditModal(productId);
    }
}

/**
 * Manejador de clic para eliminar
 */
function handleDeleteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const button = e.currentTarget;
    const productId = button.dataset.id;
    console.log('🗑️ Click en eliminar producto:', productId);
    if (productId) {
        const productCard = button.closest('.product_card');
        if (productCard) {
            const productName = productCard.querySelector('.product_card_name').textContent;
            showDeleteConfirmationModal(productId, productName);
        }
    }
}

/**
 * Actualiza los contadores de stock en el header
 * @param {Array} products - Lista de productos
 */
function updateStockCounters(products) {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.quantity < 5 && p.quantity > 0).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    
    console.log('Actualizando contadores:', { totalProducts, lowStock, outOfStock });
    
    let countersContainer = document.querySelector('.stock_counters');
    
    if (!countersContainer) {
        const stockHeader = document.querySelector('.stock_header');
        if (!stockHeader) return;
        countersContainer = document.createElement('div');
        countersContainer.className = 'stock_counters';
        stockHeader.appendChild(countersContainer);
    }
    
    countersContainer.innerHTML = `
        <div class="stock_counter_item">
            <span class="counter_label">Total:</span>
            <span class="counter_value">${totalProducts}</span>
        </div>
        <div class="stock_counter_item warning">
            <span class="counter_label">Stock bajo:</span>
            <span class="counter_value">${lowStock}</span>
        </div>
        <div class="stock_counter_item danger">
            <span class="counter_label">Agotados:</span>
            <span class="counter_value">${outOfStock}</span>
        </div>
    `;
}

/**
 * Carga todos los productos de la base de datos
 */
async function loadStockProducts() {
    console.log('Cargando productos desde DB...');
    try {
        currentProducts = await db.getProducts();
        console.log(`📦 Cargados ${currentProducts.length} productos`);
        renderStockProducts(currentProducts);
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        showStockMessage('Error al cargar el inventario', 'error');
    }
}

/**
 * Busca productos por nombre
 * @param {string} query - Texto a buscar
 */
async function searchStockProducts(query) {
    if (!query || query.trim() === '') {
        renderStockProducts(currentProducts);
        return;
    }
    
    try {
        const results = await db.searchProductsByName(query);
        renderStockProducts(results);
    } catch (error) {
        console.error('❌ Error al buscar productos:', error);
    }
}

/**
 * Configura el buscador en tiempo real
 */
function setupStockSearch() {
    const searchInput = document.querySelector('.stock_search_input');
    if (!searchInput) return;
    
    let timeout = null;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            searchStockProducts(e.target.value);
        }, 300);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(timeout);
            searchStockProducts(e.target.value);
        }
    });
}

/**
 * Abre el modal de edición para un producto
 * @param {string} productId - ID del producto a editar
 */
async function openEditModal(productId) {
    console.log('Abriendo modal de edición para:', productId);
    
    try {
        const product = await db.getProductById(productId);
        if (!product) {
            console.error('Producto no encontrado');
            return;
        }
        
        productToEdit = product;
        
        // Llenar el formulario con los datos del producto
        document.getElementById('editProductName').value = product.name || '';
        document.getElementById('editProductQuantity').value = product.quantity || 0;
        document.getElementById('editProductPrice').value = product.costPrice || 0;
        
        // Mostrar imagen si existe
        const preview = document.getElementById('editProductImagePreview');
        if (product.image) {
            preview.src = product.image;
            preview.style.display = 'block';
        } else {
            preview.src = '#';
            preview.alt = 'Sin imagen';
        }
        
        // Mostrar el modal
        const modal = document.getElementById('editProductModal');
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error al cargar producto para editar:', error);
        showStockMessage('Error al cargar el producto', 'error');
    }
}

/**
 * Cierra el modal de edición
 */
function closeEditModal() {
    const modal = document.getElementById('editProductModal');
    modal.style.display = 'none';
    productToEdit = null;
}

/**
 * Guarda los cambios del producto editado
 */
async function saveEditChanges() {
    if (!productToEdit) {
        console.error('No hay producto en edición');
        return;
    }
    
    const name = document.getElementById('editProductName').value.trim();
    const quantity = Number(document.getElementById('editProductQuantity').value);
    const costPrice = Number(document.getElementById('editProductPrice').value);
    
    // Validaciones básicas
    if (!name) {
        showStockMessage('El nombre es obligatorio', 'error');
        return;
    }
    
    if (quantity < 0) {
        showStockMessage('La cantidad no puede ser negativa', 'error');
        return;
    }
    
    if (costPrice < 0) {
        showStockMessage('El precio no puede ser negativo', 'error');
        return;
    }
    
    const updatedProduct = {
        ...productToEdit,
        name: name,
        quantity: quantity,
        costPrice: costPrice,
        updatedAt: new Date().toISOString()
    };
    
    try {
        await db.updateProduct(updatedProduct);
        console.log('✅ Producto actualizado');
        
        closeEditModal();
        await loadStockProducts();
        showStockMessage('Producto actualizado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        showStockMessage('Error al actualizar el producto', 'error');
    }
}

/**
 * Configura el selector de imagen para el modal de edición con soporte para Android
 */
function setupEditImageUpload() {
    const imageContainer = document.getElementById('editImageContainer');
    const fileInput = document.getElementById('editProductImageInput');
    const changeBtn = document.getElementById('changeEditImageBtn');
    const preview = document.getElementById('editProductImagePreview');
    
    if (!fileInput || !changeBtn || !preview) return;
    
    // Configurar atributos para Android
    if (typeof sketchware !== "undefined" || /Android/i.test(navigator.userAgent)) {
        fileInput.setAttribute("capture", "environment");
    }
    
    // Eliminar eventos anteriores
    changeBtn.removeEventListener('click', triggerEditFileInput);
    changeBtn.addEventListener('click', triggerEditFileInput);
    
    fileInput.removeEventListener('change', handleEditImageSelected);
    fileInput.addEventListener('change', handleEditImageSelected);
}

/**
 * Dispara el input file en el modal de edición
 */
function triggerEditFileInput() {
    const fileInput = document.getElementById('editProductImageInput');
    if (fileInput) {
        fileInput.click();
    }
}

/**
 * Maneja la selección de imagen en el modal de edición
 */
function handleEditImageSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📸 Imagen seleccionada para edición:', file.name);
    
    const reader = new FileReader();
    const preview = document.getElementById('editProductImagePreview');
    
    reader.onload = (e) => {
        preview.src = e.target.result;
        if (productToEdit) {
            productToEdit.image = e.target.result;
        }
        console.log('✅ Imagen actualizada en edición');
    };
    
    reader.onerror = (error) => {
        console.error('❌ Error al leer imagen:', error);
        showStockMessage('Error al cargar la imagen', 'error');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Muestra el modal de confirmación para eliminar
 * @param {string} productId - ID del producto a eliminar
 * @param {string} productName - Nombre del producto
 */
function showDeleteConfirmationModal(productId, productName) {
    console.log('Mostrando modal para eliminar:', productName);
    productToDelete = productId;
    
    const modal = document.getElementById('deleteConfirmModal');
    const productNameSpan = document.getElementById('deleteProductName');
    
    if (productNameSpan) {
        productNameSpan.textContent = productName;
    }
    
    modal.style.display = 'flex';
}

/**
 * Cierra el modal de confirmación
 */
function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    productToDelete = null;
}

/**
 * Confirma y ejecuta la eliminación
 */
async function confirmDelete() {
    if (!productToDelete) return;
    
    try {
        await db.deleteProduct(productToDelete);
        await loadStockProducts();
        closeDeleteModal();
        showStockMessage('Producto eliminado correctamente', 'success');
    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        showStockMessage('Error al eliminar el producto', 'error');
        closeDeleteModal();
    }
}

/**
 * Configura los listeners de los modales
 */
function setupModalListeners() {
    console.log('Configurando listeners de modales');
    
    // Modal de edición
    const editModal = document.getElementById('editProductModal');
    const closeEditBtn = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    
    if (closeEditBtn) {
        closeEditBtn.removeEventListener('click', closeEditModal);
        closeEditBtn.addEventListener('click', closeEditModal);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.removeEventListener('click', closeEditModal);
        cancelEditBtn.addEventListener('click', closeEditModal);
    }
    
    if (saveEditBtn) {
        saveEditBtn.removeEventListener('click', saveEditChanges);
        saveEditBtn.addEventListener('click', saveEditChanges);
    }
    
    // Cerrar al hacer clic fuera del modal de edición
    if (editModal) {
        editModal.removeEventListener('click', handleEditModalOutsideClick);
        editModal.addEventListener('click', handleEditModalOutsideClick);
    }
    
    // Modal de eliminación
    const deleteModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const closeDeleteBtn = document.getElementById('closeDeleteModal');
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.removeEventListener('click', confirmDelete);
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.removeEventListener('click', closeDeleteModal);
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    if (closeDeleteBtn) {
        closeDeleteBtn.removeEventListener('click', closeDeleteModal);
        closeDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    if (deleteModal) {
        deleteModal.removeEventListener('click', handleDeleteModalOutsideClick);
        deleteModal.addEventListener('click', handleDeleteModalOutsideClick);
    }
    
    // Configurar carga de imagen en el modal de edición
    setupEditImageUpload();
}

/**
 * Maneja clic fuera del modal de edición
 */
function handleEditModalOutsideClick(e) {
    if (e.target === document.getElementById('editProductModal')) {
        closeEditModal();
    }
}

/**
 * Maneja clic fuera del modal de eliminación
 */
function handleDeleteModalOutsideClick(e) {
    if (e.target === document.getElementById('deleteConfirmModal')) {
        closeDeleteModal();
    }
}

/**
 * Muestra un mensaje en la pantalla de stock
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje
 */
function showStockMessage(message, type) {
    const oldMessage = document.querySelector('.stock_message');
    if (oldMessage) oldMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `stock_message ${type}`;
    messageDiv.textContent = message;
    
    messageDiv.style.cssText = `
        width: 90%;
        padding: 10px;
        border-radius: 5px;
        text-align: center;
        margin: 10px auto;
        font-size: 14px;
        ${type === 'error' ? 
            'background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2;' : 
            'background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;'}
    `;
    
    const stockHeader = document.querySelector('.stock_header');
    if (stockHeader) {
        stockHeader.appendChild(messageDiv);
    }
    
    setTimeout(() => messageDiv.remove(), 3000);
}

/**
 * Inicializa la pantalla de stock
 */
async function initStockScreen() {
    console.log('🎯 Inicializando pantalla de stock...');
    await loadStockProducts();
    setupStockSearch();
}

// Event listeners globales
document.addEventListener('productAdded', () => {
    console.log('Evento productAdded recibido');
    if (document.querySelector('.screen_stock.screen_active')) {
        loadStockProducts();
    }
});

document.addEventListener('productUpdated', () => {
    console.log('Evento productUpdated recibido');
    if (document.querySelector('.screen_stock.screen_active')) {
        loadStockProducts();
    }
});

document.addEventListener('screenChanged', (e) => {
    console.log('Evento screenChanged en stock:', e.detail);
    if (e.detail.screen === 'stock') {
        initStockScreen();
    }
});

// Inicializar si la pantalla ya está activa
if (document.querySelector('.screen_stock.screen_active')) {
    console.log('Pantalla de stock activa al cargar');
    setTimeout(() => {
        initStockScreen();
    }, 300);
}

// Configurar modales al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - configurando modales');
    setTimeout(() => {
        setupModalListeners();
    }, 500);
});