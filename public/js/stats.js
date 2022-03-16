// DOM Elements
const playedGames = document.getElementById("played-games")

let user;

const fetchUserCallback = (data) => {
    user = data

    socket.emit('user-connected', user);

    fetchData(`/api/games/${user.id}`, fetchPlayedGamesCallback)
}

const fetchPlayedGamesCallback = (data) => {
    displayPlayedGames(data);

    hideSpinner()
}

const displayPlayedGames = (games) => {
    games.forEach(game => {
        const {id, timer, started_at, completed_at, user_id_light, moves} = game;

        const myColor = user.id === user_id_light ? 'light' : 'black';

        const gameMoves = JSON.parse(moves);

        const gameWon = gameMoves[gameMoves.length - 1].pieceColor === myColor ? "True" : "False"

        playedGames.innerHTML += `
            <tr>
                <td>${id}</td>
                <td>${timer}</td>
                <td>${myColor}</td>
                <td>${started_at}</td>
                <td>${completed_at}</td>
                <td>${gameWon}</td>
                <td>
                    <a href='/my-stats/played-games/${id}'>Check</a>
                </td>
            </tr>
        `
    })
}

fetchData('/api/user-info', fetchUserCallback)