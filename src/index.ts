import Client from './Client';
import env from './env';

const client = new Client();

client.once('ready', async () => {
  console.log('✨');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  if (!client.commands.has(commandName)) return;
  client.commands.get(commandName)?.execute(client, interaction);
});

client.login(env.TOKEN);
