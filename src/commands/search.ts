import { MessageActionRow, MessageSelectMenu, SlashCommandBuilder } from 'discord.js';
import ms from 'ms';
import { getInfo } from 'ytdl-core';
import { Command } from '..';
import { buildStatusEmbed } from '../helpers';
import Track from '../Track';
import ytsearch from '../ytsearch';

export default {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search (and pick) tracks from Youtube')
    .addStringOption((o) => o.setName('query').setDescription('video title').setRequired(true))
    .toJSON(),
  async execute(client, interaction) {
    const { options, guildId } = interaction;
    const query = options.getString('query', true);
    if (!guildId) return;

    await interaction.deferReply({ ephemeral: true });
    await interaction.followUp('🔎 Searching...');

    const results = await ytsearch(query, 25);
    if (!results.length) {
      await interaction.reply('No results found');
      return;
    }

    const tracks = await Promise.all(
      [...new Set(results)].map(async (url) => {
        const { videoDetails } = await getInfo(url);
        const duration = ms(Number(Number(videoDetails.lengthSeconds) * 1000));
        return {
          title: `${videoDetails.title.slice(0, 100 - duration.length - 3)} - ${duration}`,
          url,
        };
      }),
    );

    const select = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(this.name)
        .setPlaceholder('Select tracks')
        .setMinValues(1)
        .addOptions(
          tracks.map((track) => ({
            label: track.title,
            value: track.url,
          })),
        ),
    );

    await interaction.editReply({
      content: 'Select tracks to add to queue',
      components: [select],
    });
  },
  async selectMenu(client, interaction) {
    const { guildId, member } = interaction;
    if (!guildId) return;

    await interaction.deferUpdate();

    let subscription;
    try {
      subscription = await client.getOrCreateSubscription(guildId, member);
    } catch (err) {
      interaction.followUp((err as Error).message);
      return;
    }

    await interaction.editReply({ content: '🔎 Searching...', components: [] });

    const tracks = await Promise.all(interaction.values.map(async (url) => Track.fromUrl(url)));
    const response = await subscription.enqueue(tracks);

    interaction.editReply({
      content: null,
      embeds: [buildStatusEmbed(response, tracks)],
    });
  },
} as Command;
