import { MessageEmbed } from 'discord.js';
import type { Command } from '..';
import { replyNotPlayingErr } from '../helpers';

export default {
  name: 'queue',
  description: 'Shows the current queue',
  async execute(client, interaction) {
    if (!interaction.guildId) return;
    const subscription = client.subscriptions.get(interaction.guildId);

    if (!subscription || !subscription.nowPlaying) {
      await replyNotPlayingErr(interaction);
      return;
    }

    const { queue, nowPlaying } = subscription;
    const tracks = queue.slice(0, 10);
    const diff = queue.length - tracks.length;

    const tracksText = tracks
      .map((track, index) => `\`${index + 1}.\` [${track.title}](${track.url})\n`)
      .join('\n');
    const embed = new MessageEmbed().setColor('RANDOM').setTitle('Queue').setDescription(`
        __Now Playling__
        [${nowPlaying.title}](${nowPlaying.url})

        ${tracksText}
        ${diff > 0 ? `**+${diff} more songs in queue**` : ''}
      `);

    await interaction.reply({
      embeds: [embed],
    });
  },
} as Command;
