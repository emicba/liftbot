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
  buffer: Readable;
  info: MoreVideoDetails;
};

class Client extends DiscordClient {
  constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
    });
  }

  playing: Audio | null | undefined;

  connection: VoiceConnection | undefined;

  dispatcher: StreamDispatcher | undefined;

  async join(channel: VoiceChannel) {
    this.connection = await channel.join();
  }

  async play(url: string) {
    if (!this.connection) throw new Error('An active connection must exist to play a song');
    const { videoDetails } = await ytdl.getBasicInfo(url);
    this.playing = {
      info: videoDetails,
      buffer: await ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1024 * 1024 * 8,
      }),
    };
    this.dispatcher = this.connection.play(this.playing.buffer, { type: 'opus', volume: 0.5 });
    this.playing.buffer.on('close', () => {
      this.playing = null;
    });
    return this.playing;
  }
}

export default Client;
