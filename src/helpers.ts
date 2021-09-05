import { ApplicationCommandData, CommandInteraction, Guild, MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import env from './env';
import { ResponseStatus } from './Subscription';
import Track from './Track';

export async function setupCommands(guild: Guild) {
  await guild.commands.fetch();
  const guildCommands = guild.commands.cache.map((x) => x.name);
  const commands: ApplicationCommandData[] = [
    {
      name: 'play',
      description: 'Play audio from Youtube',
      options: [
        {
          name: 'query',
          description: 'video title or url',
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

export const ytdlFlags = {
  o: '-',
  q: '',
  f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
  r: '100K',
};

export function shuffle<T>(arr: T[]) {
  const array = [...arr];
  for (let i = 0; i < array.length; i += 1) {
    const randomIndex = Math.floor(Math.random() * array.length);
    [array[randomIndex], array[i]] = [array[i], array[randomIndex]];
  }
  return array;
}

export function bestThumbnail(thumbnails: ytdl.thumbnail[] | ytpl.Image[]) {
  return thumbnails.sort((a, b) => b.width - a.width)[0];
}

export function replyNotPlayingErr(interaction: CommandInteraction) {
  return interaction.reply({
    content: 'Currently not playing audio',
    ephemeral: true,
  });
}

export function statusEmebed(status: ResponseStatus, entry: Track | Track[]) {
  const title = `${status} ${Array.isArray(entry) ? `${entry.length} tracks` : entry.title}`;
  const embed = new MessageEmbed().setTitle(title);
  if (!Array.isArray(entry)) embed.setURL(entry.url).setImage(entry.thumbnail || '');
  return embed;
}
