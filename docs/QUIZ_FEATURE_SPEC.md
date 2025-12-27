# Pingu Bot - 퀴즈 컨텐츠 기능 명세서

## 프로젝트 정보

**작성일**: 2025-12-17
**버전**: 3.1 (2025-12-18 DTO 네이밍 컨벤션 수정)
**대상 Phase**: Phase 3.5 (Economy & Game Systems 확장)

## 개요

서버의 참여도를 높이고 유저들에게 재미있는 학습 경험을 제공하기 위한 자동 퀴즈 시스템입니다. Cron 스케줄러 기반으로 주기적으로 퀴즈가 생성되며, MessageCollector를 통해 정답을 수집하고 보상을 지급합니다.

### 핵심 가치

- **자동화**: Cron 기반 자동 퀴즈 생성으로 관리자 부담 최소화
- **다양성**: 숫자 퀴즈, 단어 퀴즈 등 다양한 타입의 퀴즈 지원
- **보상**: 정답자에게 코인 보상으로 경제 시스템과 연계
- **확장성**: 새로운 퀴즈 타입을 쉽게 추가할 수 있는 구조

## 사용자 스토리

### 일반 유저

- **AS A** 서버 멤버
- **I WANT TO** 주기적으로 제공되는 퀴즈에 답변하고 싶다
- **SO THAT** 코인을 획득하고 다른 유저들과 경쟁할 수 있다

### 서버 관리자

- **AS A** 서버 관리자
- **I WANT TO** 퀴즈를 전송할 채널을 설정하고 싶다
- **SO THAT** 서버 특성에 맞게 퀴즈 시스템을 운영할 수 있다

### 봇 운영자

- **AS A** 봇 운영자
- **I WANT TO** 새로운 퀴즈 타입을 쉽게 추가하고 싶다
- **SO THAT** 컨텐츠를 다양하게 확장할 수 있다

---

## 1. DB 스키마 설계

### 1.1 QuizConfig 테이블 (퀴즈 설정)

```prisma
model QuizConfig {
  guildId        String   @id @map("guild_id") @db.VarChar(20)
  quizChannelId  String   @map("quiz_channel_id") @db.VarChar(20)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // 관계
  guild          Guild    @relation(fields: [guildId], references: [guildId], onDelete: Cascade)
  quizSessions   QuizSession[]

  @@map("quiz_configs")
}
```

**필드 설명:**

- `guildId`: 길드(서버) ID (기본키, Guild와 1:1 관계)
- `quizChannelId`: 퀴즈를 전송할 채널 ID
- `updatedAt`: 설정 수정 시간

**설계 특징:**

- **QuizConfig의 존재 여부**가 퀴즈 활성화 여부를 나타냄
- `isEnabled` 플래그 대신, 레코드가 있으면 활성화, 없으면 비활성화
- 퀴즈 생성 주기와 제한 시간은 `.env`에서 전역 관리
- 1:1 관계로 guildId가 기본키 역할

### 1.2 QuizSession 테이블 (퀴즈 세션)

```prisma
model QuizSession {
  id                Int          @id @default(autoincrement())
  guildId           String       @map("guild_id") @db.VarChar(20)
  channelId         String       @map("channel_id") @db.VarChar(20)
  messageId         String?      @map("message_id") @db.VarChar(20)
  quizType          String       @map("quiz_type") @db.VarChar(30)
  question          String       @db.Text
  answer            String       @db.VarChar(200)
  hint              String?      @db.VarChar(200)
  difficulty        Int          @default(1)
  rewardAmount      Int          @map("reward_amount")
  timeLimit         Int          @map("time_limit")
  startedAt         DateTime     @default(now()) @map("started_at") @db.Timestamptz

  // 관계
  quizConfig        QuizConfig   @relation(fields: [guildId], references: [guildId], onDelete: Cascade)

  @@index([guildId])
  @@index([startedAt])
  @@map("quiz_sessions")
}
```

**필드 설명:**

- `guildId`: 길드 ID
- `channelId`: 퀴즈가 전송된 채널 ID
- `messageId`: 퀴즈 embed 메시지 ID (나중에 수정용)
- `quizType`: 퀴즈 타입 (number_math, number_sequence, word_scramble 등)
- `question`: 퀴즈 문제 텍스트
- `answer`: 정답 (문자열로 저장, 비교 시 대소문자 무시/트림 처리)
- `hint`: 퀴즈 힌트 (optional)
- `difficulty`: 퀴즈 난이도 (정수형, 기본값 1)
- `rewardAmount`: 이 퀴즈의 보상 금액
- `timeLimit`: 제한 시간(초)
- `startedAt`: 퀴즈 시작 시간

**설계 특징:**

- 퀴즈는 정답자가 나타나거나 제한시간이 만료되면 즉시 DB에서 제거됨
- 따라서 status, winnerId, winnerUsername, completedAt 필드가 불필요
- 퀴즈 종료 시 QuizSession 레코드를 DELETE 처리

### 1.4 환경 변수 (`.env`)

```bash
# 퀴즈 시스템 설정
QUIZ_GENERATION_CRON=0 */3 * * *  # 3시간마다 퀴즈 생성
QUIZ_TIME_LIMIT=1800000            # 30분 (밀리초 단위)
```

**Cron 표현식 예시:**

- `0 */3 * * *`: 3시간마다 정각 (00분)
- `0 */6 * * *`: 6시간마다 정각
- `0 9,15,21 * * *`: 매일 9시, 15시, 21시
- `*/30 * * * *`: 30분마다

---

## 2. 퀴즈 타입 추상화 설계

### 2.1 퀴즈 인터페이스

```typescript
// src/types/quiz.ts

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

/**
 * 퀴즈 타입 열거형
 */
export enum QuizType {
  NUMBER_MATH = 'number_math', // 숫자 계산 퀴즈
  NUMBER_SEQUENCE = 'number_sequence', // 수열 퀴즈
  WORD_SCRAMBLE = 'word_scramble', // 단어 섞기 퀴즈
  WORD_TRIVIA = 'word_trivia', // 상식 퀴즈
}
```

### 2.2 랜덤 유틸리티 함수

```typescript
// src/utils/random.ts

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
```

### 2.3 추상 베이스 클래스

```typescript
// src/service/quiz/generator/BaseQuizGenerator.ts

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
   * 대소문자 무시, 공백 제거 후 비교
   */
  validateAnswer(userAnswer: string, correctAnswer: string): boolean {
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    return normalizedUser === normalizedCorrect;
  }
}
```

### 2.4 구체 퀴즈 생성기 예시

#### 2.4.1 숫자 계산 퀴즈

```typescript
// src/service/quiz/generator/NumberMathQuizGenerator.ts

import { BaseQuizGenerator } from './BaseQuizGenerator';
import { QuizQuestion, QuizType } from '../../../types/quiz';
import { randomInt, randomChoice } from '../../../utils/random';

export class NumberMathQuizGenerator extends BaseQuizGenerator {
  getType(): QuizType {
    return QuizType.NUMBER_MATH;
  }

  async generate(difficulty: number): Promise<QuizQuestion> {
    const operations = ['+', '-', '*'] as const;
    const operation = randomChoice(operations);

    let num1: number;
    let num2: number;
    let answer: number;
    let question: string;

    // 난이도에 따라 숫자 범위 조정
    const range = this.getNumberRange(difficulty);

    switch (operation) {
      case '+':
        num1 = randomInt(range.min, range.max);
        num2 = randomInt(range.min, range.max);
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
        break;

      case '-':
        num1 = randomInt(range.min, range.max);
        num2 = randomInt(range.min, num1);
        answer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
        break;

      case '*':
        num1 = randomInt(2, Math.min(20, range.max / 10));
        num2 = randomInt(2, Math.min(20, range.max / 10));
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
        break;
    }

    return {
      question,
      answer: answer.toString(),
      type: this.getType(),
      difficulty,
    };
  }

  /**
   * 난이도에 따른 숫자 범위 반환
   */
  private getNumberRange(difficulty: number): { min: number; max: number } {
    if (difficulty <= 3) {
      return { min: 10, max: 50 };
    } else if (difficulty <= 6) {
      return { min: 20, max: 100 };
    } else {
      return { min: 50, max: 200 };
    }
  }
}
```

