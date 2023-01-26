const TelegramApi = require('node-telegram-bot-api');
require('dotenv').config('./');
const axios = require('axios').default;
const convert = require('xml-js');
const cred = require('./automatic-gamma-361810-9ad9dfa432cb.json');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const bot = new TelegramApi(process.env.API_KEY, { polling: true });

bot.setMyCommands([
  {
    command: '/start',
    description: 'Запуск бота',
  },
]);

let userState = {}; //initial | wCategory |  wCurrency | wPrice | wLocation
let userData = {};

function setState(chatId, stateName) {
  if (userState[chatId]) {
    userState[chatId].state = stateName;
  } else {
    userState[chatId] = { state: stateName };
  }
  console.log(userState);
}

function setData(chatId, fieldName, value) {
  if (userData[chatId]) {
    userData[chatId][`${fieldName}`] = value;
  } else {
    userData[chatId] = {
      currency: undefined,
      rate: undefined,
      amount: undefined,
      category: undefined,
      location: undefined,
    };
    userData[chatId][`${fieldName}`] = value;
  }
  console.log(userData);
}
function clearData(chatId) {
  setState(chatId, 'initial');
  userData[`${chatId}`] = undefined;
}

bot.onText(/\/start/, async (msg) => {
  clearData(msg.chat.id);
  await bot.sendPhoto(msg.chat.id, 'files/main.jpeg', {
    caption: `<b>Привет</b>, я виртуальный ассистент ShibaShipping! Чем я могу помочь? 🐾`,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      keyboard: [
        ['🧑‍💻 Кто мы?', '☎️ Контакты'],
        ['💎 Отзывы', '💸 Курсы валют'],
        ['🚚 Расчитать доставку', '🔍 Отследить заказы'],
      ],
    }),
  });
});

bot.onText(/🧑‍💻 Кто мы?/, async (msg) => {
  clearData(msg.chat.id);
  await bot.sendVideo(msg.chat.id, 'files/about.mov', {
    caption: `Ну что же… Вот и пришло время познакомиться поближе\n\nО том, кто мы и какие у нас планы, вы можете узнать из видео выше\n\nА также, если вы еще не знаете о других наших соц. сетях - можете найти их по этой ссылке: https://linktr.ee/shibashipping\n\nКстати, в Inst мы ежедневно постим классные рилсы, которые вы не увидите в телеграмме, поэтому с радостью ждём вас там!🫂`,
    width: 1072,
    height: 1920,
    parse_mode: 'HTML',
  });
});
bot.onText(/\/info/, async (msg) => {
  console.log(userData, userState);
});

bot.onText(/🔍 Отследить заказ/, async (msg) => {
  clearData(msg.chat.id);
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
  await doc.useServiceAccountAuth(cred);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  let orders = '';
  for (el of rows) {
    if (
      `@${msg.from.username}` === el['ТЕЛЕГРАМ КЛИЕНТА'] &&
      el['СТАТУС'] !== 'Выполнено'
    ) {
      orders += `Заказ #${el['№ ЗАКАЗА']} от ${el['ДАТА ЗАКАЗА']}\nСтатус: ${el['СТАТУС']}\nСсылка на товар: ${el['ССЫЛКА НА ТОВАР/АРТИКУЛ']}\n\n`;
      // orders.push({
      //   order_num: el['№ ЗАКАЗА'],
      //   order_date: el['ДАТА ЗАКАЗА'],
      //   order_link: el['ССЫЛКА НА ТОВАР/АРТИКУЛ'],
      //   status: el['СТАТУС'],
      // });
    }
  }
  if (orders !== '') {
    await bot.sendMessage(
      msg.chat.id,
      '<b>Твои заказы в пути:</b>\n\n' + orders,
      { parse_mode: 'HTML' }
    );
  } else {
    await bot.sendMessage(msg.chat.id, 'Сейчас у тебя нет заказов в пути', {
      parse_mode: 'HTML',
    });
  }
});

