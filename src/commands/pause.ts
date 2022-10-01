import { SlashCommandBuilder } from 'discord.js';
import { Command } from '..';
import { buildStatusEmbed, replyNotPlayingErr } from '../helpers';
import { ResponseStatus } from '../Subscription';

export default {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pauses the player').toJSON(),
  async execute(client, interaction) {
    if (!interaction.guildId) return;
    const subscription = client.subscriptions.get(interaction.guildId);

    if (!subscription || !subscription.nowPlaying) {
      await replyNotPlayingErr(interaction);
      return;
    }

    subscription.audioPlayer.pause();
    await interaction.reply({
      embeds: [buildStatusEmbed(ResponseStatus.PAUSED, subscription.nowPlaying)],
    });
  },
} as Command;
