/**
 * Slide System for Importance Page
 * Controls navigation between slides with animations
 */

class ImportanceSlides {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 5;
        this.slides = document.querySelectorAll('.slide');
        this.prevBtn = document.getElementById('prev-slide');
        this.nextBtn = document.getElementById('next-slide');
        this.finalBtn = document.getElementById('final-btn');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.setupKeyboardNavigation();
    }

    setupEventListeners() {
        // Previous button
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousSlide());
        }

        // Next button
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Final button
        if (this.finalBtn) {
            this.finalBtn.addEventListener('click', () => {
                window.location.href = 'globe.html';
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        });

        // Scroll navigation removed
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Avoid conflict with other elements
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToSlide(1);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.totalSlides);
                    break;
            }
        });
    }

    setupScrollNavigation() {
        // Scroll navigation removed - only button navigation
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    previousSlide() {
        if (this.currentSlide > 1) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    goToSlide(slideNumber) {
        if (slideNumber < 1 || slideNumber > this.totalSlides) {
            return;
        }

        // Remove active class from current slide
        const currentSlideElement = document.querySelector(`.slide[data-slide="${this.currentSlide}"]`);
        if (currentSlideElement) {
            currentSlideElement.classList.remove('active');
        }

        // Add active class to new slide
        const newSlideElement = document.querySelector(`.slide[data-slide="${slideNumber}"]`);
        if (newSlideElement) {
            newSlideElement.classList.add('active');
        }

        this.currentSlide = slideNumber;
        this.updateUI();
    }

    updateUI() {
        // Update buttons
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentSlide === 1;
        }

        if (this.nextBtn && this.finalBtn) {
            if (this.currentSlide === this.totalSlides) {
                this.nextBtn.style.display = 'none';
                this.finalBtn.style.display = 'flex';
            } else {
                this.nextBtn.style.display = 'flex';
                this.finalBtn.style.display = 'none';
            }
        }
    }

    // Public methods for external control
    getCurrentSlide() {
        return this.currentSlide;
    }

    getTotalSlides() {
        return this.totalSlides;
    }

    isFirstSlide() {
        return this.currentSlide === 1;
    }

    isLastSlide() {
        return this.currentSlide === this.totalSlides;
    }
}

// Initialize the system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure all elements are loaded
    setTimeout(() => {
        window.importanceSlides = new ImportanceSlides();
        console.log('🎯 Importance page slide system initialized');
    }, 100);
});

// Make the class globally available
window.ImportanceSlides = ImportanceSlides;
