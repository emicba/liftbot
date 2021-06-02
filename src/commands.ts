import { CommandInteraction, VoiceChannel } from 'discord.js';
import ytdl from 'ytdl-core';
import Client from './client';
import { bestThumbnail, findOption, isPlaylist, isVideo } from './helpers';

// eslint-disable-next-line no-unused-vars
type Command = (client: Client, command: CommandInteraction) => void;

type Commands = {
  [key: string]: Command;
};

const commands: Commands = {
  async play(client, interaction) {
    const { options } = interaction;
    const url = findOption<string>(options, 'url')?.toString();
    const shouldShuffle = findOption<boolean>(options, 'shuffle');
    if (!url || isVideo(url) === isPlaylist(url)) {
      interaction.reply({
        content: 'Invalid url',
        ephemeral: true,
      });
      return;
    }

    const { member } = interaction;
    const voice: VoiceChannel | null = await member.voice.channel;
    if (!voice) return;

    if (!client.connection) {
      await client.join(voice);
    }

    interaction.defer({ ephemeral: true });

    const response = await client.play(url, shouldShuffle);

    const { playing } = client;
    if (!playing) return;

    interaction.editReply({
      content: `<@${member.id}> - ${response} ${playing.title}`,
    });
  },
  async whatplaying(client, interaction) {
    const { playing } = client;
    if (!playing) {
      return interaction.reply({
        content: 'Currently not playing audio',
        ephemeral: true,
      });
    }
    const { title, url } = playing;
    interaction.defer();
    const { videoDetails } = await ytdl.getBasicInfo(url);
    const thumbnail = bestThumbnail(videoDetails.thumbnails);
    return interaction.editReply({
      embeds: [
        {
          title,
          color: null,
          image: { url: thumbnail.url },
        },
      ],
    });
  },
};

export default commands;
