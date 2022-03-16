// =====================
// DOM Elements
// =====================
const room = document.getElementById("game-room")
const boxes = document.querySelectorAll(".box")
const playerLight = document.getElementById("player-light")
const playerBlack = document.getElementById("player-black")
const waitingMessage = document.getElementById("waiting-message")
const playerLightTimer = playerLight.querySelector(".timer")
const playerBlackTimer = playerBlack.querySelector(".timer")
const lightCapturedPieces = document.getElementById("light-captured-pieces")
const blackCapturedPieces = document.getElementById("black-captured-pieces")
const piecesToPromoteContainer = document.getElementById("pieces-to-promote-container")
const piecesToPromote = document.getElementById("pieces-to-promote")
const gameOverMessageContainer = document.getElementById("game-over-message-container")
const winnerUsername = gameOverMessageContainer.querySelector("p strong")
const myScoreElement = document.getElementById("my-score")
const enemyScoreElement = document.getElementById("enemy-score")

// =====================
// Game Variables
// =====================
let user = null;

let search = window.location.search.split("&")

let roomId = null;
let password = null;

let gameDetails = null;

let gameHasTimer = false;
let timer = null;
let myTurn = false;
let kingIsAttacked = false;
let pawnToPromotePosition = null;
let castling = null;

let gameOver = false;
let myScore = 0;
let enemyScore = 0;

let gameStartedAtTimestamp = null

if(search.length > 1){
    roomId = search[0].split("=")[1]
    password = search[1].split("=")[1]
}else{
    roomId = search[0].split("=")[1]
}

// =====================
// Functions
// =====================

const fetchUserCallback = (data) => {
    user = data;

    if(password){
        socket.emit("user-connected", user, roomId, password);
    }else{
        socket.emit("user-connected", user, roomId);
    }

    socket.emit("get-game-details", roomId, user)
}

fetchData("/api/user-info", fetchUserCallback)

// Display chess board logic
const displayChessPieces = () => {
    boxes.forEach(box => {
        box.innerHTML = ""
    })

    lightPieces.forEach(piece => {
        let box = document.getElementById(piece.position)

        box.innerHTML += `
            <div class="piece light" data-piece="${piece.piece}" data-points="${piece.points}">
                <img src="${piece.icon}" alt="Chess Piece" >
            </div>
        `
    })

    blackPieces.forEach(piece => {
        let box = document.getElementById(piece.position)

        box.innerHTML += `
            <div class="piece black" data-piece="${piece.piece}" data-points="${piece.points}">
                <img src="${piece.icon}" alt="Chess Piece" >
            </div>
        `
    })

    addPieceListeners()
}

const onClickPiece = (e) => {
    if(!myTurn || gameOver){
        return;
    }

    hidePossibleMoves()

    let element = e.target.closest(".piece");
    let position = element.parentNode.id;
    let piece = element.dataset.piece;

    if(selectedPiece && selectedPiece.piece === piece && selectedPiece.position === position){
        hidePossibleMoves()
        selectedPiece = null
        return;
    }

    selectedPiece = {position, piece}

    let possibleMoves = findPossibleMoves(position, piece);

    showPossibleMoves(possibleMoves)
}

const addPieceListeners = () => {
    document.querySelectorAll(`.piece.${player}`).forEach(piece => {
        piece.addEventListener("click", onClickPiece)
    })

    document.querySelectorAll(`.piece.${enemy}`).forEach(piece => {
        piece.style.cursor = "default"
    })
}

// --------------------------------------

// Possible Moves Logic

const showPossibleMoves = (possibleMoves) => {
    possibleMoves.forEach(box => {
        let possibleMoveBox = document.createElement('div')
        possibleMoveBox.classList.add("possible-move");

        possibleMoveBox.addEventListener("click", move)

        box.appendChild(possibleMoveBox)
    })
}

const hidePossibleMoves = () => {
    document.querySelectorAll('.possible-move').forEach(possibleMoveBox => {
        let parent = possibleMoveBox.parentNode;
        possibleMoveBox.removeEventListener('click', move)
        parent.removeChild(possibleMoveBox)
    })
}

