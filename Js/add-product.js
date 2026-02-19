// add-product.js - Lógica de la pantalla de agregar productos

console.log('➕ add-product.js cargado');

let addProductImage = null;
let imageFile = null;

/**
 * Configura el selector de imágenes con soporte para Android
 */
function setupImageUpload() {
  const imgContainer = document.querySelector(".screen_added .img_container");
  const fileInput = document.getElementById('productImageInput');
  
  // Si no existe, lo creamos
  if (!fileInput) {
    const input = document.createElement("input");
    input.type = "file";
    input.id = "productImageInput";
    input.accept = "image/*";
    input.style.display = "none";
    
    // Importante para Android: capture permite usar cámara
    if (typeof sketchware !== "undefined" || /Android/i.test(navigator.userAgent)) {
      input.setAttribute("capture", "environment"); // "user" para selfie, "environment" para cámara trasera
    }
    
    document.body.appendChild(input);
    
    // Configurar evento change
    input.addEventListener("change", handleImageSelected);
  }
  
  // Quitar eventos anteriores para evitar duplicados
  imgContainer.removeEventListener('click', triggerFileInput);
  imgContainer.addEventListener('click', triggerFileInput);
}

/**
 * Dispara el input file al hacer clic en la imagen
 */
function triggerFileInput() {
  const fileInput = document.getElementById('productImageInput');
  if (fileInput) {
    fileInput.click();
  }
}

/**
 * Maneja la selección de imagen
 */
function handleImageSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  console.log('📸 Imagen seleccionada:', file.name);
  imageFile = file;
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const imgContainer = document.querySelector(".screen_added .img_container");
    imgContainer.innerHTML = `<img src="${e.target.result}" class="product_image_preview">`;
    addProductImage = e.target.result;
    console.log('✅ Imagen cargada correctamente');
  };
  
  reader.onerror = (error) => {
    console.error('❌ Error al leer la imagen:', error);
    showAddProductMessage('Error al cargar la imagen', 'error');
  };
  
  reader.readAsDataURL(file);
}

/**
 * Limpia el formulario después de agregar un producto
 */
function resetAddProductForm() {
  document.querySelector(".input_add_name").value = "";
  document.querySelector(".input_add_cant").value = "";
  document.querySelector(".input_add_price_cost").value = "";

  const imgContainer = document.querySelector(".screen_added .img_container");
  imgContainer.innerHTML = '<i class="bi bi-image"></i>';

  // Resetear el input file
  const fileInput = document.getElementById('productImageInput');
  if (fileInput) {
    fileInput.value = '';
  }
  
  addProductImage = null;
  imageFile = null;
}

/**
 * Muestra un mensaje de error o éxito
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje ('error' o 'success')
 */
function showAddProductMessage(message, type) {
  const oldMessage = document.querySelector(".add_product_message");
  if (oldMessage) oldMessage.remove();

  const messageDiv = document.createElement("div");
  messageDiv.className = `add_product_message ${type}`;
  messageDiv.textContent = message;

  const inputsContainer = document.querySelector(
    ".screen_added .inputs_container"
  );
  inputsContainer.insertBefore(messageDiv, inputsContainer.firstChild);

  setTimeout(() => messageDiv.remove(), 3000);
}

/**
 * Valida los campos del formulario
 * @returns {Object} - Resultado de la validación
 */
function validateAddProductForm() {
  const name = document.querySelector(".input_add_name").value.trim();
  const quantity = document.querySelector(".input_add_cant").value;
  const costPrice = document.querySelector(".input_add_price_cost").value;

  const errors = [];

  if (!name) {
    errors.push("El nombre del producto es obligatorio");
  }

  if (!quantity || quantity <= 0) {
    errors.push("La cantidad debe ser mayor a 0");
  }

  if (!costPrice || costPrice <= 0) {
    errors.push("El precio de costo debe ser mayor a 0");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Agrega un producto a la base de datos
 */
async function handleAddProduct() {
  const validation = validateAddProductForm();

  if (!validation.isValid) {
    showAddProductMessage(validation.errors.join(". "), "error");
    return;
  }

  const name = document.querySelector(".input_add_name").value.trim();
  const quantity = Number(document.querySelector(".input_add_cant").value);
  const costPrice = Number(
    document.querySelector(".input_add_price_cost").value
  );

  // Mostrar indicador de carga (útil en móvil)
  showAddProductMessage('Guardando producto...', 'success');
  
  const product = {
    id: generateId(),
    name: name,
    quantity: quantity,
    costPrice: costPrice,
    image: addProductImage || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await db.addProduct(product);
    showAddProductMessage("Producto agregado correctamente", "success");
    resetAddProductForm();

    const event = new CustomEvent("productAdded", { detail: product });
    document.dispatchEvent(event);
  } catch (error) {
    console.error("Error al agregar producto:", error);
    showAddProductMessage("Error al guardar el producto", "error");
  }
}

/**
 * Configura el listener para el botón de agregar
 */
function setupAddButtonListener() {
  const addButton = document.querySelector(".btn_add_product");
  addButton.removeEventListener("click", handleAddProduct);
  addButton.addEventListener("click", handleAddProduct);
}

/**
 * Configura validación en tiempo real para campos numéricos
 */
function setupInputValidation() {
  const quantityInput = document.querySelector(".input_add_cant");
  const priceInput = document.querySelector(".input_add_price_cost");

  quantityInput.addEventListener("keydown", (e) => {
    if (e.key === "-" || e.key === "e") {
      e.preventDefault();
    }
  });

  priceInput.addEventListener("keydown", (e) => {
    if (e.key === "-" || e.key === "e") {
      e.preventDefault();
    }
  });

  quantityInput.addEventListener("blur", () => {
    let value = Number(quantityInput.value);
    if (value < 0) quantityInput.value = 0;
  });

  priceInput.addEventListener("blur", () => {
    let value = Number(priceInput.value);
    if (value < 0) priceInput.value = 0;
  });
}

/**
 * Inicializa la pantalla de agregar productos
 */
function initAddProductScreen() {
  console.log("Inicializando pantalla de agregar productos...");
  setupImageUpload();
  setupAddButtonListener();
  setupInputValidation();
  resetAddProductForm();
}

// Escuchar cambios de pantalla
document.addEventListener("screenChanged", (e) => {
  if (e.detail.screen === "add") {
    initAddProductScreen();
  }
});

// Inicializar si la pantalla ya está activa
if (document.querySelector(".screen_added.screen_active")) {
  initAddProductScreen();
}