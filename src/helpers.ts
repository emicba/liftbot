import { CommandInteraction, MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import { ResponseStatus } from './Subscription';
import Track from './Track';

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
