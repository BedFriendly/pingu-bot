import { IQuizGenerator } from '../../../types/quiz';
import { QuizType } from '../../../types/quiz';
import { randomChoice } from '../../../utils/random';
import MathQuizGenerator from './MathQuizGenerator';

/**
 * 퀴즈 생성기 팩토리
 * 퀴즈 타입에 따라 적절한 생성기를 반환
 */
export class QuizGeneratorFactory {
  private static generators: Record<QuizType, IQuizGenerator> = {
    number_math: new MathQuizGenerator(),
    // 'number_sequence': new NumberSequenceQuizGenerator(), // TODO: 수열 퀴즈
    // 'word_scramble': new WordScrambleQuizGenerator(), // TODO: 단어 섞기 퀴즈
    // 'word_trivia': new WordTriviaQuizGenerator(), // TODO: 상식 퀴즈
  };

  /**
   * 특정 타입의 퀴즈 생성기 반환
   */
  static getGenerator(type: QuizType): IQuizGenerator {
    const generator = this.generators[type];
    if (!generator) {
      throw new Error(`Unknown quiz type: ${type}`);
    }
    return generator;
  }

  /**
   * 랜덤 퀴즈 생성기 반환
   */
  static getRandomGenerator(): IQuizGenerator {
    const types = Object.keys(this.generators) as QuizType[];
    const randomType = randomChoice(types);
    return this.generators[randomType];
  }

  /**
   * 모든 퀴즈 타입 목록 반환
   */
  static getAllTypes(): QuizType[] {
    return Object.keys(this.generators) as QuizType[];
  }
}
