import {
  Client as DiscordClient,
  Intents,
  StreamDispatcher,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import ytpl from 'ytpl';
import ytdl from 'ytdl-core-discord';
import { isPlaylist, isVideo, shuffle, ytdlOptions } from './helpers';

type Audio = {
  title: string;
  url: string;
};

enum PlayResponse {
  Played = 'Playing',
  Queued = 'Queued',
  Failed = 'Failed',
}

class Client extends DiscordClient {
  constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
    });
    this.queue = [];
  }

  playing?: Audio | null;

  queue: Audio[];

  connection?: VoiceConnection | null;

  dispatcher?: StreamDispatcher;

  async join(channel: VoiceChannel) {
    this.connection = await channel.join();
    this.connection.on('disconnect', () => {
      this.playing = null;
      this.connection = null;
      this.queue = [];
    });
  }

  async play(url: string, shouldShuffle?: boolean) {
    if (!this.connection) throw new Error('An active connection must exist to play a song');
    if (isVideo(url)) {
      const { videoDetails } = await ytdl.getBasicInfo(url);
      this.queue.push({
        title: videoDetails.title,
        url: videoDetails.video_url,
      });
    }
    if (isPlaylist(url)) {
      const { items } = await ytpl(url, { pages: 1 });
      let playlist = items.map((track) => ({
        title: track.title,
        url: track.url,
      }));
      if (shouldShuffle) playlist = shuffle(playlist);
      this.queue = this.queue.concat(playlist);
    }
    if (this.playing) return PlayResponse.Queued;
    return this.playQueue();
  }

  async playQueue(): Promise<PlayResponse> {
    if (!this.connection || !this.queue.length) {
      this.playing = null;
      return PlayResponse.Failed;
    }
    this.playing = this.queue.shift()!;
    this.dispatcher = this.connection
      .play(await ytdl(this.playing.url, ytdlOptions), {
        type: 'opus',
        volume: 0.5,
      })
      .on('finish', () => {
        this.playQueue();
      });
    return PlayResponse.Played;
  }

  async playNext() {
    this.dispatcher?.end();
  }
}

export default Client;