bot.onText(/💎 Отзывы/, async (msg) => {
  clearData(msg.chat.id);
  await bot.sendPhoto(msg.chat.id, 'files/feedback.jpg', {
    caption: `Чтобы вы могли убедиться в честности нашего сервиса - ниже можете увидеть все отзывы и выполненные нами заказы\n\n<a href="https://t.me/shibashippingfeedback">Отзывы о нас</a> | <a href="https://t.me/shibashippingorders">Выполненные заказы</a>`,
    parse_mode: 'HTML',
  });
});

bot.onText(/☎️ Контакты/, async (msg) => {
  clearData(msg.chat.id);
  await bot.sendPhoto(msg.chat.id, 'files/contacts.jpg', {
    caption: `Чтобы не пропустить ни единой новости - подписывайтесь на наши соцсети👇\n\n<a href="https://t.me/shibashipping">Основной канал</a>\n<a href="https://t.me/nikitapakhomovv">Связаться с менеджером</a><a href="https://instagram.com/shiba_shipping">\n\ninstagram</a> | <a href='https://www.youtube.com/@shibashipping/shorts'>youtube</a> | <a href='https://dzen.ru/id/638e0dc4e4bbcb36ce5a7993'>Дзэн</a> | <a href='https://vk.com/shibashipping'>ВК</a>`,
    parse_mode: 'HTML',
  });
});

bot.onText(/💸 Курсы валют/, async (msg) => {
  clearData(msg.chat.id);
  const date = new Date();
  const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
  const month =
    date.getMonth() < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
  await bot.sendPhoto(msg.chat.id, 'files/сurrency.jpg', {
    parse_mode: 'HTML',
    caption: `<b>Актуальный курс валют на ${day}.${month}.${date.getFullYear()}\n\n</b>USD: ${
      (
        await excangeRates()
      ).USD
    } руб.\nCNY: ${(await excangeRates()).CNY} руб.\nEUR: ${
      (
        await excangeRates()
      ).EUR
    } руб.`,
  });
});

bot.onText(/🚚 Расчитать доставку/, async (msg) => {
  setState(msg.chat.id, 'wCategory');
  bot.sendMessage(msg.chat.id, 'Выбери категорию', {
    reply_markup: JSON.stringify({
      keyboard: [
        ['Аксессуары', 'Одежда'],
        ['Обувь/Пуховики', 'Электроника'],
      ],
    }),
  });
});

