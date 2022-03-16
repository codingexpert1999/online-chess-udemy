const gameMoves = document.getElementById("game-moves");

let user;

const fetchUserCallback = (data) => {
    user = data;

    socket.emit('user-connected', user);

    const urlPathSplitted = window.location.pathname.split("/");

    const gameId = urlPathSplitted[urlPathSplitted.length - 1]

    fetchData(`/api/games/${gameId}/${user.id}`, fetchPlayedGameCallback);
}

const fetchPlayedGameCallback = (data) => {
    displayGameMoves(data);
    hideSpinner();
}

const displayGameMoves = (moves) => {
    moves.forEach(move => {
        const {from, to, time, pieceColor, piece} = move

        gameMoves.innerHTML += `
            <tr>
                <td>${from}</td>
                <td>${to}</td>
                <td>${time ?? '-'}</td>
                <td>
                    <img src="../../assets/chess-icons/${pieceColor}/chess-${piece}-${pieceColor}.svg" alt=""Checc Piece" >
                </td>
            </tr>
        `
    })
}

fetchData('/api/user-info', fetchUserCallback)