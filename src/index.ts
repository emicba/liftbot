import { Client, Intents } from 'discord.js';
import commands from './commands';
import { setupCommands, env } from './helpers';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

client.once('ready', () => {
  const guild = client.guilds.cache.get(env.GUILD);
  if (!guild) throw new Error(`Couldn't find a guild with id of ${env.GUILD}`);
  console.log('✨');
  setupCommands(guild);
});

client.on('interaction', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  if (commandName && commands[commandName]) commands[commandName](interaction);
});

client.login(env.TOKEN);
