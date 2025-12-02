import { EmbedBuilder, User } from 'discord.js';
import { CONSTANTS } from '../config/constants';

export class EmbedHelper {
  static success(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${CONSTANTS.EMOJI.SUCCESS} ${title}`)
      .setDescription(description)
      .setColor(CONSTANTS.COLORS.SUCCESS)
      .setTimestamp();
  }

  static error(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${CONSTANTS.EMOJI.ERROR} ${title}`)
      .setDescription(description)
      .setColor(CONSTANTS.COLORS.ERROR)
      .setTimestamp();
  }

  static warning(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${CONSTANTS.EMOJI.WARNING} ${title}`)
      .setDescription(description)
      .setColor(CONSTANTS.COLORS.WARNING)
      .setTimestamp();
  }

  static info(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(CONSTANTS.COLORS.INFO)
      .setTimestamp();
  }

  static economy(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${CONSTANTS.EMOJI.COIN} ${title}`)
      .setDescription(description)
      .setColor(CONSTANTS.COLORS.ECONOMY)
      .setTimestamp();
  }

  static game(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${CONSTANTS.EMOJI.GAME} ${title}`)
      .setDescription(description)
      .setColor(CONSTANTS.COLORS.GAME)
      .setTimestamp();
  }

  static levelUp(user: User, level: number, reward: number): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${CONSTANTS.EMOJI.LEVEL_UP} Level Up!`)
      .setDescription(
        `Congratulations ${user}!\nYou've reached **Level ${level}**!\n\n${CONSTANTS.EMOJI.COIN} Reward: **${reward} PC**`
      )
      .setColor(CONSTANTS.COLORS.LEVEL)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();
  }
}
