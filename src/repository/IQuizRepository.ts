import { QuizConfig, QuizSession } from '@prisma/client';

/**
 * Quiz Repository 인터페이스
 * 퀴즈 관련 데이터 접근 로직 정의
 * 주의: 비즈니스 로직은 포함하지 않음 (Service 레이어에서 처리)
 */
export interface IQuizRepository {
  /**
   * 길드의 퀴즈 설정 조회
   * @param guildId 길드 ID
   * @returns QuizConfig 객체 또는 null
   */
  findConfig(guildId: string): Promise<QuizConfig | null>;

  /**
   * 퀴즈 채널 설정 (신규 생성)
   * @param guildId 길드 ID
   * @param channelId 채널 ID
   * @returns 생성된 QuizConfig 객체
   */
  createQuizChannel(guildId: string, channelId: string): Promise<QuizConfig>;

  /**
   * 퀴즈 채널 업데이트 (기존 설정 수정)
   * @param guildId 길드 ID
   * @param channelId 채널 ID
   * @returns 업데이트된 QuizConfig 객체
   */
  updateQuizChannel(guildId: string, channelId: string): Promise<QuizConfig>;

  /**
   * 퀴즈 비활성화 (QuizConfig 삭제)
   * @param guildId 길드 ID
   */
  disableQuiz(guildId: string): Promise<void>;

  /**
   * 모든 활성화된 퀴즈 설정 조회
   * @returns QuizConfig 배열
   */
  findAllActiveConfigs(): Promise<QuizConfig[]>;

  /**
   * 퀴즈 세션 생성
   * @param data 퀴즈 세션 데이터
   * @returns 생성된 QuizSession 객체
   */
  createSession(data: {
    guildId: string;
    channelId: string;
    messageId?: string;
    quizType: string;
    question: string;
    answer: string;
    hint?: string;
    difficulty: number;
    rewardAmount: number;
    timeLimit: number;
  }): Promise<QuizSession>;

  /**
   * 퀴즈 세션 조회
   * @param id 퀴즈 세션 ID
   * @returns QuizSession 객체 또는 null
   */
  findSessionById(id: number): Promise<QuizSession | null>;

  /**
   * 길드의 활성화된 퀴즈 세션 조회
   * @param guildId 길드 ID
   * @returns QuizSession 객체 또는 null
   */
  findActiveSession(guildId: string): Promise<QuizSession | null>;

  /**
   * 퀴즈 정답 처리 (트랜잭션)
   * - User 코인 지급
   * - QuizSession 삭제
   * @param quizSessionId 퀴즈 세션 ID
   * @param userId 사용자 ID
   * @param username 사용자 이름
   * @returns 지급된 코인 금액
   */
  completeQuiz(
    quizSessionId: number,
    userId: string,
    username: string
  ): Promise<number>;

  /**
   * 퀴즈 세션 삭제
   * @param id 퀴즈 세션 ID
   */
  deleteSession(id: number): Promise<void>;

  /**
   * 만료된 퀴즈 세션 정리 (배치)
   * @returns 삭제된 세션 수
   */
  cleanupExpiredSessions(timeLimit: number): Promise<number>;

  /**
   * messageId 업데이트
   * @param id 퀴즈 세션 ID
   * @param messageId 메시지 ID
   * @returns 업데이트된 QuizSession 객체
   */
  updateSessionMessageId(id: number, messageId: string): Promise<QuizSession>;
}
