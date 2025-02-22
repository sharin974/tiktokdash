
let websocket = null;

document.getElementById("clearChatLog").addEventListener("click", () => {
    localStorage.removeItem("chatLog");
    localStorage.removeItem("feedLog");
    document.getElementById("chatLog").innerHTML = "";
    document.getElementById("feedLog").innerHTML = "";
});

function updateViewerCount(count) {
    const viewerCountSpan = document.getElementById("viewerCount");
    viewerCountSpan.textContent = `Viewers: ${count}`;
}
function loadChatLog() {
    let savedMessages = JSON.parse(localStorage.getItem("chatLog") || "[]");
    savedMessages.forEach(msgHTML => {
        let messageElement = document.createElement("div");
        messageElement.classList.add("chat-message");
        messageElement.innerHTML = msgHTML;
        chatContainer.appendChild(messageElement);
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function loadFeedLog() {
    let savedMessages = JSON.parse(localStorage.getItem("feedLog") || "[]");
    savedMessages.forEach(msgHTML => {
        let messageElement = document.createElement("div");
        messageElement.classList.add("activity-entry");
        messageElement.innerHTML = msgHTML;
        chatContainer.appendChild(messageElement);
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

document.addEventListener("DOMContentLoaded", loadChatLog);
function connect() {
    if (websocket) return;

    websocket = new WebSocket("ws://localhost:21213/");

    websocket.onopen = function () {
        document.getElementById("status").innerText = "Connecté";
		document.getElementById("statusIndicator").style.backgroundColor = "green";
    };

    websocket.onclose = function () {
        document.getElementById("status").innerText = "Déconnecté";
		document.getElementById("statusIndicator").style.backgroundColor = "red";
        websocket = null;
        setTimeout(connect, 1000);
    };

    websocket.onerror = function () {
        document.getElementById("status").innerText = "Échec de connexion";
		document.getElementById("statusIndicator").style.backgroundColor = "orange";
        websocket = null;
        setTimeout(connect, 1000);
    };

    websocket.onmessage = function (event) {
        let parsedData = JSON.parse(event.data);
        console.log("Données reçues", parsedData);

        if (parsedData.event === "chat") {
            addChatMessage(parsedData.data);
        } else if (["gift", "like", "share", "follow"].includes(parsedData.event)) {
            addActivity(parsedData.event, parsedData.data);
        } else if ("roomUser" && parsedData.data.viewerCount){
			updateViewerCount(parsedData.data.viewerCount);
		}
    };
}
function saveChatLog() {
    const messages = [...document.querySelectorAll("#chatLog .chat-message")].map(msg => msg.innerHTML);
    localStorage.setItem("chatLog", JSON.stringify(messages));
}
function saveActivities() {
    const messages = [...document.querySelectorAll("#feedLog")].map(msg => msg.innerHTML);
    localStorage.setItem("feedLog", JSON.stringify(messages));
}

function addChatMessage(data) {
    let chatContainer = document.getElementById("chatLog");
	let autoScroll = true;

chatContainer.addEventListener("scroll", () => {
    autoScroll = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 10;
    document.getElementById("scrollToBottom").style.display = autoScroll ? "none" : "block";
});

document.getElementById("scrollToBottom").addEventListener("click", () => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
    autoScroll = true;
});
    let messageElement = document.createElement("div");
	let currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit"});
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = `
		<span class="timestamp">[${currentTime}]</span>
        <img src="${data.profilePictureUrl}" class="avatar">
        <span class="username">${data.nickname} :</span>
        <span class="message">${data.comment}</span>
    `;
    chatContainer.appendChild(messageElement);
	saveChatLog();
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addActivity(type, data) {
    let activityContainer = document.getElementById("feedLog");
    let activityElement = document.createElement("div");
	let currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit"})
    activityElement.classList.add("activity-entry", type);
    activityElement.innerHTML = `
		<span class="timestamp">[${currentTime}]</span>
        <img src="${data.profilePictureUrl}" class="avatar">
        <span class="username">${data.nickname}</span>
        ${formatActivityMessage(type, data)}
    `;
    activityContainer.appendChild(activityElement);
	saveActivities();
    activityContainer.scrollTop = activityContainer.scrollHeight;
}

function formatActivityMessage(type, data) {
    if (type === "gift") {
        return `a offert ${data.repeatCount} <img src="${data.giftPictureUrl}" class="gift-image">`;
    } else if (type === "like") {
        return `a aimé le live`;
    } else if (type === "share") {
        return `a partagé le live`;
    } else if (type === "follow") {
        return `a follow la chaine`;
    }
    return "";
}


document.addEventListener("DOMContentLoaded", () => {
    const chatLog = document.getElementById("killFeedContainer");
    const killfeed = [];
    const maxKillfeed = 5;

    function addToKillfeed(user) {
        const entry = document.createElement("div");
        entry.classList.add("killfeed-entry");
        entry.innerHTML = `
            <img src="${user.profilePictureUrl}" alt="${user.nickname}" width="30" height="30" style="border-radius: 50%;">
            <strong>${user.nickname}</strong> a rejoint.
        `;
        chatLog.appendChild(entry);
        killfeed.push(entry);
        
        if (killfeed.length > maxKillfeed) {
            chatLog.removeChild(killfeed.shift());
        }
        
        setTimeout(() => {
            if (killfeed.includes(entry)) {
                chatLog.removeChild(entry);
                killfeed.splice(killfeed.indexOf(entry), 1);
            }
        }, 5000);
    
    }

    function handleEvent(event) {
        if (event.event === "member" && event.data.uniqueId) {
            addToKillfeed(event.data);
        }
    }
	


 /*   // Simuler des événements pour test
    setTimeout(() => {
        handleEvent({
            event: "roomUser",
            data: { viewerCount: 10 }
        });
    }, 2000);
    
    setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				userId: "TestUser",
                nickname: "TestUser",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 4000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				userId: "TestUser5",
                nickname: "TestUser5",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 5000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				userId: "TestUser1",
                nickname: "TestUser1",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 6000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				userId: "TestUser2",
                nickname: "TestUser2",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 7000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				userId: "TestUser3",
                nickname: "TestUser3",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 8000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				userId: "TestUser4",
                nickname: "TestUser4",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 9000);
});*/

window.addEventListener('load', connect);
