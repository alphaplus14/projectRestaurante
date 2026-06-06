import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

function isDarkMode() {
    return document.documentElement.classList.contains('dark');
}

/**
 * Pide confirmación antes de cerrar sesión del personal.
 * @returns {Promise<boolean>}
 */
export async function confirmStaffLogout() {
    const dark = isDarkMode();
    const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: 'Saldrás de tu panel. Tendrás que volver a iniciar sesión para entrar.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: dark ? '#44403c' : '#a8a29e',
        reverseButtons: true,
        focusCancel: true,
        background: dark ? '#1c1917' : '#fafaf9',
        color: dark ? '#fafaf9' : '#1c1917',
        customClass: {
            popup: 'rounded-xl border border-stone-200 dark:border-stone-700',
            title: 'text-stone-900 dark:text-stone-50',
            htmlContainer: 'text-stone-600 dark:text-stone-300',
        },
    });

    return result.isConfirmed === true;
}
