import { MessageEmbed, SlashCommandBuilder } from 'discord.js';
import { Command } from '..';
import { replyNotPlayingErr } from '../helpers';

export default {
  data: new SlashCommandBuilder()
    .setName('whatplaying')
    .setDescription('Describes the playing song')
    .toJSON(),
  aliases: ['nowplaying'],
  async execute(client, interaction) {
    if (!interaction.guildId) return;
    const subscription = client.subscriptions.get(interaction.guildId);

    if (!subscription || !subscription.nowPlaying) {
      await replyNotPlayingErr(interaction);
      return;
    }

    const { title, link, thumbnail } = subscription.nowPlaying;

    interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor('RANDOM')
          .setTitle(title)
          .setURL(link)
          .setImage(thumbnail || ''),
      ],
    });
  },
} as Command;
