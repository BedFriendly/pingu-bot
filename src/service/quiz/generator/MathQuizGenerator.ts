import { QuizQuestion, QuizType } from '../../../types/quiz';
import { randomInt } from '../../../utils/random';
import { BaseQuizGenerator } from './BaseQuizGenerator';

type PuzzleResult = {
  equation: string; // 수식 문자열
  answer: number; // 계산된 정답
};

type PuzzleNode = {
  value: number; // 현재 노드의 계산된 값
  expr: string; // 현재 노드의 수식 표현
  prec: number; // 현재 노드의 우선순위 (연산자 우선순위 관리용)
};

class MathQuizGenerator extends BaseQuizGenerator {
  async generate(difficulty: number): Promise<QuizQuestion> {
    const numCount = difficulty + 1;
    const maxNum = (difficulty - 1) * 3 + 10;

    const puzzle = await this.generateIntegerPuzzle(numCount, maxNum);

    return {
      question: puzzle.equation,
      answer: puzzle.answer.toString(),
      type: this.getType(),
      difficulty: difficulty,
    };
  }

  getType(): QuizType {
    return QuizType.NUMBER_MATH;
  }

  validateAnswer(userAnswer: string, correctAnswer: string): boolean {
    return userAnswer.trim() === correctAnswer.trim();
  }

  private async generateIntegerPuzzle(
    numCount: number = 4,
    maxNum: number = 9
  ): Promise<PuzzleResult> {
    // 1. 초기 노드 리스트 생성 (각 숫자는 우선순위가 가장 높은 3으로 설정)
    const nodes: PuzzleNode[] = [];

    for (let i = 0; i < numCount; i++) {
      const val = randomInt(1, maxNum);
      nodes.push({
        value: val,
        expr: val.toString(),
        prec: 3, // 단일 숫자는 괄호가 필요 없으므로 가장 높은 우선순위 부여
      });
    }

    // 2. 하나가 남을 때까지 반복 (Bottom-Up)
    while (nodes.length > 1) {
      // 임의의 두 노드 선택
      const idx1 = randomInt(0, nodes.length - 1);
      let idx2 = randomInt(0, nodes.length - 1);
      while (idx1 === idx2) idx2 = randomInt(0, nodes.length - 1);

      // 노드 추출
      let node1 = nodes[idx1];
      let node2 = nodes[idx2];

      // 연산자 후보 선정
      const validOps: string[] = ['+', '*', '-'];

      // 나눗셈 조건: 나누어 떨어지고 0이 아닐 때
      if (node2.value !== 0 && node1.value % node2.value === 0) {
        validOps.push('/');
      }

      const op = validOps[randomInt(0, validOps.length - 1)];

      // 현재 연산자의 우선순위 설정 (+,-는 1, *,/는 2)
      const currentPrec = op === '*' || op === '/' ? 2 : 1;

      // --- 연산 수행 및 수식 조합 ---
      let newValue = 0;
      let newExpr = '';

      // 뺄셈의 경우 음수 방지 (큰 수 - 작은 수)
      // 노드 자체를 스왑해야 수식 순서도 맞게 들어감
      if (op === '-' && node1.value < node2.value) {
        [node1, node2] = [node2, node1];
      }
      // 나눗셈의 경우 순서가 바뀌면 정수 조건이 깨질 수 있으므로 스왑하지 않음 (후보 선정시 이미 체크함)
      // 단, 덧셈/곱셈은 교환법칙 성립하므로 스왑 불필요

      // 괄호 처리 로직:
      // 자식 노드의 우선순위가 현재 연산자보다 낮으면 괄호로 감싼다.
      // 예: (1 + 2) * 3 -> '+'(1) < '*'(2) 이므로 괄호 필요
      const expr1 = node1.prec < currentPrec ? `(${node1.expr})` : node1.expr;

      // 오른쪽 항(뒤쪽 항)에 대한 괄호 처리 (뺄셈, 나눗셈 등 결합법칙 주의)
      // 예: 10 - (3 - 1) -> 괄호 필요. 단순히 우선순위가 같은 경우에도 뒤쪽 항은 괄호가 필요할 수 있음.
      // 안전하게 하기 위해: 현재 연산이 뺄셈/나눗셈이고 뒤쪽 항 우선순위가 1(덧/뺄)이면 괄호 추가
      let expr2 = node2.expr;
      if (
        node2.prec < currentPrec ||
        ((op === '-' || op === '/') && node2.prec === currentPrec)
      ) {
        expr2 = `(${node2.expr})`;
      }

      switch (op) {
        case '+':
          newValue = node1.value + node2.value;
          newExpr = `${expr1} + ${expr2}`;
          break;
        case '*':
          newValue = node1.value * node2.value;
          newExpr = `${expr1} * ${expr2}`; // 시각적으로 '×'를 원하면 변경 가능
          break;
        case '-':
          newValue = node1.value - node2.value;
          newExpr = `${expr1} - ${expr2}`;
          break;
        case '/':
          newValue = node1.value / node2.value;
          newExpr = `${expr1} / ${expr2}`; // 시각적으로 '÷'를 원하면 변경 가능
          break;
      }

      // 배열 업데이트: 사용한 두 노드 제거 후 새 노드 추가
      const removeFirst = Math.max(idx1, idx2);
      const removeSecond = Math.min(idx1, idx2);

      nodes.splice(removeFirst, 1);
      nodes.splice(removeSecond, 1);

      // 새 노드 푸시
      nodes.push({
        value: newValue,
        expr: newExpr,
        prec: currentPrec,
      });
    }

    // 최종 결과 반환
    return {
      equation: nodes[0].expr,
      answer: nodes[0].value,
    };
  }
}

export default MathQuizGenerator;
