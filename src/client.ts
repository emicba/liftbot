import { Client as DiscordClient, Collection, Intents, VoiceChannel } from 'discord.js';
import ytpl from 'ytpl';
import ytdl from 'ytdl-core-discord';
import {
  joinVoiceChannel,
  VoiceConnection,
  createAudioPlayer,
  AudioPlayer,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  entersState,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
} from '@discordjs/voice';
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

  _player?: AudioPlayer | null;

  async join(channel: VoiceChannel) {
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    this.connection.on(VoiceConnectionStatus.Disconnected, () => {
      this.playing = null;
      this.connection = null;
      this._player = null;
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

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 3e3);
    } catch (error) {
      console.warn(error);
      return { status: ResponseStatus.Failed };
    }

    this.playing = this.queue.shift()!;
    const resource = createAudioResource(await ytdl(this.playing.url, ytdlOptions), {
      inputType: StreamType.Opus,
    });
    this.getAudioPlayer().play(resource);
    return { status: ResponseStatus.Played, entry: this.playing };
  }

  async playNext() {
    this._player?.stop();
  }

  getAudioPlayer(): AudioPlayer {
    if (!this.connection) throw new Error('An active connection must exist to play a song');
    if (!this._player) {
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      this.connection.subscribe(player);
      player.on('stateChange', (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle && oldState.status !== newState.status) {
          this.playQueue();
        }
      });
      this._player = player;
    }
    return this._player;
  }
}

export default Client;
