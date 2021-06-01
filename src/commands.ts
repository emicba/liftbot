import { CommandInteraction, VoiceChannel } from 'discord.js';

import Client from './client';
import { YOUTUBE_URL_TEST } from './helpers';

// eslint-disable-next-line no-unused-vars
type Command = (client: Client, command: CommandInteraction) => void;

type Commands = {
  [key: string]: Command;
};

const commands: Commands = {
  async play(client, interaction) {
    const { options } = interaction;
    const url = options.find((x) => x.name === 'url')?.value?.toString();
    if (!url?.match(YOUTUBE_URL_TEST)) return;

    const { member } = interaction;
    const voice: VoiceChannel | null = await member.voice.channel;
    if (!voice) return;

    if (!client.connection) {
      await client.join(voice);
    }

    const playing = await client.play(url);
    interaction.reply({
      content: `Playing **${playing.info.title}**`,
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
