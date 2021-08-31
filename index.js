const WebUntis = require('webuntis');
const creds = require('./credentials.json');
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
const {
    changeDate
} = require('./utils/utilities');

const untis = new WebUntis(creds.school, creds.username, creds.password, creds.domain);


const commands = [
    new SlashCommandBuilder().setName('homework').setDescription('Shows a list of pending homework')
].map(command => command.toJSON());

const rest = new REST({
    version: '9'
}).setToken(creds.token);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands('882222434328150056', creds.guildId), {
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
        sendHomeworkData(interaction)
    }
});

client.login(creds.token);


function sendHomeworkData(interaction) {
    untis.login()
        .then(() => {
            return untis.getHomeWorksFor(changeDate(new Date(), -31), changeDate(new Date(), 7));
        })
        .then((timetable) => {

            const responseEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Hausaufgaben')
                .setFooter('API Info from webuntis.com');
            const hw = timetable.homeworks;
            const le = timetable.lessons;

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