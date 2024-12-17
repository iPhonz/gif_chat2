const TENOR_API_KEY = 'YOUR_API_KEY_HERE';
let selectedGif = null;
let messageId = 0;
let messages = [];

async function searchGifs() {
    const searchTerm = document.getElementById('gifSearch').value;
    const gifContainer = document.getElementById('gifContainer');
    
    try {
        const response = await fetch(`https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${TENOR_API_KEY}&limit=20`);
        const data = await response.json();
        
        gifContainer.innerHTML = '';
        data.results.forEach(gif => {
            const gifElement = document.createElement('div');
            gifElement.className = 'gif-item';
            gifElement.innerHTML = `<img src="${gif.media_formats.tinygif.url}" alt="${searchTerm} gif">`;
            gifElement.onclick = () => selectGif(gif.media_formats.gif.url);
            gifContainer.appendChild(gifElement);
        });
    } catch (error) {
        console.error('Error fetching GIFs:', error);
    }
}

function selectGif(gifUrl) {
    selectedGif = gifUrl;
}

function createMessage(text, gifUrl, parentId = null) {
    messageId++;
    return {
        id: messageId,
        text,
        gifUrl,
        parentId,
        timestamp: new Date(),
        replies: []
    };
}

function addReply(parentId) {
    const messageInput = document.getElementById('messageInput');
    messageInput.placeholder = `Replying to message #${parentId}...`;
    messageInput.dataset.replyTo = parentId;
}

function renderMessage(message, level = 0) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.style.marginLeft = `${level * 20}px`;
    
    let messageContent = `<div class="message-header">Message #${message.id}</div>`;
    
    if (message.gifUrl) {
        messageContent += `<img src="${message.gifUrl}" alt="Message GIF">`;
    }
    
    if (message.text) {
        messageContent += `<div class="caption">${message.text}</div>`;
    }
    
    messageContent += `
        <div class="message-footer">
            <button onclick="addReply(${message.id})">Reply</button>
            ${message.replies.length > 0 ? `<button onclick="toggleReplies(${message.id})">Toggle Replies (${message.replies.length})</button>` : ''}
        </div>
        <div class="replies" id="replies-${message.id}">
    `;
    
    messageElement.innerHTML = messageContent;
    
    const repliesContainer = messageElement.querySelector('.replies');
    message.replies.forEach(reply => {
        repliesContainer.appendChild(renderMessage(reply, level + 1));
    });
    
    return messageElement;
}

function toggleReplies(messageId) {
    const repliesContainer = document.getElementById(`replies-${messageId}`);
    repliesContainer.style.display = repliesContainer.style.display === 'none' ? 'block' : 'none';
}

function refreshChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = '';
    messages.forEach(message => {
        if (!message.parentId) {
            chatContainer.appendChild(renderMessage(message));
        }
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const chatContainer = document.getElementById('chatContainer');
    const text = messageInput.value;
    const replyToId = messageInput.dataset.replyTo ? parseInt(messageInput.dataset.replyTo) : null;
    
    if (!text && !selectedGif) return;
    
    const newMessage = createMessage(text, selectedGif, replyToId);
    
    if (replyToId) {
        const parentMessage = messages.find(m => m.id === replyToId);
        if (parentMessage) {
            parentMessage.replies.push(newMessage);
        }
    } else {
        messages.push(newMessage);
    }
    
    // Reset inputs and refresh chat
    messageInput.value = '';
    messageInput.placeholder = 'Type your message...';
    messageInput.dataset.replyTo = '';
    document.getElementById('gifSearch').value = '';
    document.getElementById('gifContainer').innerHTML = '';
    selectedGif = null;
    
    refreshChat();
}

// Listen for Enter key
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('gifSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchGifs();
    }
});