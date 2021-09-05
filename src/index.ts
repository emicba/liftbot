import { Snowflake } from 'discord.js';
import Client from './Client';
import env from './env';
import { setupCommands } from './helpers';

const client = new Client();

client.once('ready', async () => {
  await client.guilds.fetch();
  const guild = client.guilds.cache.get(env.GUILD as Snowflake);
  if (!guild) throw new Error(`Couldn't find a guild with id of ${env.GUILD}`);
  console.log('✨');
  setupCommands(guild);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  if (!client.commands.has(commandName)) return;
  client.commands.get(commandName)?.execute(client, interaction);
});

client.login(env.TOKEN);
