const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const responses = {
    hello: "Hi there! How can I help you?",
    how: "I'm doing great, thanks for asking!",
    help: "I can chat with you. Just type something and I'll respond!",
    bye: "Goodbye! Have a great day!",
    default: "I'm not sure how to respond to that. Can you say something else?",
    hi: "Hello there! How can I assist you today?"
};

function getResponse(userInput) {
    const input = userInput.toLowerCase().trim();
    
    if (input.includes('hello') || input.includes('hi')) return responses.hello;
    if (input.includes('how are you')) return responses.how;
    if (input.includes('help')) return responses.help;
    if (input.includes('bye') || input.includes('goodbye')) return responses.bye;
    
    return responses.default;
}

function chat() {
    rl.question('You: ', (input) => {
        if (input.toLowerCase() === 'bye') {
            console.log('Bot:', getResponse(input));
            rl.close();
        } else {
            console.log('Bot:', getResponse(input));
            chat();
        }
    });
}

console.log('Chatbot started! Type "bye" to exit.\n');
chat();

