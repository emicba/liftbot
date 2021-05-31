import { CommandInteraction, VoiceChannel } from 'discord.js';
import ytdl from 'ytdl-core-discord';
import { YOUTUBE_URL_TEST } from './helpers';

// eslint-disable-next-line no-unused-vars
type Command = (command: CommandInteraction) => void;

type Commands = {
  [key: string]: Command;
};

const commands: Commands = {
  async play(interaction) {
    const { options } = interaction;
    const url = options.find((x) => x.name === 'url')?.value?.toString();
    if (url?.match(YOUTUBE_URL_TEST)) {
      const { member } = interaction;
      const voice: VoiceChannel | null = await member.voice.channel;
      if (!voice) return;

      const voiceConnection = await voice.join();
      const { videoDetails: videoInfo } = await ytdl.getBasicInfo(url);
      interaction.reply({
        content: `Playing **${videoInfo.title}**`,
        ephemeral: true,
      });
      voiceConnection.play(
        await ytdl(url.toString(), {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1024 * 1024 * 8,
        }), { type: 'opus', volume: 0.5 },
      );
    }
  },
};

export default commands;
