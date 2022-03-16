// DOM Elements
const gamesDivElement = document.getElementById("games")
const rankFilter = document.getElementById("filter");
const gamesList = document.getElementById("games-list")
const noGamesMessage = document.getElementById("no-games-message")

const createRoomBtn = document.getElementById("create-room")
const joinRandomBtn = document.getElementById("join-random")

const createRoomFormContainer = document.getElementById("create-room-form-container")
const createRoomForm = document.getElementById("create-room-form")
const roomId = document.getElementById("room-id")
const gameTime = document.getElementById("game-time")
const closeCreateRoomFormBtn = document.getElementById("close-create-form");
const addPassword = document.getElementById("add-password");
const passwordInputGroup = document.getElementById("password-input-group");
const roomPassword = document.getElementById("room-password");

const joinRoomFormContainer = document.getElementById("join-room-form-container")
const joinRoomForm = document.getElementById("join-room-form")
const roomPasswordJoin = document.getElementById("room-password-join")
const closeJoinRoomFormBtn = document.getElementById("close-join-form");

roomPassword.readOnly = true;

let user;

let gameId = null;

const intervals = [0, 15, 30, 45, 60]

// Functions
const fetchUserCallback = (data) => {
    user = data;

    socket.emit("user-connected", user);
    socket.emit('get-rooms', "all")

    gamesDivElement.classList.remove("hidden")

    hideSpinner();
}

const handleCreateRoomFormSubmit = e => {
    e.preventDefault();

    let id = roomId.value;
    let time = intervals[+gameTime.value]

    if(addPassword.checked && roomPassword.value !== ""){
        socket.emit('create-room', id, time, user, roomPassword.value)
    }else{
        socket.emit('create-room', id, time, user)
    }

    createRoomFormContainer.classList.add("hidden")
}

const handleJoinRoomFormSubmit = e => {
    e.preventDefault();

    if(roomId){
        const password = roomPasswordJoin.value;

        socket.emit('join-room', gameId, user, password)
    }
}

const addJoinButtonListeners = () => {
    document.querySelectorAll(".game button").forEach(button => {
        if(!button.classList.contains("disabled")){
            button.addEventListener("click", e => {
                let game = button.parentNode;

                if(game.dataset.withpassword === 'true'){
                    gameId = game.id;
                    joinRoomFormContainer.classList.remove('hidden');
                }else{
                    socket.emit('join-room', game.id, user);
                }
            })
        }
    })
}

const displayRooms = rooms => {
    gamesList.innerHTML = "";

    rooms.forEach(room => {
        let {username, user_rank} = room.players[0];
        let numberOfPlayersInRoom = room.players[1] ? 2 : 1
        let hasPassword = room.password && room.password !== "" ? true : false

        gamesList.innerHTML += `
            <li class='game' id='${room.id}' data-withpassword="${hasPassword}">
                <div class="user">
                    <span>${username}</span>
                    <span>( ${user_rank.charAt(0).toUpperCase() + user_rank.slice(1)} )</span>
                </div>

                <div class="users-in-room">${numberOfPlayersInRoom} / 2</div>

                <button ${numberOfPlayersInRoom === 2 ? "class='disabled'" : ""}>Join</button>
            </li>
        `
    })

    addJoinButtonListeners()
}

fetchData('/api/user-info', fetchUserCallback)

// Listeners
socket.on('receive-rooms', rooms => {
    if(rooms.length > 0){
        noGamesMessage.classList.add("hidden");
        gamesList.classList.remove('hidden');

        displayRooms(rooms);
    }else{
        gamesList.classList.add('hidden');
        noGamesMessage.classList.remove('hidden')
    }
})

socket.on("room-created", () => {
    let id = roomId.value;

    if(addPassword.checked && roomPassword.value !== ""){
        window.location.href = window.location.origin + "/room?id=" + id + "&password=" + roomPassword.value;
    }else{
        window.location.href = window.location.origin + "/room?id=" + id
    }
})

socket.on("room-joined", (id, password=null) => {
    if(password){
        window.location.href = window.location.origin + "/room?id=" + id + "&password=" + password;
    }else{
        window.location.href = window.location.origin + "/room?id=" + id
    }
})

addPassword.addEventListener("change", () => {
    if(addPassword.checked){
        roomPassword.readOnly = false;
        passwordInputGroup.classList.remove("disabled")
    }else{
        roomPassword.readOnly = true;
        passwordInputGroup.classList.add("disabled")
    }
})

rankFilter.addEventListener("change", (e) => {
    socket.emit("get-rooms", e.target.value)
})

createRoomBtn.addEventListener("click", () => {
    createRoomFormContainer.classList.remove("hidden")
})

closeCreateRoomFormBtn.addEventListener("click", () => {
    createRoomFormContainer.classList.add("hidden")
})

createRoomForm.addEventListener("submit", handleCreateRoomFormSubmit)

closeJoinRoomFormBtn.addEventListener("click", () => {
    joinRoomFormContainer.classList.add("hidden")
})

joinRoomForm.addEventListener("submit", handleJoinRoomFormSubmit)

joinRandomBtn.addEventListener("click", () => {
    socket.emit("join-random", user)
})