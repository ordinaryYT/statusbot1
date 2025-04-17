import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import './server.js'; // Import the server to keep the app alive

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const UPTIME_API = 'https://api.uptimerobot.com/v2/getMonitors';
const MESSAGE_FILE = './lastMessage.json';

const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
};

async function fetchMonitors() {
  try {
    const res = await axios.post(UPTIME_API, new URLSearchParams({
      api_key: process.env.UPTIMEROBOT_API_KEY,
      format: 'json',
      logs: '0',
    }), { headers });

    return res.data.monitors;
  } catch (err) {
    console.error('Error fetching monitors:', err);
    return [];
  }
}

function formatStatus(statusCode) {
  switch (statusCode) {
    case 2: return '🟢 Up';
    case 9: return '🟠 Warning';
    case 8: return '🔴 Down';
    default: return '❓ Unknown';
  }
}

async function updateStatusMessage() {
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  const monitors = await fetchMonitors();

  const lines = monitors.map(m => `**${m.friendly_name}**: ${formatStatus(m.status)}`);
  const content = `📡 **Live Monitor Status**\n\n${lines.join('\n')}\n\nLast updated: <t:${Math.floor(Date.now() / 1000)}:R>`;

  let message;

  if (fs.existsSync(MESSAGE_FILE)) {
    const { messageId } = fs.readJSONSync(MESSAGE_FILE);
    try {
      message = await channel.messages.fetch(messageId);
      await message.edit(content);
    } catch {
      message = await channel.send(content);
      fs.writeJSONSync(MESSAGE_FILE, { messageId: message.id });
    }
  } else {
    message = await channel.send(content);
    fs.writeJSONSync(MESSAGE_FILE, { messageId: message.id });
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await updateStatusMessage();
  setInterval(updateStatusMessage, parseInt(import('./config.json').then(m => m.default.updateInterval)));
});

client.login(process.env.DISCORD_TOKEN);
