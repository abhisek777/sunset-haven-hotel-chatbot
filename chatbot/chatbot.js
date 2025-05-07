// Chatbot state management
const chatState = {
    currentStep: 0,
    answers: {},
    isProcessing: false
};

// Questions configuration
const questions = [
    {
        id: 'welcome',
        text: 'Welcome to Grand Azure Hotel! I\'m here to help you book your perfect stay. May I know your name?',
        key: 'name',
        required: true,
        validate: (input) => input.trim().length > 0 ? true : 'Please enter your name'
    },
    {
        id: 'checkin',
        text: 'When would you like to check in?',
        key: 'checkin',
        required: true,
        validate: (input) => {
            const date = new Date(input);
            const today = new Date();
            return date >= today ? true : 'Please select a future date';
        }
    },
    {
        id: 'checkout',
        text: 'And when will you be checking out?',
        key: 'checkout',
        required: true,
        validate: (input) => {
            const checkout = new Date(input);
            const checkin = new Date(chatState.answers.checkin);
            return checkout > checkin ? true : 'Check-out date must be after check-in date';
        }
    },
    {
        id: 'guests',
        text: 'How many guests will be staying?',
        key: 'guests',
        required: true,
        validate: (input) => {
            const num = parseInt(input);
            return num > 0 && num <= 4 ? true : 'Please enter a number between 1 and 4';
        }
    },
    {
        id: 'breakfast',
        text: 'Would you like to add breakfast to your stay? (yes/no)',
        key: 'breakfast',
        required: false,
        validate: (input) => {
            const answer = input.toLowerCase();
            return answer === 'yes' || answer === 'no' ? true : 'Please answer with yes or no';
        }
    },
    {
        id: 'payment',
        text: 'What\'s your preferred payment method? (credit card/paypal)',
        key: 'payment',
        required: false,
        validate: (input) => {
            const method = input.toLowerCase();
            return method === 'credit card' || method === 'paypal' ? true : 'Please choose credit card or paypal';
        }
    }
];

// Initialize chatbot
function initChat(elements) {
    const { chatWindow, userInput, sendButton, resetButton } = elements;
    
    chatState.currentStep = 0;
    chatState.answers = {};
    chatWindow.innerHTML = '';
    addMessage(questions[0].text, 'bot', false, chatWindow);
    loadFromLocalStorage(elements);

    // Set up event listeners
    sendButton.addEventListener('click', () => handleInput(elements));
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleInput(elements);
        }
    });
    resetButton.addEventListener('click', () => {
        localStorage.removeItem('chatState');
        initChat(elements);
    });

    // Handle input formatting
    userInput.addEventListener('input', () => {
        const currentQuestion = questions[chatState.currentStep];
        if (currentQuestion && (currentQuestion.key === 'checkin' || currentQuestion.key === 'checkout')) {
            userInput.setAttribute('pattern', '\\d{4}-\\d{2}-\\d{2}');
            userInput.setAttribute('placeholder', 'YYYY-MM-DD');
        } else {
            userInput.removeAttribute('pattern');
            userInput.setAttribute('placeholder', 'Type your response...');
        }
    });
}

// Add message to chat window
function addMessage(text, sender, isError = false, chatWindow) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    if (isError) {
        messageDiv.className += ' error-message';
    }
    messageDiv.textContent = text;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageDiv;
}

