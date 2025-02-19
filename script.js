let websocket = null;

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
        } else if (["gift", "like", "share"].includes(parsedData.event)) {
            addActivity(parsedData.event, parsedData.data);
        } else if ("roomUser"){
			addviewcount(parserdData.viewerCount);
		}
    };
}

function addChatMessage(data) {
    let chatContainer = document.getElementById("chat");
    let messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = `
        <img src="${data.profilePictureUrl}" class="avatar">
        <span class="username">${data.nickname} :</span>
        <span class="message">${data.comment}</span>
    `;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addActivity(type, data) {
    let activityContainer = document.getElementById("activity");
    let activityElement = document.createElement("div");
    activityElement.classList.add("activity-entry", type);
    activityElement.innerHTML = `
        <img src="${data.profilePictureUrl}" class="avatar">
        <span class="username">${data.nickname}</span>
        ${formatActivityMessage(type, data)}
    `;
    activityContainer.appendChild(activityElement);
    activityContainer.scrollTop = activityContainer.scrollHeight;
}

function formatActivityMessage(type, data) {
    if (type === "gift") {
        return `a offert ${data.repeatCount} <img src="${data.giftPictureUrl}" class="gift-image">`;
    } else if (type === "like") {
        return `a aimé le live`;
    } else if (type === "share") {
        return `a partagé le live`;
    }
    return "";
}
document.addEventListener("DOMContentLoaded", () => {
    const chatLog = document.getElementById("killFeedContainer");
    const viewerCountSpan = document.getElementById("viewerCount");
    const killfeed = [];
    const maxKillfeed = 5;

    function addToKillfeed(user) {
        const entry = document.createElement("div");
        entry.classList.add("chatMessage");
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

    function updateViewerCount(count) {
        viewerCountSpan.textContent = `Viewers: ${count}`;
    }

    function handleEvent(event) {
        if (event.event === "roomUser" && event.data.viewerCount !== undefined) {
            updateViewerCount(event.data.viewerCount);
        }
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
				uniqueId: "TestUser",
                nickname: "TestUser",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 4000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				uniqueId: "TestUser5",
                nickname: "TestUser5",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 5000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				uniqueId: "TestUser1",
                nickname: "TestUser1",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 6000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				uniqueId: "TestUser2",
                nickname: "TestUser2",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 7000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				uniqueId: "TestUser3",
                nickname: "TestUser3",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 8000);
	setTimeout(() => {
        handleEvent({
            event: "member",
            data: {
				uniqueId: "TestUser4",
                nickname: "TestUser4",
                profilePictureUrl: "https://via.placeholder.com/30"
            }
        });
    }, 9000);*/
});

window.addEventListener('load', connect);
