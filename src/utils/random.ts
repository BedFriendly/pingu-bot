/**
 * 랜덤 유틸리티 함수
 * 퀴즈 생성 및 다양한 랜덤 기능에 사용
 */

/**
 * 랜덤 정수 생성
 * @param min 최소값 (포함)
 * @param max 최대값 (포함)
 * @returns min과 max 사이의 랜덤 정수
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 배열에서 랜덤 요소 선택
 * @param array 선택할 배열
 * @returns 배열의 랜덤 요소
 */
export function randomChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 배열 섞기 (Fisher-Yates shuffle)
 * @param array 섞을 배열
 * @returns 섞인 새 배열
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 랜덤 float 생성
 * @param min 최소값 (포함)
 * @param max 최대값 (미포함)
 * @returns min과 max 사이의 랜덤 float
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