// Show typing indicator
function showTypingIndicator(chatWindow) {
    if (!chatWindow) {
        console.error('showTypingIndicator: chatWindow is undefined');
        return null;
    }
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatWindow.appendChild(indicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return indicator;
}

// Handle user input
function handleInput(elements) {
    try {
        const { chatWindow, userInput, sendButton, resetButton } = elements;
        
        if (chatState.isProcessing) return;

        const input = userInput.value.trim();
        if (!input) return;

        chatState.isProcessing = true;
        const currentQuestion = questions[chatState.currentStep];

        // Add user message to chat
        addMessage(input, 'user', false, chatWindow);
        userInput.value = '';

        // Validate input
        const validationResult = currentQuestion.validate(input);
        if (validationResult !== true) {
            addMessage(validationResult, 'bot', true, chatWindow);
            chatState.isProcessing = false;
            return;
        }

        // Store answer
        chatState.answers[currentQuestion.key] = input;

        // Show typing indicator
        const indicator = showTypingIndicator(chatWindow);

        // Process next step after a delay
        setTimeout(() => {
            try {
                // Remove typing indicator
                indicator.remove();

                // Move to next question or show summary
                chatState.currentStep++;
                
                if (chatState.currentStep < questions.length) {
                    const nextQuestion = questions[chatState.currentStep];
                    addMessage(nextQuestion.text, 'bot', false, chatWindow);
                    
                    // Update input placeholder for date fields
                    if (nextQuestion.key === 'checkin' || nextQuestion.key === 'checkout') {
                        userInput.setAttribute('placeholder', 'YYYY-MM-DD');
                        userInput.setAttribute('pattern', '\\d{4}-\\d{2}-\\d{2}');
                    } else {
                        userInput.removeAttribute('pattern');
                        userInput.setAttribute('placeholder', 'Type your response...');
                    }
                } else {
                    showBookingSummary(chatWindow);
                }

                chatState.isProcessing = false;
                saveToLocalStorage();
            } catch (error) {
                console.error('Error in chat processing:', error);
                addMessage(`Sorry, there was an error processing your request: ${error.message}`, 'bot', true, chatWindow);
                chatState.isProcessing = false;
            }
        }, 1000);
    } catch (error) {
        console.error('Error in handleInput:', error);
        if (elements && elements.chatWindow) {
            addMessage('Sorry, something went wrong. Please try again.', 'bot', true, elements.chatWindow);
        }
        chatState.isProcessing = false;
    }
}

// Show booking summary
async function sendBookingToBackend(bookingData) {
    try {
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending booking to backend:', error);
        throw error;
    }
}

function showBookingSummary(chatWindow) {
    const summary = document.createElement('div');
    summary.className = 'booking-summary';
    
    summary.innerHTML = `
        <h3>Booking Summary</h3>
        <div class="summary-item">
            <span>Name:</span>
            <span>${chatState.answers.name}</span>
        </div>
        <div class="summary-item">
            <span>Check-in:</span>
            <span>${new Date(chatState.answers.checkin).toLocaleDateString()}</span>
        </div>
        <div class="summary-item">
            <span>Check-out:</span>
            <span>${new Date(chatState.answers.checkout).toLocaleDateString()}</span>
        </div>
        <div class="summary-item">
            <span>Guests:</span>
            <span>${chatState.answers.guests}</span>
        </div>
        ${chatState.answers.breakfast ? `
        <div class="summary-item">
            <span>Breakfast:</span>
            <span>${chatState.answers.breakfast}</span>
        </div>
        ` : ''}
        ${chatState.answers.payment ? `
        <div class="summary-item">
            <span>Payment Method:</span>
            <span>${chatState.answers.payment}</span>
        </div>
        ` : ''}
    `;

    chatWindow.appendChild(summary);

    // Prepare booking data
    const bookingData = {
        name: chatState.answers.name,
        checkin: chatState.answers.checkin,
        checkout: chatState.answers.checkout,
        guests: parseInt(chatState.answers.guests),
        breakfast: chatState.answers.breakfast || '',
        payment: chatState.answers.payment || ''
    };

    // Send booking to backend
    sendBookingToBackend(bookingData)
        .then(response => {
            if (response.bookingId) {
                addMessage(`Booking confirmed! Your booking ID is: ${response.bookingId}`, 'bot', false, chatWindow);
            } else {
                throw new Error('No booking ID received');
            }
        })
        .catch(error => {
            console.error('Error saving booking:', error);
            addMessage('There was an error saving your booking. Please try again later.', 'bot', true, chatWindow);
        });

    addMessage("Thank you for booking with Grand Azure Hotel! We've sent a confirmation email with your booking details.", 'bot');
}

// Local Storage functions
function saveToLocalStorage() {
    localStorage.setItem('chatState', JSON.stringify(chatState));
}

function loadFromLocalStorage(elements) {
    const { chatWindow } = elements;
    const saved = localStorage.getItem('chatState');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentStep < questions.length) {
            Object.assign(chatState, parsed);
            // Replay the conversation
            Object.entries(chatState.answers).forEach(([key, value]) => {
                addMessage(value, 'user', false, chatWindow);
                const question = questions.find(q => q.key === key);
                if (question) {
                    addMessage(question.text, 'bot', false, chatWindow);
                }
            });
        }
    }
}

// Initialize the chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const elements = {
        chatWindow: document.getElementById('chat-window'),
        userInput: document.getElementById('user-input'),
        sendButton: document.getElementById('send-button'),
        resetButton: document.getElementById('reset-button')
    };

    if (!elements.chatWindow || !elements.userInput || !elements.sendButton || !elements.resetButton) {
        console.error('Required DOM elements not found');
        return;
    }

    // Initialize chat with DOM elements
    initChat(elements);
});

// Add error handling for initialization
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    addMessage('Sorry, something went wrong. Please refresh the page.', 'bot', true);
});
