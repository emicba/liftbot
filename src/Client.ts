import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import {
  Client as DiscordClient,
  Collection,
  GatewayIntentBits,
  GuildMember,
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
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
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
      subscription.once('destroy', () => {
        this.subscriptions.delete(guildId);
      });

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

  async updateSlashCommands() {
    const commands = this.commands.map((c) => c.data);

    if (!this.application) {
      throw new Error('Client is not ready yet');
    }

    await this.application.commands.set(commands);

    console.log(`Successfully registered ${commands.length} application commands.`);
  }
}

export default Client;
