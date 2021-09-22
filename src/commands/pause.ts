import { Command } from '..';
import { buildStatusEmbed, replyNotPlayingErr } from '../helpers';
import { ResponseStatus } from '../Subscription';

export default {
  name: 'pause',
  description: 'Pauses the player',
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
