import { cleanEnv, str } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export default cleanEnv(process.env, {
  /**
   * The Discord bot API token.
   */
  TOKEN: str(),
  /**
   * The guild ID the bot is working.
   */
  GUILD: str(),
});
