import {
  Client as DiscordClient,
  Intents,
  StreamDispatcher,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import ytpl from 'ytpl';
import ytdl from 'ytdl-core-discord';
import { isPlaylist, isVideo, ytdlOptions } from './helpers';

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

  playing: Audio | null | undefined;

  queue: Array<Audio>;

  connection: VoiceConnection | undefined;

  dispatcher: StreamDispatcher | undefined;

  async join(channel: VoiceChannel) {
    this.connection = await channel.join();
  }

  async play(url: string) {
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
      const playlist = items.map((track) => ({
        title: track.title,
        url: track.url,
      }));
      this.queue = this.queue.concat(playlist);
    }
    if (this.playing) return PlayResponse.Queued;
    return this.playQueue();
  }

  async playQueue() {
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
      .on('finish', () => this.playQueue());
    return PlayResponse.Played;
  }
}

export default Client;
