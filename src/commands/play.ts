import { VoiceConnectionStatus, joinVoiceChannel, entersState } from '@discordjs/voice';
import { GuildMember } from 'discord.js';
import ytpl from 'ytpl';
import { Command } from '..';
import { isPlaylist, shuffle, isVideo, buildStatusEmbed } from '../helpers';
import Subscription from '../Subscription';
import Track from '../Track';
import ytsearch from '../ytsearch';

export default {
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
          embeds: [buildStatusEmbed(response, tracks)],
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
        embeds: [buildStatusEmbed(response, track)],
      });
      return;
    } catch (err) {
      console.warn(err);
      await interaction.followUp('Something went wrong while trying to play audio');
    }
  },
} as Command;
