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
          name: 'url',
          description: 'video url',
          type: 'STRING',
          required: true,
        },
      ],
    },
    {
      name: 'whatplaying',
      description: 'Describes the playing song',
    },
  ];
  const missingCommands = commands.filter((x) => !guildCommands.includes(x.name));
  if (missingCommands.length) {
    guild.commands.set(commands);
    console.log(`✨ added ${missingCommands.length} commands`);
  }
}

export const YOUTUBE_URL_TEST = /^(https?:\/\/)?((www|music|m)\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
