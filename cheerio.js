const fs = require('fs');  //Подключаем модуль для работы с файловой системой
const axios = require('axios');  //Подключаем модуль для работы с запросами на сервер
const cheerio = require('cheerio'); //Подключаем модуль для работы с парсером Cheerio

let link = 'https://www.1a.ee/ru/c/tv-audio-video-igrovye-pristavki/audio-apparatura/naushniki/3sn?page=';


//главная функция Cheerio
const Cheerio1aee = async () => {
    try {
        let arr = [];  //массив в который будем  пушить данные
        let i = 1;        //счетчик страниц
        let flag = false;    //флаг для проверки конца страниц
        i = 43;
        //в цыкле while проходим по всем страницам паггинации  и парсим
        while (true) {
            console.log('step = ', i);
            //делаем get запрос на сайт
            await axios.get(link + i)
                .then(res => res.data)
                .then(res => {

                    //здесь работаем с пасрером и с полученным HTML (основная работа)
                    let html = res;    //весь html получееный с ссылки.. тоесть вся страница
                    const $ = cheerio.load(html); // загружаем все в cheerio
                    let pagination = $('a.next.inactive.non-clickable').html(); //последняя стрелочка пагинации

                    $(html).find('div.catalog-taxons-product').each((index, element) => {
                        let item = {
                            price: $(element).find('span.catalog-taxons-product-price__item-price').text().replace(/\s+/g, '')
                        };

                        arr.push(item);
                    });


                    if (pagination !== null) {
                        flag = true;
                    }
                })
                .catch(err => console.log(err));


            if (flag) {  //если последняя страница то остановить цыкл

                //создаем новый файл с новыми данными
                fs.writeFile('1aCheerio.json', JSON.stringify(arr), function (err) {
                    if (err) throw  err;
                    console.log('Saved 1aCheerio.json file')
                });
                break;
            }
            i++;
        }
    } catch (e) {
        console.log('err = ', e);
    }
};


Cheerio1aee();

// module.exports = Cheerio1aee;