/**
 * 퀴즈 타입 정의
 * 퀴즈 생성 및 검증에 사용되는 인터페이스와 타입
 */

/**
 * 퀴즈 타입 열거형
 */
export enum QuizType {
  NUMBER_MATH = 'number_math', // 숫자 계산 퀴즈
  // NUMBER_SEQUENCE = 'number_sequence', // TODO: 수열 퀴즈
  // WORD_SCRAMBLE = 'word_scramble', // TODO:단어 섞기 퀴즈
  // WORD_TRIVIA = 'word_trivia', // TODO: 상식 퀴즈
}

/**
 * 퀴즈 생성 결과
 */
export interface QuizQuestion {
  question: string; // 문제 텍스트
  answer: string; // 정답 (문자열)
  type: QuizType; // 퀴즈 타입
  difficulty: number; // 난이도 (정수)
  hint?: string; // 힌트 (optional)
}

/**
 * 퀴즈 생성기 인터페이스
 * 모든 퀴즈 타입은 이 인터페이스를 구현해야 함
 */
export interface IQuizGenerator {
  /**
   * 퀴즈 문제 생성 (비동기)
   * @param difficulty 난이도 (1~10)
   * @returns QuizQuestion 객체
   */
  generate(difficulty: number): Promise<QuizQuestion>;

  /**
   * 퀴즈 타입 반환
   */
  getType(): QuizType;

  /**
   * 정답 검증
   * @param userAnswer 유저의 답변
   * @param correctAnswer 정답
   * @returns 정답 여부
   */
  validateAnswer(userAnswer: string, correctAnswer: string): boolean;
}
