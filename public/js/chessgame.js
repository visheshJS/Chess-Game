const socket = io();

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  if(!playerRole) return;
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
      );
      

      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        ); // Note: Chess.js uses 'w'/'b' not 'W'/'B'

        // Add Unicode chess symbol
        pieceElement.innerText = getPieceUnicode(square);

        pieceElement.draggable = playerRole === square.color;
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, col: squareindex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });
  if(playerRole==='b'){
    boardElement.classList.add("flipped");
  }else{
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (sourceSquare, targetSource) => {

  const move = {

    from: `${String.fromCharCode(97 + sourceSquare.col)}${
      8 - sourceSquare.row
    }`,

    to: `${String.fromCharCode(97 + targetSource.col)}${8 - targetSource.row}`,

    promotion: "q",
  };
  socket.emit("move", move);
  
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♔",
    P: "♟",
    R: "♜",
    N: "♞",
    B: "♝",
    Q: "♛",
    K: "♚",
  };
  return unicodePieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});
socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});
socket.on("invalidMove", (move) => {
    alert("Invalid move: " + move.from + " to " + move.to);
});

socket.on("gameOver", (winner) => {
    const gameOverModal = document.getElementById("gameOverModal");
    const gameOverMessage = document.getElementById("gameOverMessage");
    
    // Display winner message
    if (winner === "Draw") {
        gameOverMessage.textContent = "The game is a draw!";
    } else {
        gameOverMessage.textContent = `${winner} wins the game!`;
    }

    // Show the game over modal with the winner message and play again button
    gameOverModal.style.display = "block"; 

    // Optionally, hide the chessboard and disable interaction
    document.querySelector(".chessboard").style.pointerEvents = "none";
});

  

renderBoard();
