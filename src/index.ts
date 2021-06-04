import Client from './client';
import commands from './commands';
import env from './env';
import { setupCommands } from './helpers';

const client = new Client();

client.once('ready', async () => {
  await client.guilds.fetch();
  const guild = client.guilds.cache.get(env.GUILD);
  if (!guild) throw new Error(`Couldn't find a guild with id of ${env.GUILD}`);
  console.log('✨');
  setupCommands(guild);
});

client.on('interaction', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  if (commandName && commands[commandName]) commands[commandName](client, interaction);
});

client.login(env.TOKEN);