const findPossibleMoves = (position, piece) => {
    let splittedPos = position.split("-");
    let yAxisPos = +splittedPos[1]
    let xAxisPos = splittedPos[0]

    let yAxisIndex = yAxis.findIndex(y => y === yAxisPos)
    let xAxisIndex = xAxis.findIndex(x => x === xAxisPos)

    switch(piece){
        case "pawn":
            return getPawnPossibleMoves(xAxisPos, yAxisPos, xAxisIndex, yAxisIndex);
        case 'rook':
            return getRookPossibleMoves(xAxisPos, yAxisPos, xAxisIndex, yAxisIndex);
        case 'bishop':
            return getBishopPossibleMoves(xAxisIndex, yAxisIndex)
        case 'knight':
            return getKnightPossibleMoves(xAxisIndex, yAxisIndex)
        case 'queen':
            return Array.prototype.concat(
                getRookPossibleMoves(xAxisPos, yAxisPos, xAxisIndex, yAxisIndex),
                getBishopPossibleMoves(xAxisIndex, yAxisIndex)
            )
        case 'king':
            return getKingPossibleMoves(xAxisPos, yAxisPos, xAxisIndex, yAxisIndex)
        default:
            return []
    }
}
// --------------------------------------

// Timer Logic
const updateTimer = (currentPlayer, minutes, seconds) => {
    if(currentPlayer === 'light'){
        playerLightTimer.innerText = 
            `${minutes >= 10 ? minutes : "0" + minutes}:${seconds >= 10 ? seconds : "0" + seconds}`
    }else{
        playerBlackTimer.innerText = 
            `${minutes >= 10 ? minutes : "0" + minutes}:${seconds >= 10 ? seconds : "0" + seconds}` 
    }
}

const timerEndedCallback = () => {
    socket.emit('timer-ended', roomId, user.username, gameStartedAtTimestamp)
}
// --------------------------------------

// Game Logic
const setCursor = (cusror) => {
    document.querySelectorAll(`.piece.${player}`).forEach(piece => {
        piece.getElementsByClassName.cursor = cusror
    })
}

const startGame = (playerTwo) => {
    playerBlack.querySelector(".username").innerText = playerTwo.username;

    waitingMessage.classList.add("hidden")
    playerBlack.classList.remove("hidden")

    displayChessPieces()

    setPiecesToPromote();
}

const setKingIsAttacked = (isAttacked) => {
    kingIsAttacked = isAttacked;

    let myKing = document.getElementById(getKingPosition(player)).children[0];

    if(isAttacked){
        myKing.classList.add('warning-block');
        displayToast("Your king is under attack");
    }else{
        myKing.classList.remove('warning-block');
    }
}

const endMyTurn = (newPieceBox, pawnPromoted = false, castlingPerformed = false, elPassantPerformed = false) => {
    if(kingIsAttacked){
        setKingIsAttacked(false);
    }

    myTurn = false;
    setCursor("default")

    saveMove(newPieceBox, pawnPromoted, castlingPerformed, elPassantPerformed);

    checkIfKingIsAttacked(enemy);
}
// --------------------------------------

// Move Logic

