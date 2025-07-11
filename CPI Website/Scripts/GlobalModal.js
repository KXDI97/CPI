// GlobalModal.js

function createGlobalModals() {
    const modalHTML = `
    <div id="global-modal" class="global-modal-overlay" style="display:none;">
        <div class="global-modal-content">
            <p id="modal-message"></p>
            <div class="global-modal-buttons">
                <button id="confirm-btn">Yes</button>
                <button id="cancel-btn">Cancel</button>
            </div>
        </div>
    </div>

    <div id="help-modal" class="global-modal-overlay" style="display:none;">
        <div class="global-modal-content">
            <h3>Help & Support</h3>
            <p>If you have any issues, please contact support@cpi.com or visit our FAQ page.</p>
            <button id="close-help">Close</button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('cancel-btn').onclick = () => closeModal();
    document.getElementById('close-help').onclick = () => closeHelpModal();
}

function showLogoutModal() {
    document.getElementById('modal-message').innerText = 'Are you sure you want to log out?';
    document.getElementById('confirm-btn').onclick = () => logout();
    document.getElementById('global-modal').style.display = 'flex';
}

function showHelpModal() {
    document.getElementById('help-modal').style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('global-modal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.warn("No se encontró el modal");
    }
}


function closeHelpModal() {
    document.getElementById('help-modal').style.display = 'none';
}

  function logout() {
    localStorage.removeItem("user");
    window.location.href = "../Landing Page/Login.html";
  }


document.addEventListener('DOMContentLoaded', createGlobalModals);