#### 2.4.2 수열 퀴즈

```typescript
// src/service/quiz/generator/NumberSequenceQuizGenerator.ts

import { BaseQuizGenerator } from './BaseQuizGenerator';
import { QuizQuestion, QuizType } from '../../../types/quiz';
import { randomInt, randomChoice } from '../../../utils/random';

export class NumberSequenceQuizGenerator extends BaseQuizGenerator {
  getType(): QuizType {
    return QuizType.NUMBER_SEQUENCE;
  }

  async generate(difficulty: number): Promise<QuizQuestion> {
    const patterns = ['arithmetic', 'geometric', 'fibonacci'] as const;
    const pattern = difficulty <= 5 ? 'arithmetic' : randomChoice(patterns);

    let sequence: number[];
    let answer: number;
    let hint: string;

    switch (pattern) {
      case 'arithmetic':
        // 등차수열
        const start = randomInt(1, 20);
        const diff = randomInt(2, difficulty + 2);
        sequence = [start, start + diff, start + 2 * diff, start + 3 * diff];
        answer = start + 4 * diff;
        hint = `공차가 ${diff}인 등차수열입니다.`;
        break;

      case 'geometric':
        // 등비수열
        const first = randomInt(2, 5);
        const ratio = randomInt(2, 3);
        sequence = [
          first,
          first * ratio,
          first * ratio ** 2,
          first * ratio ** 3,
        ];
        answer = first * ratio ** 4;
        hint = `공비가 ${ratio}인 등비수열입니다.`;
        break;

      case 'fibonacci':
        // 피보나치 수열
        sequence = [1, 1, 2, 3, 5];
        answer = 8;
        hint = '각 숫자는 앞의 두 숫자의 합입니다.';
        break;
    }

    const question = `다음 수열의 빈칸에 들어갈 숫자는?\n${sequence.join(', ')}, ?`;

    return {
      question,
      answer: answer.toString(),
      type: this.getType(),
      difficulty,
      hint,
    };
  }
}
```

#### 2.4.3 단어 섞기 퀴즈

```typescript
// src/service/quiz/generator/WordScrambleQuizGenerator.ts

import { BaseQuizGenerator } from './BaseQuizGenerator';
import { QuizQuestion, QuizType } from '../../../types/quiz';
import { randomChoice, shuffleArray } from '../../../utils/random';

export class WordScrambleQuizGenerator extends BaseQuizGenerator {
  private readonly wordBank = [
    { word: '펭귄', hint: '남극에 사는 새', difficulty: 1 },
    { word: '디스코드', hint: '우리가 지금 사용하는 앱', difficulty: 3 },
    { word: '타자기', hint: '글자를 쓰는 기계', difficulty: 2 },
    { word: '햄버거', hint: '빵 사이에 패티가 들어간 음식', difficulty: 2 },
    { word: '컴퓨터', hint: '전자계산기', difficulty: 2 },
    { word: '키보드', hint: '글자를 입력하는 장치', difficulty: 2 },
    { word: '스마트폰', hint: '손 안의 컴퓨터', difficulty: 3 },
    { word: '프로그래밍', hint: '코드를 작성하는 활동', difficulty: 5 },
    { word: '인공지능', hint: 'AI의 한글 이름', difficulty: 3 },
    { word: '데이터베이스', hint: '데이터를 저장하는 시스템', difficulty: 5 },
  ];

  getType(): QuizType {
    return QuizType.WORD_SCRAMBLE;
  }

  async generate(difficulty: number): Promise<QuizQuestion> {
    // 난이도에 맞는 단어 필터링
    const candidates = this.wordBank.filter(
      (w) => Math.abs(w.difficulty - difficulty) <= 2
    );

    const selected = randomChoice(
      candidates.length > 0 ? candidates : this.wordBank
    );
    const scrambled = this.scrambleWord(selected.word);

    return {
      question: `섞인 글자를 올바른 순서로 맞춰보세요!\n**${scrambled}**`,
      answer: selected.word,
      type: this.getType(),
      difficulty,
      hint: selected.hint,
    };
  }

  /**
   * 단어를 무작위로 섞기
   */
  private scrambleWord(word: string): string {
    const chars = word.split('');
    const shuffled = shuffleArray(chars);

    // 원래 단어와 같으면 다시 섞기
    if (shuffled.join('') === word && chars.length > 1) {
      return this.scrambleWord(word);
    }

    return shuffled.join('');
  }
}
```

### 2.5 퀴즈 생성기 팩토리

```typescript
// src/service/quiz/generator/QuizGeneratorFactory.ts

import { IQuizGenerator } from '../../../types/quiz';
import { QuizType } from '../../../types/quiz';
import { NumberMathQuizGenerator } from './NumberMathQuizGenerator';
import { NumberSequenceQuizGenerator } from './NumberSequenceQuizGenerator';
import { WordScrambleQuizGenerator } from './WordScrambleQuizGenerator';
import { randomChoice } from '../../../utils/random';

/**
 * 퀴즈 생성기 팩토리
 * 퀴즈 타입에 따라 적절한 생성기를 반환
 */
export class QuizGeneratorFactory {
  private static generators: Map<QuizType, IQuizGenerator> = new Map([
    [QuizType.NUMBER_MATH, new NumberMathQuizGenerator()],
    [QuizType.NUMBER_SEQUENCE, new NumberSequenceQuizGenerator()],
    [QuizType.WORD_SCRAMBLE, new WordScrambleQuizGenerator()],
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
```

---

## 3. Layer별 구현 계획

### 3.1 DAO Layer (Database Access)

#### 3.1.1 IQuizConfigDAO.ts

```typescript
// src/database/dao/IQuizConfigDAO.ts

import { QuizConfig, Prisma } from '@prisma/client';

export interface IQuizConfigDAO {
  /**
   * 길드 ID로 퀴즈 설정 조회
   */
  findByGuildId(guildId: string): Promise<QuizConfig | null>;

  /**
   * 퀴즈 설정 생성
   */
  create(data: Prisma.QuizConfigCreateInput): Promise<QuizConfig>;

  /**
   * 퀴즈 설정 업데이트 (채널 변경)
   */
  update(
    guildId: string,
    data: Prisma.QuizConfigUpdateInput
  ): Promise<QuizConfig>;

  /**
   * 퀴즈 설정 삭제 (비활성화)
   */
  delete(guildId: string): Promise<void>;

  /**
   * 모든 퀴즈 설정 조회 (활성화된 모든 길드)
   */
  findAll(): Promise<QuizConfig[]>;
}
```

#### 3.1.2 IQuizSessionDAO.ts

```typescript
// src/database/dao/IQuizSessionDAO.ts

import { QuizSession, Prisma } from '@prisma/client';

export interface IQuizSessionDAO {
  /**
   * 퀴즈 세션 생성
   */
  create(data: Prisma.QuizSessionCreateInput): Promise<QuizSession>;

  /**
   * ID로 퀴즈 세션 조회
   */
  findById(id: number): Promise<QuizSession | null>;

  /**
   * 길드의 활성화된 퀴즈 세션 조회 (가장 최근)
   */
  findActiveByGuildId(guildId: string): Promise<QuizSession | null>;

  /**
   * 퀴즈 세션 삭제 (정답자가 나왔거나 시간 만료 시)
   */
  delete(id: number): Promise<void>;

  /**
   * messageId 업데이트
   */
  updateMessageId(id: number, messageId: string): Promise<QuizSession>;

  /**
   * 만료된 퀴즈 세션 조회 및 삭제
   * @returns 삭제된 세션 수
   */
  deleteExpiredSessions(): Promise<number>;

  /**
   * 특정 길드의 퀴즈 세션 기록 조회 (최근 N개)
   */
  findRecentByGuildId(guildId: string, limit: number): Promise<QuizSession[]>;
}
```

