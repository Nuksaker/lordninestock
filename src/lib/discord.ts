const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number; // Integer color code
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export const DiscordColors = {
  BLUE: 0x3498db,
  GREEN: 0x2ecc71,
  RED: 0xe74c3c,
  YELLOW: 0xf1c40f,
  PURPLE: 0x9b59b6,
  ORANGE: 0xe67e22,
};

export async function sendDiscordWebhook(payload: DiscordWebhookPayload): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.warn('DISCORD_WEBHOOK_URL is not set. Skipping Discord notification.');
    return false;
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('Failed to send Discord webhook:', res.status, res.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    return false;
  }
}

// Helper methods for common events

export async function notifyNewDrop(itemName: string, bossName: string | undefined, finderName?: string) {
  return sendDiscordWebhook({
    username: 'LordNine StockBot',
    embeds: [{
      title: '💎 New Drop Received!',
      description: `**${itemName}** has dropped!`,
      color: DiscordColors.BLUE,
      fields: [
        { name: 'Item', value: itemName, inline: true },
        { name: 'Boss', value: bossName || 'Unknown', inline: true },
        ...(finderName ? [{ name: 'Finder', value: finderName, inline: true }] : []),
      ],
      timestamp: new Date().toISOString(),
    }]
  });
}

export async function notifySale(itemName: string, price: number, netAmount: number) {
  return sendDiscordWebhook({
    username: 'LordNine StockBot',
    embeds: [{
      title: '💰 Item Sold!',
      description: `**${itemName}** has been sold.`,
      color: DiscordColors.GREEN,
      fields: [
        { name: 'Item', value: itemName, inline: true },
        { name: 'Sale Price', value: `${price.toLocaleString()} THB`, inline: true },
        { name: 'Net Amount', value: `${netAmount.toLocaleString()} THB`, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }]
  });
}

export async function notifyDividend(itemName: string, amountPerPerson: number, totalPeople: number) {
  return sendDiscordWebhook({
    username: 'LordNine StockBot',
    embeds: [{
      title: '💸 Dividend Distributed!',
      description: `Profits from **${itemName}** have been split.`,
      color: DiscordColors.YELLOW,
      fields: [
        { name: 'Amount Per Person', value: `${amountPerPerson.toLocaleString()} THB`, inline: true },
        { name: 'Total Recipients', value: `${totalPeople} members`, inline: true },
      ],
      footer: { text: 'Check your dashboard for details.' },
      timestamp: new Date().toISOString(),
    }]
  });
}
