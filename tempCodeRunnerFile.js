let currentLanguage = 'en';
let moodScore = 50;
let stressScore = 50;
let detectedTopics = [];
let chatHistory = [];

const GEMINI_API_KEY = 'AIzaSyDdvJivuOONa6sggsldJPO9hj-4fO8zbR8';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({});

const interaction1 = await client.interactions.create({
    model: 'gemini-2.5-flash',
    input: 'Hi, my name is Phil.'
});
console.log(`Model: ${interaction1.outputs[interaction1.outputs.length - 1].text}`);

const interaction2 = await client.interactions.create({
    model: 'gemini-2.5-flash',
    input: 'What is my name?',
    previous_interaction_id: interaction1.id
});
console.log(`Model: ${interaction2.outputs[interaction2.outputs.length - 1].text}`);

const MENTAL_HEALTH_CONTEXT = `You are LimitsTalk AI, a compassionate mental health assistant designed to help students with stress, depression, and anxiety. 
Guidelines for responses:
1. Be empathetic, non-judgmental, and supportive
2. Use evidence-based therapeutic approaches (CBT, mindfulness, etc.)
3. Never give medical advice or diagnoses
4. Always encourage professional help when needed
5. Provide coping strategies and validation
6. Ask open-ended questions to understand feelings
7. Maintain professional boundaries while being warm
8. Focus on strengths and resilience
9. Suggest practical, actionable steps
10. Recognize and validate emotions

Important safety protocols:
- If user mentions self-harm or suicide, provide crisis resources immediately
- If user needs immediate help, encourage contacting professionals
- Always prioritize safety over conversation flow

Current time and date: ${new Date().toLocaleString()}`;

const EMOTION_KEYWORDS = {
    anxiety: ['anxious', 'worried', 'nervous', 'panic', 'overwhelmed', 'scared', 'fear'],
    depression: ['depressed', 'sad', 'hopeless', 'empty', 'tired', 'worthless', 'guilty'],
    stress: ['stressed', 'pressure', 'burnout', 'exhausted', 'tense', 'frustrated'],
    positive: ['happy', 'good', 'better', 'improving', 'hopeful', 'calm', 'relieved']
};

const CRISIS_RESOURCES = {
    en: {
        suicide: '988 Suicide & Crisis Lifeline',
        text: 'Text HOME to 741741',
        website: 'https://988lifeline.org'
    },
    es: {
        suicide: 'Línea de Prevención del Suicidio: 988',
        text: 'Texto AYUDA al 741741',
        website: 'https://suicidepreventionlifeline.org/help-yourself/en-espanol/'
    },
    fr: {
        suicide: '3114 - Prévention Suicide',
        text: 'Text SOS to 3114',
        website: 'https://3114.fr'
    }
};

let conversationHistory = [
    {
        role: "user",
        parts: [{ text: MENTAL_HEALTH_CONTEXT }]
    },
    {
        role: "model",
        parts: [{ text: "I understand. I am MindCare AI, ready to provide compassionate mental health support. How can I help you today?" }]
    }
];

document.addEventListener('DOMContentLoaded', function() {
    initializeLanguage();
    initializeChatbot();
    updateAnalysisDisplay();
    document.getElementById('languageSelect').addEventListener('change', changeLanguage);
    initializeQuestionnaire();
});

function initializeLanguage() {
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
    document.getElementById('languageSelect').value = savedLanguage;
    currentLanguage = savedLanguage;
    updateLanguageContent();
}

function changeLanguage() {
    const newLanguage = document.getElementById('languageSelect').value;
    currentLanguage = newLanguage;
    localStorage.setItem('preferredLanguage', newLanguage);
    updateLanguageContent();
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
    const translations = {
        'welcome': {
            'en': 'Welcome to Limits talk',
            'es': 'Bienvenido a limisTalk',
            'hi': 'LimitsTalk एआई में आपका स्वागत है'
        }
    };
    return translations[key]?.[language] || translations[key]?.['en'] || key;
}

function initializeChatbot() {
    const savedChat = localStorage.getItem('chatHistory');
    if (savedChat) {
        chatHistory = JSON.parse(savedChat);
        loadChatHistory();
    }
    const savedConvo = localStorage.getItem('conversationHistory');
    if (savedConvo) {
        conversationHistory = JSON.parse(savedConvo);
    }
}

function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    if (!message) return;
    addMessageToChat(message, 'user');
    userInput.value = '';
    showTypingIndicator();
    processWithAI(message);
}

function setQuickResponse(text) {
    document.getElementById('userInput').value = text;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
