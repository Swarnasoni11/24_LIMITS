let currentLanguage = 'en';
let moodScore = 50;
let stressScore = 50;
let detectedTopics = ['Anxiety', 'Stress'];
let chatHistory = [];
let conversationHistory = [];
let videoStream = null;
let isCameraOn = false;
const GEMINI_API_KEY = 'AIzaSyB1vlS1kINLd8r7ee0x8xDkloNPmEdQaW4'; 

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${AIzaSyB1vlS1kINLd8r7ee0x8xDkloNPmEdQaW4}`;
const MENTAL_HEALTH_CONTEXT = `You are MindCare AI, a compassionate mental health assistant designed to help students with stress, depression, and anxiety. 

IMPORTANT GUIDELINES:
1. Be empathetic, non-judgmental, and supportive - validate feelings first
2. Use evidence-based therapeutic approaches (CBT, DBT, mindfulness techniques)
3. NEVER give medical advice, diagnoses, or prescribe medications
4. Always encourage professional help when symptoms are severe
5. Provide practical coping strategies and validation
6. Ask open-ended questions to understand feelings better
7. Maintain professional boundaries while being warm
8. Focus on strengths, resilience, and small steps
9. Suggest actionable, practical steps
10. Recognize and validate all emotions

SAFETY PROTOCOLS:
- If user mentions self-harm/suicide, provide crisis resources IMMEDIATELY
- If user needs immediate help, prioritize connecting them to professionals
- Safety always comes before conversation flow
- Never encourage harmful behaviors

