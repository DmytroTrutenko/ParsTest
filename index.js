const express = require('express'); //подключаем модули
const app = express(); //инициализируем експерс
const server = require('http').createServer(app); //работа с сервером. библиотека http
const io = require('socket.io').listen(server); // подключаем сокет ио для связи клиент - сервер
const Cheerio1aee = require('./cheerioPars'); //моудль Cheerio

server.listen(3000, () => { // отслеживаем порт 3000
    console.log('listening on *:3000');
});

app.get('/', (request, response) => {   //отслеживаем страницу главную html
    response.sendFile(__dirname + '/index.html');
});

connections = [];

io.sockets.on('connection', (socket) => {
    console.log('connected');
    connections.push(socket);   //проверка что подключение удачно! пушим обьект в массив


    socket.on('disconnect', (data) => {
        console.log('disconnected');
        connections.splice(connections.indexOf(socket), 1);  //проверка что подключение закончилось! удаляем обьект с массива
    });

    socket.on('clickedCheerio', () => {
        Cheerio1aee();
    });

});