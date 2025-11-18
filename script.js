// State Management
let botConfig = {
    name: '',
    businessName: '',
    phoneNumber: '',
    welcomeMessage: '',
    fallbackMessage: '',
    responseStyle: 'professional',
    language: 'en',
    responseDelay: 1,
    confidenceThreshold: 75,
    enableEmojis: true,
    enableTyping: true,
    enableQuickReplies: true,
    enableHumanHandoff: true,
    enableAnalytics: true
};

let faqs = [];
let templates = [];
let testResults = {
    accuracyScore: 0,
    responseTime: 0,
    handoffRate: 0,
    satisfactionScore: 0
};
let currentFAQ = null;
let isProcessing = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadTheme();
    loadSampleData();
    updateDeploymentSummary();
});

// Event Listeners
function initializeEventListeners() {
    // Range inputs
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const valueSpan = e.target.parentElement.querySelector('.range-value');
            if (valueSpan) {
                const suffix = e.target.id === 'responseDelay' ? 's' : '%';
                valueSpan.textContent = e.target.value + suffix;
            }

            // Update bot config
            if (e.target.id === 'responseDelay') {
                botConfig.responseDelay = parseFloat(e.target.value);
            } else if (e.target.id === 'confidenceThreshold') {
                botConfig.confidenceThreshold = parseInt(e.target.value);
            }
        });
    });

    // Form inputs
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', handleFormChange);
    });

    // FAQ search
    const faqSearch = document.getElementById('faqSearch');
    if (faqSearch) {
        faqSearch.addEventListener('input', handleFAQSearch);
    }

    // Filter controls
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    if (categoryFilter) categoryFilter.addEventListener('change', handleFilterChange);
    if (statusFilter) statusFilter.addEventListener('change', handleFilterChange);

    // Test input
    const testInput = document.getElementById('testInput');
    if (testInput) {
        testInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendTestMessage();
            }
        });
    }

    // Quick replies checkbox
    const enableQuickReplies = document.getElementById('enableQuickReplies');
    if (enableQuickReplies) {
        enableQuickReplies.addEventListener('change', (e) => {
            const quickRepliesGroup = document.getElementById('quickRepliesGroup');
            if (quickRepliesGroup) {
                quickRepliesGroup.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }

    // Template inputs
    const templateContent = document.getElementById('templateContent');
    if (templateContent) {
        templateContent.addEventListener('input', updateTemplatePreview);
    }

    const quickReplies = document.getElementById('quickReplies');
    if (quickReplies) {
        quickReplies.addEventListener('input', updateTemplatePreview);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            addFAQ();
        }
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            showTemplates();
        }
        if (e.key === 'Escape') {
            hideLoading();
        }
    });
}

// Theme Management
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle i');

    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeToggle.classList.remove('fa-sun');
        themeToggle.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.classList.remove('fa-moon');
        themeToggle.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.querySelector('.theme-toggle i');

    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.classList.remove('fa-moon');
        themeToggle.classList.add('fa-sun');
    }
}

