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
