import {
  ApplicationCommandData,
  CommandInteraction,
  GuildMember,
  MessageEmbed,
  VoiceChannel,
} from 'discord.js';

import Client from './client';
import { isPlaylist, isVideo, replyNotPlayingErr, statusEmebed as statusEmbed } from './helpers';
import ytsearch from './ytsearch';

export type Command = {
  interaction: ApplicationCommandData;
  execute: (client: Client, command: CommandInteraction) => void;
};

export const commands: { [key: string]: Command } = {
  play: {
    interaction: {
      name: 'play',
      description: 'Play audio from Youtube',
      options: [
        {
          name: 'query',
          description: 'video title or url',
          type: 'STRING',
          required: true,
        },
        {
          name: 'shuffle',
          description: 'shuffle playlist before adding it to queue',
          type: 'BOOLEAN',
        },
      ],
    },
    async execute(client, interaction) {
      const { options } = interaction;
      const query = options.get('query')?.value as string;
      const shouldShuffle = options.get('shuffle')?.value as boolean;
      const url = isVideo(query) || isPlaylist(query) ? query : await ytsearch(query);
      if (!url) {
        interaction.reply({
          content: 'Invalid query',
          ephemeral: true,
        });
        return;
      }

      const { member } = interaction;
      const voice: VoiceChannel | null = (member as GuildMember).voice?.channel as VoiceChannel;
      if (!voice) return;

      if (!client.connection) {
        await client.join(voice);
      }

      interaction.defer({ ephemeral: true });

      const { status, entry } = await client.play(url, shouldShuffle);

      const { playing } = client;
      if (!playing || !entry) return;

      interaction.editReply({
        embeds: [statusEmbed(status, entry)],
      });
    },
  },
  whatplaying: {
    interaction: {
      name: 'whatplaying',
      description: 'Describes the playing song',
    },
    async execute(client, interaction) {
      const { playing } = client;
      if (!playing) return replyNotPlayingErr(interaction);
      const { title, url, thumbnail } = playing;
      interaction.defer();
      return interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setTitle(title)
            .setURL(url)
            .setImage(thumbnail || ''),
        ],
      });
    },
  },
  skip: {
    interaction: {
      name: 'skip',
      description: 'Skips to the next song',
    },
    async execute(client, interaction) {
      if (!client.playing) return replyNotPlayingErr(interaction);
      client.playNext();
      return interaction.reply({
        content: 'Skipped to the next song',
      });
    },
  },
};
