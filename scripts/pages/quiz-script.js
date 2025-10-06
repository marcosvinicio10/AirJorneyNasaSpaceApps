// Specific script for the quiz page
class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.startTime = null;
        this.selectedAnswer = null;
        this.quizCompleted = false;
        
        this.init();
    }

    init() {
        console.log('Initializing quiz application...');
        this.loadQuestions();
        this.setupEventListeners();
        this.startQuiz();
    }

    loadQuestions() {
        this.questions = [
            {
                id: 1,
                question: "Imagine you're walking down the street and feel the air is 'heavy' and hard to breathe. What invisible pollutant is most likely causing this sensation?",
                category: "Personal Experience",
                options: [
                    "Carbon Dioxide (CO₂) - the gas we exhale",
                    "Particulate Matter (PM2.5) - microscopic particles that enter the lungs",
                    "Oxygen (O₂) - the gas we breathe",
                    "Nitrogen (N₂) - the most abundant gas in the air"
                ],
                correct: 1,
                explanation: "PM2.5 are particles so small they penetrate deep into the lungs, causing that 'heavy air' feeling and difficulty breathing. It's like breathing invisible dust!"
            },
            {
                id: 2,
                question: "You're planning an outdoor activity for your family. What air quality value would you consider safe for children to play in the park?",
                category: "Family Protection",
                options: [
                    "0-50 (Green) - Clean and safe air for everyone",
                    "51-100 (Yellow) - Acceptable, but sensitive people should be careful",
                    "101-150 (Orange) - Unhealthy for sensitive groups",
                    "151-200 (Red) - Unhealthy for everyone"
                ],
                correct: 0,
                explanation: "Values 0-50 (Green) are the only ones considered safe for outdoor activities, especially for children, elderly, and people with respiratory problems. It's when you can breathe deeply without worry!"
            },
            {
                id: 3,
                question: "Your 75-year-old grandmother is worried about air quality in her city. What is the most common impact of air pollution on elderly health?",
                category: "Elderly Impact",
                options: [
                    "Improved lung capacity",
                    "Increased risk of heart attacks and strokes",
                    "Strengthened immune system",
                    "Reduced blood pressure"
                ],
                correct: 1,
                explanation: "Air pollution significantly increases the risk of cardiovascular problems in the elderly, including heart attacks and strokes. That's why polluted air days are especially dangerous for our grandparents."
            },
            {
                id: 4,
                question: "You're driving to work every day and worry about your contribution to pollution. What daily action would have the greatest positive impact on air quality?",
                category: "Personal Action",
                options: [
                    "Use car air conditioning less",
                    "Choose public transportation or bicycle 2-3 times a week",
                    "Change car air filter monthly",
                    "Drive slower to save fuel"
                ],
                correct: 1,
                explanation: "Reducing individual car use is the most impactful action. Every trip you take by bus, subway, or bicycle means fewer pollutants in the air we all breathe!"
            },
            {
                id: 5,
                question: "Reflecting on what you learned in AirJorney, how many people in the world breathe air that doesn't meet WHO safe standards?",
                category: "Global Awareness",
                options: [
                    "1 in 10 people (10%)",
                    "1 in 4 people (25%)",
                    "9 in 10 people (90%)",
                    "All people (100%)"
                ],
                correct: 2,
                explanation: "Incredibly, 9 in 10 people in the world breathe air that doesn't meet WHO safe standards. This means almost all of us, including you and your family, are exposed to dangerous levels of air pollution."
            }
        ];
        
        console.log(`${this.questions.length} questions loaded`);
    }

    setupEventListeners() {
        // Event listeners for answer buttons using event delegation
        document.addEventListener('click', (e) => {
            // Check if click was on .answer-option element or its children
            const answerOption = e.target.closest('.answer-option');
            if (answerOption) {
                this.selectAnswer(parseInt(answerOption.dataset.index));
            }
        });

        // Event listeners for control buttons
        const nextBtn = document.getElementById('next-btn');
        const skipBtn = document.getElementById('skip-btn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextQuestion();
            });
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.skipQuestion();
            });
        }
    }

    startQuiz() {
        console.log('Starting quiz...');
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.startTime = Date.now();
        this.quizCompleted = false;
        this.selectedAnswer = null;
        
        this.showQuestion();
        this.updateProgress();
    }

    showQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.showResults();
            return;
        }

        const question = this.questions[this.currentQuestion];
        console.log(`Showing question ${this.currentQuestion + 1}: ${question.question}`);
        
        // Update interface elements
        document.getElementById('question-text').textContent = question.question;
        document.getElementById('question-category').textContent = question.category;
        
        // Create answer options
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = 'answer-option';
            answerElement.dataset.index = index;
            answerElement.innerHTML = `
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${option}</span>
            `;
            answersContainer.appendChild(answerElement);
        });
        
        // Reset selection and state
        this.selectedAnswer = null;
        this.quizCompleted = false;
        this.updateNextButton();
    }

    selectAnswer(answerIndex) {
        console.log(`Answer selected: ${answerIndex}`);
        
        // Remove previous selection
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Mark new selection
        const selectedOption = document.querySelector(`[data-index="${answerIndex}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        this.selectedAnswer = answerIndex;
        this.updateNextButton();
    }

    updateNextButton() {
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.disabled = this.selectedAnswer === null || this.quizCompleted;
        }
    }

    nextQuestion() {
        if (this.selectedAnswer === null || this.quizCompleted) {
            console.log('Next question blocked - no answer or already processed');
            return;
        }
        
        // Prevent multiple executions
        this.quizCompleted = true;
        
        const question = this.questions[this.currentQuestion];
        const isCorrect = this.selectedAnswer === question.correct;
        
        console.log(`Question ${this.currentQuestion + 1}: Answer ${isCorrect ? 'Correct' : 'Incorrect'} (${this.correctAnswers} correct so far)`);
        
        if (isCorrect) {
            this.correctAnswers++;
            this.score += 100;
            console.log(`Correct! Total: ${this.correctAnswers} correct, ${this.score} points`);
        }
        
        // Show visual feedback
        this.showAnswerFeedback(isCorrect);
        
        // Advance to next question after delay
        setTimeout(() => {
            this.currentQuestion++;
            this.quizCompleted = false; // Reactivate for next question
            this.updateProgress();
            this.showQuestion();
        }, 1500);
    }

    showAnswerFeedback(isCorrect) {
        const selectedOption = document.querySelector(`[data-index="${this.selectedAnswer}"]`);
        if (selectedOption) {
            selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        
        // Highlight correct answer
        const correctOption = document.querySelector(`[data-index="${this.questions[this.currentQuestion].correct}"]`);
        if (correctOption && !isCorrect) {
            correctOption.classList.add('correct');
        }
    }

    skipQuestion() {
        console.log('Question skipped');
        this.currentQuestion++;
        this.updateProgress();
        this.showQuestion();
    }

    updateProgress() {
        const progress = (this.currentQuestion / this.questions.length) * 100;
        document.getElementById('quiz-progress').style.width = `${progress}%`;
        document.getElementById('question-counter').textContent = `${this.currentQuestion + 1} of ${this.questions.length}`;
    }

    showResults() {
        console.log('Showing results...');
        this.quizCompleted = true;
        
        const endTime = Date.now();
        const totalTime = Math.round((endTime - this.startTime) / 1000);
        
        // Ensure values are valid
        const validCorrectAnswers = Math.max(0, Math.min(this.correctAnswers, this.questions.length));
        const accuracy = this.questions.length > 0 ? Math.round((validCorrectAnswers / this.questions.length) * 100) : 0;
        const finalScore = validCorrectAnswers * 100;
        
        console.log(`Results: ${validCorrectAnswers}/${this.questions.length} correct, ${accuracy}% accuracy, ${finalScore} points`);
        
        // Update result elements
        document.getElementById('final-score').textContent = finalScore;
        document.getElementById('correct-answers').textContent = `${validCorrectAnswers}/${this.questions.length}`;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('quiz-time').textContent = `${totalTime}s`;
        
        // Determine medal
        const medal = this.calculateMedal(accuracy);
        this.showMedal(medal);
        
        // Update statistics
        this.updateStats();
        
        // Show results screen
        document.getElementById('question-container').style.display = 'none';
        document.getElementById('results-screen').style.display = 'block';
        
        // Hide quiz controls
        const quizControls = document.querySelector('.quiz-controls');
        if (quizControls) {
            quizControls.style.display = 'none';
        }
    }

    calculateMedal(accuracy) {
        if (accuracy >= 90) {
            return { icon: '🥇', name: 'Gold', description: 'Excellent! You are an air quality expert!' };
        } else if (accuracy >= 70) {
            return { icon: '🥈', name: 'Silver', description: 'Very good! Keep learning about air quality!' };
        } else if (accuracy >= 50) {
            return { icon: '🥉', name: 'Bronze', description: 'Good start! Keep studying to improve!' };
        } else {
            return { icon: '📚', name: 'Student', description: 'Keep studying! Knowledge about air quality is important!' };
        }
    }

    showMedal(medal) {
        document.querySelector('.medal-icon').textContent = medal.icon;
        document.querySelector('.medal-text').textContent = medal.name;
        document.getElementById('medal-description').textContent = medal.description;
    }

    updateStats() {
        // Update local statistics (simplified implementation)
        const stats = this.getStats();
        document.getElementById('streak').textContent = stats.streak;
        document.getElementById('best-score').textContent = stats.bestScore;
        document.getElementById('total-quizzes').textContent = stats.totalQuizzes;
    }

    getStats() {
        // Retrieve statistics from localStorage
        const stats = JSON.parse(localStorage.getItem('quizStats') || '{"streak": 0, "bestScore": 0, "totalQuizzes": 0}');
        
        // Update statistics
        stats.totalQuizzes++;
        if (this.score > stats.bestScore) {
            stats.bestScore = this.score;
        }
        if (this.correctAnswers === this.questions.length) {
            stats.streak++;
        } else {
            stats.streak = 0;
        }
        
        // Save statistics
        localStorage.setItem('quizStats', JSON.stringify(stats));
        
        return stats;
    }

    restartQuiz() {
        console.log('Restarting quiz...');
        document.getElementById('results-screen').style.display = 'none';
        document.getElementById('question-container').style.display = 'block';
        
        // Show quiz controls again
        const quizControls = document.querySelector('.quiz-controls');
        if (quizControls) {
            quizControls.style.display = 'flex';
        }
        
        // Complete reset of all variables
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.startTime = Date.now();
        this.quizCompleted = false;
        this.selectedAnswer = null;
        
        this.showQuestion();
        this.updateProgress();
    }
}

// Funções globais para os botões
function nextQuestion() {
    if (window.quizApp) {
        window.quizApp.nextQuestion();
    }
}

function skipQuestion() {
    if (window.quizApp) {
        window.quizApp.skipQuestion();
    }
}

function restartQuiz() {
    if (window.quizApp) {
        window.quizApp.restartQuiz();
    }
}

// Inicializar aplicação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página do quiz carregada');
    window.quizApp = new QuizApp();
});
