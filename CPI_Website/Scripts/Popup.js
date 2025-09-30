// Scripts/Popup.js
    (function () {
    const $ = (s, r=document) => r.querySelector(s);
    const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

    const profileBtn = $('.profile-button');
    const profilePop = $('#profile-popup');
    const notifBtn   = $('.notification-button');
    const notifPop   = $('#notification-popup');

    // evita doble binding si este script se carga en varias vistas
    if (document.body.dataset.popupBound === '1') return;
    document.body.dataset.popupBound = '1';

    const closeAll = () => {
        profilePop?.classList.remove('show');
        notifPop?.classList.remove('show');
    };

    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !profilePop?.classList.contains('show');
        closeAll();
        if (willOpen) profilePop?.classList.add('show');
    });

    notifBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !notifPop?.classList.contains('show');
        closeAll();
        if (willOpen) notifPop?.classList.add('show');
    });

    // Cerrar si hago clic por fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-info') && !e.target.closest('.notification')) {
        closeAll();
        }
    });

    // Tecla ESC cierra
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });
    })();