bot.on('message', async (msg) => {
  if (
    msg.text === '/start' ||
    msg.text === '/info' ||
    msg.text === '🚚 Расчитать доставку' ||
    msg.text === '☎️ Контакты' ||
    msg.text === '💎 Отзывы' ||
    msg.text === '💸 Курсы валют' ||
    msg.text === '🔍 Отследить заказы' ||
    msg.text === '🧑‍💻 Кто мы?'
  ) {
    clearData(msg.chat.id);
    return;
  } else {
    if (userState[msg.chat.id]?.state === 'wCategory') {
      if (
        !['Аксессуары', 'Одежда', 'Обувь/Пуховики', 'Электроника'].includes(
          msg.text
        )
      ) {
        return bot.sendMessage(
          msg.chat.id,
          'Я не знаю такой категории товара, попробуй снова'
        );
      }
      setData(msg.chat.id, 'category', msg.text);
      return bot
        .sendMessage(msg.chat.id, 'Выбери валюту', {
          reply_markup: JSON.stringify({
            keyboard: [['USD'], ['EUR'], ['CNY']],
          }),
        })
        .then(setState(msg.chat.id, 'wCurrency'));
    } else if (userState[msg.chat.id]?.state === 'wCurrency') {
      if (!['USD', 'EUR', 'CNY'].includes(msg.text)) {
        return bot.sendMessage(
          msg.chat.id,
          'Я не знаю такой валюты, попробуй снова'
        );
      }
      setData(msg.chat.id, 'currency', msg.text);
      return bot
        .sendMessage(
          msg.chat.id,
          `Введи цену товара в ${userData[msg.chat.id].currency}`,
          {
            reply_markup: JSON.stringify({
              hide_keyboard: true,
            }),
          }
        )
        .then(setState(msg.chat.id, 'wPrice'));
    } else if (userState[msg.chat.id]?.state === 'wPrice') {
      if (!msg.text.match(/^[0-9]*[.,]?[0-9]+$/)) {
        return bot.sendMessage(
          msg.chat.id,
          'Пожалуйста, введи число. Например 102 / 250.02 / 120,1'
        );
      }
      setData(msg.chat.id, 'amount', parseFloat(msg.text.replace(',', '.')));
      return bot
        .sendMessage(msg.chat.id, `Ты находишься в Санкт-Петербурге?`, {
          reply_markup: JSON.stringify({
            keyboard: [['Да', 'Нет']],
          }),
        })
        .then(setState(msg.chat.id, 'wLocation'));
    } else if (userState[msg.chat.id]?.state === 'wLocation') {
      if (!['Да', 'Нет'].includes(msg.text)) {
        return bot.sendMessage(
          msg.chat.id,
          'На этот вопрос можно ответить только "Да" или "Нет", попробуй снова'
        );
      }
      setData(msg.chat.id, 'location', msg.text);
      setData(
        msg.chat.id,
        'rate',
        (await excangeRates())[`${userData[msg.chat.id].currency}`]
      );
      let result = userData[msg.chat.id].amount * userData[msg.chat.id].rate;
      if (
        (userData[msg.chat.id].currency === 'CNY' &&
          userData[msg.chat.id].amount >= 2000) ||
        (userData[msg.chat.id].currency === 'USD' &&
          userData[msg.chat.id].amount >= 300) ||
        (userData[msg.chat.id].currency === 'EUR' &&
          userData[msg.chat.id].amount >= 250)
      ) {
        result *= 1.08;
      } else {
        result *= 1.05;
        result += 900;
      }

      switch (userData[msg.chat.id].category) {
        case 'Аксессуары':
          result += 900;
          break;
        case 'Одежда':
          result += 1200;
          break;
        case 'Обувь/Пуховики':
          result += 1700;
          break;
        case 'Электроника':
          result += 4000;
          break;
        default:
          result = 0;
      }
      if (userData[msg.chat.id].location === 'Нет') result += 600;

      bot.sendMessage(
        msg.chat.id,
        `Итоговая стоимость доставки: ${Math.ceil(result)}₽`,
        {
          reply_markup: JSON.stringify({
            keyboard: [
              ['🧑‍💻 Кто мы?', '☎️ Контакты'],
              ['💎 Отзывы', '💸 Курсы валют'],
              ['🚚 Расчитать доставку', '🔍 Отследить заказы'],
            ],
          }),
        }
      );
      clearData(msg.chat.id);
      return;
    } else {
      return bot.sendMessage(
        msg.chat.id,
        'Я не знаю такой команды, нажми /start, чтобы получить список доступных команд'
      );
    }
  }
});

async function excangeRates() {
  const arr = ['USD', 'EUR', 'CNY'];
  const xml = await (
    await axios.get('http://www.cbr.ru/scripts/XML_daily.asp')
  ).data;
  const res = [];
  const rate = JSON.parse(convert.xml2json(xml)).elements[0].elements;
  for (let el of rate) {
    if (arr.includes(el.elements[1].elements[0].text)) {
      res.push(parseFloat(el.elements[4].elements[0].text.replace(',', '.')));
    }
  }
  res[0] += 5;
  res[1] += 5;
  res[2] += 1;
  return {
    USD: parseFloat(res[0].toFixed(2)),
    EUR: parseFloat(res[1].toFixed(2)),
    CNY: parseFloat(res[2].toFixed(2)),
  };
}
