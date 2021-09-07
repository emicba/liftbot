import type { ChatInputApplicationCommandData, CommandInteraction } from 'discord.js';
import fs from 'fs';
import Client from './Client';
import env from './env';

const client = new Client();

export interface Command extends ChatInputApplicationCommandData {
  execute: (client: Client, interaction: CommandInteraction) => void;
}

const commandFiles = fs.readdirSync(`${__dirname}/commands`);

commandFiles.forEach(async (file) => {
  const command = (await import(`${__dirname}/commands/${file}`)).default;
  client.commands.set(command.name, command);
});

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
