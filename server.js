const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let onlineUsers = {}; // { socketId: username }

io.on("connection", (socket) => {
  console.log("Novo usuário conectado:", socket.id);

  // Definir nome do usuário
  socket.on("setUsername", (username) => {
    onlineUsers[socket.id] = username;
    io.emit("updateUserList", onlineUsers);
  });

  // Mensagem de grupo
  socket.on("groupMessage", (msg) => {
    io.emit("groupMessage", { user: onlineUsers[socket.id], msg });
  });

  // Digitando no grupo
  socket.on("typingGroup", () => {
    socket.broadcast.emit("typingGroup", onlineUsers[socket.id]);
  });
  socket.on("stopTypingGroup", () => {
    socket.broadcast.emit("stopTypingGroup", onlineUsers[socket.id]);
  });

  // Criar ou entrar em sala privada
  socket.on("createPrivateRoom", ({ targetId }) => {
    const roomName = getRoomName(socket.id, targetId);
    socket.join(roomName);
    io.to(targetId).emit("invitePrivateRoom", { roomName, from: onlineUsers[socket.id] });
  });

  // Mensagem privada
  socket.on("privateMessage", ({ roomName, msg }) => {
    io.to(roomName).emit("privateMessage", { user: onlineUsers[socket.id], msg, roomName });
  });

  // Digitando no privado
  socket.on("typingPrivate", ({ roomName }) => {
    socket.to(roomName).emit("typingPrivate", onlineUsers[socket.id]);
  });
  socket.on("stopTypingPrivate", ({ roomName }) => {
    socket.to(roomName).emit("stopTypingPrivate");
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("updateUserList", onlineUsers);
    console.log("Usuário desconectado:", socket.id);
  });
});

// Função para criar nome único da sala privada
function getRoomName(id1, id2) {
  return [id1, id2].sort().join("_");
}

server.listen(4000, () => console.log("Servidor rodando na porta 4000"));