const move = (e) => {
    let currentBox = document.getElementById(selectedPiece.position);
    let boxToMove = e.target.parentNode;
    let piece = currentBox.querySelector(".piece");

    hidePossibleMoves();

    let pieceToRemove = null;
    let pieceToRemovePieceImg = null;

    if(boxToMove.children.length > 0){
        if(boxToMove.children[0].classList.contains(player)){
            performCastling(player, currentBox.id, boxToMove.id)

            return;
        }

        pieceToRemove = boxToMove.children[0];
        pieceToRemovePieceImg = pieceToRemove.children[0]
    }else{
        if(!isLeftCastlingPerformed || !isRightCastlingPerformed){
            if(piece.dataset.piece === 'rook'){
                let myKingPosition = getKingPosition(player);

                let pieceXAxisIndex = xAxis.findIndex(x => x === currentBox.id[0]);
                let myKingXAxisIndex = xAxis.findIndex(x => x === myKingPosition[0]);

                if(pieceXAxisIndex < myKingXAxisIndex){
                    isLeftCastlingPerformed = true;
                }else{
                    isRightCastlingPerformed = true;
                }
            }
        }
    }

    currentBox.innerHTML = "";

    if(pieceToRemove){
        capturePiece(pieceToRemove)
        boxToMove.innerHTML = ""
    }

    boxToMove.appendChild(piece)

    let boxesNeededForCheck = {
        currentBox, boxToMove
    }

    let piecesNeededForCheck = {
        piece, pieceToRemove, pieceToRemovePieceImg
    }

    let isMovePossible = canMakeMove(boxesNeededForCheck, piecesNeededForCheck);

    if(!isMovePossible){
        return;
    }

    if(piece.dataset.piece === 'pawn'){
        // Pawn promotion check
        if(
            (player === 'light' && boxToMove.id[2] === '1') ||
            (player === 'black' && boxToMove.id[2] === '8')
        ){
            let canBePromoted = isPawnAtTheEndOfTheBoard(player, boxToMove.id);

            if(canBePromoted){
                pawnToPromotePosition = boxToMove.id;

                piecesToPromoteContainer.classList.remove('hidden');

                return;
            }
        }

        if(elPassantPositions[boxToMove.id]){
            performElPassant(player, currentBox.id, boxToMove.id)

            return
        }
    }

    if(checkForDraw()){
        endGame();
        socket.emit("draw", roomId)
    }

    endMyTurn(boxToMove)
}

const canMakeMove = ({currentBox, boxToMove}, {piece, pieceToRemove, pieceToRemovePieceImg}) => {
    // TODO: Check if move is valid
    let moveIsNotValid = checkIfKingIsAttacked(player);

    if(moveIsNotValid){
        selectedPiece = null;

        if(pieceToRemove){
            pieceToRemove.appendChild(pieceToRemovePieceImg)

            boxToMove.removeChild(piece);
            boxToMove.appendChild(pieceToRemove);

            if(pieceToRemove.classList.contains("black")){
                blackCapturedPieces.removeChild(blackCapturedPieces.lastChild)
            }else{
                lightCapturedPieces.removeChild(lightCapturedPieces.lastChild)
            }
        }

        currentBox.appendChild(piece);

        displayToast("You can't make this move. Your king is under attack")

        return false
    }

    return true
}

const capturePiece = (pieceToRemove) => {
    let pawnImg = pieceToRemove.children[0];

    let li = document.createElement('li')
    li.appendChild(pawnImg);

    if(pieceToRemove.classList.contains('black')){
        blackCapturedPieces.appendChild(li);

        if(!gameOver){
            if(player === 'light'){
                myScore += parseInt(pieceToRemove.dataset.points)
            }else{
                enemyScore += parseInt(pieceToRemove.dataset.points)
            }
        }
    }else{
        lightCapturedPieces.appendChild(li);

        if(!gameOver){
            if(player === 'black'){
                myScore += parseInt(pieceToRemove.dataset.points)
            }else{
                enemyScore += parseInt(pieceToRemove.dataset.points)
            }
        }
    }
}

const checkIfKingIsAttacked = (playerToCheck) => {
    let kingPosition = getKingPosition(playerToCheck);

    let check = isCheck(kingPosition, playerToCheck === player);

    if(check){
        if(player !== playerToCheck){
            if(isCheckmate(kingPosition)){
                socket.emit('checkmate', roomId, user.username, myScore, gameStartedAtTimestamp)
                endGame(user.username)
            }else{
                socket.emit('check', roomId);
            }
        } 
        
        return true;
    }

    return false;
}

