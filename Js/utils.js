// utils.js - Funciones auxiliares reutilizables

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Cantidad formateada como moneda (ej: $1,000.00)
 */
function formatCurrency(amount) {
  return `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
}

/**
 * Formatea una fecha para mostrar
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada (ej: 15/01/2024)
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Obtiene el rango de fechas para "Hoy"
 * @returns {Object} - Fecha de inicio y fin del día
 */
function getTodayRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    start: today,
    end: tomorrow,
  };
}

/**
 * Obtiene el rango de fechas para "Esta semana"
 * @returns {Object} - Fecha de inicio y fin de la semana
 */
function getWeekRange() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(
    now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
  );
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return {
    start: startOfWeek,
    end: endOfWeek,
  };
}

/**
 * Obtiene el rango de fechas para "Este mes"
 * @returns {Object} - Fecha de inicio y fin del mes
 */
function getMonthRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    start: startOfMonth,
    end: endOfMonth,
  };
}

/**
 * Genera un ID único para productos/ventas
 * @returns {string} - ID único basado en timestamp
 */
function generateId() {
  return Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

/**
 * Valida que un producto tenga todos los campos requeridos
 * @param {Object} product - Producto a validar
 * @returns {Object} - Resultado de la validación {isValid: boolean, errors: string[]}
 */
function validateProduct(product) {
  const errors = [];

  if (!product.name || product.name.trim() === "") {
    errors.push("El nombre del producto es requerido");
  }

  if (
    product.quantity === undefined ||
    product.quantity === null ||
    product.quantity < 0
  ) {
    errors.push("La cantidad debe ser un número válido mayor o igual a 0");
  }

  if (
    product.costPrice === undefined ||
    product.costPrice === null ||
    product.costPrice < 0
  ) {
    errors.push(
      "El precio de costo debe ser un número válido mayor o igual a 0"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida los datos de una venta
 * @param {Object} sale - Datos de la venta a validar
 * @returns {Object} - Resultado de la validación {isValid: boolean, errors: string[]}
 */
function validateSale(sale) {
  const errors = [];

  if (!sale.productId) {
    errors.push("Debe seleccionar un producto");
  }

  if (!sale.quantity || sale.quantity <= 0) {
    errors.push("La cantidad debe ser mayor a 0");
  }

  if (!sale.salePrice || sale.salePrice <= 0) {
    errors.push("El precio de venta debe ser mayor a 0");
  }

  if (sale.quantity > sale.availableStock) {
    errors.push("No hay suficiente stock disponible");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
