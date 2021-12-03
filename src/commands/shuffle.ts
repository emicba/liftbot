import { MessageEmbed } from 'discord.js';
import type { Command } from '..';
import { replyNotPlayingErr, shuffle } from '../helpers';

export default {
  name: 'shuffle',
  description: 'Shuffles the current queue.',
  async execute(client, interaction) {
    if (!interaction.guildId) return;
    const subscription = client.subscriptions.get(interaction.guildId);

    if (!subscription || subscription.queue.length === 0) {
      await replyNotPlayingErr(interaction);
      return;
    }

    await interaction.deferReply();

    subscription.queue = shuffle(subscription.queue);

    await interaction.followUp({
      embeds: [
        new MessageEmbed()
          .setColor('RANDOM')
          .setTitle('Shuffled queue')
          .setDescription('The queue has been shuffled.'),
      ],
    });
  },
} as Command;
