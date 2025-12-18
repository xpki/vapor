import os from 'os';
import dotenv from 'dotenv/config';
import path from "node:path";
import wisp from "wisp-server-node"
import { createBareServer } from "@tomphttp/bare-server-node"
import { Server } from 'socket.io'
import { uvPath } from "@titaniumnetwork-dev/ultraviolet"
import { epoxyPath } from "@mercuryworkshop/epoxy-transport"
import { bareModulePath } from "@mercuryworkshop/bare-as-module3"
import { baremuxPath } from "@mercuryworkshop/bare-mux/node"
import express from "express";
import process from 'node:process';
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const bare = createBareServer("/bare/")
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const publicPath = path.join(__dirname, "public");
const server = createServer(app);
const io = new Server(server, {
  path: "/socket.io/",
  pingInterval: 10000,
  pingTimeout: 5000,
});
const devs = {
    [process.env.devn1]: process.env.dev1,
    [process.env.devn2]: process.env.dev2,
    [process.env.devn3]: process.env.dev3,
}
app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/baremod/", express.static(bareModulePath));

// pages
app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/chat", (req, res) => {
    res.sendFile(path.join(publicPath, "chat.html"));
});

app.use((req, res) => {
    res.status(404);
    res.sendFile(path.join(publicPath, "404.html"));
});


// chat things
let onlineUsers = 0
const messages = [];
const MAX_HISTORY = 50;
const nicknames = {};

function getNickname(socketId) {
  return nicknames[socketId] || `user-${socketId.slice(0, 5)}`;
}

function pushMessage(msg) {
  messages.push(msg);
  if (messages.length > MAX_HISTORY) messages.shift();
}

io.on("connection", (socket) => {
    onlineUsers++
    io.emit("online users", onlineUsers);

    socket.emit("chatHistory", messages);

    socket.on("setNickname", (nickname) => {
        const clean = String(nickname).trim().slice(0, 32);
        nicknames[socket.id] = clean || getNickname(socket.id);

        io.emit("nicknameUpdated", {
            id: socket.id,
            nickname: nicknames[socket.id],
        });
    });

    socket.on("sendMessage", (message) => {
        const text = String(message || "").slice(0, 500);
        if (!text.trim()) return;

        const payload = {
            sender: nicknames[socket.id],
            message: text,
        }

        pushMessage(payload)
        io.emit("newMessage", payload)
    })
    socket.on("disconnect", () => {
        onlineUsers--;
        io.emit("online users", onlineUsers);
        delete nicknames[socket.id];
    });    
})

// proxy things

server.on("upgrade", (req, socket, head) => {
    if (req.url.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
    } else if (bare.shouldRoute(req)) {
        bare.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});


// server running things
let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080; // set your port

server.on("listening", () => {
    const address = server.address();
    console.log("Listening on:");
    console.log(`\thttp://localhost:${address.port}`);
    console.log(
        `\thttp://${
            address.family === "IPv6" ? `[${address.address}]` : address.address
        }:${address.port}`
    );
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close();
    bare.close();
    process.exit(0);
}

server.listen({
    port,
});
