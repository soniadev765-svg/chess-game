const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
const players = {};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.emit("boardState", chess.fen());

    socket.on("move", (move) => {
        try {
            if (
                (chess.turn() === "w" && socket.id !== players.white) ||
                (chess.turn() === "b" && socket.id !== players.black)
            ) {
                return;
            }

            const result = chess.move(move);

            if (result) {
                io.emit("boardState", chess.fen());
            } else {
                socket.emit("invalidMove");
            }
        } catch (err) {
            console.error(err);
            socket.emit("invalidMove");
        }
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);

        if (socket.id === players.white) {
            delete players.white;
        }

        if (socket.id === players.black) {
            delete players.black;
        }
    });
});

server.listen(3007, () => {
    console.log("Server running on port 3007");
});