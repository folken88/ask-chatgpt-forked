import { moduleName, getGamePromptSetting } from './settings.js';
import { pushHistory } from './history.js';

async function callGptApi(query) {
    const apiKey = game.settings.get(moduleName, 'apiKey');
    if (!apiKey) {
        console.warn(`${moduleName} | API key is not set. Cannot proceed with API call.`);
        return null;
    }

    const model = game.settings.get(moduleName, 'modelVersion');
    if (!model) {
        console.warn(`${moduleName} | Model version is not set. Cannot proceed with API call.`);
        return null;
    }

    const prompt = getGamePromptSetting();
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const promptMessage = { role: 'user', content: prompt };
    const queryMessage = { role: 'user', content: query };

    // Respect the context length setting
    const contextLength = game.settings.get(moduleName, 'contextLength');
    const messages = pushHistory().slice(-contextLength).concat(promptMessage, queryMessage);

    const requestBody = {
        model,
        messages,
        temperature: 0.1,
    };

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    };

    const is4xx = c => c >= 400 && c < 500;
    const handleFailedQuery = async (response, msg) => {
        let err = `${response?.status}`;
        try {
            const data = await response.json();
            console.debug(`${moduleName} | callGptApi(): failure data =`, data);
            err = `${data?.error?.message} (${err})`;
        } catch (e) {
            console.warn(`${moduleName} | Could not decode failed API response.`, e);
        }
        throw new Error(`${msg}: ${err}`);
    };

    let response = {};
    for (
        let retries = 0, backoffTime = 5000;
        retries < 5 && !response?.ok;
        retries++, await new Promise(r => setTimeout(r, backoffTime))
    ) {
        console.debug(`${moduleName} | callGptApi(): waiting for reply (tries: ${retries})`);
        if (retries > 0) {
            ui.notifications?.warn(`Retrying GPT API call (${retries}/5). Please wait...`);
        }
        response = await fetch(apiUrl, requestOptions);
        console.debug(`${moduleName} | callGptApi(): response =`, response);
        if (response?.status && is4xx(response?.status)) {
            await handleFailedQuery(response, "ChatGPT API failed");
        }
    }

    if (response?.ok) {
        const data = await response.json();
        console.debug(`${moduleName} | callGptApi(): response data =`, data);

        const replyMessage = data.choices[0].message;
        pushHistory(queryMessage, replyMessage);
        return replyMessage.content.trim();
    } else {
        await handleFailedQuery(response, "ChatGPT API failed multiple times");
    }
}

export async function getGptReplyAsHtml(query) {
    const answer = await callGptApi(query);
    const html = /</?[a-z][\s\S]*>/i.test(answer) || !answer.includes('\n') ?
        answer : answer.replace(/\n/g, "<br>");
    return html.replaceAll("```", "");
}
