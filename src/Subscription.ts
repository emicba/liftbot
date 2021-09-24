import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { TypedEmitter } from 'tiny-typed-emitter';
import Track from './Track';

export enum ResponseStatus {
  PLAYED = 'Playing',
  QUEUED = 'Queued',
  FAILED = 'Failed',
  PAUSED = 'Paused',
}

export type SubscriptionEvents = {
  destroy: () => void;
};

export default class Subscription extends TypedEmitter<SubscriptionEvents> {
  public readonly voiceConnection: VoiceConnection;

  public readonly audioPlayer: AudioPlayer;

  public queue: Track[];

  public destroyTimeout?: ReturnType<typeof setTimeout>;

  public constructor(voiceConnection: VoiceConnection) {
    super();
    this.voiceConnection = voiceConnection;
    this.audioPlayer = createAudioPlayer();
    this.queue = [];

    this.voiceConnection.on('stateChange', async (_, state) => {
      if (state.status === VoiceConnectionStatus.Disconnected) {
        if (
          state.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          state.closeCode === 4014
        ) {
          /**
           * If the WebSocket closed with a 4014 code, do not attempt to reconnect.
           * There's a chance the conection will re-establish itself if the disconnection was due
           * to switching channels. We'll wait 2 seconds before destroying the voice connection.
           * Read more:
           * https://discord.com/developers/docs/topics/opcodes-and-status-codes#voice-voice-close-event-codes
           */
          try {
            await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 2000);
          } catch {
            this.voiceConnection.destroy();
          }
        } else {
          this.voiceConnection.destroy();
        }
      } else if (state.status === VoiceConnectionStatus.Destroyed) {
        this.stop();
      } else if (
        state.status === VoiceConnectionStatus.Connecting ||
        state.status === VoiceConnectionStatus.Signalling
      ) {
        try {
          await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 15e3);
        } catch {
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
            this.voiceConnection.destroy();
          }
        }
      }
    });

    this.audioPlayer.on('stateChange', async (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        (oldState.resource as AudioResource<Track>).metadata.onFinish();
        await this.playQueue();
        if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
          this.destroyTimeout = setTimeout(() => {
            this.stop();
          }, 1.2e6);
        }
      } else if (newState.status === AudioPlayerStatus.Playing) {
        (newState.resource as AudioResource<Track>).metadata.onStart();
        if (this.destroyTimeout !== undefined) {
          clearTimeout(this.destroyTimeout);
          this.destroyTimeout = undefined;
        }
      }
    });

    this.audioPlayer.on('error', (err) => {
      console.warn(err);
      (err.resource as AudioResource<Track>).metadata.onError(err);
    });

    this.voiceConnection.subscribe(this.audioPlayer);
  }

  public enqueue(request: Track | Track[]): Promise<ResponseStatus> {
    if (Array.isArray(request)) {
      this.queue = this.queue.concat(request);
    } else {
      this.queue.push(request);
    }
    return this.playQueue();
  }

  public stop() {
    this.queue = [];
    this.audioPlayer.stop(true);
    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
      this.voiceConnection.destroy();
    }
    if (this.destroyTimeout !== undefined) {
      clearTimeout(this.destroyTimeout);
    }
    this.emit('destroy');
  }

  private async playQueue(): Promise<ResponseStatus> {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
      return ResponseStatus.QUEUED;
    }

    const nextTrack = this.queue.shift()!;
    try {
      const resource = await nextTrack.createAudioResouce();
      this.audioPlayer.play(resource);
      return ResponseStatus.PLAYED;
    } catch (err) {
      console.warn(err);
      nextTrack.onError(err as Error);
      this.playQueue();
      return ResponseStatus.FAILED;
    }
  }

  get nowPlaying(): Track | null {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) return null;
    return (this.audioPlayer.state.resource as AudioResource<Track>).metadata;
  }
}
