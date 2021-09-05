import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import Track from './Track';

export enum ResponseStatus {
  Played = 'Playing',
  Queued = 'Queued',
  Failed = 'Failed',
}

export default class Subscription {
  public readonly voiceConnection: VoiceConnection;

  public readonly audioPlayer: AudioPlayer;

  public queue: Track[];

  public nowPlaying: Track | null;

  public constructor(voiceConnection: VoiceConnection) {
    this.voiceConnection = voiceConnection;
    this.audioPlayer = createAudioPlayer();
    this.queue = [];
    this.nowPlaying = null;

    this.voiceConnection.on('stateChange', async (_, state) => {
      if (state.status === VoiceConnectionStatus.Disconnected) {
        this.voiceConnection.destroy();
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

    this.audioPlayer.on('stateChange', (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        (oldState.resource as AudioResource<Track>).metadata.onFinish();
        this.nowPlaying = null;
        this.playQueue();
      } else if (newState.status === AudioPlayerStatus.Playing) {
        (newState.resource as AudioResource<Track>).metadata.onStart();
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
    this.nowPlaying = null;
    this.audioPlayer.stop(true);
  }

  private async playQueue(): Promise<ResponseStatus> {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
      return ResponseStatus.Queued;
    }

    this.nowPlaying = this.queue.shift()!;
    try {
      const resource = await this.nowPlaying.createAudioResouce();
      this.audioPlayer.play(resource);
      return ResponseStatus.Played;
    } catch (err) {
      console.warn(err);
      this.nowPlaying.onError(err as Error);
      this.playQueue();
      return ResponseStatus.Failed;
    }
  }
}
