# Discord Integration Setup Guide

Follow these steps to set up the Discord bot for the Placement Dashboard.

## 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and give it a name (e.g., "Placement Bot").
3. Go to the **Bot** tab on the left sidebar.
4. Click **Reset Token** to generate a token. **Copy this Token**. You will need it for the dashboard settings.
5. Scroll down to **Privileged Gateway Intents** and enable:
   - **Server Members Intent**
   - **Message Content Intent**
6. Click **Save Changes**.

## 2. Invite the Bot to Your Server

1. Go to the **OAuth2** tab -> **URL Generator**.
2. Under **Scopes**, select `bot`.
3. Under **Bot Permissions**, select:
   - `Send Messages`
   - `Embed Links`
   - `Manage Threads` (if you want thread updates)
   - `Read Message History`
   - `Mention Everyone` (if needed)
4. Copy the Generated URL at the bottom.
5. Open the URL in a browser and invite the bot to your Placement Server.

## 3. Configure the Dashboard

1. Log in to the Placement Dashboard as a **Manager**.
2. Go to **Settings** -> **Discord Integration** tab.
3. Enable the integration.
4. Paste the **Bot Token** you copied in Step 1.
5. Enter your **Server (Guild) ID**:
   - In Discord, go to **User Settings** -> **Advanced** -> Enable **Developer Mode**.
   - Right-click your server icon on the left -> **Copy Server ID**.
6. Create channels in your Discord server for different notifications (e.g., `#job-postings`, `#application-updates`, `#profile-approvals`).
7. Right-click each channel -> **Copy Channel ID** and paste them into the corresponding fields in the dashboard settings.
8. Click **Save All Changes**.

## 4. User Setup

- **Students**: Can go to their Profile -> Personal tab to add their Discord User ID and Username.
- **Coordinators**: Can go to Settings to add their Discord details.

## Troubleshooting

- If the bot is not sending messages, check if it has the correct permissions in the specific channels.
- Check the server logs for any "Missing Access" errors.
