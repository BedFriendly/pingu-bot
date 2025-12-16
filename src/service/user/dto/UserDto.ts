/**
 * User Entity DTO
 * User 엔티티의 일부를 표현하기 위한 DTO
 * Response DTO에서만 사용됨
 */
export class UserDto {
  readonly userId: string;
  readonly username: string;
  readonly coins: number;
  readonly experience: number;
  readonly level: number;
  readonly totalWins: number;
  readonly totalGames: number;

  constructor(props: {
    userId: string;
    username: string;
    coins: number;
    experience: number;
    level: number;
    totalWins: number;
    totalGames: number;
  }) {
    this.userId = props.userId;
    this.username = props.username;
    this.coins = props.coins;
    this.experience = props.experience;
    this.level = props.level;
    this.totalWins = props.totalWins;
    this.totalGames = props.totalGames;
  }
}