const saveMove = (newPieceBox, pawnPromoted, castlingPerformed, elPassantPerformed) => {
    let move = {from: selectedPiece.position, to: newPieceBox.id, piece: selectedPiece.piece, pieceColor: player}
    selectedPiece = null
    pawnToPromotePosition = null;

    if(gameHasTimer){
        let currentTime;

        if(player === 'light'){
            currentTime = playerLightTimer.innerText
        }else{
            currentTime = playerBlackTimer.innerText
        }

        move.time = currentTime

        timer.stop()
    }

    if(pawnPromoted){
        let promotedPiece = newPieceBox.children[0];

        let pawnPromotion = {
            promotedTo: promotedPiece.dataset.piece,
            pieceImg: promotedPiece.children[0].src
        }

        socket.emit('move-made', roomId, move, pawnPromotion)
    }else if(castlingPerformed){
        socket.emit('move-made', roomId, move, null, castling)
    }else if(elPassantPerformed){
        socket.emit('move-made', roomId, move, null, null, true)
    }else{
        socket.emit('move-made', roomId, move)
    }
}

const moveEnemy = (move, pawnPromotion = null, elPassantPerformed = false) => {
    pawnsToPerformElPassant = {}
    elPassantPositions = {}

    const {from , to, piece} = move;

    let boxMovedFrom = document.getElementById(from);
    let boxMovedTo = document.getElementById(to);

    if(boxMovedTo.children.length > 0){
        let pieceToRemove = boxMovedTo.children[0];

        capturePiece(pieceToRemove)
    }

    boxMovedTo.innerHTML = "";

    let enemyPiece = boxMovedFrom.children[0];

    if(pawnPromotion){
        const {promotedTo, pieceImg} = pawnPromotion

        enemyPiece.dataset.piece = promotedTo;
        enemyPiece.children[0].src = pieceImg
    }

    boxMovedFrom.innerHTML = ""
    boxMovedTo.appendChild(enemyPiece);

    if(elPassantPerformed){
        let capturedPieceBox = null
        if(player === 'light'){
            capturedPieceBox = document.getElementById(`${to[0]}-${parseInt(to[2]) - 1}`)
        }else{
            capturedPieceBox = document.getElementById(`${to[0]}-${parseInt(to[2]) + 1}`)
        }

        capturePiece(capturedPieceBox.children[0])

        capturedPieceBox.innerHTML = ""
    }

    if(piece === 'pawn'){
        let canPerformElPassant = checkForElPassant(move)

        if(canPerformElPassant){
            pawnsToPerformElPassant[to] = true
        }
    }

    myTurn = true;
    setCursor('pointer')

    if(gameHasTimer){
        timer.start()
    }
}
// --------------------------------------

// Castling Logic
const performCastling = (currentPlayer, rookPosition, kingPosition) => {
    let rookBox = document.getElementById(rookPosition)
    let kingBox = document.getElementById(kingPosition)

    let rook = rookBox.children[0]
    let king = kingBox.children[0]

    let newRookPosition = rookPosition;
    let newKingPosition = kingPosition;

    if(rookPosition[0] === 'A'){
        newRookPosition = 'D' + rookPosition.substr(1);
        newKingPosition = 'C' + kingPosition.substr(1)
    }else{
        newRookPosition = 'F' + rookPosition.substr(1);
        newKingPosition = 'G' + kingPosition.substr(1)
    }

    rookBox.innerHTML = ""
    kingBox.innerHTML = ""

    let newRookBox = document.getElementById(newRookPosition)
    let newKingBox = document.getElementById(newKingPosition)

    newRookBox.appendChild(rook)
    newKingBox.appendChild(king)

    if(currentPlayer === player){
        let check = isCheck(newKingPosition);

        if(check){
            newRookBox.innerHTML = ""
            newKingBox.innerHTML = ""

            rookBox.appendChild(rook)
            kingBox.appendChild(king)

            displayToast("Your king is under attack")
        }else{
            if(rookPosition[0] === 'A'){
                isLeftCastlingPerformed = true;
            }else{
                isRightCastlingPerformed = true
            }

            castling = {
                rookPosition,
                kingPosition
            }

            endMyTurn(document.getElementById(kingPosition), false, true)
        }
    }else{
        castling = null;

        myTurn = true;
        setCursor('pointer');

        if(gameHasTimer){
            timer.start()
        }
    }
}
// --------------------------------------

