import { SlashCommandBuilder } from 'discord.js';
import { Command } from '..';
import { replyNotPlayingErr } from '../helpers';

export default {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skips to the next song').toJSON(),
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
