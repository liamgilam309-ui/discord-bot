import dotenv from "dotenv";
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from "discord.js";

import fetch from "node-fetch";

// Buat client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Slash commands
const commands = [
  { name: "ping", description: "Tes bot (balas Pong!)" },
  { name: "bypass", description: "Bypass sebuah link" }
];

// Setup REST API buat register commands
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
      body: commands
    });
    console.log("✅ Commands registered");
  } catch (err) {
    console.error("❌ Error registering commands:", err);
  }
});

// Event handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand() && !interaction.isModalSubmit()) return;

  // Tes command
  if (interaction.isCommand() && interaction.commandName === "ping") {
    return interaction.reply("🏓 Pong!");
  }

  // Command /bypass → buka modal
  if (interaction.isCommand() && interaction.commandName === "bypass") {
    const modal = new ModalBuilder()
      .setCustomId("bypassmodal")
      .setTitle("Bypass Link");

    const urlInput = new TextInputBuilder()
      .setCustomId("link")
      .setLabel("Masukkan Link Get Key:")
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(urlInput);
    modal.addComponents(row);

    return interaction.showModal(modal);
  }

  // Modal submit → proses bypass
  if (interaction.isModalSubmit() && interaction.customId === "bypassmodal") {
    await interaction.deferReply({ ephemeral: true });

    const link = interaction.fields.getTextInputValue("link");
    if (!link) return interaction.followUp("❌ Tidak ada link yang dimasukkan.");
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      return interaction.followUp("❌ Format link tidak valid!");
    }

    let apiUrl = `https://slr.kys.gay/api/premium/bypass?url=${encodeURIComponent(link)}`;
    const API_HEADERS = {
      Authorization: `Bearer SLR-72264178721555610712260642385517-astors`
    };

    try {
      const response = await fetch(apiUrl, { headers: API_HEADERS });
      if (!response.ok) throw new Error("API error");

      const result = await response.json();
      const bypassResult =
        result.key?.result ||
        result.result?.result ||
        JSON.stringify(result.key || result.result) ||
        "Tidak ada hasil";

      await interaction.followUp(`✅ Hasil Bypass:\n\`\`\`${bypassResult}\`\`\``);
    } catch (err) {
      console.error("❌ Error bypass:", err);
      await interaction.followUp("❌ Terjadi error saat proses bypass.");
    }
  }
});

// Login bot
client.login(process.env.DISCORD_TOKEN);
