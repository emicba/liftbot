import { Client as DiscordClient, Collection, Intents, Snowflake } from 'discord.js';
import { commands, Command } from './commands';
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
    this.commands = new Collection(Object.entries(commands));
    this.subscriptions = new Collection();
  }
}

export default Client;
