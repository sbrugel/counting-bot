import DiscordJS, { Intents, MessageEmbed, TextChannel } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { BOT } from './config';
import { updateConfig } from './utils/updateConfig';

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

client.login(BOT.TOKEN);

client.on('ready', async () => {
    const chan = await client.channels.fetch(BOT.CHANNEL_ID) as TextChannel;
    const lastCount = chan.messages.fetch({ limit: 10 })
        .then((messages) => {
            const messagesArray = Array.from(messages);
            if (!messagesArray[0][1].author.bot) {
                BOT.COUNT = Number.parseInt(messagesArray[0][1].content);
                BOT.WHO_SENT_LAST_ID = messagesArray[0][1].author.id;
            } else {
                BOT.COUNT = 0;
                BOT.SESSION_START_TIMESTAMP = Date.now();
                BOT.WHO_SENT_LAST_ID = '';
                BOT.PARTICIPANTS = [];
            }
        })
    updateConfig(BOT);
    console.log('Ready!');
});

client.on('messageUpdate', async msg => {
    if (msg.channel.id !== BOT.CHANNEL_ID) return;
    if (msg.author.bot && !msg.partial) return; // sage will crash if it hits this line and the message is a partial
    if (msg.createdTimestamp <= BOT.SESSION_START_TIMESTAMP) return;

    const endMsg = `${msg.partial ? 'Someone' : msg.author.toString()} edited a message and broke the count!`;

    if (BOT.COUNT > 0) {
        endGame(endMsg);
    }
});

client.on('messageDelete', async msg => {
    if (msg.channel.id !== BOT.CHANNEL_ID) return;
    if (msg.author.bot && !msg.partial) return; // sage will crash if it hits this line and the message is a partial
    if (msg.createdTimestamp <= BOT.SESSION_START_TIMESTAMP) return;

    const endMsg = `${msg.partial ? 'Someone' : msg.author.toString()} deleted a message and broke the count!`;

    if (BOT.COUNT > 0) {
        endGame(endMsg);
    }
});

client.on('messageCreate', async msg => {
    if (msg.author.bot || msg.channel.id !== BOT.CHANNEL_ID) return;

    let gameOver = false;
    let endMsg = '';

    if (msg.author.id === BOT.WHO_SENT_LAST_ID) {
        gameOver = true;
        endMsg = `${msg.author.toString()}, you aren't allowed to count twice in a row!`;
    }

    BOT.WHO_SENT_LAST_ID = msg.author.id;

    if (msg.stickers.size > 0) {
        gameOver = true;
        endMsg = `${msg.author.toString()}, that's a nice sticker mate but we're supposed to be counting here.`;
    } else if (msg.attachments.size > 0) {
        gameOver = true;
        endMsg = `${msg.author.toString()}, you can't send attachments here. This is a counting channel.`;
    } else if (Number.isNaN(parseInt(msg.content))) {
        gameOver = true;
        endMsg = `Really ${msg.author.toString()}? **${msg.content}** isn't a number!`;
    } else if (parseInt(msg.content) > BOT.COUNT + 1) {
        gameOver = true;
        endMsg = `Come on ${msg.author.toString()}, **${msg.content}** doesn't come after **${BOT.COUNT}**!`;
    } else if (parseInt(msg.content) < BOT.COUNT) {
        gameOver = true;
        endMsg = `Believe it or not ${msg.author.toString()}, **${msg.content}** is less than **${BOT.COUNT}**.`;
    } else if (parseInt(msg.content) === BOT.COUNT) {
        gameOver = true;
        endMsg = `My dude ${msg.author.toString()}, that was literally the number we were on.`;
    } else if (!/^\d+$/.test(msg.content)) { // thanks Ben855
        gameOver = true;
        endMsg = `${msg.author.toString()}, you've sent more things than just the number.`;
    }

    if (msg.content === (BOT.COUNT + 1).toString()) {
        if (!BOT.PARTICIPANTS.includes(msg.author.id)) {
            BOT.PARTICIPANTS.push(msg.author.id);
        }

        BOT.COUNT++;
        BOT.WHO_SENT_LAST_ID = msg.author.id;
    }

    if (gameOver) {
        endGame(endMsg);
    }

    updateConfig(BOT);
});

async function endGame(message: string) {
    const chan = await client.channels.fetch(BOT.CHANNEL_ID) as TextChannel;
	const endDate = Date.now();
    chan.send({ content: message });
    if (BOT.COUNT !== 0) {
        const resultEmbed = new MessageEmbed()
            .setDescription(`The count lasted for **${prettyMilliseconds(endDate - BOT.SESSION_START_TIMESTAMP)}**. With **${BOT.COUNT}** counts and ` +
            `**${BOT.PARTICIPANTS.length}** participants that's an average of one count every **${prettyMilliseconds((endDate - BOT.SESSION_START_TIMESTAMP) / BOT.COUNT)}**`)
            .setColor('BLURPLE'); // haha nice one discord
            chan.send({ embeds: [resultEmbed] });
    }
    BOT.COUNT = 0;
    BOT.SESSION_START_TIMESTAMP = Date.now();
    BOT.WHO_SENT_LAST_ID = '';
    BOT.PARTICIPANTS = [];
	chan.send('Restarting the counter...\n\n0');
    updateConfig(BOT);
}
