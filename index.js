const express = require('express'); //подключаем модули
const app = express(); //инициализируем експерс
const server = require('http').createServer(app); //работа с сервером. библиотека http
const io = require('socket.io').listen(server); // подключаем сокет ио для связи клиент - сервер
const fs = require('fs');  //Подключаем модуль для работы с файловой системой
const axios = require('axios');  //Подключаем модуль для работы с запросами на сервер
const cheerioPars = require('cheerio'); //Подключаем модуль для работы с парсером Cheerio

let link = 'https://www.1a.ee/ru/c/tv-audio-video-igrovye-pristavki/audio-apparatura/naushniki/3sn?page=';
let arr = [];  //массив в который будем  пушить данные


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



    //главная функция Cheerio
    const Cheerio1aee = async () => {
        try {
            const start = new Date().getTime();
            let i = 1;        //счетчик страниц
            let flag = false;    //флаг для проверки конца страниц
            i = 39;
            //в цыкле while проходим по всем страницам паггинации  и парсим
            while (true) {
                console.log('step = ', i);
                //делаем get запрос на сайт
                await axios.get(link + i)
                    .then(res => res.data)
                    .then(res => {

                        //здесь работаем с пасрером и с полученным HTML (основная работа)
                        let html = res;    //весь html получееный с ссылки.. тоесть вся страница
                        const $ = cheerioPars.load(html); // загружаем все в cheerioPars
                        let pagination = $('a.next.inactive.non-clickable').html(); //последняя стрелочка пагинации
                        $(html).find('div.catalog-taxons-product').each((index, element) => {
                            let item = {
                                price: $(element).find('span.catalog-taxons-product-price__item-price').text().replace(/\s+/g, ''),
                                image: $(element).find('img.catalog-taxons-product__image').attr('src').trim(),
                                name: $(element).find('a.catalog-taxons-product__name').text().replace(/\s+/g,   ' ').replace(/Наушники/i,   '').trim(),
                                type: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(0).text().replace(/\s+/g, ' ').trim(),
                                wireless: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(1).text().replace(/\s+/g, ' ').trim(),
                                frequency: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(2).text().replace(/\s+/g, ' ').trim(),
                                resistance: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(3).text().replace(/\s+/g, ' ').trim(),
                                sensitivity: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(4).text().replace(/\s+/g, ' ').trim()
                            };

                            arr.push(item);

                        });


                        if (pagination !== null) {
                            flag = true;
                        }
                    })
                    .catch(err => console.log(err));


                if (flag) {  //если последняя страница то остановить цыкл

                    socket.emit('receiveObject', arr); //отправляем на клиент

                    //создаем новый файл с новыми данными
                    fs.writeFile('1aCheerio.json', JSON.stringify(arr), (err) => {
                        if (err) throw  err;
                        const end = new Date().getTime();
                        const isTime = end - start;
                        console.log(isTime + 'ms');
                        socket.emit('isTime', {isTime:isTime});
                        console.log('Saved 1aCheerio.json file');
                        socket.emit('savedFile');
                    });
                    break;
                }
                i++;
            }
        } catch (e) {
            console.log('err = ', e);
        }
    };

    socket.on('disconnect', () => {
        console.log('disconnected');
        connections.splice(connections.indexOf(socket), 1);  //проверка что подключение закончилось! удаляем обьект с массива
    });

    socket.on('clickedCheerio', () => {
        Cheerio1aee();

    });
});