### 3.2 Repository Layer

#### 3.2.1 IQuizRepository.ts

```typescript
// src/repository/IQuizRepository.ts

import { QuizConfig, QuizSession } from '@prisma/client';

export interface IQuizRepository {
  /**
   * 길드의 퀴즈 설정 조회
   */
  findConfig(guildId: string): Promise<QuizConfig | null>;

  /**
   * 퀴즈 채널 설정
   */
  setQuizChannel(guildId: string, channelId: string): Promise<QuizConfig>;

  /**
   * 퀴즈 채널 업데이트
   */
  updateQuizChannel(guildId: string, channelId: string): Promise<QuizConfig>;

  /**
   * 퀴즈 비활성화 (QuizConfig 삭제)
   */
  disableQuiz(guildId: string): Promise<void>;

  /**
   * 모든 활성화된 퀴즈 설정 조회
   */
  findAllActiveConfigs(): Promise<QuizConfig[]>;

  /**
   * 퀴즈 세션 생성
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
   */
  findSessionById(id: number): Promise<QuizSession | null>;

  /**
   * 길드의 활성화된 퀴즈 세션 조회
   */
  findActiveSession(guildId: string): Promise<QuizSession | null>;

  /**
   * 퀴즈 정답 처리 (트랜잭션)
   * - User 코인 지급
   * - QuizSession 삭제
   * @returns 지급된 코인 금액
   */
  completeQuiz(
    quizSessionId: number,
    userId: string,
    username: string
  ): Promise<number>;

  /**
   * 퀴즈 세션 삭제
   */
  deleteSession(id: number): Promise<void>;

  /**
   * 만료된 퀴즈 세션 정리 (배치)
   * @returns 삭제된 세션 수
   */
  cleanupExpiredSessions(): Promise<number>;

  /**
   * messageId 업데이트
   */
  updateSessionMessageId(id: number, messageId: string): Promise<QuizSession>;
}
```

### 3.3 Service Layer

#### 3.3.1 QuizService (핵심 비즈니스 로직)

```typescript
// src/service/quiz/quiz.service.ts

import { IQuizRepository } from '../../repository/IQuizRepository';
import { QuizRepository } from '../../repository/impl/QuizRepository';
import { QuizGeneratorFactory } from './generator/QuizGeneratorFactory';
import { QuizCreateReqDto } from './dto/request/QuizCreateReqDto';
import { QuizAnswerSubmitReqDto } from './dto/request/QuizAnswerSubmitReqDto';
import { QuizChannelSetReqDto } from './dto/request/QuizChannelSetReqDto';
import { QuizCreateResDto } from './dto/response/QuizCreateResDto';
import { QuizAnswerSubmitResDto } from './dto/response/QuizAnswerSubmitResDto';
import { QuizChannelSetResDto } from './dto/response/QuizChannelSetResDto';
import {
  QuizNotFoundError,
  QuizAlreadyActiveError,
  QuizChannelNotSetError,
} from '../../errors/game/quiz';
import { logger } from '../../utils/logger';
import { config } from '../../config/config';

/**
 * Quiz Service
 * 퀴즈 생성, 검증, 보상 지급 등 비즈니스 로직 처리
 */
export class QuizService {
  private readonly DEFAULT_DIFFICULTY = 3; // 기본 난이도
  private readonly DEFAULT_REWARD_AMOUNT = 100; // 기본 보상 (PC)

  constructor(private quizRepository: IQuizRepository = new QuizRepository()) {}

  /**
   * 새 퀴즈 생성
   */
  async createQuiz(reqDto: QuizCreateReqDto): Promise<QuizCreateResDto> {
    const { guildId, quizType } = reqDto;

    // 1. 퀴즈 설정 조회
    const quizConfig = await this.quizRepository.findConfig(guildId);

    // 비즈니스 로직: 퀴즈 설정이 없거나 채널이 설정되지 않음
    if (!quizConfig || !quizConfig.quizChannelId) {
      throw new QuizChannelNotSetError('퀴즈 채널이 설정되지 않았습니다.');
    }

    // 비즈니스 로직: 이미 활성화된 퀴즈가 있는지 확인
    const activeSession = await this.quizRepository.findActiveSession(guildId);
    if (activeSession) {
      throw new QuizAlreadyActiveError('이미 진행 중인 퀴즈가 있습니다.');
    }

    // 2. 퀴즈 생성
    const generator = quizType
      ? QuizGeneratorFactory.getGenerator(quizType)
      : QuizGeneratorFactory.getRandomGenerator();

    const quizQuestion = await generator.generate(this.DEFAULT_DIFFICULTY);

    // 3. 퀴즈 세션 생성
    const session = await this.quizRepository.createSession({
      guildId,
      channelId: quizConfig.quizChannelId,
      quizType: quizQuestion.type,
      question: quizQuestion.question,
      answer: quizQuestion.answer,
      hint: quizQuestion.hint,
      difficulty: quizQuestion.difficulty,
      rewardAmount: this.DEFAULT_REWARD_AMOUNT,
      timeLimit: Math.floor(config.quiz.timeLimit / 1000), // 밀리초 -> 초
    });

    logger.info(
      `퀴즈 생성 완료: Guild ${guildId}, Session ${session.id}, Type ${quizQuestion.type}`
    );

    // Response DTO 생성
    return new QuizCreateResDto({
      session: {
        id: session.id,
        quizType: session.quizType,
        question: session.question,
        hint: session.hint,
        difficulty: session.difficulty,
        timeLimit: session.timeLimit,
        rewardAmount: session.rewardAmount,
        answer: session.answer,
      },
      channelId: quizConfig.quizChannelId,
    });
  }

  /**
   * 정답 제출 및 검증
   */
  async submitAnswer(
    reqDto: QuizAnswerSubmitReqDto
  ): Promise<QuizAnswerSubmitResDto> {
    const { quizSessionId, userId, username, answer } = reqDto;

    // 1. 퀴즈 세션 조회
    const session = await this.quizRepository.findSessionById(quizSessionId);
    if (!session) {
      throw new QuizNotFoundError('퀴즈 세션을 찾을 수 없습니다.');
    }

    // 비즈니스 로직: 제한 시간 확인
    const now = new Date();
    const elapsed = (now.getTime() - session.startedAt.getTime()) / 1000;
    if (elapsed > session.timeLimit) {
      // 만료된 퀴즈 삭제
      await this.quizRepository.deleteSession(quizSessionId);
      throw new QuizNotFoundError('퀴즈 제한 시간이 초과되었습니다.');
    }

    // 2. 정답 검증
    const generator = QuizGeneratorFactory.getGenerator(session.quizType);
    const isCorrect = generator.validateAnswer(answer, session.answer);

    if (!isCorrect) {
      // 오답 - 아무 처리도 하지 않음
      return new QuizAnswerSubmitResDto({
        isCorrect: false,
        coinsEarned: 0,
      });
    }

    // 3. 정답 처리 (트랜잭션: 코인 지급 + 세션 삭제)
    const coinsEarned = await this.quizRepository.completeQuiz(
      quizSessionId,
      userId,
      username
    );

    logger.info(
      `퀴즈 정답: Session ${quizSessionId}, User ${userId}, Coins ${coinsEarned}`
    );

    // Response DTO 생성
    return new QuizAnswerSubmitResDto({
      isCorrect: true,
      correctAnswer: session.answer,
      coinsEarned,
    });
  }

  /**
   * 퀴즈 채널 설정
   */
  async setQuizChannel(
    reqDto: QuizChannelSetReqDto
  ): Promise<QuizChannelSetResDto> {
    const { guildId, channelId } = reqDto;

    // 기존 설정 확인
    const existingConfig = await this.quizRepository.findConfig(guildId);

    let config;
    if (existingConfig) {
      // 업데이트
      config = await this.quizRepository.updateQuizChannel(guildId, channelId);
    } else {
      // 새로 생성
      config = await this.quizRepository.setQuizChannel(guildId, channelId);
    }

    logger.info(`퀴즈 채널 설정: Guild ${guildId}, Channel ${channelId}`);

    return new QuizChannelSetResDto({
      guildId: config.guildId,
      quizChannelId: config.quizChannelId,
    });
  }

  /**
   * 퀴즈 비활성화
   */
  async disableQuiz(guildId: string): Promise<void> {
    await this.quizRepository.disableQuiz(guildId);
    logger.info(`퀴즈 비활성화: Guild ${guildId}`);
  }

  /**
   * 퀴즈 설정 조회
   */
  async getConfig(guildId: string): Promise<QuizConfig | null> {
    return await this.quizRepository.findConfig(guildId);
  }

  /**
   * 퀴즈 세션 만료 처리
   */
  async expireSession(quizSessionId: number): Promise<void> {
    const session = await this.quizRepository.findSessionById(quizSessionId);
    if (session) {
      await this.quizRepository.deleteSession(quizSessionId);
      logger.info(`퀴즈 만료: Session ${quizSessionId}`);
    }
  }
}
```

