export const moduleName = 'ask-chatgpt';
import { fetch } from 'node-fetch';

export const gameSystems = (() => {
    const genericPrompt = "I would like you to help me with running the game by coming up with ideas, answering questions, and improvising. Keep responses as short as possible. Stick to the rules as much as possible.";
    const formatPrompt = "Always format each answer as HTML code without CSS, including lists and tables. Never use Markdown.";
    return {
        'generic': {
            name: 'Generic tabletop RPG',
            prompt: `You are a game master for a tabletop roleplaying game. ${genericPrompt} ${formatPrompt}`,
        },
        'dnd5e': {
            name: 'Dungeons & Dragons 5th Edition',
            prompt: `You are a dungeon master for a Dungeons & Dragons 5th Edition game. ${genericPrompt} Properly format spells, monsters, conditions, and so on. ${formatPrompt}`,
        },
        'pf2e': {
            name: 'Pathfinder Second Edition',
            prompt: `You are a game master for a Pathfinder 2nd Edition game. ${genericPrompt} Properly format spells, monsters, conditions, and so on. ${formatPrompt}`,
        },
        'pf1e': {
            name: 'Pathfinder First Edition',
            prompt: `You are a game master for a Pathfinder 1st Edition game. ${genericPrompt} Use open source Pathfinder 1e content from the SRD and Archives of Nethys to answer questions succinctly. Make sure not to confuse Pathfinder 1e with Pathfinder 2e, but if asked, it is okay to compare the two systems. Properly format spells, monsters, conditions, and other rules content. ${formatPrompt}`,
        },
        'foundry-ironsworn': {
            name: 'Ironsworn',
            prompt: `You are a game master for an Ironsworn game. ${genericPrompt} Properly format moves, oracle tables, and so on. ${formatPrompt}`,
        },
    };
})();

export const registerSettings = () => {
    // 'world' scope settings are available only to GMs

    game.settings.register(moduleName, 'apiKey', {
        name: 'OpenAI API key',
        hint: 'API key for ChatGPT from OpenAI. Get yours at https://platform.openai.com/account/api-keys .',
        scope: 'world',
        config: true,
        type: String,
        default: '',
    });

    Hooks.on('renderSettingsConfig', async (_settingsConfig, element, _data) => {
        let apiKeyInput = element.find(`input[name='${moduleName}.apiKey']`)[0];
        if (apiKeyInput) {
            apiKeyInput.type = 'password';
            apiKeyInput.autocomplete = 'one-time-code';
        }

        // Dynamically populate model choices
        const models = await fetchAvailableModels();
        if (models) {
            game.settings.settings.get(`${moduleName}.modelVersion`).choices = models;
        }
    });

    game.settings.register(moduleName, 'modelVersion', {
        name: 'ChatGPT model version',
        hint: 'Version of the ChatGPT model to use. Free accounts do not have access to GPT-4 or newer models.',
        scope: 'world',
        config: true,
        type: String,
        default: 'gpt-3.5-turbo',
        choices: {}, // Choices will be dynamically populated
    });

    game.settings.register(moduleName, 'contextLength', {
        name: 'Context length',
        hint: 'Number of messages, including replies, ChatGPT has access to. Increases API usage cost. Context is not shared among users and resets on page reload.',
        scope: 'world',
        config: true,
        type: Number,
        default: 0,
        range: {min: 0, max: 50},
    });

    game.settings.register(moduleName, 'gameSystem', {
        name: 'Game system',
        hint: 'Optimize logic for the game system, including ChatGPT prompt.',
        scope: 'world',
        config: true,
        type: String,
        default: game.system.id in gameSystems ? game.system.id : 'generic',
        choices: Object.fromEntries(
            Object.entries(gameSystems).map(([id, desc]) => [id, desc.name])
        ),
        onChange: id => console.log(`${moduleName} | Game system changed to '${id}',`,
            'ChatGPT prompt now is:', getGamePromptSetting()),
    });

    game.settings.register(moduleName, 'gamePrompt', {
        name: 'Custom ChatGPT prompt',
        hint: 'Overrides prompt for the game system above. Set to customize or refine ChatGPT behavior.',
        scope: 'world',
        config: true,
        type: String,
        default: gameSystems[game.settings.get(moduleName, 'gameSystem')].prompt,
        onChange: () => console.log(`${moduleName} | ChatGPT prompt now is:`, getGamePromptSetting()),
    });
}

export const getGamePromptSetting = () => {
    return game.settings.get(moduleName, 'gamePrompt').trim() ||
        gameSystems[game.settings.get(moduleName, 'gameSystem')].prompt;
}

// Function to fetch the available models from OpenAI
const fetchAvailableModels = async () => {
    const apiKey = game.settings.get(moduleName, 'apiKey');
    if (!apiKey) {
        console.warn(`${moduleName} | API key is not set. Cannot fetch models.`);
        return null;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();
        const models = data.data.map(model => model.id);
        
        // Filter for relevant models (e.g., only GPT models)
        return models.filter(model => model.startsWith('gpt')).reduce((acc, model) => {
            acc[model] = model.toUpperCase().replace(/-/g, ' ');
            return acc;
        }, {});
    } catch (error) {
        console.error(`${moduleName} | Error fetching models:`, error);
        return null;
    }
};
