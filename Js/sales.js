// sales.js - Lógica de la pantalla de ventas/salida de productos

let selectedProduct = null;

/**
 * Busca productos para la venta
 * @param {string} query - Texto a buscar
 */
async function searchProductsForSale(query) {
  const resultsContainer = document.querySelector(".sold_results_container");

  if (!query || query.trim() === "") {
    resultsContainer.innerHTML = "";
    return;
  }

  try {
    const products = await db.searchProductsByName(query);

    if (products.length === 0) {
      resultsContainer.innerHTML = `
                <div class="no_results_message">
                    <i class="bi bi-search" style="font-size: 24px; color: #ccc;"></i>
                    <p>No se encontraron productos</p>
                </div>
            `;
      return;
    }

    resultsContainer.innerHTML = "";

    products.forEach((product) => {
      if (product.quantity > 0) {
        const resultItem = createSearchResultItem(product);
        resultsContainer.appendChild(resultItem);
      }
    });
  } catch (error) {
    console.error("Error al buscar productos:", error);
  }
}

/**
 * Crea un elemento de resultado de búsqueda
 * @param {Object} product - Producto a mostrar
 * @returns {HTMLElement} - Elemento del resultado
 */
function createSearchResultItem(product) {
  const item = document.createElement("div");
  item.className = "product_result_item";
  item.dataset.productId = product.id;

  const imageHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product_result_image">`
    : `<div class="product_result_image_placeholder"><i class="bi bi-image"></i></div>`;

  item.innerHTML = `
        ${imageHtml}
        <div class="product_result_info">
            <span class="product_result_name">${product.name}</span>
            <span class="product_result_stock">Stock: ${product.quantity} unidades</span>
        </div>
        <i class="bi bi-chevron-right select_product"></i>
    `;

  item.addEventListener("click", () => selectProductForSale(product));

  return item;
}

/**
 * Selecciona un producto para la venta
 * @param {Object} product - Producto seleccionado
 */
function selectProductForSale(product) {
  selectedProduct = product;

  document.querySelector(".sold_search_container").style.display = "none";
  document.querySelector(".sold_form_container").style.display = "flex";

  const previewImage = document.querySelector(".sold_product_image");
  if (product.image) {
    previewImage.src = product.image;
  } else {
    previewImage.src = "#";
    previewImage.alt = "Sin imagen";
  }

  document.querySelector(".sold_product_name").textContent = product.name;
  document.querySelector(".sold_product_stock").textContent = product.quantity;

  document.querySelector(".input_sold_quantity").value = "";
  document.querySelector(".input_sold_price").value = "";
  document.querySelector(".sold_total_amount").textContent = "$0.00";

  document.querySelector(".input_sold_quantity").focus();
}

/**
 * Cancela la venta y vuelve al buscador
 */
function cancelSale() {
  selectedProduct = null;

  document.querySelector(".sold_search_container").style.display = "flex";
  document.querySelector(".sold_form_container").style.display = "none";
  document.querySelector(".sold_search_input").value = "";
  document.querySelector(".sold_results_container").innerHTML = "";
}

/**
 * Calcula el total de la venta en tiempo real
 */
function setupTotalCalculation() {
  const quantityInput = document.querySelector(".input_sold_quantity");
  const priceInput = document.querySelector(".input_sold_price");
  const totalSpan = document.querySelector(".sold_total_amount");

  function calculateTotal() {
    const quantity = Number(quantityInput.value) || 0;
    const price = Number(priceInput.value) || 0;
    const total = quantity * price;
    totalSpan.textContent = formatCurrency(total);
  }

  quantityInput.addEventListener("input", calculateTotal);
  priceInput.addEventListener("input", calculateTotal);
}

/**
 * Valida los datos de la venta
 * @returns {Object} - Resultado de la validación
 */
