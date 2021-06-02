import { ApplicationCommandData, CommandInteractionOption, Guild } from 'discord.js';
import dotenv from 'dotenv';
import { cleanEnv, str } from 'envalid';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

dotenv.config();

export const env = cleanEnv(process.env, {
  TOKEN: str(),
  GUILD: str(),
});

export async function setupCommands(guild: Guild) {
  await guild.commands.fetch();
  const guildCommands = guild.commands.cache.map((x) => x.name);
  const commands: ApplicationCommandData[] = [
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
        {
          name: 'shuffle',
          description: 'shuffle playlist before adding it to queue',
          type: 'BOOLEAN',
        },
      ],
    },
    {
      name: 'whatplaying',
      description: 'Describes the playing song',
    },
  ];
  const missingCommands = commands.filter((x) => !guildCommands.includes(x.name));
  if (missingCommands.length || env.isProduction) {
    guild.commands.set(commands);
    console.log(`✨ added ${missingCommands.length} commands`);
  }
}

export const isVideo = ytdl.validateURL;
export const isPlaylist = ytpl.validateID;

export const ytdlOptions: ytdl.downloadOptions = {
  filter: 'audioonly',
  quality: 'highestaudio',
  highWaterMark: 1024 * 1024 * 8,
};

export function findOption<T>(options: CommandInteractionOption[], name: string): T | undefined {
  return options.find((x) => x.name === name)?.value as any;
}

export function shuffle<T>(arr: T[]) {
  const array = [...arr];
  for (let i = 0; i < array.length; i += 1) {
    const randomIndex = Math.floor(Math.random() * array.length);
    [array[randomIndex], array[i]] = [array[i], array[randomIndex]];
  }
  return array;
}
