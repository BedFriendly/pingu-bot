import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionResolvable,
} from 'discord.js';

export type CommandCategory =
  | 'games'
  | 'economy'
  | 'leveling'
  | 'fun'
  | 'utility';

export interface Command {
  data: SlashCommandBuilder;
  category: CommandCategory;
  cooldown?: number; // in seconds
  permissions?: PermissionResolvable[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
