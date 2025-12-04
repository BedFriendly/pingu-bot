export class Validator {
  /**
   * Validate bet amount
   */
  static isValidBet(
    amount: number,
    balance: number,
    minBet: number
  ): {
    valid: boolean;
    error?: string;
  } {
    if (amount < minBet) {
      return {
        valid: false,
        error: `Minimum bet is ${minBet} PC.`,
      };
    }

    if (amount > balance) {
      return {
        valid: false,
        error: 'You do not have enough coins.',
      };
    }

    if (!Number.isInteger(amount)) {
      return {
        valid: false,
        error: 'Bet amount must be a whole number.',
      };
    }

    return { valid: true };
  }

  /**
   * Validate coin transfer
   */
  static isValidTransfer(
    amount: number,
    balance: number,
    fromId: string,
    toId: string
  ): {
    valid: boolean;
    error?: string;
  } {
    if (fromId === toId) {
      return {
        valid: false,
        error: 'You cannot transfer coins to yourself.',
      };
    }

    if (amount <= 0) {
      return {
        valid: false,
        error: 'Transfer amount must be positive.',
      };
    }

    if (amount > balance) {
      return {
        valid: false,
        error: 'You do not have enough coins.',
      };
    }

    if (!Number.isInteger(amount)) {
      return {
        valid: false,
        error: 'Transfer amount must be a whole number.',
      };
    }

    return { valid: true };
  }

  /**
   * Validate cooldown
   */
  static checkCooldown(
    lastUsed: Date | null,
    cooldownMs: number
  ): {
    ready: boolean;
    remainingMs?: number;
  } {
    if (!lastUsed) {
      return { ready: true };
    }

    const now = Date.now();
    const elapsed = now - lastUsed.getTime();

    if (elapsed >= cooldownMs) {
      return { ready: true };
    }

    return {
      ready: false,
      remainingMs: cooldownMs - elapsed,
    };
  }
}
