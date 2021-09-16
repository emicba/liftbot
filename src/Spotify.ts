import fetch, { Response } from 'node-fetch';
import { bestThumbnail, SPOTIFY_PLAYLIST_TEST } from './helpers';
import Track from './Track';
import ytsearch from './ytsearch';

interface ClientCredentialsResponse {
  clientId: string;
  accessToken: string;
  accessTokenExpirationTimestampMs: number;
  isAnonymous: string;
}

interface Image {
  url: string;
  width: number;
  height: number;
}

interface SpotifyTrack {
  track: {
    name: string;
    album: {
      name: string;
      images: Image[];
    };
    // eslint-disable-next-line camelcase
    external_urls: {
      spotify: string;
    };
    artists: {
      name: string;
    }[];
  };
}

interface SpotifyPlaylistResponse {
  items: SpotifyTrack[];
}

const BASE_URL = 'https://api.spotify.com/v1';

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
    const response = await fetch('https://open.spotify.com/get_access_token');
    if (!response.ok) throw new Error('Could not get Spotify anonymous token');
    const data: ClientCredentialsResponse = await response.json();
    this.token = data.accessToken;
    if (this.tokenTimeout !== undefined) {
      clearTimeout(this.tokenTimeout);
    }
    this.tokenTimeout = setTimeout(
      () => this.refreshAnonymousToken(),
      data.accessTokenExpirationTimestampMs - Date.now(),
    );
  }

  private async fetch(url: string, searchParams = {}): Promise<Response> {
    const params = new URLSearchParams(searchParams);
    return fetch(`${BASE_URL}${url}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  public async getPlaylistTracks(playlistUrl: string): Promise<Track[]> {
    const match = SPOTIFY_PLAYLIST_TEST.exec(playlistUrl);
    if (!match || match.length < 2) throw new Error('Invalid playlist URL');
    const playlistId = match[1];
    const response = await this.fetch(`/playlists/${playlistId}/tracks`, {
      fields: 'items(track(name,external_urls(spotify),artists(name),album(name,images)))',
    });
    if (!response.ok) throw new Error('Could not get playlist tracks');
    const data: SpotifyPlaylistResponse = await response.json();
    return Promise.all(
      data.items.map(async ({ track }) => {
        const artists = track.artists.map((artist) => artist.name).join(' ');
        const url = await ytsearch(`${track.name} ${artists}`);
        return new Track({
          title: track.name,
          url,
          thumbnail: bestThumbnail(track.album.images).url!,
        });
      }),
    );
  }
}

export default Spotify;
