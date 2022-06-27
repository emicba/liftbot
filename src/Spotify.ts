import { request } from 'undici';
import { bestThumbnail } from './helpers';
import Track from './Track';
import type {
  AlbumsAPIResponse,
  ArtistsAPIResponse,
  ClientCredentialsResponse,
  PlaylistsAPIResponse,
  TracksAPIResponse,
} from './types/spotify';
import ytsearch from './ytsearch';

const SPOTIFY_REGEX = /https:\/\/open\.spotify\.com\/(?<type>\w+)\/(?<id>[a-zA-Z0-9]{22})/;
const BASE_URL = 'https://api.spotify.com/v1';

export function isSpotifyUrl(url: string): boolean {
  return SPOTIFY_REGEX.test(url);
}

class Spotify {
  token?: string;

  tokenTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    try {
      this.refreshAnonymousToken();
    } catch (err) {
      console.warn(err);
      throw err;
    }
  }

  private async refreshAnonymousToken() {
    const { statusCode, body } = await request('https://open.spotify.com/get_access_token', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (statusCode !== 200) throw new Error('Could not get Spotify anonymous token');
    const data: ClientCredentialsResponse = await body.json();
    this.token = data.accessToken;
    if (this.tokenTimeout !== undefined) {
      clearTimeout(this.tokenTimeout);
    }
    this.tokenTimeout = setTimeout(
      () => this.refreshAnonymousToken(),
      data.accessTokenExpirationTimestampMs - Date.now(),
    );
  }

  private async fetch(url: string, query = {}) {
    return request(`${BASE_URL}${url}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      query,
    });
  }

  private async getAlbumTracks(id: string): Promise<any> {
    const { statusCode, body } = await this.fetch(`/albums/${id}`);
    if (statusCode !== 200) throw new Error('Could not get album tracks');
    const data: AlbumsAPIResponse = await body.json();
    return Promise.all(
      data.tracks.items.map(async (track) => {
        const artists = track.artists.map((artist) => artist.name).join(' ');
        const url = await ytsearch(`${track.name} ${artists}`);
        return new Track({
          title: track.name,
          url,
          sourceUrl: track.external_urls.spotify,
          thumbnail: bestThumbnail(data.images).url,
        });
      }),
    );
  }

  private async getArtistTracks(id: string): Promise<Track[]> {
    const { statusCode, body } = await this.fetch(`/artists/${id}/top-tracks`, { market: 'US' });
    if (statusCode !== 200) throw new Error('Could not get artist tracks');
    const data: ArtistsAPIResponse = await body.json();
    return Promise.all(
      data.tracks.map(async (track) => {
        const artists = track.artists.map((artist) => artist.name).join(' ');
        const url = await ytsearch(`${track.name} ${artists}`);
        return new Track({
          title: track.name,
          url,
          sourceUrl: track.external_urls.spotify,
          thumbnail: bestThumbnail(track.album.images).url,
        });
      }),
    );
  }

  private async getTrack(id: string): Promise<Track> {
    const { statusCode, body } = await this.fetch(`/tracks/${id}`);
    if (statusCode !== 200) throw new Error('Could not get track');
    const data: TracksAPIResponse = await body.json();
    const artists = data.artists.map((artist) => artist.name).join(' ');
    const url = await ytsearch(`${data.name} ${artists}`);
    return new Track({
      title: data.name,
      url,
      sourceUrl: data.external_urls.spotify,
      thumbnail: bestThumbnail(data.album.images).url,
    });
  }

  private async getPlaylistTracks(id: string): Promise<Track[]> {
    const { statusCode, body } = await this.fetch(`/playlists/${id}/tracks`, {
      fields: 'items(track(name,external_urls(spotify),artists(name),album(name,images)))',
    });
    if (statusCode !== 200) throw new Error('Could not get playlist tracks');
    const data: PlaylistsAPIResponse = await body.json();
    return Promise.all(
      data.items.map(async ({ track }) => {
        const artists = track.artists.map((artist) => artist.name).join(' ');
        const url = await ytsearch(`${track.name} ${artists}`);
        return new Track({
          title: track.name,
          url,
          sourceUrl: track.external_urls.spotify,
          thumbnail: bestThumbnail(track.album.images).url,
        });
      }),
    );
  }

  public async resolveUrl(url: string): Promise<Track | Track[]> {
    const { type, id }: Partial<{ [key: string]: string }> = SPOTIFY_REGEX.exec(url)?.groups ?? {};
    if (!type || !id || id.length !== 22) {
      throw new Error('Invalid URL');
    }
    switch (type) {
      case 'album':
        return this.getAlbumTracks(id);
      case 'artist':
        return this.getArtistTracks(id);
      case 'track':
        return this.getTrack(id);
      case 'playlist':
        return this.getPlaylistTracks(id);
      default:
        throw new Error('Unknown type');
    }
  }
}

export default Spotify;
