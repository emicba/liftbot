import { CommandInteraction, GuildMember, MessageEmbed, VoiceChannel } from 'discord.js';
import ytdl from 'ytdl-core';
import Client from './client';
import { bestThumbnail, isPlaylist, isVideo, replyNotPlayingErr } from './helpers';

// eslint-disable-next-line no-unused-vars
type Command = (client: Client, command: CommandInteraction) => void;

type Commands = {
  [key: string]: Command;
};

const commands: Commands = {
  async play(client, interaction) {
    const { options } = interaction;
    const url = options.get('url')?.value as string;
    const shouldShuffle = options.get('shuffle')?.value as boolean;
    if (!url || isVideo(url) === isPlaylist(url)) {
      interaction.reply({
        content: 'Invalid url',
        ephemeral: true,
      });
      return;
    }

    // const { member  } = interaction;
    const { member } = interaction;
    const voice: VoiceChannel | null = (member as GuildMember).voice?.channel as VoiceChannel;
    if (!voice) return;

    if (!client.connection) {
      await client.join(voice);
    }

    interaction.defer({ ephemeral: true });

    const response = await client.play(url, shouldShuffle);

    const { playing } = client;
    if (!playing) return;

    interaction.editReply({
      content: `<@${member?.user.id}> - ${response} ${playing.title}`,
    });
  },
  async whatplaying(client, interaction) {
    const { playing } = client;
    if (!playing) return replyNotPlayingErr(interaction);
    const { title, url } = playing;
    interaction.defer();
    const { videoDetails } = await ytdl.getBasicInfo(url);
    const thumbnail = bestThumbnail(videoDetails.thumbnails);
    return interaction.editReply({
      embeds: [new MessageEmbed().setTitle(title).setImage(thumbnail.url)],
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
