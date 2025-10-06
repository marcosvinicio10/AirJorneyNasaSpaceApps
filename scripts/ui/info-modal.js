// ===== MODAL DE INFORMAÇÕES =====
// Este arquivo gerencia o modal de informações do globo

// Configurar modal de informações
function setupInfoModal() {
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const closeBtn = document.getElementById('close-info');

    if (infoBtn && infoModal && closeBtn) {
        // Abrir modal
        infoBtn.addEventListener('click', () => {
            infoModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        });

        // Fechar modal
        closeBtn.addEventListener('click', () => {
            infoModal.classList.remove('show');
            document.body.style.overflow = 'auto'; // Restaurar scroll
        });

        // Fechar modal clicando fora
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                infoModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && infoModal.classList.contains('show')) {
                infoModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });
    }
}

