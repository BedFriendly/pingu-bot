import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionResolvable,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

export type CommandCategory =
  | 'games'
  | 'economy'
  | 'leveling'
  | 'fun'
  | 'utility';

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  category: CommandCategory;
  cooldown?: number; // in seconds
  permissions?: PermissionResolvable[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