### 3.4 Embed Layer

#### 3.4.1 QuizEmbed.ts

```typescript
// src/embed/quiz/QuizEmbed.ts

import { EmbedBuilder } from 'discord.js';

/**
 * 퀴즈 문제 Embed
 */
export class QuizEmbed {
  static create(props: {
    question: string;
    quizType: string;
    difficulty: number;
    hint?: string;
    timeLimit: number;
    rewardAmount: number;
  }): EmbedBuilder {
    const { question, quizType, difficulty, hint, timeLimit, rewardAmount } =
      props;

    const difficultyStars = '⭐'.repeat(Math.min(difficulty, 5));

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🧩 퀴즈 타임!')
      .setDescription(question)
      .addFields(
        { name: '⏱️ 제한 시간', value: `${timeLimit}초`, inline: true },
        { name: '💰 보상', value: `${rewardAmount} PC`, inline: true },
        { name: '📝 퀴즈 타입', value: quizType, inline: true },
        { name: '🎯 난이도', value: difficultyStars, inline: true }
      )
      .setFooter({ text: '채팅에 답을 입력하세요!' })
      .setTimestamp();

    if (hint) {
      embed.addFields({ name: '💡 힌트', value: hint });
    }

    return embed;
  }
}

/**
 * 정답 Embed
 */
export class QuizCorrectEmbed {
  static create(props: {
    winner: string;
    answer: string;
    coinsEarned: number;
  }): EmbedBuilder {
    const { winner, answer, coinsEarned } = props;

    return new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ 정답입니다!')
      .setDescription(`**${winner}**님이 정답을 맞추셨습니다!`)
      .addFields(
        { name: '정답', value: answer, inline: true },
        { name: '보상', value: `${coinsEarned} PC`, inline: true }
      )
      .setTimestamp();
  }
}

/**
 * 퀴즈 만료 Embed
 */
export class QuizExpiredEmbed {
  static create(props: { answer: string }): EmbedBuilder {
    const { answer } = props;

    return new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⏰ 시간 초과!')
      .setDescription('제한 시간 내에 정답자가 없었습니다.')
      .addFields({ name: '정답', value: answer })
      .setTimestamp();
  }
}
```

### 3.5 Command Layer

#### 3.5.1 quiz-config.ts (관리자 전용)

