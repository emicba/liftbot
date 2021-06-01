import { CommandInteraction, VoiceChannel } from 'discord.js';
import ytdl from 'ytdl-core';
import Client from './client';

// eslint-disable-next-line no-unused-vars
type Command = (client: Client, command: CommandInteraction) => void;

type Commands = {
  [key: string]: Command;
};

const commands: Commands = {
  async play(client, interaction) {
    const { options } = interaction;
    const url = options.find((x) => x.name === 'url')?.value?.toString();
    if (!url || !ytdl.validateURL(url)) {
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

    const response = await client.play(url);

    const { playing } = client;
    if (!playing) return;

    interaction.reply({
      content: `<@${member.id}> - ${response} ${playing.info.title}`,
      ephemeral: true,
    });
  },
  async whatplaying(client, interaction) {
    interaction.reply({
      content: client.playing
        ? `Playing **${client.playing.info.title}**`
        : 'Currently not playing audio',
      ephemeral: !client.playing,
    });
  },
};

export default commands;
