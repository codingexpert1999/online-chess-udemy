// DOM Elements
const lobby = document.getElementById("lobby");
const username = document.getElementById("username");
const rank = document.getElementById("rank");
const points = document.getElementById("points");
const beginnerRooms = document.getElementById("beginner-rooms")
const intermediateRooms = document.getElementById("intermediate-rooms")
const advancedRooms = document.getElementById("advanced-rooms")
const expertRooms = document.getElementById("expert-rooms")
const totalUsers = document.getElementById("total-users");
const totalRooms = document.getElementById("total-rooms");

let user;

const fetchUserCallback = (data) => {
    user = data;

    socket.emit('user-connected', user);

    socket.emit('send-total-rooms-and-users');

    lobby.classList.remove("hidden");
    username.innerText = user.username;
    rank.innerText = user.user_rank;
    points.innerText = user.user_points;

    hideSpinner();
}

fetchData('/api/user-info', fetchUserCallback);

socket.on("receive-number-of-rooms-and-users", (numberOfRooms, totalR, totalU) => {
    beginnerRooms.innerText = `${numberOfRooms[0]} rooms`
    intermediateRooms.innerText = `${numberOfRooms[1]} rooms`
    advancedRooms.innerText = `${numberOfRooms[2]} rooms`
    expertRooms.innerText = `${numberOfRooms[3]} rooms`;

    totalRooms.innerText = `Total Rooms: ${totalR}`
    totalUsers.innerText = `Total Users: ${totalU}`
})