```typescript
// src/command/admin/quiz-config.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import { Command } from '../../types/command';
import { QuizService } from '../../service/quiz/quiz.service';
import { QuizChannelSetReqDto } from '../../service/quiz/dto/request/QuizChannelSetReqDto';
import { logger } from '../../utils/logger';
import { PinguBot } from '../../bot';
import { config } from '../../config/config';

/**
 * Quiz Config Command (관리자 전용)
 * 퀴즈 설정을 관리하는 커맨드
 */
export default class QuizConfigCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('quiz-config')
    .setDescription('퀴즈 설정을 관리합니다 (관리자 전용)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('퀴즈 채널을 설정합니다')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('퀴즈를 전송할 채널')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('disable')
        .setDescription('퀴즈 시스템을 비활성화합니다')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('view').setDescription('현재 퀴즈 설정을 확인합니다')
    );

  category = 'admin' as const;
  cooldown = 5;

  private quizService: QuizService;

  constructor() {
    this.quizService = new QuizService();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    try {
      switch (subcommand) {
        case 'set':
          await this.handleSet(interaction, guildId);
          break;
        case 'disable':
          await this.handleDisable(interaction, guildId);
          break;
        case 'view':
          await this.handleView(interaction, guildId);
          break;
      }
    } catch (error) {
      logger.error('퀴즈 설정 실패:', error);
      await interaction.reply({
        content: `❌ 설정 중 오류가 발생했습니다: ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  private async handleSet(
    interaction: ChatInputCommandInteraction,
    guildId: string
  ): Promise<void> {
    const channel = interaction.options.getChannel(
      'channel',
      true
    ) as TextChannel;

    const reqDto = new QuizChannelSetReqDto({
      guildId,
      channelId: channel.id,
    });

    await this.quizService.setQuizChannel(reqDto);

    // QuizScheduler에게 변경 알림
    const bot = interaction.client as PinguBot;
    await bot.quizScheduler.refreshGuildConfig(guildId);

    await interaction.reply({
      content: `✅ 퀴즈 채널이 <#${channel.id}>로 설정되었습니다.\n퀴즈는 ${config.quiz.generationCron} 주기로 생성됩니다.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleDisable(
    interaction: ChatInputCommandInteraction,
    guildId: string
  ): Promise<void> {
    await this.quizService.disableQuiz(guildId);

    // QuizScheduler에게 변경 알림
    const bot = interaction.client as PinguBot;
    await bot.quizScheduler.refreshGuildConfig(guildId);

    await interaction.reply({
      content: '✅ 퀴즈 시스템이 비활성화되었습니다.',
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleView(
    interaction: ChatInputCommandInteraction,
    guildId: string
  ): Promise<void> {
    const quizConfig = await this.quizService.getConfig(guildId);

    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('⚙️ 퀴즈 설정')
      .setTimestamp();

    if (quizConfig) {
      embed.addFields(
        {
          name: '상태',
          value: '✅ 활성화',
          inline: true,
        },
        {
          name: '퀴즈 채널',
          value: `<#${quizConfig.quizChannelId}>`,
          inline: true,
        },
        {
          name: '생성 주기',
          value: `\`${config.quiz.generationCron}\``,
          inline: true,
        },
        {
          name: '제한 시간',
          value: `${Math.floor(config.quiz.timeLimit / 1000)}초`,
          inline: true,
        },
        {
          name: '보상',
          value: '100 PC',
          inline: true,
        }
      );
    } else {
      embed.setDescription(
        '❌ 퀴즈가 비활성화되어 있습니다.\n`/quiz-config set` 명령어로 설정하세요.'
      );
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
```

#### 3.5.2 quiz.ts (일반 유저용 - 수동 퀴즈 시작)

```typescript
// src/command/game/quiz.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types/command';
import { QuizService } from '../../service/quiz/quiz.service';
import { QuizCreateReqDto } from '../../service/quiz/dto/request/QuizCreateReqDto';
import { QuizAnswerSubmitReqDto } from '../../service/quiz/dto/request/QuizAnswerSubmitReqDto';
import {
  QuizEmbed,
  QuizCorrectEmbed,
  QuizExpiredEmbed,
} from '../../embed/quiz/QuizEmbed';
import { QuizType } from '../../types/quiz';
import { logger } from '../../utils/logger';

/**
 * Quiz Command
 * 수동으로 퀴즈를 시작하는 커맨드 (Cron과 별개)
 */
export default class QuizCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('새 퀴즈를 시작합니다')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('퀴즈 타입 (선택하지 않으면 랜덤)')
        .addChoices(
          { name: '숫자 계산', value: QuizType.NUMBER_MATH },
          { name: '수열', value: QuizType.NUMBER_SEQUENCE },
          { name: '단어 섞기', value: QuizType.WORD_SCRAMBLE }
        )
        .setRequired(false)
    );

  category = 'game' as const;
  cooldown = 60; // 1분 쿨다운

  private quizService: QuizService;

  constructor() {
    this.quizService = new QuizService();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const quizType = interaction.options.getString('type') as QuizType | null;

    try {
      // Request DTO 생성
      const reqDto = new QuizCreateReqDto({
        guildId,
        quizType: quizType || undefined,
      });

      // Service 호출
      const quizRes = await this.quizService.createQuiz(reqDto);

      // Embed 생성
      const embed = QuizEmbed.create({
        question: quizRes.session.question,
        quizType: quizRes.session.quizType,
        difficulty: quizRes.session.difficulty,
        hint: quizRes.session.hint,
        timeLimit: quizRes.session.timeLimit,
        rewardAmount: quizRes.session.rewardAmount,
      });

      // 퀴즈 전송
      await interaction.reply({ embeds: [embed] });

      // MessageCollector 시작
      await this.startQuizCollector(
        interaction,
        quizRes.session.id,
        quizRes.session.timeLimit,
        quizRes.session.answer
      );
    } catch (error) {
      logger.error('퀴즈 생성 실패:', error);
      await interaction.reply({
        content: `❌ ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  /**
   * MessageCollector 시작
   */
  private async startQuizCollector(
    interaction: ChatInputCommandInteraction,
    quizSessionId: number,
    timeLimit: number,
    correctAnswer: string
  ): Promise<void> {
    const channel = interaction.channel as TextChannel;

    // MessageCollector 생성
    const collector = channel.createMessageCollector({
      filter: (m) => !m.author.bot,
      time: timeLimit * 1000,
    });

    collector.on('collect', async (message) => {
      try {
        // 정답 제출
        const reqDto = new QuizAnswerSubmitReqDto({
          quizSessionId,
          userId: message.author.id,
          username: message.author.username,
          answer: message.content,
        });

        const result = await this.quizService.submitAnswer(reqDto);

        if (result.isCorrect) {
          // 정답!
          await message.react('✅');

          const embed = QuizCorrectEmbed.create({
            winner: message.author.username,
            answer: result.correctAnswer!,
            coinsEarned: result.coinsEarned,
          });

          await channel.send({ embeds: [embed] });

          // Collector 종료
          collector.stop('correct_answer');
        } else {
          // 오답
          await message.react('❌');
        }
      } catch (error) {
        // 퀴즈가 이미 종료되었거나 에러 발생
        if (error.message.includes('찾을 수 없습니다')) {
          collector.stop('quiz_ended');
        } else {
          logger.error('정답 제출 처리 실패:', error);
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        // 시간 만료
        try {
          await this.quizService.expireSession(quizSessionId);
          const embed = QuizExpiredEmbed.create({ answer: correctAnswer });
          await channel.send({ embeds: [embed] });
        } catch (error) {
          logger.error('퀴즈 만료 처리 실패:', error);
        }
      }
    });
  }
}
```

---

## 4. Cron 스케줄러 통합 방안

### 4.1 라이브러리 선택: `node-cron`

**이유:**

- 가벼운 의존성
- Cron 표현식 지원
- 동적 스케줄링 가능
- 타임존 지원

**설치:**

```bash
yarn add node-cron
yarn add -D @types/node-cron
```

### 4.2 QuizScheduler 클래스

```typescript
// src/scheduler/QuizScheduler.ts

import cron from 'node-cron';
import { QuizService } from '../service/quiz/quiz.service';
import { IQuizRepository } from '../repository/IQuizRepository';
import { QuizRepository } from '../repository/impl/QuizRepository';
import { QuizCreateReqDto } from '../service/quiz/dto/request/QuizCreateReqDto';
import { QuizAnswerSubmitReqDto } from '../service/quiz/dto/request/QuizAnswerSubmitReqDto';
import {
  QuizEmbed,
  QuizCorrectEmbed,
  QuizExpiredEmbed,
} from '../embed/quiz/QuizEmbed';
import { logger } from '../utils/logger';
import { Client, TextChannel } from 'discord.js';
import { config } from '../config/config';

/**
 * 퀴즈 스케줄러
 * Cron 기반 자동 퀴즈 생성 및 전송
 */
export class QuizScheduler {
  private quizService: QuizService;
  private quizRepository: IQuizRepository;
  private mainTask: cron.ScheduledTask | null = null;
  private cleanupTask: cron.ScheduledTask | null = null;

  constructor(
    private client: Client,
    quizService?: QuizService,
    quizRepository?: IQuizRepository
  ) {
    this.quizService = quizService || new QuizService();
    this.quizRepository = quizRepository || new QuizRepository();
  }

  /**
   * 스케줄러 초기화
   * - 단일 Cron Job 등록 (모든 길드에 대해)
   * - 만료된 퀴즈 정리 작업 등록
   */
  async initialize(): Promise<void> {
    logger.info('QuizScheduler 초기화 중...');

    // 메인 퀴즈 생성 작업 스케줄링
    this.scheduleMainQuizJob();

    // 만료된 퀴즈 정리 작업 (5분마다)
    this.scheduleCleanup();

    logger.info('QuizScheduler 초기화 완료');
  }

  /**
   * 메인 퀴즈 생성 작업 스케줄링
   * 환경 변수에서 가져온 Cron 표현식 사용
   */
  private scheduleMainQuizJob(): void {
    const cronExpression = config.quiz.generationCron;

    // Cron 표현식 검증
    if (!cron.validate(cronExpression)) {
      logger.error(`유효하지 않은 Cron 표현식: ${cronExpression}`);
      return;
    }

    // Cron 작업 생성
    this.mainTask = cron.schedule(cronExpression, async () => {
      await this.executeQuizJobForAllGuilds();
    });

    logger.info(`메인 퀴즈 작업 스케줄링 완료: ${cronExpression}`);
  }

  /**
   * 모든 활성화된 길드에 대해 퀴즈 생성
   */
  private async executeQuizJobForAllGuilds(): Promise<void> {
    try {
      logger.info('퀴즈 생성 작업 시작 (모든 길드)');

      // 활성화된 모든 QuizConfig 조회
      const configs = await this.quizRepository.findAllActiveConfigs();

      if (configs.length === 0) {
        logger.info('활성화된 퀴즈 설정이 없습니다.');
        return;
      }

      // 각 길드에 대해 퀴즈 생성
      for (const quizConfig of configs) {
        await this.executeQuizJobForGuild(quizConfig.guildId);
      }

      logger.info(`퀴즈 생성 작업 완료: ${configs.length}개 길드`);
    } catch (error) {
      logger.error('퀴즈 생성 작업 실패:', error);
    }
  }

  /**
   * 특정 길드에 대해 퀴즈 생성
   */
  private async executeQuizJobForGuild(guildId: string): Promise<void> {
    try {
      logger.info(`퀴즈 생성 시작: Guild ${guildId}`);

      // 1. 퀴즈 생성
      const reqDto = new QuizCreateReqDto({ guildId });
      const quizRes = await this.quizService.createQuiz(reqDto);

      // 2. Discord 채널에 전송
      const channel = (await this.client.channels.fetch(
        quizRes.channelId
      )) as TextChannel;

      if (!channel) {
        logger.error(`퀴즈 채널을 찾을 수 없음: ${quizRes.channelId}`);
        return;
      }

      const embed = QuizEmbed.create({
        question: quizRes.session.question,
        quizType: quizRes.session.quizType,
        difficulty: quizRes.session.difficulty,
        hint: quizRes.session.hint,
        timeLimit: quizRes.session.timeLimit,
        rewardAmount: quizRes.session.rewardAmount,
      });

      const message = await channel.send({ embeds: [embed] });

      // 3. MessageCollector 시작
      await this.startQuizCollector(
        channel,
        quizRes.session.id,
        quizRes.session.timeLimit,
        quizRes.session.answer
      );

      // 4. QuizSession에 messageId 업데이트
      await this.quizRepository.updateSessionMessageId(
        quizRes.session.id,
        message.id
      );

      logger.info(
        `퀴즈 전송 완료: Guild ${guildId}, Session ${quizRes.session.id}`
      );
    } catch (error) {
      logger.error(`퀴즈 생성 실패: Guild ${guildId}`, error);
    }
  }

  /**
   * MessageCollector 시작
   */
  private async startQuizCollector(
    channel: TextChannel,
    quizSessionId: number,
    timeLimit: number,
    correctAnswer: string
  ): Promise<void> {
    const collector = channel.createMessageCollector({
      filter: (m) => !m.author.bot,
      time: timeLimit * 1000,
    });

    collector.on('collect', async (message) => {
      try {
        const reqDto = new QuizAnswerSubmitReqDto({
          quizSessionId,
          userId: message.author.id,
          username: message.author.username,
          answer: message.content,
        });

        const result = await this.quizService.submitAnswer(reqDto);

        if (result.isCorrect) {
          await message.react('✅');

          const embed = QuizCorrectEmbed.create({
            winner: message.author.username,
            answer: result.correctAnswer!,
            coinsEarned: result.coinsEarned,
          });

          await channel.send({ embeds: [embed] });
          collector.stop('correct_answer');
        } else {
          await message.react('❌');
        }
      } catch (error) {
        if (error.message.includes('찾을 수 없습니다')) {
          collector.stop('quiz_ended');
        } else {
          logger.error('정답 제출 처리 실패:', error);
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        try {
          await this.quizService.expireSession(quizSessionId);
          const embed = QuizExpiredEmbed.create({ answer: correctAnswer });
          await channel.send({ embeds: [embed] });
        } catch (error) {
          logger.error('퀴즈 만료 처리 실패:', error);
        }
      }
    });
  }

  /**
   * 길드 설정 변경 시 호출 (명령어에서 사용)
   */
  async refreshGuildConfig(guildId: string): Promise<void> {
    logger.info(`QuizScheduler: 길드 설정 새로고침 - ${guildId}`);
    // 단일 Cron Job 방식이므로 별도 작업 불필요
    // 다음 스케줄 실행 시 자동으로 새로운 설정 반영됨
  }

  /**
   * 만료된 퀴즈 정리 작업 스케줄링
   */
  private scheduleCleanup(): void {
    // 5분마다 실행
    this.cleanupTask = cron.schedule('*/5 * * * *', async () => {
      try {
        const deletedCount = await this.quizRepository.cleanupExpiredSessions();
        if (deletedCount > 0) {
          logger.info(`만료된 퀴즈 세션 정리: ${deletedCount}개`);
        }
      } catch (error) {
        logger.error('퀴즈 정리 작업 실패:', error);
      }
    });

    logger.info('퀴즈 정리 작업 스케줄링 완료 (5분마다)');
  }

  /**
   * 스케줄러 종료
   */
  shutdown(): void {
    logger.info('QuizScheduler 종료 중...');

    // 메인 작업 중지
    if (this.mainTask) {
      this.mainTask.stop();
      this.mainTask = null;
    }

    // 정리 작업 중지
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask = null;
    }

    logger.info('QuizScheduler 종료 완료');
  }
}
```

### 4.3 PinguBot에 QuizScheduler 통합

```typescript
// src/bot.ts

import { QuizScheduler } from './scheduler/QuizScheduler';

export class PinguBot extends Client {
  // ... 기존 코드

  public quizScheduler: QuizScheduler;

  constructor() {
    super({
      /* ... */
    });

    // ... 기존 코드
    this.quizScheduler = new QuizScheduler(this);
  }

  public async start(): Promise<void> {
    try {
      // ... 기존 코드

      await this.login(config.discord.token);

      // 로그인 후 QuizScheduler 초기화
      await this.quizScheduler.initialize();

      logger.info('Pingu Bot started successfully!');
    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  // Graceful shutdown
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Pingu Bot...');

    // QuizScheduler 종료
    this.quizScheduler.shutdown();

    // Bot 종료
    this.destroy();

    logger.info('Pingu Bot shutdown complete');
  }
}
```

### 4.4 Config 파일에 환경 변수 추가

```typescript
// src/config/config.ts

import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface Config {
  discord: {
    token: string;
    clientId: string;
  };
  database: {
    path: string;
  };
  apis: {
    unsplashAccessKey: string;
  };
  quiz: {
    generationCron: string;
    timeLimit: number; // 밀리초
  };
  environment: 'development' | 'production';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

function validateEnv(): void {
  const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

validateEnv();

export const config: Config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
  database: {
    path:
      process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'pingu.db'),
  },
  apis: {
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  },
  quiz: {
    generationCron: process.env.QUIZ_GENERATION_CRON || '0 */3 * * *', // 기본값: 3시간마다
    timeLimit: parseInt(process.env.QUIZ_TIME_LIMIT || '1800000'), // 기본값: 30분
  },
  environment:
    (process.env.NODE_ENV as 'development' | 'production') || 'development',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
};
```

---

## 5. 에러 클래스 설계

### 5.1 에러 클래스 위치 및 네이밍

기존 에러 패턴에 따라 `src/errors/game/quiz/` 디렉토리에 배치:

```typescript
// src/errors/game/quiz/QuizNotFoundError.ts

import { BotError } from '../../base/BotError';

/**
 * 퀴즈 세션을 찾을 수 없는 오류
 */
export class QuizNotFoundError extends BotError {
  constructor(message: string) {
    super(message);
  }
}
```

```typescript
// src/errors/game/quiz/QuizAlreadyActiveError.ts

import { BotError } from '../../base/BotError';

/**
 * 이미 활성화된 퀴즈가 존재하는 오류
 */
export class QuizAlreadyActiveError extends BotError {
  constructor(message: string) {
    super(message);
  }
}
```

```typescript
// src/errors/game/quiz/QuizChannelNotSetError.ts

import { BotError } from '../../base/BotError';

/**
 * 퀴즈 채널이 설정되지 않은 오류
 */
export class QuizChannelNotSetError extends BotError {
  constructor(message: string) {
    super(message);
  }
}
```

### 5.2 Barrel Export

```typescript
// src/errors/game/quiz/index.ts

/**
 * Quiz 도메인 오류 Barrel Export
 */
export { QuizNotFoundError } from './QuizNotFoundError';
export { QuizAlreadyActiveError } from './QuizAlreadyActiveError';
export { QuizChannelNotSetError } from './QuizChannelNotSetError';
```

---

## 6. 구현 순서 및 파일 구조

### 6.1 파일 구조

```
src/
├── types/
│   └── quiz.ts                              # 퀴즈 타입 정의
│
├── errors/
│   └── game/
│       └── quiz/
│           ├── QuizNotFoundError.ts
│           ├── QuizAlreadyActiveError.ts
│           ├── QuizChannelNotSetError.ts
│           └── index.ts                     # Barrel export
│
├── utils/
│   └── random.ts                            # 랜덤 유틸리티 함수
│
├── database/
│   ├── dao/
│   │   ├── IQuizConfigDAO.ts
│   │   ├── IQuizSessionDAO.ts
│   │   └── impl/
│   │       ├── QuizConfigDAO.ts
│   │       └── QuizSessionDAO.ts
│
├── repository/
│   ├── IQuizRepository.ts
│   └── impl/
│       └── QuizRepository.ts
│
├── service/
│   └── quiz/
│       ├── quiz.service.ts
│       ├── generator/
│       │   ├── BaseQuizGenerator.ts
│       │   ├── QuizGeneratorFactory.ts
│       │   ├── NumberMathQuizGenerator.ts
│       │   ├── NumberSequenceQuizGenerator.ts
│       │   └── WordScrambleQuizGenerator.ts
│       └── dto/
│           ├── request/
│           │   ├── QuizCreateReqDto.ts
│           │   ├── QuizAnswerSubmitReqDto.ts
│           │   └── QuizChannelSetReqDto.ts
│           └── response/
│               ├── QuizCreateResDto.ts
│               ├── QuizAnswerSubmitResDto.ts
│               └── QuizChannelSetResDto.ts
│
├── embed/
│   └── quiz/
│       └── QuizEmbed.ts (3개 Embed 통합)
│
├── command/
│   ├── admin/
│   │   └── quiz-config.ts
│   └── game/
│       └── quiz.ts
│
├── scheduler/
│   └── QuizScheduler.ts
│
├── config/
│   └── config.ts                            # 환경 변수 추가
│
└── bot.ts                                    # QuizScheduler 통합
```

**파일 수 요약:**

- 타입: 1개
- 에러: 4개 (3 에러 클래스 + 1 barrel export)
- 유틸리티: 1개
- DAO: 4개 (2 인터페이스 + 2 구현)
- Repository: 2개 (1 인터페이스 + 1 구현)
- Service: 1개
- DTO: 6개 (3 Request + 3 Response)
- Generator: 5개 (1 Base + 1 Factory + 3 구체 클래스)
- Embed: 1개 (3개 클래스 통합)
- Command: 2개
- Scheduler: 1개
- Config: 1개 (기존 파일 수정)
- Bot: 1개 (기존 파일 수정)

**총 29개 파일** (2개 기존 파일 수정 포함)

### 6.2 단계별 구현 순서

#### Phase 1: 기초 인프라 (2일)

**1일차: 데이터베이스 레이어 & 유틸리티**

1. 랜덤 유틸리티 함수 작성
   - `utils/random.ts`
2. Prisma Schema 작성
   - `prisma/schema.prisma`에 QuizConfig, QuizSession 추가
   - Guild 모델에 관계 추가
3. Migration 실행
   - `yarn prisma:migrate`
4. DAO 인터페이스 및 구현
   - `IQuizConfigDAO.ts` + `QuizConfigDAO.ts`
   - `IQuizSessionDAO.ts` + `QuizSessionDAO.ts`

**2일차: Repository & 타입 & 에러**

1. Repository 인터페이스 작성
   - `IQuizRepository.ts`
2. Repository 구현
   - `QuizRepository.ts`
   - 트랜잭션 로직 구현 (`completeQuiz`)
3. 타입 정의
   - `types/quiz.ts` (IQuizGenerator, QuizQuestion, QuizType)
4. 에러 클래스 작성
   - `errors/game/quiz/*.ts`

#### Phase 2: 퀴즈 생성기 (2일)

**3일차: 추상화 및 기본 생성기**

1. 베이스 클래스 작성
   - `BaseQuizGenerator.ts`
2. 팩토리 작성
   - `QuizGeneratorFactory.ts`
3. NumberMathQuizGenerator 구현

**4일차: 추가 생성기**

1. NumberSequenceQuizGenerator 구현
2. WordScrambleQuizGenerator 구현

#### Phase 3: 서비스 & DTO (2일)

**5일차: DTO 작성**

1. Request DTO 작성
   - QuizCreateReqDto, QuizAnswerSubmitReqDto, QuizChannelSetReqDto
2. Response DTO 작성
   - QuizCreateResDto, QuizAnswerSubmitResDto, QuizChannelSetResDto

**6일차: Service 구현**

1. QuizService 구현
   - `createQuiz()`, `submitAnswer()`, `setQuizChannel()`, `disableQuiz()`, `expireSession()` 메서드
   - 비즈니스 로직 검증 추가

#### Phase 4: Embed & Command (2일)

**7일차: Embed & Config**

1. QuizEmbed, QuizCorrectEmbed, QuizExpiredEmbed 구현
2. config.ts에 quiz 섹션 추가
3. .env 예시 업데이트

**8일차: Command 구현**

1. QuizConfigCommand 구현 (관리자)
   - set, disable, view 서브커맨드
2. QuizCommand 구현 (일반 유저)
   - MessageCollector 통합

#### Phase 5: 스케줄러 (2일)

**9일차: 스케줄러 구현**

1. node-cron 설치
2. QuizScheduler 클래스 작성
   - 단일 Cron Job 방식
   - `initialize()`, `executeQuizJobForAllGuilds()` 메서드

**10일차: 스케줄러 통합**

1. PinguBot에 QuizScheduler 통합
2. Graceful shutdown 구현
3. Cleanup Job 구현
4. refreshGuildConfig() 메서드 추가

#### Phase 6: 테스트 & 디버깅 (2일)

**11-12일차**

1. 통합 테스트
2. 버그 수정
3. 문서화

**총 예상 개발 기간: 12일 (약 2주)**

---

## 7. 비기능적 요구사항

### 7.1 성능

- MessageCollector는 메모리에 상주하므로 제한 시간을 적절히 설정 (최대 1시간)
- 동시 진행 퀴즈: 길드당 1개로 제한
- 퀴즈 생성 주기: 환경 변수에서 관리 (기본값: 3시간)
- 퀴즈 종료 시 즉시 DB에서 삭제하여 저장 공간 절약
- 단일 Cron Job으로 효율성 향상

### 7.2 확장성

- 새로운 퀴즈 타입 추가 시:
  1. IQuizGenerator를 구현한 새 Generator 클래스 작성
  2. QuizGeneratorFactory에 등록
  3. QuizType enum에 추가
- 외부 API 연동 가능 (예: Trivia API) - generate() 메서드가 async이므로 지원
- 난이도별 보상 차등화 가능 (difficulty 필드 활용)
- 전역 설정을 환경 변수로 관리하여 배포 환경별 조정 가능

### 7.3 보안

- Cron 표현식 검증: node-cron의 `validate()` 사용
- 입력 검증: Service 레이어에서 처리
- SQL Injection 방지: Prisma 사용으로 자동 방지

### 7.4 에러 처리

- 퀴즈 생성 실패 시 로그 기록, 사용자에게 에러 메시지 전송 안 함 (Cron Job)
- Collector 에러 시 자동 종료 및 로그 기록
- Discord API 에러 시 재시도 로직 (선택)

---

## 8. 향후 확장 계획

### v1.1

- **퀴즈 난이도 시스템**: difficulty 값에 따라 보상 차등 지급
- **퀴즈 통계**: 유저별 정답률, 평균 응답 시간 (별도 테이블 추가)
- **리더보드**: 퀴즈 정답 횟수 순위

### v1.2

- **퀴즈 카테고리**: 과학, 역사, 스포츠 등 카테고리별 퀴즈
- **멀티플 초이스**: 4지선다형 퀴즈 (Button 인터랙션 사용)
- **팀 퀴즈**: 여러 유저가 협력하여 풀이

### v2.0

- **외부 API 연동**: Open Trivia Database, JService 등
- **커스텀 퀴즈**: 관리자가 직접 퀴즈 추가
- **퀴즈 배치**: 한 번에 여러 문제 출제

---

## 9. 완료 기준

### MVP 완료 기준

- [ ] 데이터베이스 스키마 마이그레이션 완료
- [ ] 랜덤 유틸리티 함수 구현
- [ ] 3개 이상의 퀴즈 타입 구현 (async generate 지원)
- [ ] `/quiz-config` 명령어로 설정 가능 (set, disable, view)
- [ ] 단일 Cron Job으로 자동 퀴즈 생성
- [ ] MessageCollector로 정답 수집
- [ ] 정답 시 코인 보상 지급 및 세션 삭제
- [ ] 제한 시간 만료 시 세션 삭제
- [ ] Cleanup Job으로 만료된 세션 자동 정리
- [ ] 에러 핸들링 및 로깅
- [ ] 환경 변수로 퀴즈 주기 및 제한 시간 관리

### 품질 기준

- [ ] 모든 레이어가 6-layer 아키텍처를 준수
- [ ] Service 레이어에만 비즈니스 로직 존재
- [ ] 모든 Service 메서드가 DTO 사용
- [ ] Embed는 Command에서만 생성
- [ ] 랜덤 유틸리티는 utils/random.ts에 분리
- [ ] 에러 클래스는 errors/game/quiz/에 배치
- [ ] DTO 네이밍이 FINAL_ARCHITECTURE_PLAN.md 컨벤션 준수
- [ ] 코드에 주석 및 문서 작성
- [ ] ESLint 경고 없음

---

## 10. 참고 자료

### Cron 표현식 참고

- [Crontab Guru](https://crontab.guru/) - Cron 표현식 테스트 도구
- [node-cron 문서](https://www.npmjs.com/package/node-cron)

### Discord.js 참고

- [MessageCollector 문서](https://discord.js.org/#/docs/discord.js/main/class/MessageCollector)
- [Embed Builder 가이드](https://discordjs.guide/popular-topics/embeds.html)

### 외부 API (선택)

- [Open Trivia Database](https://opentdb.com/) - 무료 퀴즈 API
- [jService](https://jservice.io/) - Jeopardy! 퀴즈 API

---

## 부록: DTO 예시

### Request DTOs

```typescript
// QuizCreateReqDto.ts
export class QuizCreateReqDto {
  readonly guildId: string;
  readonly quizType?: QuizType;

  constructor(props: { guildId: string; quizType?: QuizType }) {
    this.guildId = props.guildId;
    this.quizType = props.quizType;
  }
}

// QuizAnswerSubmitReqDto.ts
export class QuizAnswerSubmitReqDto {
  readonly quizSessionId: number;
  readonly userId: string;
  readonly username: string;
  readonly answer: string;

  constructor(props: {
    quizSessionId: number;
    userId: string;
    username: string;
    answer: string;
  }) {
    this.quizSessionId = props.quizSessionId;
    this.userId = props.userId;
    this.username = props.username;
    this.answer = props.answer;
  }
}

// QuizChannelSetReqDto.ts
export class QuizChannelSetReqDto {
  readonly guildId: string;
  readonly channelId: string;

  constructor(props: { guildId: string; channelId: string }) {
    this.guildId = props.guildId;
    this.channelId = props.channelId;
  }
}
```

### Response DTOs

```typescript
// QuizCreateResDto.ts
export class QuizCreateResDto {
  readonly session: {
    id: number;
    quizType: string;
    question: string;
    hint?: string;
    difficulty: number;
    timeLimit: number;
    rewardAmount: number;
    answer: string; // Collector용
  };
  readonly channelId: string;

  constructor(props: {
    session: {
      id: number;
      quizType: string;
      question: string;
      hint?: string;
      difficulty: number;
      timeLimit: number;
      rewardAmount: number;
      answer: string;
    };
    channelId: string;
  }) {
    this.session = props.session;
    this.channelId = props.channelId;
  }
}

// QuizAnswerSubmitResDto.ts
export class QuizAnswerSubmitResDto {
  readonly isCorrect: boolean;
  readonly correctAnswer?: string;
  readonly coinsEarned: number;

  constructor(props: {
    isCorrect: boolean;
    correctAnswer?: string;
    coinsEarned: number;
  }) {
    this.isCorrect = props.isCorrect;
    this.correctAnswer = props.correctAnswer;
    this.coinsEarned = props.coinsEarned;
  }
}

// QuizChannelSetResDto.ts
export class QuizChannelSetResDto {
  readonly guildId: string;
  readonly quizChannelId: string;

  constructor(props: { guildId: string; quizChannelId: string }) {
    this.guildId = props.guildId;
    this.quizChannelId = props.quizChannelId;
  }
}
```

---

## 마무리

이 문서는 Pingu Bot의 퀴즈 컨텐츠 기능에 대한 상세 기획서입니다. 6-layer 아키텍처를 준수하며, Cron 스케줄러와 MessageCollector를 통합하여 자동화되고 확장 가능한 퀴즈 시스템을 구축합니다.

**주요 변경사항 (v3.1):**

1. **DTO 네이밍 컨벤션 수정 (FINAL_ARCHITECTURE_PLAN.md 준수)**
   - `CreateQuizReqDto` → `QuizCreateReqDto` (Quiz + Create)
   - `SubmitAnswerReqDto` → `QuizAnswerSubmitReqDto` (QuizAnswer + Submit)
   - `SetQuizChannelReqDto` → `QuizChannelSetReqDto` (QuizChannel + Set)
   - `CreateQuizResDto` → `QuizCreateResDto`
   - `SubmitAnswerResDto` → `QuizAnswerSubmitResDto`
   - `SetQuizChannelResDto` → `QuizChannelSetResDto`
   - **패턴**: `{Data}{Action}ReqDto` / `{Data}{Action}ResDto`

2. **퀴즈 생성 주기 및 만료 시간을 환경 변수로 관리**
   - `QUIZ_GENERATION_CRON`: 퀴즈 생성 주기 (Cron 표현식)
   - `QUIZ_TIME_LIMIT`: 퀴즈 제한 시간 (밀리초)

3. **QuizConfig 테이블 대폭 간소화**
   - 제거된 필드: `id`, `cronExpression`, `quizTimeLimit`, `isEnabled`, `rewardAmount`, `createdAt`
   - `guildId`가 기본키 (Guild와 1:1 관계)
   - 레코드 존재 여부가 활성화 상태를 나타냄

4. **에러 클래스 위치 변경**
   - `src/errors/quiz/` → `src/errors/game/quiz/`
   - 기존 패턴에 맞춘 네이밍: `QuizNotFoundError`, `QuizAlreadyActiveError`, `QuizChannelNotSetError`

5. **QuizScheduler 구조 변경**
   - 길드별 동적 스케줄링 → 단일 Cron Job
   - `Map<guildId, task>` → `mainTask: ScheduledTask | null`
   - 모든 활성화된 길드를 순회하며 퀴즈 생성

6. **Service & Repository 메서드 변경**
   - `updateConfig()` → `setQuizChannel()`, `updateQuizChannel()`, `disableQuiz()`
   - `findOrCreateConfig()` → `findConfig()`, `setQuizChannel()`

7. **Command 간소화**
   - `/quiz-config` 서브커맨드: `set`, `disable`, `view`만 유지
   - `channel`, `schedule`, `reward`, `timelimit`, `toggle` 제거

구현 시 다음 사항을 준수해주세요:

- 모든 비즈니스 로직은 Service 레이어에만
- DTO 패턴을 철저히 사용 (FINAL_ARCHITECTURE_PLAN.md 네이밍 컨벤션 준수)
- Embed는 Command에서만 생성
- 랜덤 유틸리티는 utils/random.ts 사용
- 퀴즈 종료 시 세션 DELETE 처리
- 에러 클래스는 errors/game/quiz/ 디렉토리에 배치
- 환경 변수로 전역 설정 관리
- 단일 Cron Job으로 효율적 스케줄링
- 에러 처리 및 로깅을 꼼꼼하게
- 코드 주석 및 문서화

궁금한 사항이나 추가 요구사항이 있다면 언제든지 문의해주세요.
