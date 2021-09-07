import type { ChatInputApplicationCommandData, CommandInteraction } from 'discord.js';
import fs from 'fs';
import Client from './Client';
import env from './env';

const client = new Client();

export interface Command extends ChatInputApplicationCommandData {
  aliases?: string[];
  execute: (client: Client, interaction: CommandInteraction) => void;
}

const commandFiles = fs.readdirSync(`${__dirname}/commands`);

commandFiles.forEach(async (file) => {
  const command: Command = (await import(`${__dirname}/commands/${file}`)).default;
  client.commands.set(command.name, command);
  if (command.aliases) {
    command.aliases.forEach((alias) => client.commands.set(alias, { ...command, name: alias }));
  }
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

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.id !== message.guild.ownerId) return;
  if (message.content === '!setup') {
    await message.guild.commands.set(client.commands.toJSON() as any);
    await message.reply(`Successfully added ${client.commands.size} commands :^)`);
  }
});

client.login(env.TOKEN);
