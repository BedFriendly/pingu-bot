import {
  ChatInputCommandInteraction,
  PermissionResolvable,
  SharedSlashCommand,
} from 'discord.js';

export type CommandCategory =
  | 'admin'
  | 'game'
  | 'economy'
  | 'leveling'
  | 'fun'
  | 'utility';

export interface Command {
  data: SharedSlashCommand;
  category: CommandCategory;
  cooldown?: number; // in seconds
  permissions?: PermissionResolvable[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
