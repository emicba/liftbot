import { MessageEmbed } from 'discord.js';
import { Command } from '..';
import { replyNotPlayingErr } from '../helpers';

export default {
  name: 'whatplaying',
  description: 'Describes the playing song',
  async execute(client, interaction) {
    if (!interaction.guildId) return;
    const subscription = client.subscriptions.get(interaction.guildId);

    if (!subscription || !subscription.nowPlaying) {
      await replyNotPlayingErr(interaction);
      return;
    }

    const { title, url, thumbnail } = subscription.nowPlaying;

    interaction.reply({
      embeds: [
        new MessageEmbed()
          .setTitle(title)
          .setURL(url)
          .setImage(thumbnail || ''),
      ],
    });
  },
} as Command;
