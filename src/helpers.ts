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

export function buildStatusEmbed(status: ResponseStatus, entry: Track | Track[]) {
  const _entry = Array.isArray(entry) && entry.length === 1 ? entry[0] : entry;
  const title = `${status} ${Array.isArray(_entry) ? `${_entry.length} tracks` : _entry.title}`;
  const embed = new MessageEmbed().setTitle(title);
  if (!Array.isArray(_entry)) embed.setURL(_entry.url).setImage(_entry.thumbnail || '');
  return embed;
}
