import { CommandInteraction, GuildMember, MessageEmbed, VoiceChannel } from 'discord.js';

import Client from './client';
import { isPlaylist, isVideo, replyNotPlayingErr, statusEmebed as statusEmbed } from './helpers';
import ytsearch from './ytsearch';

type Command = (client: Client, command: CommandInteraction) => void;

type Commands = {
  [key: string]: Command;
};

const commands: Commands = {
  async play(client, interaction) {
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
  async whatplaying(client, interaction) {
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
  async skip(client, interaction) {
    if (!client.playing) return replyNotPlayingErr(interaction);
    client.playNext();
    return interaction.reply({
      content: 'Skipped to the next song',
    });
  },
};

export default commands;
