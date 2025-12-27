import { QuizConfig, Prisma } from '@prisma/client';

/**
 * QuizConfig DAO 인터페이스
 * quiz_configs 테이블에 대한 CRUD 작업 정의
 */
export interface IQuizConfigDAO {
  /**
   * 길드 ID로 퀴즈 설정 조회
   * @param guildId 길드 ID
   * @returns QuizConfig 객체 또는 null
   */
  findByGuildId(guildId: string): Promise<QuizConfig | null>;

  /**
   * 퀴즈 설정 생성
   * @param data 퀴즈 설정 생성 데이터
   * @returns 생성된 QuizConfig 객체
   */
  create(data: Prisma.QuizConfigCreateInput): Promise<QuizConfig>;

  /**
   * 퀴즈 설정 업데이트 (채널 변경)
   * @param guildId 길드 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 QuizConfig 객체
   */
  update(
    guildId: string,
    data: Prisma.QuizConfigUpdateInput
  ): Promise<QuizConfig>;

  /**
   * 퀴즈 설정 삭제 (비활성화)
   * @param guildId 길드 ID
   */
  delete(guildId: string): Promise<void>;

  /**
   * 모든 퀴즈 설정 조회 (활성화된 모든 길드)
   * @returns QuizConfig 배열
   */
  findAll(): Promise<QuizConfig[]>;
}
