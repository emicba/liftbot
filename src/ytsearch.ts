/* eslint-disable no-redeclare */
import fetch from 'node-fetch';

async function ytsearch(query: string, limit?: 1): Promise<string>;
async function ytsearch(query: string, limit: number): Promise<string[]>;
async function ytsearch(query: string, limit: number = 1): Promise<string | string[]> {
  const response = await fetch(`https://www.youtube.com/results?search_query=${query}`);
  if (!response.ok) throw new Error('Could not fetch search results');
  const body = await response.text();
  const regex = /"videoRenderer":{"videoId":"(?<videoId>.{11})"/gm;

  let match = regex.exec(body);
  if (limit === 1 && match?.groups?.videoId) {
    return `https://youtu.be/${match.groups.videoId}`;
  }

  const results: string[] = [];
  while (results.length < limit && match?.groups?.videoId) {
    results.push(`https://youtu.be/${match.groups.videoId}`);
    match = regex.exec(body);
  }
  return results;
}

export default ytsearch;
