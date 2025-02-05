const express= require('express');
const socket= require('socket.io');
const http = require('http');
const {Chess}= require('chess.js');
const path= require("path"); 

const app = express();
const PORT=3040

const server=http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players={};
let currentPlayer="w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index",{title: "Chess Game"});
})

io.on("connection",(uniqueSocket)=>{
    console.log(`connected`);

    if(!players.white){
        players.white=uniqueSocket.id;
        uniqueSocket.emit("playerRole","w");

    }else if(!players.black){
        players.black=uniqueSocket.id;
        uniqueSocket.emit("playerRole","b");
    }else{
        uniqueSocket.emit("spectatorRole");
    }

    uniqueSocket.on("disconnect",() => {
        if(uniqueSocket.id===players.white){
            delete players.white
        }else if(uniqueSocket.id === players.black){
            delete players.black
        }
      
    });

    uniqueSocket.on("move",(move)=>{
        //check if the move is valid chess move

        try{
            //making sure jiski turn hai vo chalra hai
            if(chess.turn()==="w" && uniqueSocket.id !==players.white) return;
            if(chess.turn()==="b" && uniqueSocket.id !==players.black) return;
            
            const result=chess.move(move);
            if(result){
                currentPlayer=chess.turn();
                // Check if the game is over (checkmate, stalemate, etc.)
                if (chess.isGameOver()) {
                    let winner = null;
                    if (chess.isCheckmate) {
                        winner = chess.turn() === "w" ? "Black" : "White";
                    } else if (chess.isStalemate || chess.isThreefoldRepetition || chess.isInsufficientMaterial) {
                        winner = "Draw";
                    }

                    io.emit("gameOver", winner);
                }
                io.emit("move",move);
                io.emit("boardState",chess.fen());
            }
            else{
                console.log(`invalid move: `,move);
                uniqueSocket.emit("invalidMove",move);
                
            }
        }
        catch(error){
            console.log(error);
            uniqueSocket.emit("invalid move: ",move);
        }
    })
    
});

server.listen(3040,()=>{
    console.log(`Server running at http://localhost:${PORT}`);


})