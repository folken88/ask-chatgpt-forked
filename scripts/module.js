import { registerSettings, moduleName } from './settings.js';
import { getGptReplyAsHtml } from './gpt-api.js';
import { clearHistory, loadHistory } from './history.js';
import { fetchAvailableModels } from './settings.js';

Hooks.once('init', () => {
    console.log(`${moduleName} | Initialization`);
    registerSettings();
});

Hooks.on('chatMessage', (chatLog, message, chatData) => {
    const echoChatMessage = async (chatData, question) => {
        const toGptHtml = '<span class="ask-chatgpt-to">To: GPT</span><br>';
        chatData.content = `${toGptHtml}${question.replace(/\n/g, "<br>")}`;
        await ChatMessage.create(chatData);
    };

    let match;

    const reWhisper = new RegExp(/^(\/w(?:hisper)?\s)(\[(?:[^\]]+)\]|(?:[^\s]+))\s*([^]*)/, "i");
    match = message.match(reWhisper);
    if (match) {
        const gpt = 'gpt';
        const userAliases = match[2].replace(/[[\]]/g, "").split(",").map(n => n.trim());
        const question = match[3].trim();
        if (userAliases.some(u => u.toLowerCase() === gpt)) {
            const users = userAliases
                .filter(n => n.toLowerCase() !== gpt)
                .reduce((arr, n) => arr.concat(ChatMessage.getWhisperRecipients(n)), [game.user]);

            // same error logic as in Foundry
            if (!users.length) throw new Error(game.i18n.localize("ERROR.NoTargetUsersForWhisper"));
            if (users.some(u => !u.isGM && u.id != game.user.id) && !game.user.can("MESSAGE_WHISPER")) {
                throw new Error(game.i18n.localize("ERROR.CantWhisper"));
            }

            chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
            chatData.whisper = users.map(u => u.id);
            chatData.sound = CONFIG.sounds.notification;
            echoChatMessage(chatData, question);

            respondTo(question, users);

            // prevent further processing, since an unknown whisper target would trigger an error
            return false;
        }
    }

    const rePublic = new RegExp(/^(\/\?\s)\s*([^]*)/, "i");
    match = message.match(rePublic);
    if (match) {
        const question = match[2].trim();
        echoChatMessage(chatData, question);

        respondTo(question, []);

        // prevent further processing, since an unknown command would trigger an error
        return false;
    }

    return true;
});

async function respondTo(question, users) {
    console.debug(`${moduleName} | respondTo(question = "${question}", users =`, users, ')');
    try {
        const reply = await getGptReplyAsHtml(question);

        const abbr = "By ChatGPT. Statements may be false";
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({alias: 'GPT'}),
            content: `<abbr title="${abbr}" class="ask-chatgpt-to fa-solid fa-microchip-ai"></abbr>
                <span class="ask-chatgpt-reply">${reply}</span>`,
            whisper: users.map(u => u.id),
            sound: CONFIG.sounds.notification,
        });
    } catch (e) {
        console.error(`${moduleName} | Failed to provide response.`, e);
        ui.notifications.error(e.message, {permanent: true, console: false});
    }
}

// Hook to add buttons to UI for managing history and fetching models
Hooks.on('renderSettingsConfig', async (_settingsConfig, html, data) => {
    if (data?.namespace === moduleName) {
        // Adding Clear History Button
        const clearButton = $(`<button type="button">Clear History</button>`);
        clearButton.on('click', () => {
            clearHistory();
            ui.notifications?.info("Chat history cleared.");
        });

        // Adding Load History Button
        const loadButton = $(`<button type="button">Load History</button>`);
        loadButton.on('click', () => {
            loadHistory();
            ui.notifications?.info("Chat history loaded.");
        });

        // Adding Fetch Models Button
        const fetchModelsButton = $(`<button type="button">Fetch Available GPT Models</button>`);
        fetchModelsButton.on('click', async () => {
            try {
                await fetchAvailableModels();
                ui.notifications?.info("Successfully fetched available GPT models.");
            } catch (e) {
                console.error(`${moduleName} | Failed to fetch GPT models.`, e);
                ui.notifications?.error("Failed to fetch available GPT models. Check console for details.");
            }
        });

        // Append buttons to the settings form
        html.find('div.form-group').last().after(clearButton);
        html.find('div.form-group').last().after(loadButton);
        html.find('div.form-group').last().after(fetchModelsButton);
    }
});
