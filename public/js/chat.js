// DOM Elements
const openChatBtn = document.getElementById("open-chat");
const closeChatBtn = document.getElementById("close-chat");
const chat = document.getElementById("chat");
const messages = document.getElementById("messages")
const chatForm = document.getElementById("chat-form")
const messageInput = document.getElementById("message-input");

// Functions
const displayMessage = message => {
    messages.innerHTML += `
        <li class="message">
            <span class="time">${message.created_at}</span>

            <p>
                <strong>${message.user}:</strong> ${message.text}
            </p>
        </li>
    `
}

const handleSubmit = (e) => {
    e.preventDefault();

    let text = messageInput.value;

    let date = new Date();

    let message = {
        text,
        user: user.username,
        created_at: `${date.getDate() + 1}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`
    }

    messageInput.value = "";

    displayMessage(message);

    if(typeof roomId !== 'undefined'){
        socket.emit('send-message', text, user.username, roomId);
    }else{
        socket.emit('send-message', text, user.username);
    }
}

// Listeners
openChatBtn.addEventListener("click", () => {
    chat.classList.add("open")
})

closeChatBtn.addEventListener("click", () => {
    chat.classList.remove("open")
})

chatForm.addEventListener("submit", handleSubmit);

socket.on("receive-message", (text, user, toEveryone=false) => {
    if(typeof roomId !== "undefined" && toEveryone){
        return;
    }

    let date = new Date();

    let message = {
        text, 
        user,
        created_at: `${date.getDate() + 1}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`
    }

    displayMessage(message);
})