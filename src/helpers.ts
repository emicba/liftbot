import { ApplicationCommandData, Guild } from 'discord.js';
import dotenv from 'dotenv';
import { cleanEnv, str } from 'envalid';

dotenv.config();

export const env = cleanEnv(process.env, {
  TOKEN: str(),
  GUILD: str(),
});

export async function setupCommands(guild: Guild) {
  await guild.commands.fetch();
  const guildCommands = guild.commands.cache.map((x) => x.name);
  const commands: Array<ApplicationCommandData> = [
    {
      name: 'play',
      description: 'Play audio from Youtube',
      options: [
        {
          name: 'url', description: 'video url', type: 'STRING', required: true,
        },
      ],
    },
  ];
  const missingCommands = commands.filter((x) => !guildCommands.includes(x.name));
  if (missingCommands.length) {
    guild.commands.add(missingCommands);
  }
}

export const YOUTUBE_URL_TEST = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
