import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { ApplicationCommandData, CommandInteraction, GuildMember, MessageEmbed } from 'discord.js';
import ytpl from 'ytpl';

import Client from './Client';
import {
  isPlaylist,
  isVideo,
  replyNotPlayingErr,
  shuffle,
  statusEmebed as statusEmbed,
} from './helpers';
import Subscription from './Subscription';
import Track from './Track';
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
      const { options, guildId } = interaction;
      if (!guildId) return;
      const query = options.get('query')?.value as string;
      const shouldShuffle = options.get('shuffle')?.value as boolean;

      await interaction.deferReply({ ephemeral: true });

      let subscription = client.subscriptions.get(guildId);

      if (
        !subscription ||
        subscription.voiceConnection.state.status === VoiceConnectionStatus.Destroyed
      ) {
        if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
          const voiceChannel = interaction.member.voice.channel;
          subscription = new Subscription(
            joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: voiceChannel.guild.id,
              adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            }),
          );
          subscription.voiceConnection.on('error', console.warn);
          client.subscriptions.set(guildId, subscription);
        }
      }

      if (!subscription) {
        await interaction.followUp('You need to be in a voice channel');
        return;
      }

      try {
        await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 15e3);
      } catch (err) {
        console.warn(err);
        await interaction.followUp('Something went wrong while trying to join voice channel');
        return;
      }

      try {
        if (isPlaylist(query)) {
          const { items } = await ytpl(query, { pages: 1 });
          let tracks = await Track.fromPlaylist(items);
          if (shouldShuffle) {
            tracks = shuffle(tracks);
          }
          const response = await subscription.enqueue(tracks);
          interaction.followUp({
            embeds: [statusEmbed(response, tracks)],
          });
          return;
        }
        const url = isVideo(query) ? query : await ytsearch(query);
        if (!url) {
          interaction.followUp('Invalid query');
          return;
        }
        const track = await Track.fromUrl(url);
        const response = await subscription.enqueue(track);
        interaction.followUp({
          embeds: [statusEmbed(response, track)],
        });
        return;
      } catch (err) {
        console.warn(err);
        await interaction.followUp('Something went wrong while trying to play audio');
      }
    },
  },
  whatplaying: {
    interaction: {
      name: 'whatplaying',
      description: 'Describes the playing song',
    },
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
  },
  skip: {
    interaction: {
      name: 'skip',
      description: 'Skips to the next song',
    },
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
  },
};
