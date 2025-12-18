import { QuizSession, Prisma } from '@prisma/client';

/**
 * QuizSession DAO 인터페이스
 * quiz_sessions 테이블에 대한 CRUD 작업 정의
 */
export interface IQuizSessionDAO {
  /**
   * 퀴즈 세션 생성
   * @param data 퀴즈 세션 생성 데이터
   * @returns 생성된 QuizSession 객체
   */
  create(data: Prisma.QuizSessionCreateInput): Promise<QuizSession>;

  /**
   * ID로 퀴즈 세션 조회
   * @param id 퀴즈 세션 ID
   * @returns QuizSession 객체 또는 null
   */
  findById(id: number): Promise<QuizSession | null>;

  /**
   * 길드의 활성화된 퀴즈 세션 조회 (가장 최근)
   * @param guildId 길드 ID
   * @returns QuizSession 객체 또는 null
   */
  findActiveByGuildId(guildId: string): Promise<QuizSession | null>;

  /**
   * 퀴즈 세션 삭제 (정답자가 나왔거나 시간 만료 시)
   * @param id 퀴즈 세션 ID
   */
  delete(id: number): Promise<void>;

  /**
   * messageId 업데이트
   * @param id 퀴즈 세션 ID
   * @param messageId 디스코드 메시지 ID
   * @returns 업데이트된 QuizSession 객체
   */
  updateMessageId(id: number, messageId: string): Promise<QuizSession>;

  /**
   * 만료된 퀴즈 세션 조회 및 삭제
   * @returns 삭제된 세션 수
   */
  deleteExpiredSessions(timeLimit: number): Promise<number>;

  /**
   * 특정 길드의 퀴즈 세션 기록 조회 (최근 N개)
   * @param guildId 길드 ID
   * @param limit 조회할 세션 수
   * @returns QuizSession 배열
   */
  findRecentByGuildId(guildId: string, limit: number): Promise<QuizSession[]>;
}
