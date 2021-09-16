import { AudioResource, createAudioResource, demuxProbe } from '@discordjs/voice';
import { getInfo } from 'ytdl-core';
import { raw as ytdl } from 'youtube-dl-exec';
import ytpl from 'ytpl';
import { bestThumbnail, Image, ytdlFlags } from './helpers';

interface TrackMeta {
  title: string;
  url: string;
  thumbnail?: string;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (err: Error) => void;
}

const emptyFn = () => undefined;

export default class Track implements TrackMeta {
  public readonly title: string;

  public readonly url: string;

  public readonly thumbnail: string | undefined;

  public readonly onStart: () => void;

  public readonly onFinish: () => void;

  public readonly onError: (err: Error) => void;

  public constructor({ title, url, thumbnail, onStart, onFinish, onError }: TrackMeta) {
    this.title = title;
    this.url = url;
    this.thumbnail = thumbnail;
    this.onStart = onStart || emptyFn;
    this.onFinish = onFinish || emptyFn;
    this.onError = onError || emptyFn;
  }

  public createAudioResouce(): Promise<AudioResource<Track>> {
    return new Promise((resolve, reject) => {
      const process = ytdl(this.url, ytdlFlags, { stdio: ['ignore', 'pipe'] });
      const stream = process.stdout;
      if (!stream) {
        reject(new Error('No stdout'));
        return;
      }
      const onError = (err: Error) => {
        if (!process.killed) process.kill();
        stream.resume();
        reject(err);
      };
      process
        .once('spawn', () => {
          demuxProbe(stream)
            .then((probe) => {
              resolve(
                createAudioResource(probe.stream, {
                  metadata: this,
                  inputType: probe.type,
                }),
              );
            })
            .catch(onError);
        })
        .catch(onError);
    });
  }

  public static async fromUrl(
    url: string,
    methods?: Pick<TrackMeta, 'onStart' | 'onFinish' | 'onError'>,
  ): Promise<Track> {
    const { videoDetails } = await getInfo(url);
    const { title, thumbnails } = videoDetails;

    const thumbnail = bestThumbnail(thumbnails).url;

    if (!methods) {
      return new Track({
        title,
        url,
        thumbnail,
      });
    }

    return new Track({
      title,
      url,
      thumbnail,
      ...methods,
    });
  }

  public static async fromPlaylist(items: ytpl.Item[]): Promise<Track[]> {
    return items.map((item) => {
      const track = new Track({
        title: item.title,
        url: item.shortUrl,
        thumbnail: bestThumbnail(item.thumbnails as Image[]).url,
      });
      return track;
    });
  }
}