// Sample Data
function loadSampleData() {
    // Sample FAQs
    faqs = [
        {
            id: 1,
            question: "What are your working hours?",
            answer: "We're open Monday to Friday, 9 AM to 6 PM. We're closed on weekends and public holidays.",
            category: "general",
            keywords: ["hours", "timing", "schedule", "open", "close"],
            status: "active",
            quickReplies: ["Thank you", "More questions", "Contact support"]
        },
        {
            id: 2,
            question: "How can I place an order?",
            answer: "You can place an order through our website, mobile app, or by calling our hotline. We accept payments via card, bank transfer, and mobile money.",
            category: "products",
            keywords: ["order", "buy", "purchase", "payment"],
            status: "active",
            quickReplies: ["Website link", "Call support", "Other payment methods"]
        },
        {
            id: 3,
            question: "What payment methods do you accept?",
            answer: "We accept Visa, Mastercard, American Express, bank transfers, and popular mobile money services like PayPal, Apple Pay, and Google Pay.",
            category: "pricing",
            keywords: ["payment", "card", "money", "transfer"],
            status: "active",
            quickReplies: ["Card details", "Mobile money", "Bank info"]
        },
        {
            id: 4,
            question: "How long does delivery take?",
            answer: "Standard delivery takes 3-5 business days. Express delivery (available in major cities) takes 1-2 business days. International shipping takes 7-14 days.",
            category: "shipping",
            keywords: ["delivery", "shipping", "time", "arrival"],
            status: "active",
            quickReplies: ["Track order", "Express delivery", "International rates"]
        },
        {
            id: 5,
            question: "What's your return policy?",
            answer: "We offer a 30-day return policy for unused items in original packaging. Digital products have a 7-day return window. Please contact our support team to initiate a return.",
            category: "returns",
            keywords: ["return", "refund", "exchange", "policy"],
            status: "active",
            quickReplies: ["Start return", "Refund status", "Exchange options"]
        }
    ];

    // Sample templates
    templates = [
        {
            name: "welcome_message",
            category: "utility",
            content: "Hello {{1}}, welcome to {{2}}! How can we help you today?",
            quickReplies: ["Shop now", "Track order", "Contact support"]
        },
        {
            name: "order_confirmation",
            category: "utility",
            content: "Your order {{1}} has been confirmed! Total: {{2}}. Estimated delivery: {{3}}",
            quickReplies: ["Track order", "Modify order", "Customer service"]
        },
        {
            name: "appointment_reminder",
            category: "utility",
            content: "Reminder: You have an appointment with {{1}} on {{2}} at {{3}}",
            quickReplies: ["Confirm", "Reschedule", "Cancel"]
        }
    ];

    renderFAQList();
}

// Form Handling
function handleFormChange(event) {
    const { id, value, type } = event.target;

    if (id in botConfig) {
        botConfig[id] = type === 'checkbox' ? event.target.checked : value;
    }

    // Update deployment summary
    updateDeploymentSummary();
}

function formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length > 0 && !value.startsWith('234')) {
        value = '234' + value;
    }

    if (value.length <= 3) {
        event.target.value = value;
    } else if (value.length <= 6) {
        event.target.value = `${value.slice(0, 3)} ${value.slice(3)}`;
    } else if (value.length <= 10) {
        event.target.value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
    } else {
        event.target.value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 10)} ${value.slice(10, 13)}`;
    }
}

// FAQ Management
function renderFAQList(filteredFAQs = faqs) {
    const faqList = document.getElementById('faqList');
    if (!faqList) return;

    if (filteredFAQs.length === 0) {
        faqList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-question-circle"></i>
                <p>No FAQs found. Add your first FAQ to get started!</p>
                <button class="btn btn-primary" onclick="addFAQ()">
                    <i class="fas fa-plus"></i> Add FAQ
                </button>
            </div>
        `;
        return;
    }

    faqList.innerHTML = filteredFAQs.map(faq => `
        <div class="faq-item" data-faq-id="${faq.id}">
            <div class="faq-header">
                <div class="faq-question">${faq.question}</div>
                <div class="faq-meta">
                    <span class="category-badge">${faq.category}</span>
                    <span>${faq.status}</span>
                </div>
            </div>
            <div class="faq-answer">${faq.answer}</div>
            ${faq.keywords.length > 0 ? `
                <div class="faq-keywords">
                    ${faq.keywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
                </div>
            ` : ''}
            <div class="faq-actions">
                <button class="faq-action-btn edit" onclick="editFAQ(${faq.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="faq-action-btn delete" onclick="deleteFAQ(${faq.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function addFAQ() {
    currentFAQ = null;
    openFAQModal();
}

function editFAQ(faqId) {
    const faq = faqs.find(f => f.id === faqId);
    if (faq) {
        currentFAQ = faq;
        openFAQModal(faq);
    }
}

function deleteFAQ(faqId) {
    const faq = faqs.find(f => f.id === faqId);
    if (faq && confirm(`Delete FAQ: "${faq.question}"?`)) {
        faqs = faqs.filter(f => f.id !== faqId);
        renderFAQList();
        showNotification('FAQ deleted successfully');
        updateDeploymentSummary();
    }
}

function openFAQModal(faq = null) {
    const modal = document.getElementById('faqModal');
    if (!modal) return;

    // Populate form
    if (faq) {
        document.getElementById('faqQuestion').value = faq.question;
        document.getElementById('faqAnswer').value = faq.answer;
        document.getElementById('faqCategory').value = faq.category;
        document.getElementById('faqKeywords').value = faq.keywords.join(', ');
        document.getElementById('faqStatus').value = faq.status;

        const enableQuickReplies = document.getElementById('enableQuickReplies');
        const quickRepliesGroup = document.getElementById('quickRepliesGroup');
        const faqQuickReplies = document.getElementById('faqQuickReplies');

        if (enableQuickReplies) {
            enableQuickReplies.checked = faq.quickReplies && faq.quickReplies.length > 0;
            if (quickRepliesGroup) {
                quickRepliesGroup.style.display = enableQuickReplies.checked ? 'block' : 'none';
            }
            if (faqQuickReplies) {
                faqQuickReplies.value = faq.quickReplies ? faq.quickReplies.join('\n') : '';
            }
        }
    } else {
        // Clear form
        document.querySelectorAll('#faqModal input, #faqModal select, #faqModal textarea').forEach(field => {
            field.value = field.type === 'checkbox' ? field.checked : '';
        });
        document.getElementById('faqStatus').value = 'active';
    }

    modal.classList.add('active');
}

function saveFAQ() {
    const question = document.getElementById('faqQuestion')?.value?.trim();
    const answer = document.getElementById('faqAnswer')?.value?.trim();
    const category = document.getElementById('faqCategory')?.value;
    const keywords = document.getElementById('faqKeywords')?.value?.trim();
    const status = document.getElementById('faqStatus')?.value;
    const enableQuickReplies = document.getElementById('enableQuickReplies')?.checked;
    const quickReplies = document.getElementById('faqQuickReplies')?.value?.trim();

    if (!question || !answer || !category) {
        alert('Please fill in all required fields');
        return;
    }

    const faqData = {
        question,
        answer,
        category,
        keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        status,
        quickReplies: enableQuickReplies && quickReplies ? quickReplies.split('\n').map(r => r.trim()).filter(r => r) : []
    };

    if (currentFAQ) {
        // Update existing FAQ
        Object.assign(currentFAQ, faqData);
        showNotification('FAQ updated successfully');
    } else {
        // Create new FAQ
        const newFAQ = {
            id: Date.now(),
            ...faqData
        };
        faqs.push(newFAQ);
        showNotification('FAQ added successfully');
    }

    renderFAQList();
    updateDeploymentSummary();
    closeModal('faqModal');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Search and Filter
function handleFAQSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredFAQs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm) ||
        faq.answer.toLowerCase().includes(searchTerm) ||
        faq.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
    renderFAQList(filteredFAQs);
}

function handleFilterChange() {
    const categoryFilter = document.getElementById('categoryFilter')?.value;
    const statusFilter = document.getElementById('statusFilter')?.value;
    const searchTerm = document.getElementById('faqSearch')?.value?.toLowerCase();

    let filteredFAQs = faqs;

    if (categoryFilter) {
        filteredFAQs = filteredFAQs.filter(faq => faq.category === categoryFilter);
    }

    if (statusFilter) {
        filteredFAQs = filteredFAQs.filter(faq => faq.status === statusFilter);
    }

    if (searchTerm) {
        filteredFAQs = filteredFAQs.filter(faq =>
            faq.question.toLowerCase().includes(searchTerm) ||
            faq.answer.toLowerCase().includes(searchTerm)
        );
    }

    renderFAQList(filteredFAQs);
}

// Template Management
function showTemplateCategory(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Load template for category
    const template = templates.find(t => t.name.includes(category)) || templates[0];
    if (template) {
        document.getElementById('templateName').value = template.name;
        document.getElementById('templateContent').value = template.content;
        document.getElementById('templateCategory').value = template.category;
        document.getElementById('quickReplies').value = template.quickReplies.join('\n');
        updateTemplatePreview();
    }
}

function updateTemplatePreview() {
    const content = document.getElementById('templateContent')?.value || 'Select a template to preview';
    const quickReplies = document.getElementById('quickReplies')?.value || '';

    const previewElement = document.getElementById('templatePreview');
    const quickRepliesElement = document.getElementById('quickRepliesPreview');

    if (previewElement) {
        previewElement.textContent = content || 'Select a template to preview';
    }

    if (quickRepliesElement) {
        const quickReplyArray = quickReplies.split('\n').filter(reply => reply.trim());
        quickRepliesElement.innerHTML = quickReplyArray.map(reply =>
            `<div class="quick-reply">${reply.trim()}</div>`
        ).join('');
    }
}

function clearTemplate() {
    document.querySelectorAll('#templateName, #templateContent, #quickReplies').forEach(field => {
        field.value = '';
    });
    updateTemplatePreview();
}

function saveTemplate() {
    const name = document.getElementById('templateName')?.value?.trim();
    const category = document.getElementById('templateCategory')?.value;
    const content = document.getElementById('templateContent')?.value?.trim();
    const quickReplies = document.getElementById('quickReplies')?.value?.trim();

    if (!name || !content) {
        alert('Please fill in template name and content');
        return;
    }

    const template = {
        name,
        category,
        content,
        quickReplies: quickReplies ? quickReplies.split('\n').map(r => r.trim()).filter(r => r) : []
    };

    // Update or add template
    const existingIndex = templates.findIndex(t => t.name === name);
    if (existingIndex >= 0) {
        templates[existingIndex] = template;
    } else {
        templates.push(template);
    }

    showNotification('Template saved successfully');
}

// Bot Testing
function sendTestMessage() {
    const testInput = document.getElementById('testInput');
    const message = testInput?.value?.trim();

    if (!message) return;

    // Add user message
    addChatMessage(message, 'user');
    testInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Simulate bot response
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateBotResponse(message);
        addChatMessage(response.text, 'bot', response.quickReplies);
        updateTestResults();
    }, 1000 + Math.random() * 2000);
}

function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Search for matching FAQ
    const matchedFAQ = faqs.find(faq => {
        const questionMatch = faq.question.toLowerCase().includes(lowerMessage);
        const keywordMatch = faq.keywords.some(keyword => lowerMessage.includes(keyword));
        return questionMatch || keywordMatch;
    });

    if (matchedFAQ) {
        return {
            text: matchedFAQ.answer,
            quickReplies: matchedFAQ.quickReplies || []
        };
    }

    // Default responses
    const defaultResponses = [
        "I'm not sure how to help with that. Can you try asking in a different way?",
        "I don't have information about that. Would you like me to connect you with a human agent?",
        "That's an interesting question! Let me find someone who can better assist you.",
        "I'm still learning! For this specific question, I'll need to connect you with our support team."
    ];

    return {
        text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
        quickReplies: ["Contact support", "Try again", "Main menu"]
    };
}

function addChatMessage(message, sender, quickReplies = []) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = sender === 'bot' ?
        '<i class="fas fa-robot"></i>' :
        '<i class="fas fa-user"></i>';

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
            ${quickReplies.length > 0 ? `
                <div class="quick-replies">
                    ${quickReplies.map(reply =>
                        `<button class="quick-reply" onclick="sendQuickReply('${escapeHtml(reply)}')">${reply}</button>`
                    ).join('')}
                </div>
            ` : ''}
            <span class="message-time">${time}</span>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendQuickReply(message) {
    sendTestMessage();
    const testInput = document.getElementById('testInput');
    if (testInput) {
        testInput.value = message;
    }
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function testCommonQuestions() {
    const commonQuestions = [
        "What are your working hours?",
        "How can I place an order?",
        "What payment methods do you accept?",
        "How long does delivery take?",
        "What's your return policy?"
    ];

    let questionIndex = 0;
    const interval = setInterval(() => {
        if (questionIndex < commonQuestions.length) {
            document.getElementById('testInput').value = commonQuestions[questionIndex];
            sendTestMessage();
            questionIndex++;
        } else {
            clearInterval(interval);
        }
    }, 3000);
}

function testEdgeCases() {
    const edgeCases = [
        "", // Empty message
        "xyz", // Gibberish
        "What about...?", // Incomplete question
        "!!!!", // Only punctuation
        "a".repeat(500) // Very long message
    ];

    let caseIndex = 0;
    const interval = setInterval(() => {
        if (caseIndex < edgeCases.length) {
            document.getElementById('testInput').value = edgeCases[caseIndex];
            sendTestMessage();
            caseIndex++;
        } else {
            clearInterval(interval);
        }
    }, 2500);
}

function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // Keep only the welcome message
    chatMessages.innerHTML = `
        <div class="message bot-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>Hello! 👋 I'm your FAQ bot. How can I help you today?</p>
                <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    `;

    // Reset test results
    testResults = {
        accuracyScore: 0,
        responseTime: 0,
        handoffRate: 0,
        satisfactionScore: 0
    };
    updateTestResults();
}

function updateTestResults() {
    // Simulate test results
    testResults.accuracyScore = Math.min(100, 65 + Math.random() * 30);
    testResults.responseTime = (1 + Math.random() * 3).toFixed(1);
    testResults.handoffRate = Math.max(0, 10 + Math.random() * 20);
    testResults.satisfactionScore = Math.min(100, 70 + Math.random() * 25);

    // Update UI
    document.getElementById('accuracyScore').textContent = Math.round(testResults.accuracyScore) + '%';
    document.getElementById('responseTime').textContent = testResults.responseTime + 's';
    document.getElementById('handoffRate').textContent = Math.round(testResults.handoffRate) + '%';
    document.getElementById('satisfactionScore').textContent = Math.round(testResults.satisfactionScore) + '%';
}

// WhatsApp API
function testWhatsAppAPI() {
    showLoading('Testing API Connection...', 'Verifying WhatsApp API credentials');

    setTimeout(() => {
        // Simulate API test
        const success = Math.random() > 0.2; // 80% success rate

        const statusIndicator = document.getElementById('apiStatus');
        const statusDot = statusIndicator?.querySelector('.status-dot');
        const statusText = statusIndicator?.querySelector('.status-text');

        if (success) {
            statusIndicator?.classList.add('connected');
            if (statusDot) statusDot.style.background = 'var(--success-color)';
            if (statusText) statusText.textContent = 'Connected';
            showNotification('WhatsApp API connection successful!', 'success');
        } else {
            statusIndicator?.classList.remove('connected');
            if (statusDot) statusDot.style.background = 'var(--error-color)';
            if (statusText) statusText.textContent = 'Connection Failed';
            showNotification('Failed to connect to WhatsApp API. Please check your credentials.', 'error');
        }

        updateDeploymentSummary();
        hideLoading();
    }, 2000);
}

// Import/Export
function importFAQ() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (file.name.endsWith('.json')) {
                        const importedFAQs = JSON.parse(e.target.result);
                        faqs = [...faqs, ...importedFAQs];
                    } else if (file.name.endsWith('.csv')) {
                        // Simple CSV parsing
                        const lines = e.target.result.split('\n');
                        const importedFAQs = lines.slice(1).map((line, index) => {
                            const [question, answer, category, keywords] = line.split(',').map(s => s.trim());
                            return {
                                id: Date.now() + index,
                                question: question || '',
                                answer: answer || '',
                                category: category || 'general',
                                keywords: keywords ? keywords.split(';').map(k => k.trim()) : [],
                                status: 'active'
                            };
                        }).filter(faq => faq.question && faq.answer);
                        faqs = [...faqs, ...importedFAQs];
                    }
                    renderFAQList();
                    updateDeploymentSummary();
                    showNotification('FAQs imported successfully');
                } catch (error) {
                    showNotification('Failed to import FAQs. Please check the file format.', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function exportFAQ() {
    const dataStr = JSON.stringify(faqs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faqs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('FAQs exported successfully');
}

function exportBotConfig() {
    const config = {
        ...botConfig,
        faqs,
        templates,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bot-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Bot configuration exported successfully');
}

// Deployment
function updateDeploymentSummary() {
    // Get form values
    const botName = document.getElementById('botName')?.value || 'Not configured';
    const businessName = document.getElementById('businessName')?.value || 'Not configured';
    const language = document.getElementById('language')?.value || 'English';

    // Update summary
    const summaryBotName = document.getElementById('summaryBotName');
    const summaryFAQs = document.getElementById('summaryFAQs');
    const summaryTemplates = document.getElementById('summaryTemplates');
    const summaryLanguage = document.getElementById('summaryLanguage');
    const summaryAPI = document.getElementById('summaryAPI');
    const summaryScore = document.getElementById('summaryScore');

    if (summaryBotName) summaryBotName.textContent = botName || businessName || 'Unnamed Bot';
    if (summaryFAQs) summaryFAQs.textContent = faqs.length;
    if (summaryTemplates) summaryTemplates.textContent = templates.length;
    if (summaryLanguage) summaryLanguage.textContent = language === 'en-ng' ? 'Nigerian English' :
                                                             language === 'pidgin' ? 'Nigerian Pidgin' :
                                                             language.charAt(0).toUpperCase() + language.slice(1);
    if (summaryAPI) {
        const statusIndicator = document.getElementById('apiStatus');
        summaryAPI.textContent = statusIndicator?.classList.contains('connected') ? 'Connected' : 'Not Connected';
    }
    if (summaryScore) {
        const score = calculateDeploymentScore();
        summaryScore.textContent = score + '%';
        summaryScore.style.color = score >= 80 ? 'var(--success-color)' :
                                   score >= 60 ? 'var(--warning-color)' : 'var(--error-color)';
    }
}

function calculateDeploymentScore() {
    let score = 0;
    const maxScore = 100;

    // Basic config (30 points)
    if (document.getElementById('botName')?.value) score += 10;
    if (document.getElementById('businessName')?.value) score += 10;
    if (document.getElementById('phoneNumber')?.value) score += 10;

    // FAQs (30 points)
    score += Math.min(30, faqs.length * 6);

    // Templates (10 points)
    score += Math.min(10, templates.length * 3);

    // API connection (20 points)
    const statusIndicator = document.getElementById('apiStatus');
    if (statusIndicator?.classList.contains('connected')) score += 20;

    // Testing (10 points)
    if (testResults.accuracyScore > 0) score += 10;

    return Math.round(score);
}

function previewDeployment() {
    showNotification('Deployment preview coming soon!', 'info');
}

function deployBot() {
    const score = calculateDeploymentScore();
    if (score < 60) {
        alert(`Your bot is not ready for deployment. Current score: ${score}%. Please complete the configuration.`);
        return;
    }

    showLoading('Deploying Bot...', 'Deploying your WhatsApp FAQ bot to production');

    setTimeout(() => {
        hideLoading();
        showNotification('Bot deployed successfully! 🎉', 'success');

        // Update deployment steps
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => step.classList.add('completed'));
    }, 5000);
}

function showAnalytics() {
    showNotification('Analytics dashboard coming soon!', 'info');
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Loading State
function showLoading(title = 'Processing...', description = 'Please wait') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    document.getElementById('loadingTitle').textContent = title;
    document.getElementById('loadingDescription').textContent = description;
    loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--error-color)' : type === 'warning' ? 'var(--warning-color)' : type === 'info' ? 'var(--info-color)' : 'var(--whatsapp-green)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        font-size: 0.875rem;
        font-weight: 500;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add custom styles
const customStyles = document.createElement('style');
customStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }

    .empty-state i {
        font-size: 3rem;
        color: var(--text-tertiary);
        margin-bottom: 1rem;
    }

    .empty-state p {
        margin-bottom: 2rem;
        font-size: 1.125rem;
    }

    .typing-dots {
        display: flex;
        gap: 0.25rem;
        padding: 0.5rem;
    }

    .typing-dots span {
        width: 8px;
        height: 8px;
        background: var(--text-tertiary);
        border-radius: 50%;
        animation: typingDot 1.4s infinite ease-in-out;
    }

    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    .typing-dots span:nth-child(3) { animation-delay: 0s; }

    @keyframes typingDot {
        0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .quick-replies {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
    }

    .quick-reply {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid var(--border-color);
        border-radius: 1rem;
        color: var(--whatsapp-green);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.3s ease;
        border: none;
    }

    .quick-reply:hover {
        background: var(--whatsapp-green);
        color: white;
    }

    .message-content .quick-replies .quick-reply {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid var(--border-color);
    }

    .message-content .quick-replies .quick-reply:hover {
        background: var(--whatsapp-green);
        color: white;
    }

    .notification {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .suggestions {
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: var(--text-tertiary);
    }
`;
document.head.appendChild(customStyles);