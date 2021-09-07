import { Client as DiscordClient, Collection, Intents, Snowflake } from 'discord.js';
import { Command } from '.';
import Subscription from './Subscription';

class Client extends DiscordClient {
  public commands: Collection<string, Command>;

  public subscriptions: Collection<Snowflake, Subscription>;

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
  }
}

export default Client;
