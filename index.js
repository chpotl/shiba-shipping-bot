const TelegramApi = require('node-telegram-bot-api');
require('dotenv').config('./');
const axios = require('axios').default;

const bot = new TelegramApi(process.env.API_KEY, { polling: true });

bot.onText(/\/start/, async (msg) => {
  await bot.sendPhoto(msg.chat.id, 'files/photo_2023-01-24 23.04.06.jpeg', {
    caption: `<b>Привет</b>, я виртуальный асистент ShibaShiping! Чем я могу помочь? 🐾`,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      keyboard: [
        ['🧑‍💻 Кто мы?', '☎️ Контакты', '💎 Отзывы'],
        ['🚚 Расчитать доставку', '💸 Курсы валют', '🔍 Отследить заказ'],
      ],
    }),
  });
});

bot.onText(/🧑‍💻 Кто мы?/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 'https://t.me/shibashipping/683');
});

bot.onText(/☎️ Контакты/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `<a href='https://instagram.com/shiba_shipping'>instagram</a>\n\n<a href='https://www.youtube.com/@shibashipping/shorts'>youtube</a>\n\n<a href='https://dzen.ru/id/638e0dc4e4bbcb36ce5a7993'>Дзэн</a>\n\n<a href='https://vk.com/shibashipping'>ВК</a>\n\n`,
    { parse_mode: 'HTML' }
  );
});

bot.onText(/💸 Курсы валют/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `USD: 69.5 руб.\nCNY: 10.23 руб.\nEUR: 75.11 руб.`,
    { parse_mode: 'HTML' }
  );
});

bot.onText(/🚚 Расчитать доставку/, async (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;
  let weight;
  let currency;
  let rate;
  let amount;
  let category;
  let location;
  let result = 0;
  const categoryId = await bot.sendMessage(
    chatId,
    'Выберите категорю\n\n1.Аксессуары\n2.Одежда\n3.Обувь/Пуховики',
    {
      reply_markup: {
        force_reply: true,
      },
    }
  );
  bot.onReplyToMessage(chatId, categoryId.message_id, async (msg) => {
    category = msg.text;
    const weightId = await bot.sendMessage(chatId, 'Введите вес', {
      reply_markup: JSON.stringify({
        force_reply: true,
      }),
    });
    bot.onReplyToMessage(chatId, weightId.message_id, async (msg) => {
      weight = msg.text;
      console.log(weight);
      const currencyId = await bot.sendMessage(
        chatId,
        'Выберите валюту\n\n1.USD\n2.EUR\n3.RUB',
        {
          reply_markup: JSON.stringify({
            force_reply: true,
          }),
        }
      );
      bot.onReplyToMessage(chatId, currencyId.message_id, async (msg) => {
        currency = 1;
        if (msg.text == 1) currency = 'usd';
        if (msg.text == 2) currency = 'eur';
        if (msg.text == 3) currency = 'rub';
        rate = await (
          await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=rub`
          )
        ).data[currency].rub;
        const amountId = await bot.sendMessage(
          chatId,
          `Введите стоимость в ${currency}`,
          {
            reply_markup: JSON.stringify({
              force_reply: true,
            }),
          }
        );
        bot.onReplyToMessage(chatId, amountId.message_id, async (msg) => {
          amount = msg.text;
          console.log(amount);
          const locationId = await bot.sendMessage(
            chatId,
            'Вы находитесь в Санкт-Петербурге?\n\n1.Да\n2.Нет',
            {
              reply_markup: JSON.stringify({
                force_reply: true,
              }),
            }
          );
          bot.onReplyToMessage(chatId, locationId.message_id, async (msg) => {
            location = msg.text;
            result += rate * amount;
            if (category === '1') result += 600;
            if (category === '2') result += 1200;
            if (category === '3') result += 1700;
            if (location === '2') result += 600;
            result += weight * 300;
            result *= 1.05;
            bot.sendMessage(chatId, result, {
              reply_markup: JSON.stringify({
                keyboard: [['Главное меню']],
              }),
            });
          });
        });
      });
    });
  });
});
