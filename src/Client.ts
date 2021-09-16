import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import {
  Client as DiscordClient,
  Collection,
  GuildMember,
  Intents,
  Interaction,
  Snowflake,
} from 'discord.js';
import { Command } from '.';
import Spotify from './Spotify';
import Subscription from './Subscription';

class Client extends DiscordClient {
  public commands: Collection<string, Command>;

  public subscriptions: Collection<Snowflake, Subscription>;

  public spotify: Spotify;

  constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
    });
    this.commands = new Collection();
    this.subscriptions = new Collection();
    this.spotify = new Spotify();
  }

  public async getOrCreateSubscription(
    guildId: Snowflake,
    member: Interaction['member'],
  ): Promise<Subscription> {
    let subscription = this.subscriptions.get(guildId);

    if (
      subscription &&
      subscription.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed
    ) {
      return subscription;
    }

    if (member instanceof GuildMember && member.voice.channel) {
      const voiceChannel = member.voice.channel;
      subscription = new Subscription(
        joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        }),
      );
      subscription.voiceConnection.on('error', console.warn);
      this.subscriptions.set(guildId, subscription);
    }

    if (!subscription) throw new Error('You need to be in a voice channel');

    try {
      await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 15e3);
    } catch (err) {
      console.warn(err);
      throw new Error('Something went wrong while trying to join voice channel');
    }

    return subscription;
  }
}

export default Client;
