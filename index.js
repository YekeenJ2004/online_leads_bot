import  { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } from 'discord.js';
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});


// Register slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('createembed')
        .setDescription('Creates an embed with the provided product details')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the product')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The hyperlink for the product title')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('productimage')
                .setDescription('URL of the product image')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('asin')
                .setDescription('The ASIN of the product')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('statsimage')
                .setDescription('URL of the stats image')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Any notes you have')
                .setRequired(false))
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID, process.env.SERVER_ID), // Replace with your bot's client ID
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'createembed') {
        try {
            const title = interaction.options.getString('title');
            const link = interaction.options.getString('link');
            const productImage = interaction.options.getString('productimage');
            const asin = interaction.options.getString('asin');
            const statsImage = interaction.options.getString('statsimage');
            const notes  = interaction.options.getString('notes')

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setURL(link)
                .setThumbnail(productImage) // Small product image
                .addFields(
                    { name: '📋ASIN', value: asin, inline: false },
                    { name: '📘NOTES', value: notes, inline: false }
                )
                .setImage(statsImage) // Stats image in the last row
                .setColor(0x3498db) // Embed color
                .setFooter({ text: 'Powered by Xanon', iconURL: 'https://imgur.com/nOgw6oi.jpeg' });

            const testChannel = await client.channels.fetch(process.env.TEST_CHANNEL_ID);
            try{
                if (testChannel) {
                    const message = await testChannel.send({ embeds: [embed] });
                    await message.react('✅'); // Approve
                    await message.react('❌'); // Cancel
        
                    // Create a reaction collector
                    const filter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && !user.bot;
                    const collector = message.createReactionCollector({ filter, max: 1, time: 60000 });
        
                    collector.on('collect', async (reaction) => {
                        if (reaction.emoji.name === '✅') {
                            const mainChannel = await client.channels.fetch(process.env.MAIN_CHANNEL_ID);
                            if (mainChannel) {
                                await mainChannel.send({ embeds: [embed] });
                                await testChannel.send('Embed sent to the main channel!');
                            }
                        } else if (reaction.emoji.name === '❌') {
                            await testChannel.send('Embed cancelled.');
                        }
                    });
        
                    collector.on('end', (collected) => {
                        if (collected.size === 0) {
                            testChannel.send('No reaction received. Embed not sent to the main channel.');
                        }
                    });
                } else {
                    await interaction.reply('Test channel not found. Please check the configuration.');
                }
                await interaction.reply('Embed sent to the test channel for review!');
            }catch{
                await interaction.reply('Could not create embed');
            }   
        }catch{
            await interaction.reply('Could not create embed');
        }
        
        
    }
});

client.login(process.env.DISCORD_TOKEN);