import {
  Client as DiscordClient,
  Collection,
  Intents,
  StreamDispatcher,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import ytpl from 'ytpl';
import ytdl from 'ytdl-core-discord';
import { bestThumbnail, isPlaylist, isVideo, shuffle, ytdlOptions } from './helpers';
import { commands, Command } from './commands';

export type Audio = {
  title: string;
  url: string;
  thumbnail?: string | null;
};

export enum ResponseStatus {
  Played = 'Playing',
  Queued = 'Queued',
  Failed = 'Failed',
}

interface PlayedResponse {
  status: ResponseStatus.Played;
  entry: Audio;
}

interface QueuedResponse {
  status: ResponseStatus.Queued;
  entry: Audio | Audio[];
}

interface FailedResponse {
  status: ResponseStatus.Failed;
}

type PlayResponse = PlayedResponse | QueuedResponse | FailedResponse;

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
    this.commands = new Collection(Object.entries(commands));
  }

  commands: Collection<string, Command>;

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
      const queued: Audio = {
        title: videoDetails.title,
        url: videoDetails.video_url,
        thumbnail: bestThumbnail(videoDetails.thumbnails).url,
      };
      this.queue.push(queued);
      if (this.playing) return { status: ResponseStatus.Queued, entry: queued };
      return this.playQueue();
    }
    if (isPlaylist(url)) {
      const { items } = await ytpl(url, { pages: 1 });
      let queued: Audio[] = items.map((track) => ({
        title: track.title,
        url: track.url,
        thumbnail: bestThumbnail(track.thumbnails).url,
      }));
      if (shouldShuffle) queued = shuffle(queued);
      this.queue = this.queue.concat(queued);
      if (!this.playing) this.playQueue();
      return { status: ResponseStatus.Queued, entry: queued };
    }
    return { status: ResponseStatus.Failed };
  }

  async playQueue(): Promise<PlayResponse> {
    if (!this.connection || !this.queue.length) {
      this.playing = null;
      return { status: ResponseStatus.Failed };
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
    return { status: ResponseStatus.Played, entry: this.playing };
  }

  async playNext() {
    this.dispatcher?.end();
  }
}

export default Client;
