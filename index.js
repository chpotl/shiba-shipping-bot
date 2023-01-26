const TelegramApi = require('node-telegram-bot-api');
require('dotenv').config('./');
const axios = require('axios').default;
const convert = require('xml-js');
const bot = new TelegramApi(process.env.API_KEY, { polling: true });

let state = 'initial'; //initial | wCategory |  wCurrency | wPrice | wLocation

let data = {
  currency: undefined,
  rate: undefined,
  amount: undefined,
  category: undefined,
  location: undefined,
};

bot.onText(/\/start/, async (msg) => {
  await bot.sendPhoto(msg.chat.id, 'files/main.jpeg', {
    caption: `<b>Привет</b>, я виртуальный асистент ShibaShiping! Чем я могу помочь? 🐾`,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      keyboard: [
        ['🧑‍💻 Кто мы?', '☎️ Контакты'],
        ['💎 Отзывы', '💸 Курсы валют'],
        ['🚚 Расчитать доставку', '🔍 Отследить заказ'],
      ],
    }),
  });
  state = 'initial';
  data = {
    currency: undefined,
    rate: undefined,
    amount: undefined,
    category: undefined,
    location: undefined,
  };
});

bot.onText(/🧑‍💻 Кто мы?/, async (msg) => {
  await bot.sendVideo(msg.chat.id, 'files/about.mov', {
    caption: `Ну что же… Вот и пришло время познакомиться поближе\n\nО том, кто мы и какие у нас планы, вы можете узнать из видео выше\n\nА также, если вы еще не знаете о других наших соц. сетях - можете найти их по этой ссылке: https://linktr.ee/shibashipping\n\nКстати, в Inst мы ежедневно постим классные рилсы, которые вы не увидите в телеграмме, поэтому с радостью ждём вас там!🫂`,
    width: 1072,
    height: 1920,
    parse_mode: 'HTML',
  });
});

bot.onText(/💎 Отзывы/, async (msg) => {
  await bot.sendPhoto(msg.chat.id, 'files/feedback.jpg', {
    caption: `<a href="https://t.me/shibashippingfeedback">Отзывы о нас</a>\n\n<a href="https://t.me/shibashippingorders">Выполненные заказы</a>`,
    parse_mode: 'HTML',
  });
});

bot.onText(/☎️ Контакты/, async (msg) => {
  await bot.sendPhoto(msg.chat.id, 'files/contacts.jpg', {
    caption: `<a href="https://t.me/shibashipping">Канал с новостями</a>\n\n<a href="https://t.me/nikitapakhomovv">Связаться с менеджером</a><a href="https://instagram.com/shiba_shipping">\n\ninstagram</a> | <a href='https://www.youtube.com/@shibashipping/shorts'>youtube</a> | <a href='https://dzen.ru/id/638e0dc4e4bbcb36ce5a7993'>Дзэн</a> | <a href='https://vk.com/shibashipping'>ВК</a>`,
    parse_mode: 'HTML',
  });
});

bot.onText(/💸 Курсы валют/, async (msg) => {
  const date = new Date();
  const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
  const month =
    date.getMonth() < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
  await bot.sendPhoto(msg.chat.id, 'files/photo_2023-01-24 23.04.06.jpeg', {
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
  state = 'wCategory';
  bot.sendMessage(msg.chat.id, 'Выбери категорю', {
    reply_markup: JSON.stringify({
      keyboard: [
        ['Аксессуары', 'Одежда'],
        ['Обувь/Пуховики', 'Электроника'],
      ],
    }),
  });
});

bot.on('message', async (msg) => {
  console.log(state);
  console.log(data);
  if (state === 'wCategory') {
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
    data.category = msg.text;
    return bot
      .sendMessage(msg.chat.id, 'Выбери валюту', {
        reply_markup: JSON.stringify({
          keyboard: [['USD'], ['EUR'], ['CNY']],
        }),
      })
      .then((state = 'wCurrency'));
  }
  if (state === 'wCurrency') {
    if (!['USD', 'EUR', 'CNY'].includes(msg.text)) {
      return bot.sendMessage(
        msg.chat.id,
        'Я не знаю такой валюты, попробуй снова'
      );
    }
    data.currency = msg.text;

    return bot
      .sendMessage(msg.chat.id, `Введи цену товара в ${data.currency}`, {
        reply_markup: JSON.stringify({
          hide_keyboard: true,
        }),
      })
      .then((state = 'wPrice'));
  }
  if (state === 'wPrice') {
    if (!msg.text.match(/^[0-9]*[.,]?[0-9]+$/)) {
      return bot.sendMessage(
        msg.chat.id,
        'Пожалуйста, введи число. Например 102 / 250.02 / 120,1'
      );
    }
    data.amount = parseFloat(msg.text.replace(',', '.'));

    return bot
      .sendMessage(msg.chat.id, `Ты находишься в Санкт-Петербурге?`, {
        reply_markup: JSON.stringify({
          keyboard: [['Да', 'Нет']],
        }),
      })
      .then((state = 'wLocation'));
  }
  if (state === 'wLocation') {
    if (!['Да', 'Нет'].includes(msg.text)) {
      return bot.sendMessage(
        msg.chat.id,
        'На этот вопрос можно ответить только "Да" или "Нет", попробуй снова'
      );
    }
    data.location = msg.text;
    data.rate = (await excangeRates())[`${data.currency}`];
    console.log(data);
    let result = data.amount * data.rate;
    if (
      (data.currency === 'CNY' && data.amount >= 2000) ||
      (data.currency === 'USD' && data.amount >= 300) ||
      (data.currency === 'EUR' && data.amount >= 250)
    ) {
      result *= 1.08;
    } else {
      result *= 1.05;
      result += 900;
    }

    switch (data.category) {
      case 'Аксессуары':
        result += 900;
        break;
      case 'Одежда':
        result += 1200;
        break;
      case 'Обувь/Верхняя одежда':
        result += 1700;
        break;
      case 'Электроника':
        result += 4000;
        break;
      default:
        result = 0;
    }
    console.log(result);
    if (data.location === 'Нет') result += 600;

    bot.sendMessage(
      msg.chat.id,
      `Итоговая стоимость доставки: ${Math.ceil(result)}₽`,
      {
        reply_markup: JSON.stringify({
          keyboard: [
            ['🧑‍💻 Кто мы?', '☎️ Контакты', '💎 Отзывы'],
            ['🚚 Расчитать доставку', '💸 Курсы валют', '🔍 Отследить заказ'],
          ],
        }),
      }
    );
    state = 'initial';
    data = {
      currency: undefined,
      rate: undefined,
      amount: undefined,
      category: undefined,
      location: undefined,
    };
    return;
  }
  state = 'initial';
  data = {
    currency: undefined,
    rate: undefined,
    amount: undefined,
    category: undefined,
    location: undefined,
  };
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