function validateSaleForm() {
  const quantity = Number(document.querySelector(".input_sold_quantity").value);
  const price = Number(document.querySelector(".input_sold_price").value);

  const errors = [];

  if (!quantity || quantity <= 0) {
    errors.push("La cantidad debe ser mayor a 0");
  }

  if (quantity > selectedProduct.quantity) {
    errors.push(`Solo hay ${selectedProduct.quantity} unidades disponibles`);
  }

  if (!price || price <= 0) {
    errors.push("El precio de venta debe ser mayor a 0");
  }

  if (price < selectedProduct.costPrice) {
    if (
      !confirm(
        "El precio de venta es menor al precio de costo. ¿Continuar de todas formas?"
      )
    ) {
      errors.push("Venta cancelada por precio bajo");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Registra una venta
 */
async function handleRegisterSale() {
  if (!selectedProduct) {
    showSaleMessage("Error: No hay producto seleccionado", "error");
    return;
  }

  const validation = validateSaleForm();

  if (!validation.isValid) {
    showSaleMessage(validation.errors.join(". "), "error");
    return;
  }

  const quantity = Number(document.querySelector(".input_sold_quantity").value);
  const salePrice = Number(document.querySelector(".input_sold_price").value);

  const saleData = {
    productId: selectedProduct.id,
    productName: selectedProduct.name,
    quantity: quantity,
    costPrice: selectedProduct.costPrice,
    salePrice: salePrice,
    availableStock: selectedProduct.quantity,
  };

  try {
    await db.addSale(saleData);

    showSaleMessage("Venta registrada correctamente", "success");

    selectedProduct.quantity -= quantity;

    if (selectedProduct.quantity === 0) {
      setTimeout(() => {
        cancelSale();
      }, 1500);
    } else {
      document.querySelector(".sold_product_stock").textContent =
        selectedProduct.quantity;
      document.querySelector(".input_sold_quantity").value = "";
      document.querySelector(".input_sold_price").value = "";
      document.querySelector(".sold_total_amount").textContent = "$0.00";
      document.querySelector(".input_sold_quantity").focus();
    }

    const event = new CustomEvent("saleRegistered", { detail: saleData });
    document.dispatchEvent(event);
  } catch (error) {
    console.error("Error al registrar venta:", error);
    showSaleMessage("Error al registrar la venta", "error");
  }
}

/**
 * Muestra un mensaje en la pantalla de ventas
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje
 */
function showSaleMessage(message, type) {
  const oldMessage = document.querySelector(".sale_message");
  if (oldMessage) oldMessage.remove();

  const messageDiv = document.createElement("div");
  messageDiv.className = `sale_message ${type}`;
  messageDiv.textContent = message;

  messageDiv.style.cssText = `
        width: 90%;
        padding: 10px;
        border-radius: 5px;
        text-align: center;
        margin: 10px auto;
        font-size: 14px;
        ${
          type === "error"
            ? "background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2;"
            : "background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;"
        }
    `;

  const container = document.querySelector(
    ".sold_form_container .inputs_container"
  );
  container.insertBefore(messageDiv, container.firstChild);

  setTimeout(() => messageDiv.remove(), 3000);
}

/**
 * Configura el buscador de productos
 */
function setupSaleSearch() {
  const searchInput = document.querySelector(".sold_search_input");
  let timeout = null;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchProductsForSale(e.target.value);
    }, 300);
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      clearTimeout(timeout);
      searchProductsForSale(e.target.value);
    }
  });
}

/**
 * Configura todos los listeners de la pantalla de ventas
 */
function setupSaleListeners() {
  document
    .querySelector(".btn_cancel_sold")
    .addEventListener("click", cancelSale);
  document
    .querySelector(".btn_sell_product")
    .addEventListener("click", handleRegisterSale);
  setupTotalCalculation();

  const quantityInput = document.querySelector(".input_sold_quantity");
  const priceInput = document.querySelector(".input_sold_price");

  [quantityInput, priceInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "-" || e.key === "e") {
        e.preventDefault();
      }
    });
  });
}

/**
 * Inicializa la pantalla de ventas
 */
function initSalesScreen() {
  console.log("Inicializando pantalla de ventas...");

  setupSaleSearch();
  setupSaleListeners();

  selectedProduct = null;
  document.querySelector(".sold_search_container").style.display = "flex";
  document.querySelector(".sold_form_container").style.display = "none";
  document.querySelector(".sold_search_input").value = "";
  document.querySelector(".sold_results_container").innerHTML = "";
}

// Escuchar cambios de pantalla
document.addEventListener("screenChanged", (e) => {
  if (e.detail.screen === "sold") {
    initSalesScreen();
  }
});

// Inicializar si la pantalla ya está activa
if (document.querySelector(".screen_sold.screen_active")) {
  initSalesScreen();
}
