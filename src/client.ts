import {
  Client as DiscordClient,
  Intents,
  StreamDispatcher,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import { Readable } from 'stream';
import { MoreVideoDetails } from 'ytdl-core';
import ytdl from 'ytdl-core-discord';

type Audio = {
  buffer: Promise<Readable>;
  info: MoreVideoDetails;
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
    const { videoDetails } = await ytdl.getBasicInfo(url);
    this.queue.push({
      info: videoDetails,
      buffer: ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1024 * 1024 * 8,
      }),
    });
    if (this.playing) return PlayResponse.Queued;
    return this.playQueue();
  }

  async playQueue() {
    if (!this.connection || !this.queue.length) return PlayResponse.Failed;
    this.playing = this.queue.shift()!;
    this.dispatcher = this.connection
      .play(await this.playing.buffer, {
        type: 'opus',
        volume: 0.5,
      })
      .on('finish', () => this.playQueue());
    return PlayResponse.Played;
  }
}

export default Client;
