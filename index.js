const express = require('express'); //подключаем модули
const app = express(); //инициализируем експерс
const server = require('http').createServer(app); //работа с сервером. библиотека http


const io = require('socket.io').listen(server); // подключаем сокет ио для связи клиент - сервер

const fs = require('fs');  //Подключаем модуль для работы с файловой системой
const axios = require('axios');  //Подключаем модуль для работы с запросами на сервер

const cheerioPars = require('cheerio'); //Подключаем модуль для работы с парсером Cheerio
const puppeteer = require('puppeteer');
// const osmosis = require('osmosis');

let link = 'https://www.1a.ee/ru/c/tv-audio-video-igrovye-pristavki/audio-apparatura/naushniki/3sn?page=';
let dataC = [];  //массив в который будем  пушить данные


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

//Парсеры
    // Cheerio
    const Cheerio1aee = async () => {
        try {
            const startC = new Date().getTime();
            let i = 1;        //счетчик страниц
            let flag = false;    //флаг для проверки конца страниц
            flag = true;
            //в цыкле while проходим по всем страницам паггинации  и парсим
            while (true) {
                // console.log('step = ', i);
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
                                name: $(element).find('a.catalog-taxons-product__name').text().replace(/\s+/g, ' ').replace(/Наушники/i, '').trim(),
                                type: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(0).text().replace(/\s+/g, ' ').trim(),
                                wireless: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(1).text().replace(/\s+/g, ' ').trim(),
                                frequency: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(2).text().replace(/\s+/g, ' ').trim(),
                                resistance: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(3).text().replace(/\s+/g, ' ').trim(),
                                sensitivity: $(element).find('ul.catalog-taxons-product-key-attribute-list li strong').eq(4).text().replace(/\s+/g, ' ').trim()
                            };

                            dataC.push(item);
                        });

                        if (pagination !== null) {
                            flag = true;
                        }
                    })
                    .catch(err => console.log(err));


                if (flag) {  //если последняя страница то остановить цыкл

                    socket.emit('receiveObject', dataC); //отправляем на клиент

                    //создаем новый файл с новыми данными
                    fs.writeFile('1aCheerio.json', JSON.stringify(dataC), (err) => {
                        if (err) throw  err;
                        const endC = new Date().getTime();
                        const isTimeC = endC - startC;
                        console.log(isTimeC + 'ms');
                        socket.emit('isTime', {isTimeC: isTimeC});
                        console.log('Saved 1aCheerio.json file');
                        socket.emit('savedFileC');
                    });
                    break;
                }
                // i++;
            }
        } catch (e) {
            console.log('err = ', e);
        }
    };
    // Cheerio

    //Puppeteer
    const Puppeteer1aee = async () => {
        try {
            const startP = new Date().getTime();

            const browser = await puppeteer.launch({headless: true});
            const page = await browser.newPage();
            await page.goto(link);

            const result = await page.evaluate(() => {

                let dataP = []; // Создаём пустой массив для хранения данных
                let elements = document.querySelectorAll('div.catalog-taxons-product');


                for (var element of elements) {
                    let price = element.querySelector('span.catalog-taxons-product-price__item-price').innerText,
                        image = element.querySelector('img.catalog-taxons-product__image').src,
                        name = element.querySelector('a.catalog-taxons-product__name').innerText.replace(/Наушники/i, '').trim(),
                        type = element.querySelector('ul.catalog-taxons-product-key-attribute-list li:nth-child(1) strong').innerText,
                        wireless = element.querySelector('ul.catalog-taxons-product-key-attribute-list li:nth-child(2)  strong'),
                        frequency = element.querySelector('ul.catalog-taxons-product-key-attribute-list li:nth-child(3) strong'),
                        resistance = element.querySelector('ul.catalog-taxons-product-key-attribute-list li:nth-child(4) strong'),
                        sensitivity = element.querySelector('ul.catalog-taxons-product-key-attribute-list li:nth-child(5) strong');


                    if (wireless === null) {
                        wireless = '';
                    } else {
                        wireless = wireless.innerText;
                    }

                    if (frequency === null) {
                        frequency = '';
                    } else {
                        frequency = frequency.innerText;
                    }

                    if (resistance === null) {
                        resistance = '';
                    } else {
                        resistance = resistance.innerText;
                    }

                    if (sensitivity === null) {
                        sensitivity = '';
                    } else {
                        sensitivity = sensitivity.innerText;
                    }

                    dataP.push({
                        price,
                        image,
                        name,
                        type,
                        wireless,
                        frequency,
                        resistance,
                        sensitivity
                    });
                }

                return dataP;
            });

            socket.emit('receiveObject', result); //отправляем на клиент
            fs.writeFile('1aPuppeteer.json', JSON.stringify(result), (err) => {
                if (err) throw  err;
                const endP = new Date().getTime();
                const isTimeP = endP - startP;
                console.log(isTimeP + 'ms');
                socket.emit('isTime', {isTimeP: isTimeP});
                console.log('Saved 1aPuppeteer.json file');
                socket.emit('savedFileP');
            });
            browser.close();
            console.log(result);
            return result;
        } catch (e) {
            console.log('err = ', e);
        }
    };
    //Puppeteer

    //Osmosis
    // const Osmosis1aee = async ()=> {
    //     let dataO = [];
    //         osmosis
    //             // Load steemit.com
    //             .get('https://steemit.com')
    //             // Find all posts in postslist__summaries list
    //             .find('.PostsList__summaries > li')
    //             // Create an object with title and summary
    //             .set({
    //                 title: 'h2',
    //                 summary: '.PostSummary__body'
    //             })
    //             // Push post into an array
    //             .data(res => response.push(res))
    //             .error(err => reject(err))
    //             .done(() => resolve(response));
    //    return dataO;
    // };
    //
    // Osmosis1aee().then(res => {
    //     console.log(res);
    // });
    //Osmosis


//Парсеры


    socket.on('disconnect', () => {
        console.log('disconnected');
        connections.splice(connections.indexOf(socket), 1);  //проверка что подключение закончилось! удаляем обьект с массива
    });

    socket.on('clickedCheerio', () => {
        Cheerio1aee();
    });
    socket.on('clickedPuppeteer', () => {
        Puppeteer1aee();
    });
});

