const {
    Client,
    Intents
} = require('discord.js');
const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const {
    REST
} = require('@discordjs/rest');
const {
    Routes
} = require('discord-api-types/v9');
const {
    MessageEmbed
} = require('discord.js');
const axios = require("axios");
const localSave = require('../../cookie.json')
const fs = require('fs');

const instance = axios.create({
    baseURL: 'https://nessa.webuntis.com'
});

const commands = [
    new SlashCommandBuilder().setName('homework').setDescription('Shows a list of pending homework')
].map(command => command.toJSON());

const rest = new REST({
    version: '9'
}).setToken(localSave.token);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands('882222434328150056', localSave.guildId), {
                body: commands
            },
        );

        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});

client.once('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const {
        commandName
    } = interaction;

    if (commandName === 'homework') {
        readHomework(interaction)
    }
});

client.login(localSave.token);


async function getHomework(startDate, endDate) {
    try {
        const response = await instance({
            url: `/WebUntis/api/homeworks/lessons?startDate=${startDate}&endDate=${endDate}`,
            headers: {
                "Cookie": localSave.cookie,
                "User-Agent": "PostmanRuntime/7.28.4"
            },
            method: "GET"
        })

        fs.writeFile("./examples/latest.json", JSON.stringify(response.data), function (err) {
            if (err) {
                return console.log(err);
            }
        });
    } catch (error) {
        console.error(error);
    }
}

async function readHomework(interaction) {

    await getHomework(convertDate(new Date(), -31), convertDate(new Date(), 7))

    fs.readFile('./examples/latest.json', (err, data) => {
        const responseEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Hausaufgaben')
            .setFooter('API Info from webuntis.com');


        let le, hw;
        try {
            let student = JSON.parse(data)
            hw = student.data.homeworks
            le = student.data.lessons
        } catch (error) {
            updateCookie()
            readHomework(interaction)
            return
        }
        for (let i = 0; i < hw.length; i++) {
            if (hw[i].completed === false) {
                for (let x = 0; x < le.length; x++) {

                    if (le[x].id === hw[i].lessonId) {
                        var dateString = hw[i].dueDate.toString();
                        var year = dateString.substring(0, 4);
                        var month = dateString.substring(4, 6);
                        var day = dateString.substring(6, 8);
                        responseEmbed.addField(le[x].subject, `\`\`\`${hw[i].text}\n> Bis ${day}.${month}.${year}\`\`\``, false)
                    }
                }
            }
        }

        interaction.reply({
            embeds: [responseEmbed]
        })
    });
}

function convertDate(date, past) {

    date.setDate(date.getDate() + past);

    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();

    var mmChars = mm.split('');
    var ddChars = dd.split('');

    return yyyy + (mmChars[1] ? mm : "0" + mmChars[0]) + (ddChars[1] ? dd : "0" + ddChars[0]);
}

async function updateCookie() {
    // const response = await instance({
    //     url: `/WebUntis/?school=csbk-bielefeld#/basic/login`,
    //     headers: {
    //         "User-Agent": "PostmanRuntime/7.28.4"
    //     },
    //     method: "GET"
    // })
    // saveCookies(response.headers)

    const authFlow2 = await instance({
        url: `/WebUntis/j_spring_security_check`,
        headers: {
            "User-Agent": "PostmanRuntime/7.28.4",
            "Cookie": localSave.cookie
        },
        data: localSave.authSequence,
        method: "GET"
    })

    console.log(authFlow2.data)

}

function saveCookies(respHead) {
    const contentString = JSON.stringify(respHead)
    const regex = /JSESSIONID=[\w]+;/g;
    const sessionId = regex.exec(contentString)

    localSave.cookie = `${sessionId[0]} schoolname=\"_Y3Niay1iaWVsZWZlbGQ=\"; traceId=8a6936acf3f409dae29d67069c0fa13f629e1790`
    fs.writeFile("./cookie.json", JSON.stringify(localSave), function (err) {
        if (err) {
            return console.log(err);
        }
    });
}