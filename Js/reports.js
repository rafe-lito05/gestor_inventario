// reports.js - Lógica de la pantalla de reportes

console.log('📊 reports.js cargado');

let currentFilter = "all";
let currentSales = [];
let dbReady = false;

/**
 * Espera a que la base de datos esté lista
 */
async function waitForDB() {
    console.log('Esperando base de datos...');
    while (!db.db) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('✅ Base de datos lista');
    dbReady = true;
}

/**
 * Inicializa la pantalla de reportes
 */
async function initReportsScreen() {
    console.log("Inicializando pantalla de reportes...");
    
    if (!db.db) {
        console.log('DB no lista, esperando...');
        await waitForDB();
    }
    
    setupFilterListeners();
    await loadSalesReport("all");
}

/**
 * Configura los listeners de los filtros
 */
function setupFilterListeners() {
    const filters = document.querySelectorAll(".filter");
    
    filters.forEach((filter) => {
        // Eliminar listeners anteriores para evitar duplicados
        filter.removeEventListener('click', handleFilterClick);
        filter.addEventListener('click', handleFilterClick);
    });
}

/**
 * Manejador de clic en filtros
 */
async function handleFilterClick(e) {
    const filter = e.currentTarget;
    const filters = document.querySelectorAll(".filter");
    
    filters.forEach((f) => f.classList.remove("active_filter"));
    filter.classList.add("active_filter");

    const filterText = filter
        .querySelector(".filter_text")
        .textContent.toLowerCase();

    if (filterText.includes("todos")) {
        await loadSalesReport("all");
    } else if (filterText.includes("hoy")) {
        await loadSalesReport("today");
    } else if (filterText.includes("semana")) {
        await loadSalesReport("week");
    } else if (filterText.includes("mes")) {
        await loadSalesReport("month");
    }
}

/**
 * Carga el reporte de ventas según el filtro
 * @param {string} filter - Tipo de filtro
 */
async function loadSalesReport(filter) {
    console.log('Cargando reporte:', filter);
    currentFilter = filter;

    try {
        // Verificar DB antes de usarla
        if (!db.db) {
            console.log('DB no lista, esperando...');
            await waitForDB();
        }
        
        let sales = [];

        switch (filter) {
            case "today":
                const todayRange = getTodayRange();
                sales = await db.getSalesByDateRange(todayRange.start, todayRange.end);
                break;

            case "week":
                const weekRange = getWeekRange();
                sales = await db.getSalesByDateRange(weekRange.start, weekRange.end);
                break;

            case "month":
                const monthRange = getMonthRange();
                sales = await db.getSalesByDateRange(monthRange.start, monthRange.end);
                break;

            default:
                sales = await db.getSales();
                break;
        }

        console.log(`📦 Cargadas ${sales.length} ventas`);
        currentSales = sales;
        updateTotals(sales);
        renderSalesTable(sales);
    } catch (error) {
        console.error("❌ Error al cargar reporte:", error);
        showReportsMessage("Error al cargar los datos", "error");
    }
}

/**
 * Actualiza los totales en la pantalla
 * @param {Array} sales - Lista de ventas
 */
function updateTotals(sales) {
    const totals = db.calculateSalesTotals(sales);

    document.querySelector(".total_sold_mount").textContent = totals.totalSold;
    document.querySelector(".total_profit_mount").textContent = formatCurrency(totals.totalProfit);
}

/**
 * Renderiza la tabla de ventas
 * @param {Array} sales - Lista de ventas
 */
