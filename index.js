const TelegramBot = require('node-telegram-bot-api')
const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const fetch = require("node-fetch")
const path = require('path')
const fs = require('fs')
const app = express();

const config = require('./config.json')



app.use(cors())
app.use(express.json())

app.listen(6000, () => {
    console.log('Server Works !!! At port 6000');
});

// server

app.post('/download', async (req, res) => {
    console.log('Post working ~~~~')

    const url = req.body.url
    const id = req.body.id
    
    let info = await ytdl.getInfo(url, (err) => {throw err})
    let videoName = await info.videoDetails.title
    let title = await videoName.replace(/[&\/\\|#,+()$~%.'":*?<>{}]/g, '')

    console.log(title)
    console.log('Download video ~~~~')

    const audio = await ytdl(url, {
        filter: 'audioonly'
    }).pipe(fs.createWriteStream(title + '.mp3'))

    audio.on('finish', ()=>{
        console.log('Send song~~~~')
        sendAudio(title, id)
    })
    audio.on('error', (err) => {
        console.log(err)
    })
})


// bot

const token = config.token

const bot = new TelegramBot(token, { polling: true })

bot.setMyCommands([
    { command: '/start', description: 'Начальное приветствие' },
    { command: '/info', description: 'Описание' },
    { command: '/help', description: 'Помощь в начале работы' },
])


const start = () => {
    bot.on('message', async (msg) => {
        const text = msg.text
        const chatID = msg.chat.id

        if (text == '/start') {

            return bot.sendMessage(chatID, 'Вставьте ссылку на YouTube видео или воспользуйтесь командами /info, /help')
        }
        if (text == '/info') {
            return bot.sendMessage(chatID, 'Я конвертирую YouTube видео в mp3, проще говоря, вставь ссылку на видео и получи песню🎵 прямо в чат!😎')
        }
        if (text == '/help') {
            await bot.sendSticker(chatID, 'https://cdn.tlgrm.ru/stickers/fcb/7f8/fcb7f8aa-d7a3-31d2-ba8b-ae97676501aa/192/2.webp')
            await bot.sendMessage(chatID, `Оууу, я вижу ты заинтересовался? Ну что ж, ${msg.from.username}, для начала зайди в ютуб, скопируй ссылку на видео и вставь в чат!`)

            bot.sendMessage(chatID, "Получилось?🤔", {
                "reply_markup": {
                    "keyboard": [["Конечно", "Не вышло"]],
                    one_time_keyboard: true
                }
            });

            return
        }
        if (text === 'Конечно') {
            await bot.sendMessage(chatID, `Я в тебе никогда не сомневался, ты нечто😊👏`)
            return
        }
        if (text === 'Не вышло') {
            await bot.sendMessage(chatID, `Не сдаваяся, я помогу тебе, так что cледуй инструкции приведенной ниже👇👇👇`)
            await bot.sendMessage(chatID, `Действуем по плану:`)
            await bot.sendMessage(chatID, `1. Вначале заходим в приложение YouTube (или в сам браузер), выбираем видео и нажимаем поделиться`)
            await bot.sendPhoto(chatID, './insctuctions/1.jpg')
            await bot.sendMessage(chatID, `2. Затем нажимаем поделиться в Telegram`)
            await bot.sendPhoto(chatID, './insctuctions/2.jpg')
            await bot.sendMessage(chatID, `3. Теперь нажимаем на чат с ботом и кликаем "Отправить"`)
            await bot.sendPhoto(chatID, './insctuctions/3.jpg')
            await bot.sendMessage(chatID, `4. А теперь тебе остается не много подождать, пока я приведу видео в порядок😉`)
            await bot.sendPhoto(chatID, './insctuctions/4.jpg')
            await bot.sendMessage(chatID, `Ура! 🎉🎉🎉 все готово, ты ВЕЛИКОЛЕПЕН и можешь сохранить песню себе или слушать прямо отсюда🎶😊`)
            return
        }
        if (text.indexOf('http') != -1) {
            let url = msg.text
            getAudio(url, chatID)
            await bot.sendMessage(chatID, 'Подождите не много, ваша песня скоро будет готова...🎵🎵🎵 ')
            /* await bot.sendAudio(chatID, './Joji - SLOW DANCING IN THE DARK.mp3') */
        } else if (text.indexOf('youtu') === -1 || text !== '/start' || text !== '/info' || text !== '/help') {
            return bot.sendMessage(chatID, 'Кажется вы ввели не правильную ссылку, попробуй еще раз или воспользуйся /help')
        }



    })
}

const getAudio = async (videoURL, chatID) => {
    console.log('Starting: Fetch ~~~~')
    const response = await fetch('http://localhost:6000/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: videoURL,
            id: chatID
        })
    }).catch(err => console.log(err))
    
}


const sendAudio = async (title, id) => {
    console.log(title + '.mp3')
    await bot.sendAudio(id, `./${title}.mp3`)
    await delAudio(title)
}

const delAudio = async (title) => {
    fs.unlink(`./${title}.mp3`, function (err) {
        if (err) return console.log(err);
        console.log('file deleted successfully');
    })
}

start()