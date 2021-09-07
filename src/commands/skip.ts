import { Command } from '..';
import { replyNotPlayingErr } from '../helpers';

export default {
  name: 'skip',
  description: 'Skips to the next song',
  async execute(client, interaction) {
    if (!interaction.guildId) return;
    const subscription = client.subscriptions.get(interaction.guildId);

    if (!subscription || !subscription.nowPlaying) {
      await replyNotPlayingErr(interaction);
      return;
    }

    subscription.audioPlayer.stop();
    interaction.reply({
      content: 'Skipped to the next song',
    });
  },
} as Command;
