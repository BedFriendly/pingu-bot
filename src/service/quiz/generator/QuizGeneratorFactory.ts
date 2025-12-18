import { IQuizGenerator } from '../../../types/quiz';
import { QuizType } from '../../../types/quiz';
import { randomChoice } from '../../../utils/random';

/**
 * 퀴즈 생성기 팩토리
 * 퀴즈 타입에 따라 적절한 생성기를 반환
 */
export class QuizGeneratorFactory {
  private static generators: Map<QuizType, IQuizGenerator> = new Map([
    // 새로운 퀴즈 타입 추가 시 여기에 등록
  ]);

  /**
   * 특정 타입의 퀴즈 생성기 반환
   */
  static getGenerator(type: QuizType): IQuizGenerator {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`Unknown quiz type: ${type}`);
    }
    return generator;
  }

  /**
   * 랜덤 퀴즈 생성기 반환
   */
  static getRandomGenerator(): IQuizGenerator {
    const types = Array.from(this.generators.keys());
    const randomType = randomChoice(types);
    return this.generators.get(randomType)!;
  }

  /**
   * 모든 퀴즈 타입 목록 반환
   */
  static getAllTypes(): QuizType[] {
    return Array.from(this.generators.keys());
  }
}
