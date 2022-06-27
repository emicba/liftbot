import { request } from 'undici';

async function ytsearch(query: string, limit?: 1): Promise<string>;
async function ytsearch(query: string, limit: number): Promise<string[]>;
async function ytsearch(query: string, limit: number = 1): Promise<string | string[]> {
  const { statusCode, body } = await request('https://www.youtube.com/results?', {
    query: { search_query: query },
  });
  if (statusCode !== 200) throw new Error('Could not fetch search results');
  const html = await body.text();

  const regex = /"videoRenderer":{"videoId":"(?<videoId>.{11})"/gm;

  let match = regex.exec(html);
  if (limit === 1 && match?.groups?.videoId) {
    return `https://youtu.be/${match.groups.videoId}`;
  }

  const results: string[] = [];
  while (results.length < limit && match?.groups?.videoId) {
    results.push(`https://youtu.be/${match.groups.videoId}`);
    match = regex.exec(html);
  }
  return results;
}

export default ytsearch;
