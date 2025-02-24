let websocket = null;
const killfeed = [];
const maxKillfeed = 5;

// Écouteur pour effacer le chat et le feed
const clearChatLogBtn = document.getElementById("clearChatLog");
if (clearChatLogBtn) {
    clearChatLogBtn.addEventListener("click", () => {
        localStorage.removeItem("chatLog");
        localStorage.removeItem("feedLog");
        document.getElementById("chatLog").innerHTML = "";
        document.getElementById("feedLog").innerHTML = "";
    });
}
//ViewerCount
function updateViewerCount(count) {
    const viewerCountSpan = document.getElementById("viewerCount");
    if (viewerCountSpan) {
        viewerCountSpan.textContent = `Viewers: ${count}`;
    }
}
//Charge les messages et les likes des anciens.
function loadLog(logId, storageKey) {
    const savedMessages = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const container = document.getElementById(logId);
    
    savedMessages.forEach(msgData => {
        let messageElement = document.createElement("div");
        messageElement.innerHTML = msgData.html;
        messageElement.classList.add(...msgData.classes); // Réapplique les classes CSS
        container.appendChild(messageElement);
    });

    container.scrollTop = container.scrollHeight; // Garde le scroll en bas
}


document.addEventListener("DOMContentLoaded", () => {
    loadLog("chatLog", "chatLog");
    loadLog("feedLog", "feedLog");
});

function connect() {
    if (websocket) return;
    websocket = new WebSocket("ws://localhost:21213/");

    websocket.onopen = () => {
        document.getElementById("status").innerText = "Connecté";
        document.getElementById("statusIndicator").style.backgroundColor = "green";
    };

    websocket.onclose = () => {
        document.getElementById("status").innerText = "Déconnecté";
        document.getElementById("statusIndicator").style.backgroundColor = "red";
        websocket = null;
        setTimeout(connect, 1000);
    };

    websocket.onerror = () => {
        document.getElementById("status").innerText = "Échec de connexion";
        document.getElementById("statusIndicator").style.backgroundColor = "orange";
        websocket = null;
        setTimeout(connect, 1000);
    };

    websocket.onmessage = (event) => {
        let parsedData = JSON.parse(event.data);
        console.log("Données reçues", parsedData);

        if (parsedData.event === "chat") {
            addChatMessage(parsedData.data);
        } else if (["gift", "like", "share", "follow"].includes(parsedData.event)) {
            addActivity(parsedData.event, parsedData.data);
        } else if (parsedData.event === "roomUser" && parsedData.data.viewerCount) {
            updateViewerCount(parsedData.data.viewerCount);
        } else if ((parsedData.event === "member" || parsedData.event === "roomUser") && parsedData.data.uniqueId) {
            addToKillfeed(parsedData.data);
        }
    };
}
//Sauvegarde des logs messages et activites
function saveLog(logId, storageKey) {
    const messages = [...document.querySelectorAll(`#${logId} div`)].map(msg => ({
        html: msg.innerHTML,
        classes: [...msg.classList] // Sauvegarde toutes les classes CSS de l'élément
    }));
    localStorage.setItem(storageKey, JSON.stringify(messages));
    
}

function addChatMessage(data) {
    let chatContainer = document.getElementById("chatLog");
    if (!chatContainer) return;

    let messageElement = document.createElement("div");
    let currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = `
        <span class="timestamp">[${currentTime}]</span>
        <img src="${data.profilePictureUrl}" class="avatar">
        <span class="username">${data.nickname} :</span>
        <span class="message">${data.comment}</span>
    `;
    chatContainer.appendChild(messageElement);
    saveLog("chatLog", "chatLog");
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addActivity(type, data) {
    let activityContainer = document.getElementById("feedLog");
    if (!activityContainer) return;

    let activityElement = document.createElement("div");
    let currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    activityElement.classList.add("activity-entry", type);
    activityElement.innerHTML = `
        <span class="timestamp">[${currentTime}]</span>
        <img src="${data.profilePictureUrl}" class="avatar">
        <span class="username">${data.nickname}</span>
        ${formatActivityMessage(type, data)}
    `;
    activityContainer.appendChild(activityElement);
    saveLog("feedLog", "feedLog");
    activityContainer.scrollTop = activityContainer.scrollHeight;
}

function formatActivityMessage(type, data) {
    switch (type) {
        case "gift":
            return `a offert ${data.repeatCount} <img src="${data.giftPictureUrl}" class="gift-image">`;
        case "like":
            return `a aimé le live`;
        case "share":
            return `a partagé le live`;
        case "follow":
            return `a follow la chaîne`;
        default:
            return "";
    }
}

function addToKillfeed(user) {
    const chatLog = document.getElementById("killFeedContainer");
    if (!chatLog) return;

    const entry = document.createElement("div");
    entry.classList.add("killfeed-entry");
    entry.innerHTML = `
        <img src="${user.profilePictureUrl ?? "default.png"}" alt="${user.nickname}" width="30" height="30" style="border-radius: 50%;">
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

// Fonction pour gérer la visibilité des boutons de scroll
function handleScroll(logId, btnId) {
    const logContainer = document.getElementById(logId);
    const scrollBtn = document.getElementById(btnId);

    if (!logContainer || !scrollBtn) return;

    logContainer.addEventListener("scroll", () => {
        if (logContainer.scrollTop + logContainer.clientHeight < logContainer.scrollHeight - 10) {
            scrollBtn.style.display = "block";
        } else {
            scrollBtn.style.display = "none";
        }
    });

    scrollBtn.addEventListener("click", () => {
        logContainer.scrollTop = logContainer.scrollHeight;
    });
}

window.addEventListener('load', connect);
