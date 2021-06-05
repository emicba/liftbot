import { ApplicationCommandData, CommandInteraction, Guild, MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import env from './env';
import { Audio, ResponseStatus } from './client';

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
    {
      name: 'skip',
      description: 'Skips to the next song',
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

export function shuffle<T>(arr: T[]) {
  const array = [...arr];
  for (let i = 0; i < array.length; i += 1) {
    const randomIndex = Math.floor(Math.random() * array.length);
    [array[randomIndex], array[i]] = [array[i], array[randomIndex]];
  }
  return array;
}

export function bestThumbnail(thumbnails: ytdl.thumbnail[]) {
  return thumbnails.sort((a, b) => b.width - a.width)[0];
}

export function replyNotPlayingErr(interaction: CommandInteraction) {
  return interaction.reply({
    content: 'Currently not playing audio',
    ephemeral: true,
  });
}

export function statusEmebed(status: ResponseStatus, entry: Audio | Audio[]) {
  const title = `${status} ${Array.isArray(entry) ? `${entry.length} tracks` : entry.title}`;
  const embed = new MessageEmbed().setTitle(title);
  if (!Array.isArray(entry)) embed.setURL(entry.url);
  return embed;
}
