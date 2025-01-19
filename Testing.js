let message = null;

function updateMessage(newMessage) {
    message = newMessage; // 如果没有传递新消息，则设置为 null
}

updateMessage("Hello!");
console.log(message); // 输出: Hello!

updateMessage();
console.log(message); // 输出: null