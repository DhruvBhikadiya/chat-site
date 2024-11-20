const express = require('express');
const { createServer } = require('http');
const cp = require('cookie-parser');
const socket = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./Config/db.js');
const multer = require('multer');
const bodyparser = require("body-parser");

dotenv.config();

const app = express();
const server = createServer(app);

const io = socket(server);

const upload = multer({ dest: 'Uploades/sharingFiles' });

app.use(cp());

app.use(express.urlencoded());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }))

app.use('/Uploades', express.static(path.join(__dirname, '/Uploades')));
app.use('/image', express.static(path.join(__dirname, '/image')));

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/Views'));

app.use('/', require('./Routes'));

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = `/Uploades/sharingFiles/${req.file.filename}`;
    res.json({ filePath });
});

const rooms = {};
const peersUsers = {};

io.on('connection', async (socket) => {
    console.log('New user connected');

    socket.on('join', (data) => {
        const { currentUserId, currentChatId } = data;

        const roomId = [currentUserId, currentChatId].sort().join('_');

        socket.join(roomId);

        rooms[currentUserId] = rooms[currentUserId] || {};
        rooms[currentChatId] = rooms[currentChatId] || {};
        rooms[currentUserId][currentChatId] = roomId;
        rooms[currentChatId][currentUserId] = roomId;

        console.log(rooms);

        console.log(`${currentUserId} joined room: ${roomId}`);
    });

    socket.on('join_group', (data) => {
        const { currentUserId, currentChatId, groupName } = data;
        socket.join(currentChatId);
        console.log(`${currentUserId} joined group ${groupName}`);
    });

    socket.on('newUser', (data) => {
        const { peerId, userId } = data;
        console.log('newUser joined with id :- ', peerId);
        peersUsers[userId] = peerId;

        console.log(peersUsers);

        socket.on('videoChatId', async (data) => {
            console.log(data);
            console.log('videoChatId event occure');
            const { currentChatId, callType, isGroupChat } = data;
            if (!isGroupChat) {
                var room;
                if (rooms.hasOwnProperty(userId)) {
                    room = rooms[userId][currentChatId];
                }
                const pId = peersUsers[currentChatId];
                console.log(pId, currentChatId);
                io.to(room).emit('videoUserJoined', ({ pId, currentChatId, callType, isGroupChat }));
            }
            else {
                const udata = await db.query(`select * from group_tbl where gid = ${currentChatId};`);
                const user = [];
                udata.rows[0].uid.forEach(element => {
                    user.push(element);
                });
                user.push(udata.rows[0].aid);
                console.log(user);
                const data = {
                    peerIds: peersUsers,
                    currentChatId: currentChatId,
                    callType: callType,
                    uid: user,
                    isGroupChat: isGroupChat
                };
                io.to(currentChatId).emit('group_video_user_joined', (data));
            }
        });

        socket.on('voiceChatId', async (data) => {
            console.log(data);
            console.log('voiceChatId event occure');
            const { currentChatId, callType, isGroupChat } = data;
            if (!isGroupChat) {
                var room;
                if (rooms.hasOwnProperty(userId)) {
                    room = rooms[userId][currentChatId];
                }
                const pId = peersUsers[currentChatId];
                console.log(pId, currentChatId);
                io.to(room).emit('voiceUserJoined', ({ pId, currentChatId, callType, isGroupChat }));
            }
            else {
                const udata = await db.query(`select * from group_tbl where gid = ${currentChatId};`);
                const user = [];
                udata.rows[0].uid.forEach(element => {
                    user.push(element);
                });
                user.push(udata.rows[0].aid);
                console.log(user);
                const data = {
                    peerIds: peersUsers,
                    currentChatId: currentChatId,
                    callType: callType,
                    uid: user,
                    isGroupChat: isGroupChat
                };
                io.to(currentChatId).emit('group_voice_user_joined', (data));
            }
        });
    })


    socket.on('rejectCall', (data) => {
        console.log(data, '--rejectCall--');
        const { currentChatId, currentUserId, isGroupChat, callType } = data;
        if (!isGroupChat) {
            var room;
            if (rooms.hasOwnProperty(currentUserId)) {
                room = rooms[currentUserId][currentChatId];
            }
            console.log(room, '--rejectCall--');
            io.to(room).emit('rejectCall', (callType));
        }
        else {
            io.to(currentChatId).emit('rejectCall', (callType));
        }
    });

    socket.on('disconnectUser', (data) => {
        console.log(data, '--disconnectUser--');
        const { callType, currentChatId, currentUserId, isGroupChat } = data;
        if (!isGroupChat) {
            var room;
            if (rooms.hasOwnProperty(currentUserId)) {
                room = rooms[currentUserId][currentChatId];
            }
            console.log(room, '--disconnectUser--');
            io.to(room).emit('userDisconnected', (callType));
        }
        else {
            io.to(currentChatId).emit('userDisconnected', (callType));
        }
    });

    socket.on('group_message', (data) => {
        const { currentUserId, currentChatId, message, fileType } = data;
        try {
            const sentMessage = db.query(`select add_group_message($1,$2,$3,$4)`, [currentUserId, currentChatId, message, fileType]);
            if (!sentMessage) {
                console.log('Message not send');
            }
            else {
                io.to(currentChatId).emit('group_message', { currentUserId, message, fileType });
            }
        }
        catch (e) {
            console.log(e);
            console.log("Something went wrong");
        }
    });

    socket.on('private_message', (data) => {
        const { currentUserId, currentChatId, message, fileType } = data;
        try {
            const sentMessage = db.query(`select add_message($1,$2,$3,$4)`, [currentUserId, currentChatId, message, fileType]);
            if (!sentMessage) {
                console.log('Message not send');
            }
            else {
                io.to(rooms[currentUserId][currentChatId]).emit('private_message', { currentUserId, message, fileType });
            }
        }
        catch (e) {
            console.log(e);
            console.log("Something went wrong");
        }

    });

    socket.on('get_old_chats', async (currentChatId, currentUserId, isGroupChat) => {
        let messages;
        if (isGroupChat) {
            const result = await db.query(`SELECT * FROM group_chat_messages where group_id = ${currentChatId}`);
            messages = result.rows;
            socket.emit('old_group_chat', currentChatId, currentUserId, messages);
        } else {
            const result = await db.query('SELECT * FROM chat_messages');
            messages = result.rows;
            socket.emit('old_chat', currentChatId, currentUserId, messages);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected!');
    });
});

server.listen(process.env.PORT, (e) => {
    e ? console.log(e) : console.log("Server is running on port :- ", process.env.PORT);
});