CURRENT CONTEXT:
- Platform: Web-based mental health assistant
- User: Student seeking mental health support
- Time: ${new Date().toLocaleString()}
- Goal: Provide immediate support, coping strategies, and guide toward professional help if needed`;
const EMOTION_KEYWORDS = {
    anxiety: ['anxious', 'worried', 'nervous', 'panic', 'overwhelmed', 'scared', 'fear', 'racing thoughts', 'panic attack'],
    depression: ['depressed', 'sad', 'hopeless', 'empty', 'tired', 'worthless', 'guilty', 'suicidal', 'no purpose', 'lonely'],
    stress: ['stressed', 'pressure', 'burnout', 'exhausted', 'tense', 'frustrated', 'burnt out', 'overworked'],
    anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage', 'frustrated'],
    positive: ['happy', 'good', 'better', 'improving', 'hopeful', 'calm', 'relieved', 'excited', 'joyful', 'peaceful']
};
const CRISIS_RESOURCES = {
    en: {
        suicide: '988 Suicide & Crisis Lifeline (Call or Text 988)',
        text: 'Crisis Text Line: Text HOME to 741741',
        website: 'https://988lifeline.org',
        international: 'International Suicide Hotlines: https://www.opencounseling.com/suicide-hotlines'
    },
    es: {
        suicide: 'Línea de Prevención del Suicidio: 988',
        text: 'Texto AYUDA al 741741',
        website: 'https://suicidepreventionlifeline.org/help-yourself/en-espanol/',
        international: 'Líneas internacionales: https://www.telefonodelaesperanza.org'
    },
    fr: {
        suicide: '3114 - Prévention Suicide (Appel gratuit)',
        text: 'Text SOS to 3114',
        website: 'https://3114.fr',
        international: 'SOS Amitié: 09 72 39 40 50'
    },
    hi: {
        suicide: 'वंदना हेल्पलाइन: 9999 666 555',
        text: 'टेक्स्ट HELP to 88888',
        website: 'https://www.aasra.info',
        international: 'अंतरराष्ट्रीय हेल्पलाइन: https://www.befrienders.org'
    }
};

const TRANSLATIONS = {
    welcome: {
        en: "Welcome to MindCare AI",
        es: "Bienvenido a MindCare AI",
        fr: "Bienvenue sur MindCare AI",
        hi: "माइंडकेयर एआई में आपका स्वागत है",
        zh: "欢迎来到MindCare AI",
        ar: "مرحبًا بك في MindCare AI"
    },
    start_talking: {
        en: "Start Talking",
        es: "Empezar a Hablar",
        fr: "Commencer à Parler",
        hi: "बात शुरू करें",
        zh: "开始对话",
        ar: "ابدأ المحادثة"
    },
    feeling_anxious: {
        en: "I feel anxious today",
        es: "Me siento ansioso hoy",
        fr: "Je me sens anxieux aujourd'hui",
        hi: "मैं आज चिंतित महसूस कर रहा हूँ",
        zh: "我今天感到焦虑",
        ar: "أشعر بالقلق اليوم"
    },
    feeling_depressed: {
        en: "I'm feeling depressed",
        es: "Me siento deprimido",
        fr: "Je me sens déprimé",
        hi: "मैं उदास महसूस कर रहा हूँ",
        zh: "我感到沮丧",
        ar: "أشعر بالاكتئاب"
    },
    need_coping: {
        en: "I need coping strategies",
        es: "Necesito estrategias de afrontamiento",
        fr: "J'ai besoin de stratégies d'adaptation",
        hi: "मुझे मुकाबला करने की रणनीतियों की आवश्यकता है",
        zh: "我需要应对策略",
        ar: "أحتاج إلى استراتيجيات للتكيف"
    }
};
document.addEventListener('DOMContentLoaded', function() {
    console.log('MindCare AI Initializing...');
  
    initializeLanguage();
    initializeChatbot();
    initializeQuestionnaire();
    updateAnalysisDisplay();
    document.getElementById('languageSelect').addEventListener('change', changeLanguage);
    conversationHistory = [
        {
            role: "user",
            parts: [{ text: MENTAL_HEALTH_CONTEXT }]
        },
        {
            role: "model",
            parts: [{ text: "I understand. I am MindCare AI, ready to provide compassionate mental health support. How are you feeling today?" }]
        }
    ];

    loadSavedData();
    const cameraBtn = document.getElementById('cameraToggleBtn');
    if (cameraBtn) {
        cameraBtn.addEventListener('click', toggleCamera);
    }

    console.log('MindCare AI Initialized Successfully');
});
function initializeLanguage() {
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = savedLanguage;
    }
    currentLanguage = savedLanguage;
    updateLanguageContent();
}

function changeLanguage() {
    const newLanguage = document.getElementById('languageSelect').value;
    currentLanguage = newLanguage;
    localStorage.setItem('preferredLanguage', newLanguage);
    updateLanguageContent();
    
    // Update quick responses
    updateQuickResponses();
    
    showNotification(`Language changed to ${getLanguageName(newLanguage)}`, 'success');
}

function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'hi': 'Hindi',
        'zh': 'Chinese',
        'ar': 'Arabic'
    };
    return languages[code] || 'English';
}

function updateLanguageContent() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = getTranslation(key, currentLanguage);
    });
}

function getTranslation(key, language) {
    return TRANSLATIONS[key]?.[language] || TRANSLATIONS[key]?.['en'] || key;
}

function updateQuickResponses() {
    const buttons = document.querySelectorAll('.quick-response');
    if (buttons.length >= 3) {
        buttons[0].textContent = TRANSLATIONS.feeling_anxious[currentLanguage] || "I feel anxious today";
        buttons[1].textContent = TRANSLATIONS.feeling_depressed[currentLanguage] || "I'm feeling depressed";
        buttons[2].textContent = TRANSLATIONS.need_coping[currentLanguage] || "I need coping strategies";
    }
}

function initializeChatbot() {
    // Load previous chat history
    const savedChat = localStorage.getItem('mindcare_chatHistory');
    if (savedChat) {
        try {
            chatHistory = JSON.parse(savedChat);
            loadChatHistory();
        } catch (e) {
            console.error('Error loading chat history:', e);
            chatHistory = [];
        }
    }
    const savedConvo = localStorage.getItem('mindcare_conversationHistory');
    if (savedConvo) {
        try {
            conversationHistory = JSON.parse(savedConvo);
        } catch (e) {
            console.error('Error loading conversation history:', e);
            conversationHistory = [];
        }
    }
}

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (!message) {
        showNotification('Please enter a message', 'warning');
        return;
    }
    
    addMessageToChat(message, 'user');
    userInput.value = '';
    
    showTypingIndicator();
    
    try {
        const response = await processWithGeminiAPI(message);
    
        removeTypingIndicator();

        addMessageToChat(response, 'ai');
        
        updateAnalysisFromMessage(message, response);
        
    } catch (error) {
        console.error('Error processing message:', error);
        removeTypingIndicator();
        const fallbackResponse = getFallbackResponse(detectEmotion(message));
        addMessageToChat(fallbackResponse, 'ai');
    }
}

async function processWithGeminiAPI(userMessage) {
    if (isCrisisSituation(userMessage)) {
        return handleCrisisSituation(userMessage);
    }

    analyzeMessageContent(userMessage);

    try {
        conversationHistory.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        const requestBody = {
            contents: conversationHistory,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
        };

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let aiResponse = '';

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            aiResponse = data.candidates[0].content.parts[0].text;
        } else {
            aiResponse = "I understand you're reaching out. Could you tell me more about what you're experiencing?";
        }

        conversationHistory.push({
            role: "model",
            parts: [{ text: aiResponse }]
        });

        if (conversationHistory.length > 20) {
            conversationHistory = [
                conversationHistory[0],
                conversationHistory[1],
                ...conversationHistory.slice(-18)
            ];
        }

        localStorage.setItem('mindcare_conversationHistory', JSON.stringify(conversationHistory));
        return aiResponse;

    } catch (error) {
        console.error('Gemini API Error:', error);

        if (error.message.includes('API_KEY_INVALID') || error.message.includes('403') || error.message.includes('400')) {
            showNotification('API Key Error: Please check your Gemini API key', 'error');
            return "I'm having trouble connecting to my knowledge base. Please check if the API key is correctly configured.";
        }

        const emotion = detectEmotion(userMessage);
        return getFallbackResponse(emotion);
    }
}

function analyzeMessageContent(message) {
    const lowerMessage = message.toLowerCase();
    let moodChange = 0;
    let stressChange = 0;

    let currentDetectedTopics = [...detectedTopics];
    if (currentDetectedTopics.includes('Anxiety') || currentDetectedTopics.includes('Stress')) {
        currentDetectedTopics = currentDetectedTopics.filter(t => t !== 'Anxiety' && t !== 'Stress');
    }

    if (EMOTION_KEYWORDS.anxiety.some(k => lowerMessage.includes(k))) {
        if (!currentDetectedTopics.includes('Anxiety')) currentDetectedTopics.push('Anxiety');
        moodChange -= 10;
        stressChange += 15;
    }

    if (EMOTION_KEYWORDS.depression.some(k => lowerMessage.includes(k))) {
        if (!currentDetectedTopics.includes('Depression')) currentDetectedTopics.push('Depression');
        moodChange -= 15;
        stressChange += 10;
    }

    if (EMOTION_KEYWORDS.stress.some(k => lowerMessage.includes(k))) {
        if (!currentDetectedTopics.includes('Stress')) currentDetectedTopics.push('Stress');
        moodChange -= 5;
        stressChange += 20;
    }

    if (EMOTION_KEYWORDS.anger.some(k => lowerMessage.includes(k))) {
        if (!currentDetectedTopics.includes('Anger')) currentDetectedTopics.push('Anger');
        moodChange -= 8;
        stressChange += 12;
    }

    if (EMOTION_KEYWORDS.positive.some(k => lowerMessage.includes(k))) {
        if (!currentDetectedTopics.includes('Improvement')) currentDetectedTopics.push('Improvement');
        moodChange += 20;
        stressChange -= 10;
    }

    detectedTopics = currentDetectedTopics;
    moodScore = Math.max(0, Math.min(100, moodScore + moodChange));
    stressScore = Math.max(0, Math.min(100, stressScore + stressChange));

    updateAnalysisDisplay();
    saveEmotionAnalytics(message, moodChange, stressChange);
}

function detectEmotion(message) {
    const lowerMessage = message.toLowerCase();
    if (EMOTION_KEYWORDS.anxiety.some(k => lowerMessage.includes(k))) return 'anxiety';
    if (EMOTION_KEYWORDS.depression.some(k => lowerMessage.includes(k))) return 'depression';
    if (EMOTION_KEYWORDS.stress.some(k => lowerMessage.includes(k))) return 'stress';
    if (EMOTION_KEYWORDS.anger.some(k => lowerMessage.includes(k))) return 'anger';
    if (EMOTION_KEYWORDS.positive.some(k => lowerMessage.includes(k))) return 'positive';
    return 'neutral';
}

function getFallbackResponse(emotion) {
    const responses = {
        anxiety: ["I hear that you're feeling anxious.", "Anxiety can feel overwhelming.", "What's one small thing that helps you?"],
        depression: ["I'm glad you're reaching out.", "Depression can feel heavy.", "Would you like to share what's difficult?"],
        stress: ["Stress can feel heavy.", "Write down what's on your mind.", "What's one thing you can control right now?"],
        anger: ["Anger is valid.", "Take a deep breath.", "What boundary was crossed?"],
        positive: ["Glad you're feeling better!", "How can you build on this?", "Remember this feeling."],
        neutral: ["I'm here to listen.", "Tell me more.", "What's on your mind?"]
    };

    const arr = responses[emotion] || responses.neutral;
    return arr[Math.floor(Math.random() * arr.length)];
}

function isCrisisSituation(message) {
    const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm'];
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(k => lowerMessage.includes(k));
}

function handleCrisisSituation() {
    return "🚨 Please seek immediate help. Your life matters. Contact a crisis helpline or trusted person.";
}

function setQuickResponse(text) {
    const userInput = document.getElementById('userInput');
    if (userInput) userInput.value = text;
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function addMessageToChat(message, sender, saveToHistory = true) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedMessage = escapeHtml(message).replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-content">${formattedMessage}</div>
        <div class="message-time">${timeString}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (saveToHistory) {
        chatHistory.push({ sender, message, timestamp: now.toISOString(), moodScore, stressScore });
        if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);
        localStorage.setItem('mindcare_chatHistory', JSON.stringify(chatHistory));
    }
}

function updateAnalysisDisplay() {
    let moodText = moodScore > 70 ? 'Positive' : moodScore > 40 ? 'Neutral' : moodScore > 20 ? 'Low' : 'Depressed';
    let stressText = stressScore > 70 ? 'High' : stressScore > 40 ? 'Moderate' : stressScore > 20 ? 'Low' : 'Minimal';

    const moodLevelEl = document.getElementById('moodLevel');
    const moodProgressEl = document.getElementById('moodProgress');
    const stressLevelEl = document.getElementById('stressLevel');
    const stressProgressEl = document.getElementById('stressProgress');

    if (moodLevelEl) moodLevelEl.textContent = moodText;
    if (moodProgressEl) moodProgressEl.style.width = `${moodScore}%`;
    if (stressLevelEl) stressLevelEl.textContent = stressText;
    if (stressProgressEl) stressProgressEl.style.width = `${stressScore}%`;

    const topicsEl = document.getElementById('topics');
    if (topicsEl && detectedTopics.length > 0) {
        topicsEl.textContent = [...new Set(detectedTopics)].join(', ');
    }

    saveCurrentState();
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => notification.classList.add('hidden'), 4000);
}

function saveCurrentState() {
    localStorage.setItem('mindcare_state', JSON.stringify({ moodScore, stressScore, detectedTopics }));
}

document.addEventListener('DOMContentLoaded', () => {
    const cameraBtn = document.getElementById('cameraToggleBtn');
    if (cameraBtn) cameraBtn.addEventListener('click', toggleCamera);

    const userInput = document.getElementById('userInput');
    if (userInput) userInput.addEventListener('keypress', handleKeyPress);

    document.querySelectorAll('.quick-response').forEach(btn => {
        btn.addEventListener('click', () => setQuickResponse(btn.textContent));
    });

    const submitAssessmentBtn = document.getElementById('submitAssessment');
    if (submitAssessmentBtn) submitAssessmentBtn.addEventListener('click', calculateQuickAssessment);
});