// Pawn Promotion Logic
const setPiecesToPromote = () => {
    if(player === 'light'){
        lightPieces.forEach(piece => {
            if(piece.piece !== 'pawn' && piece.piece !== 'king'){
                const li = document.createElement("li");
                li.setAttribute("data-piece", piece.piece);

                const img = document.createElement("img");
                img.src = piece.icon;

                li.appendChild(img);
                piecesToPromote.appendChild(li);
            }
        })
    }else{
        blackPieces.forEach(piece => {
            if(piece.piece !== 'pawn' && piece.piece !== 'king'){
                const li = document.createElement("li");
                li.setAttribute("data-piece", piece.piece);

                const img = document.createElement("img");
                img.src = piece.icon;

                li.appendChild(img);
                piecesToPromote.appendChild(li);
            }
        })
    }

    addListenerToPiecesToPromote();
}

const onChoosePieceToPromote = e => {
    if(!pawnToPromotePosition){
        return;
    }

    const pieceToPromote = e.target.closest("li");
    const pieceToPromoteImg = pieceToPromote.children[0];
    const pieceToPromoteType = pieceToPromote.dataset.piece;

    let pieceToChange = document.getElementById(pawnToPromotePosition).children[0];

    pieceToChange.innerHTML = ""
    pieceToChange.appendChild(pieceToPromoteImg)
    pieceToChange.dataset.piece = pieceToPromoteType;

    piecesToPromoteContainer.classList.add('hidden');

    endMyTurn(document.getElementById(pawnToPromotePosition), true);
}

const addListenerToPiecesToPromote = () => {
    for(let i = 0; i < piecesToPromote.children.length; i++){
        piecesToPromote.children[i].addEventListener("click", onChoosePieceToPromote)
    }
}
// --------------------------------------

// El Passant Logic
const checkForElPassant = (enemyMove) => {
    const {from, to, piece} = enemyMove;

    if(piece !== 'pawn' || (from[2] !== '7' && from[2] !== '2')){
        return false
    }

    let enemyPawn = null

    if(player === 'light'){
        enemyPawn = blackPieces.find(enemyPiece => enemyPiece.piece === 'pawn' && enemyPiece.position === from)
    }else{
        enemyPawn = lightPieces.find(enemyPiece => enemyPiece.piece === 'pawn' && enemyPiece.position === from)
    }

    if(!enemyPawn){
        return false
    }

    if(Math.abs(parseInt(to[2]) - parseInt(from[2])) === 2){
        let splittedPos = to.split("-");
        let xAxisPos = splittedPos[0]
        let yAxisPos = +splittedPos[1]

        let xAxisIndex = xAxis.findIndex(x => x === xAxisPos)

        if(xAxisIndex - 1 >= 0){
            let leftBox = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxisPos}`)

            if(
                leftBox.children.length > 0 &&
                leftBox.children[0].classList.contains(player) &&
                leftBox.children[0].dataset.piece === 'pawn'
            ){
                return true
            }
        }

        if(xAxisIndex + 1 < xAxis.length){
            let rightBox = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxisPos}`)

            if(
                rightBox.children.length > 0 &&
                rightBox.children[0].classList.contains(player) &&
                rightBox.children[0].dataset.piece === 'pawn'
            ){
                return true
            }
        }
    }

    return false
}

const performElPassant = (currentPlayer, prevPawnPosition, newPawnPosition) => {
    let capturedPawnPos = newPawnPosition[0] + '-' + prevPawnPosition[2]
    let capturedPawnBox = document.getElementById(capturedPawnPos)

    capturePiece(capturedPawnBox.children[0])

    if(currentPlayer === player){
        endMyTurn(document.getElementById(newPawnPosition), false, false, true)

        delete pawnsToPerformElPassant[capturedPawnPos]
        delete elPassantPositions[newPawnPosition]
    }else{
        myTurn = true
        setCursor('pointer')

        if(gameHasTimer){
            timer.start()
        }
    }
}
// --------------------------------------

