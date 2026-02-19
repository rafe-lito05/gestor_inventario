// database.js - Capa de datos con IndexedDB

class InventoryDB {
  constructor() {
    this.dbName = "inventoryDB";
    this.version = 1;
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Inicializa la base de datos
   * @returns {Promise} - Promesa que se resuelve cuando la DB está lista
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      console.log('Inicializando IndexedDB...');
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error("Error al abrir la base de datos:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log("✅ Base de datos inicializada correctamente");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('Actualizando estructura de la base de datos...');

        // Crear almacén de productos
        if (!db.objectStoreNames.contains("products")) {
          const productStore = db.createObjectStore("products", {
            keyPath: "id",
          });
          productStore.createIndex("name", "name", { unique: false });
          productStore.createIndex("quantity", "quantity", { unique: false });
          console.log('📦 Store "products" creado');
        }

        // Crear almacén de ventas
        if (!db.objectStoreNames.contains("sales")) {
          const saleStore = db.createObjectStore("sales", { keyPath: "id" });
          saleStore.createIndex("productId", "productId", { unique: false });
          saleStore.createIndex("date", "date", { unique: false });
          saleStore.createIndex("productName", "productName", {
            unique: false,
          });
          console.log('📊 Store "sales" creado');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Espera a que la DB esté lista
   */
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // ==================== MÉTODOS PARA PRODUCTOS ====================

  /**
   * Agrega un nuevo producto
   * @param {Object} product - Datos del producto
   * @returns {Promise} - Promesa con el producto agregado
   */
  async addProduct(product) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["products"], "readwrite");
      const store = transaction.objectStore("products");

      if (!product.id) {
        product.id = generateId();
      }

      product.quantity = Number(product.quantity);
      product.costPrice = Number(product.costPrice);
      product.createdAt = new Date().toISOString();
      product.updatedAt = new Date().toISOString();

      const request = store.add(product);

      request.onsuccess = () => {
        console.log("✅ Producto agregado:", product.name);
        resolve(product);
      };

      request.onerror = (event) => {
        console.error("❌ Error al agregar producto:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Obtiene todos los productos
   * @returns {Promise<Array>} - Lista de productos
   */
  async getProducts() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["products"], "readonly");
      const store = transaction.objectStore("products");
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error("❌ Error al obtener productos:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Obtiene un producto por su ID
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} - Producto encontrado
   */
  async getProductById(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["products"], "readonly");
      const store = transaction.objectStore("products");
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error("❌ Error al obtener producto:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Actualiza un producto existente
   * @param {Object} product - Producto con datos actualizados
   * @returns {Promise<Object>} - Producto actualizado
   */
  async updateProduct(product) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["products"], "readwrite");
      const store = transaction.objectStore("products");

      product.updatedAt = new Date().toISOString();
      if (product.quantity !== undefined) product.quantity = Number(product.quantity);
      if (product.costPrice !== undefined) product.costPrice = Number(product.costPrice);

      const request = store.put(product);

      request.onsuccess = () => {
        console.log("✅ Producto actualizado:", product.name);
        resolve(product);
      };

      request.onerror = (event) => {
        console.error("❌ Error al actualizar producto:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Elimina un producto
   * @param {string} id - ID del producto a eliminar
   * @returns {Promise} - Promesa que se resuelve al eliminar
   */
  async deleteProduct(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["products"], "readwrite");
      const store = transaction.objectStore("products");
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log("✅ Producto eliminado:", id);
        resolve();
      };

      request.onerror = (event) => {
        console.error("❌ Error al eliminar producto:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Busca productos por nombre
   * @param {string} query - Texto a buscar
   * @returns {Promise<Array>} - Productos que coinciden
   */
  async searchProductsByName(query) {
    const products = await this.getProducts();
    const searchTerm = query.toLowerCase().trim();

    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm)
    );
  }

  // ==================== MÉTODOS PARA VENTAS ====================

  /**
   * Registra una nueva venta
   * @param {Object} saleData - Datos de la venta
   * @returns {Promise<Object>} - Venta registrada
   */
  async addSale(saleData) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ["sales", "products"],
        "readwrite"
      );
      const saleStore = transaction.objectStore("sales");
      const productStore = transaction.objectStore("products");

      const sale = {
        id: generateId(),
        productId: saleData.productId,
        productName: saleData.productName,
        quantity: Number(saleData.quantity),
        costPrice: Number(saleData.costPrice),
        salePrice: Number(saleData.salePrice),
        profit:
          (Number(saleData.salePrice) - Number(saleData.costPrice)) *
          Number(saleData.quantity),
        date: new Date().toISOString(),
      };

      const getProductRequest = productStore.get(sale.productId);

      getProductRequest.onsuccess = (event) => {
        const product = event.target.result;

        if (product) {
          product.quantity -= sale.quantity;
          product.updatedAt = new Date().toISOString();
          productStore.put(product);

          const addSaleRequest = saleStore.add(sale);

          addSaleRequest.onsuccess = () => {
            console.log("✅ Venta registrada:", sale.id);
            resolve(sale);
          };

          addSaleRequest.onerror = (error) => {
            console.error("❌ Error al registrar venta:", error);
            reject(error);
          };
        } else {
          reject(new Error("Producto no encontrado"));
        }
      };

      getProductRequest.onerror = (error) => {
        reject(error);
      };
    });
  }

  /**
   * Obtiene todas las ventas
   * @returns {Promise<Array>} - Lista de ventas
   */
  async getSales() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sales"], "readonly");
      const store = transaction.objectStore("sales");
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error("❌ Error al obtener ventas:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Obtiene ventas filtradas por rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Array>} - Ventas en el rango
   */
  async getSalesByDateRange(startDate, endDate) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sales"], "readonly");
      const store = transaction.objectStore("sales");
      const index = store.index("date");

      const range = IDBKeyRange.bound(
        startDate.toISOString(),
        endDate.toISOString(),
        false,
        true
      );

      const request = index.getAll(range);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error("❌ Error al obtener ventas por fecha:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Obtiene ventas de un producto específico
   * @param {string} productId - ID del producto
   * @returns {Promise<Array>} - Ventas del producto
   */
  async getSalesByProduct(productId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sales"], "readonly");
      const store = transaction.objectStore("sales");
      const index = store.index("productId");

      const request = index.getAll(productId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error("❌ Error al obtener ventas por producto:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Calcula totales de ventas (cantidad y ganancia)
   * @param {Array} sales - Lista de ventas
   * @returns {Object} - Totales calculados
   */
  calculateSalesTotals(sales) {
    return sales.reduce(
      (totals, sale) => {
        totals.totalSold += sale.quantity;
        totals.totalProfit += sale.profit || 0;
        totals.totalRevenue += sale.quantity * sale.salePrice;
        return totals;
      },
      { totalSold: 0, totalProfit: 0, totalRevenue: 0 }
    );
  }

  /**
   * Obtiene productos con stock bajo (menor a 5 unidades)
   * @returns {Promise<Array>} - Productos con stock bajo
   */
  async getLowStockProducts() {
    const products = await this.getProducts();
    return products.filter(
      (product) => product.quantity < 5 && product.quantity > 0
    );
  }

  /**
   * Obtiene productos agotados
   * @returns {Promise<Array>} - Productos sin stock
   */
  async getOutOfStockProducts() {
    const products = await this.getProducts();
    return products.filter((product) => product.quantity === 0);
  }
}

// Crear instancia global de la base de datos
const db = new InventoryDB();