interface Image {
  url: string;
  width: number;
  height: number;
}

export interface ClientCredentialsResponse {
  clientId: string;
  accessToken: string;
  accessTokenExpirationTimestampMs: number;
  isAnonymous: string;
}

interface ExternalUrls {
  // eslint-disable-next-line camelcase
  external_urls: { spotify: string };
}

interface Album {
  name: string;
  images: Image[];
}

interface Artist extends ExternalUrls {
  name: string;
}

interface AlbumTrack extends ExternalUrls {
  name: string;
  artists: Artist[];
}

interface ArtistTrack extends ExternalUrls {
  name: string;
  artists: Artist[];
  album: Album;
}

interface PlaylistTrack extends ExternalUrls {
  track: {
    name: string;
    album: Album;
    artists: Artist[];
  } & ExternalUrls;
}

export interface AlbumsAPIResponse extends ExternalUrls {
  artists: Artist[];
  images: Image[];
  tracks: {
    items: AlbumTrack[];
  };
}

export interface ArtistsAPIResponse {
  tracks: ArtistTrack[];
}

export interface TracksAPIResponse extends AlbumTrack {
  album: Album;
}

export interface PlaylistsAPIResponse {
  items: PlaylistTrack[];
}