function renderSalesTable(sales) {
    const tableContainer = document.querySelector(".table_container");

    if (!sales || sales.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty_report_message">
                <i class="bi bi-file-earmark-text" style="font-size: 48px; color: #ccc;"></i>
                <p>No hay ventas en este período</p>
            </div>
        `;
        return;
    }

    const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

    let tableHtml = `
        <table class="sales_table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>P. Costo</th>
                    <th>P. Venta</th>
                    <th>Ganancia</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedSales.forEach((sale) => {
        const profitClass = sale.profit >= 0 ? "profit_positive" : "profit_negative";

        tableHtml += `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td title="${sale.productName}">${truncateText(sale.productName, 20)}</td>
                <td class="text-center">${sale.quantity}</td>
                <td class="text-right">${formatCurrency(sale.costPrice)}</td>
                <td class="text-right">${formatCurrency(sale.salePrice)}</td>
                <td class="text-right ${profitClass}">${formatCurrency(sale.profit)}</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="text-right"><strong>Totales:</strong></td>
                    <td class="text-right"><strong>${formatCurrency(calculateTotalCost(sales))}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(calculateTotalRevenue(sales))}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(calculateTotalProfit(sales))}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    tableContainer.innerHTML = tableHtml;
}

/**
 * Trunca texto largo
 * @param {string} text - Texto a truncar
 * @param {number} length - Longitud máxima
 * @returns {string} - Texto truncado
 */
function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + "..." : text;
}

/**
 * Calcula el costo total de las ventas
 * @param {Array} sales - Lista de ventas
 * @returns {number} - Costo total
 */
function calculateTotalCost(sales) {
    return sales.reduce((total, sale) => total + sale.costPrice * sale.quantity, 0);
}

/**
 * Calcula el ingreso total de las ventas
 * @param {Array} sales - Lista de ventas
 * @returns {number} - Ingreso total
 */
function calculateTotalRevenue(sales) {
    return sales.reduce((total, sale) => total + sale.salePrice * sale.quantity, 0);
}

/**
 * Calcula la ganancia total de las ventas
 * @param {Array} sales - Lista de ventas
 * @returns {number} - Ganancia total
 */
function calculateTotalProfit(sales) {
    return sales.reduce((total, sale) => total + sale.profit, 0);
}

/**
 * Muestra un mensaje en la pantalla de reportes
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje
 */
function showReportsMessage(message, type) {
    const oldMessage = document.querySelector(".reports_message");
    if (oldMessage) oldMessage.remove();

    const messageDiv = document.createElement("div");
    messageDiv.className = `reports_message ${type}`;
    messageDiv.textContent = message;

    messageDiv.style.cssText = `
        width: 90%;
        padding: 10px;
        border-radius: 5px;
        text-align: center;
        margin: 10px auto;
        font-size: 14px;
        ${type === "error"
            ? "background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2;"
            : "background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;"
        }
    `;

    const reportContainer = document.querySelector(".report_container");
    reportContainer.parentNode.insertBefore(messageDiv, reportContainer.nextSibling);

    setTimeout(() => messageDiv.remove(), 3000);
}

/**
 * Exporta el reporte actual a CSV
 */
function exportToCSV() {
    if (currentSales.length === 0) {
        showReportsMessage("No hay datos para exportar", "error");
        return;
    }

    let csvContent = "Fecha,Producto,Cantidad,Precio Costo,Precio Venta,Ganancia\n";

    currentSales.forEach((sale) => {
        const row = [
            formatDate(sale.date),
            `"${sale.productName}"`,
            sale.quantity,
            sale.costPrice,
            sale.salePrice,
            sale.profit,
        ].join(",");
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${currentFilter}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Agrega botón de exportar a la pantalla de reportes
 */
function addExportButton() {
    const reportContainer = document.querySelector(".report_container");
    if (!reportContainer) return;

    const exportBtn = document.createElement("button");
    exportBtn.className = "btn btn_export";
    exportBtn.innerHTML = '<i class="bi bi-download"></i> Exportar Reporte';

    exportBtn.addEventListener("click", exportToCSV);

    reportContainer.parentNode.insertBefore(exportBtn, reportContainer.nextSibling);
}

// Agregar botón de exportar al cargar
document.addEventListener('DOMContentLoaded', addExportButton);

// Escuchar cambios de pantalla
document.addEventListener("screenChanged", (e) => {
    console.log('Evento screenChanged en reports:', e.detail);
    if (e.detail.screen === "reports") {
        initReportsScreen();
    }
});

// Escuchar nuevas ventas
document.addEventListener("saleRegistered", () => {
    if (document.querySelector(".screen_report.screen_active")) {
        loadSalesReport(currentFilter);
    }
});

// Inicializar si la pantalla ya está activa
if (document.querySelector(".screen_report.screen_active")) {
    // Pequeño retraso para asegurar que app.js inicializó la DB
    setTimeout(() => {
        initReportsScreen();
    }, 500);
}