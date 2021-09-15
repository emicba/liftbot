import ytpl from 'ytpl';
import { Command } from '..';
import { isPlaylist, shuffle, isVideo, buildStatusEmbed, getVideoId } from '../helpers';
import Track from '../Track';
import ytsearch from '../ytsearch';

export default {
  name: 'play',
  description: 'Play audio from Youtube',
  options: [
    {
      name: 'query',
      description: 'video title or url',
      type: 'STRING',
      required: true,
    },
    {
      name: 'shuffle',
      description: 'shuffle playlist before adding it to queue',
      type: 'BOOLEAN',
    },
  ],
  async execute(client, interaction) {
    const { options, guildId, member } = interaction;
    if (!guildId) return;
    const query = options.getString('query', true);
    const shouldShuffle = options.get('shuffle', false);

    await interaction.deferReply({ ephemeral: true });

    let subscription;
    try {
      subscription = await client.getOrCreateSubscription(guildId, member);
    } catch (err) {
      interaction.followUp((err as Error).message);
      return;
    }

    try {
      if (isPlaylist(query)) {
        const { items } = await ytpl(query, { pages: 1 });
        let tracks = await Track.fromPlaylist(items);
        if (shouldShuffle) {
          tracks = shuffle(tracks);
        }
        const response = await subscription.enqueue(tracks);
        interaction.followUp({
          embeds: [buildStatusEmbed(response, tracks)],
        });
        return;
      }
      const url = isVideo(query) ? `https://youtu.be/${getVideoId(query)}` : await ytsearch(query);
      if (!url) {
        interaction.followUp('Invalid query');
        return;
      }
      const track = await Track.fromUrl(url);
      const response = await subscription.enqueue(track);
      interaction.followUp({
        embeds: [buildStatusEmbed(response, track)],
      });
      return;
    } catch (err) {
      console.warn(err);
      await interaction.followUp('Something went wrong while trying to play audio');
    }
  },
} as Command;
