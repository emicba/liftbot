import type {
  ChatInputCommandInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
  SelectMenuInteraction,
} from 'discord.js';
import fs from 'fs';
import Client from './Client';
import env from './env';

const client = new Client();

export interface Command {
  data: RESTPostAPIApplicationCommandsJSONBody;
  aliases?: string[];
  execute: (client: Client, interaction: ChatInputCommandInteraction) => void;
  selectMenu?: (client: Client, interaction: SelectMenuInteraction) => void;
}

const commandFiles = fs.readdirSync(`${__dirname}/commands`);

commandFiles.forEach(async (file) => {
  const command: Command = (await import(`${__dirname}/commands/${file}`)).default;
  client.commands.set(command.data.name, command);
  if (command.aliases) {
    command.aliases.forEach((alias) =>
      client.commands.set(alias, { ...command, data: { ...command.data, name: alias } }),
    );
  }
});

client.once('ready', async () => {
  console.log('✨ Client is ready');

  if (env.isProduction) {
    await client.updateSlashCommands();
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    client.commands.get(commandName)?.execute(client, interaction);
    return;
  }
  if (interaction.isSelectMenu()) {
    const { customId } = interaction;
    client.commands.get(customId)?.selectMenu?.(client, interaction);
  }
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.id !== message.guild.ownerId) return;
  if (message.content === '!setup') {
    await message.guild.commands.set(client.commands.toJSON() as any);
    await message.reply(`Successfully added ${client.commands.size} commands :^)`);
  }
});

process.on('SIGTERM', () => process.exit(0));

client.login(env.TOKEN);
