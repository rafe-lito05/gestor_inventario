// app.js - Archivo principal que coordina la navegación y carga los módulos

console.log('🚀 app.js cargado');

let change_option = document.querySelectorAll('.options_icon');
let screens = document.querySelectorAll('.screen');
let appInitialized = false;

/**
 * Función para cambiar de pantalla
 * @param {HTMLElement|number} clickedIcon - Icono clickeado o índice
 * @param {number} iconIndex - Índice del icono (opcional si se pasa el icono)
 */
function changeScreen(clickedIcon, iconIndex) {
    let index;

    if (typeof clickedIcon === 'number') {
        index = clickedIcon;
        clickedIcon = change_option[index];
    } else {
        index = iconIndex;
    }

    if (index === undefined || index < 0 || index >= change_option.length) {
        console.error('Índice de pantalla inválido:', index);
        return;
    }

    change_option.forEach((item) => {
        item.classList.remove('option_active');
    });

    if (clickedIcon) {
        clickedIcon.classList.add('option_active');
    }

    screens.forEach((screen) => {
        screen.classList.remove('screen_active');
    });

    if (screens[index]) {
        screens[index].classList.add('screen_active');

        const headerTitle = document.querySelector('.header_title');
        const titles = ['Salida de Productos', 'Agregar Producto', 'Reporte de Ventas', 'Inventario'];
        headerTitle.textContent = titles[index];

        const screenNames = ['sold', 'add', 'reports', 'stock'];
        const event = new CustomEvent('screenChanged', {
            detail: {
                screen: screenNames[index],
                index: index
            }
        });
        document.dispatchEvent(event);
        
        console.log('📱 Pantalla cambiada a:', screenNames[index]);
    }
}

/**
 * Inicializa la aplicación
 */
async function initApp() {
    console.log('🎯 Inicializando aplicación...');

    try {
        // Inicializar base de datos y esperar a que termine
        await db.init();
        console.log('✅ Base de datos lista');

        // Configurar eventos de los iconos
        change_option.forEach((menu, index) => {
            menu.addEventListener('click', function(e) {
                e.preventDefault();
                changeScreen(this, index);
            });
        });

        // Verificar pantalla inicial
        const activeIcon = document.querySelector('.options_icon.option_active');
        if (activeIcon) {
            const activeIndex = Array.from(change_option).findIndex(icon =>
                icon.classList.contains('option_active')
            );

            if (activeIndex !== -1) {
                screens.forEach((screen) => screen.classList.remove('screen_active'));

                if (screens[activeIndex]) {
                    screens[activeIndex].classList.add('screen_active');

                    const headerTitle = document.querySelector('.header_title');
                    const titles = ['Salida de Productos', 'Agregar Producto', 'Reporte de Ventas', 'Inventario'];
                    headerTitle.textContent = titles[activeIndex];

                    const screenNames = ['sold', 'add', 'reports', 'stock'];
                    const event = new CustomEvent('screenChanged', {
                        detail: {
                            screen: screenNames[activeIndex],
                            index: activeIndex
                        }
                    });
                    
                    // Pequeño retraso para asegurar que todos los listeners estén listos
                    setTimeout(() => {
                        document.dispatchEvent(event);
                    }, 100);
                }
            }
        } else {
            console.log('No hay icono activo, activando pantalla de reportes');
            setTimeout(() => {
                changeScreen(change_option[2], 2);
            }, 200);
        }

        appInitialized = true;
        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        showErrorMessage(error.message);
    }
}

/**
 * Muestra mensaje de error en pantalla
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #ffebee;
        color: #c62828;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.2);
        text-align: center;
        z-index: 9999;
        max-width: 80%;
    `;
    errorDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle" style="font-size: 48px;"></i>
        <p style="margin-top: 10px;">Error al inicializar la base de datos</p>
        <p style="font-size: 12px; margin-top: 5px;">${message}</p>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño retraso para asegurar que todos los scripts estén cargados
    setTimeout(() => {
        initApp();
    }, 100);
});

// Exponer funciones globales
window.app = {
    changeScreen: (index) => {
        if (index >= 0 && index < change_option.length) {
            changeScreen(index);
        }
    },
    reloadData: () => {
        const activeIcon = document.querySelector('.options_icon.option_active');
        if (activeIcon) {
            const activeIndex = Array.from(change_option).findIndex(icon =>
                icon.classList.contains('option_active')
            );
            const screenNames = ['sold', 'add', 'reports', 'stock'];
            const event = new CustomEvent('screenChanged', {
                detail: {
                    screen: screenNames[activeIndex],
                    index: activeIndex
                }
            });
            document.dispatchEvent(event);
        }
    },
    getCurrentScreen: () => {
        const activeIcon = document.querySelector('.options_icon.option_active');
        if (activeIcon) {
            return Array.from(change_option).findIndex(icon =>
                icon.classList.contains('option_active')
            );
        }
        return -1;
    }
};