// Draw Logic
const checkForDraw = () => {
    let myTotalPieces = document.querySelectorAll(`.piece.${player}`).length
    let enemyTotalPieces = document.querySelectorAll(`.piece.${enemy}`).length

    return myTotalPieces === enemyTotalPieces && myTotalPieces === 1
} 
// --------------------------------------

// Game Over Logic
const endGame = (winner=null) => {
    gameOver = true
    myTurn = false
    setCursor("default")

    if(gameHasTimer){
        timer.stop()
    }

    if(winner){
        winnerUsername.innerText = winner;

        let winningPoints = 0;

        if(winner === user.username){
            winningPoints = ~~((myScore / totalPiecesPoints) * 100)
            myScoreElement.innerText = winningPoints
            enemyScoreElement.innerText = -winningPoints
            myScoreElement.classList.add("positive-score")
            socket.emit("update-score", roomId, winningPoints, -winningPoints)
        }else{
            winningPoints = ~~((enemyScore / totalPiecesPoints) * 100)
            myScoreElement.innerText = -winningPoints
            enemyScoreElement.innerText = +winningPoints
            enemyScoreElement.classList.add("positive-score")
        }
    }else{
        winnerUsername.innerText = "Nobody"
    }

    gameOverMessageContainer.classList.remove("hidden")
}
// --------------------------------------

displayChessPieces()

// =====================
// Socket Listeners
// =====================

socket.on("receive-game-details", (details) => {
    gameDetails = details;

    let playerOne = gameDetails.players[0];

    gameHasTimer = gameDetails.time > 0

    if(!gameHasTimer){
        playerLightTimer.classList.add("hidden")
        playerBlackTimer.classList.add("hidden")
    }else{
        playerLightTimer.innerText = gameDetails.time + ":00";
        playerBlackTimer.innerText = gameDetails.time + ":00";
    }

    playerLight.querySelector(".username").innerText = playerOne.username;

    if(playerOne.username === user.username){
        player = 'light'
        enemy = 'black'

        myTurn = true
    }else{
        gameStartedAtTimestamp = new Date().toISOString().slice(0, 19).replace("T", ' ')

        player = 'black'
        enemy = 'light'

        setCursor('default')
        startGame(user)
    }

    if(gameHasTimer){
        timer = new Timer(player, roomId, gameDetails.time, 0, updateTimer, timerEndedCallback)
    }

    hideSpinner();
    room.classList.remove("hidden")
})

// If we are the first player and someone joins then this event is emitted
socket.on("game-started", (playerTwo) => {
    gameStartedAtTimestamp = new Date().toISOString().slice(0, 19).replace("T", ' ')
    startGame(playerTwo)

    if(gameHasTimer){
        timer.start()
    }
})

socket.on("enemy-moved", (move) => {
    moveEnemy(move)
})

socket.on("enemy-moved_castling", (enemyCastling) => {
    const {rookPosition, kingPosition} = enemyCastling
    performCastling(enemy, rookPosition, kingPosition)
})

socket.on('enemy-moved_pawn-promotion', (move, pawnPromotion) => {
    moveEnemy(move, pawnPromotion)
})

socket.on('enemy-moved_el-passant', (move) => {
    moveEnemy(move, null, true)
})

socket.on("enemy-timer-updated", (minutes, seconds) => {
    updateTimer(enemy, minutes, seconds)
})

socket.on("king-is-attacked", () => {
    setKingIsAttacked(true);
})

socket.on("you-lost", (winner, newEnemyScore = null) => {
    if(newEnemyScore){
        enemyScore = newEnemyScore
    }

    endGame(winner)
})

socket.on("you-won", () => {
    endGame(user.username)
})

socket.on("draw", () => {
    endGame()
})