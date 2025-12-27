import { IQuizGenerator, QuizQuestion, QuizType } from '../../../types/quiz';

/**
 * 퀴즈 생성기 추상 클래스
 * 공통 로직을 제공하고 구체 클래스에서 generate()만 구현
 */
export abstract class BaseQuizGenerator implements IQuizGenerator {
  /**
   * 퀴즈 생성 (추상 메서드)
   * @param difficulty 난이도 (1~10)
   */
  abstract generate(difficulty: number): Promise<QuizQuestion>;

  /**
   * 퀴즈 타입 반환 (추상 메서드)
   */
  abstract getType(): QuizType;

  /**
   * 기본 정답 검증 로직
   * @param userAnswer 사용자가 제출한 답변
   * @param correctAnswer 정답
   */
  abstract validateAnswer(userAnswer: string, correctAnswer: string): boolean;
}
