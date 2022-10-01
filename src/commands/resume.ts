import { SlashCommandBuilder } from 'discord.js';
import { Command } from '..';
import { buildStatusEmbed, replyNotPlayingErr } from '../helpers';
import { ResponseStatus } from '../Subscription';

export default {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resumes the player').toJSON(),
  async execute(client, interaction) {
    if (!interaction.guildId) return;
    const subscription = client.subscriptions.get(interaction.guildId);

    if (!subscription || !subscription.nowPlaying) {
      await replyNotPlayingErr(interaction);
      return;
    }

    subscription.audioPlayer.unpause();
    await interaction.reply({
      embeds: [buildStatusEmbed(ResponseStatus.PLAYED, subscription.nowPlaying)],
    });
  },
} as Command;
