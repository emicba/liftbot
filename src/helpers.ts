import { CommandInteraction, MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import { ResponseStatus } from './Subscription';
import Track from './Track';

export const isVideo = ytdl.validateURL;
export const getVideoId = ytdl.getVideoID;
export const isPlaylist = ytpl.validateID;
export const SPOTIFY_PLAYLIST_TEST = /^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]{22})/;
export const isSpotifyPlaylist = (query: string) => SPOTIFY_PLAYLIST_TEST.test(query);

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

export interface Image {
  url: string;
  width: number;
  height: number;
}

export function bestThumbnail<T extends Image>(thumbnails: T[]) {
  return thumbnails.reduce((best, current) => {
    if (current.width > best.width) {
      return current;
    }
    return best;
  });
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
  const embed = new MessageEmbed().setColor('RANDOM').setTitle(title);
  if (!Array.isArray(_entry)) embed.setURL(_entry.url).setImage(_entry.thumbnail || '');
  return embed;
}
