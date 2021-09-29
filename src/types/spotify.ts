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

interface Artist extends ExternalUrls {
  name: string;
}

interface AlbumTrack extends ExternalUrls {
  name: string;
  artists: Artist[];
}

interface PlaylistTrack extends ExternalUrls {
  track: {
    name: string;
    album: {
      name: string;
      images: Image[];
    };
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

export interface PlaylistsAPIResponse {
  items: PlaylistTrack[];
}
