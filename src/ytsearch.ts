import fetch from 'node-fetch';

export default async function ytsearch(query: string): Promise<string | undefined> {
  const response = await fetch(`https://www.youtube.com/results?search_query=${query}`);
  if (response.ok) {
    const body = await response.text();
    const regex = /"videoRenderer":{"videoId":"(?<videoId>.{11})"/gm;
    const videoId = regex.exec(body);
    if (videoId?.groups?.videoId) {
      return `https://youtu.be/${videoId?.groups?.videoId}`;
    }
  }
  return undefined;
}
