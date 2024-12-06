import { registerSettings, moduleName } from './settings.js';
import { getGptReplyAsHtml } from './gpt-api.js';
import { getActiveActor, searchActorItems, summarizeItems } from './actor-utils.js';

// Keep track of recently discussed items
const recentItemContext = {
	items: [],
	timestamp: 0,
	duration: 300000 // Context lasts 5 minutes
};

function updateRecentItems(items) {
	recentItemContext.items = items;
	recentItemContext.timestamp = Date.now();
}

function getRecentItems() {
	if (Date.now() - recentItemContext.timestamp > recentItemContext.duration) {
		return []; // Context expired
	}
	return recentItemContext.items;
}

function findBestItemMatch(actor, searchTerm) {
	// Common abbreviations and variations
	const variations = {
		'clw': 'cure light wounds',
		'cmw': 'cure moderate wounds',
		'csw': 'cure serious wounds',
		'cure light': 'cure light wounds',
		'cure moderate': 'cure moderate wounds',
		'cure serious': 'cure serious wounds'
	};

	// Normalize search term
	searchTerm = searchTerm.toLowerCase();
	if (variations[searchTerm]) {
		searchTerm = variations[searchTerm];
	}

	// First, check recent context
	const recentItems = getRecentItems();
	const recentMatch = recentItems.find(item => 
		item.name.toLowerCase().includes(searchTerm) ||
		searchTerm.includes(item.name.toLowerCase())
	);
	if (recentMatch) {
		return actor.items.find(i => i.name === recentMatch.name);
	}

	// Then check exact matches
	const exactMatch = actor.items.find(i => 
		i.name.toLowerCase() === searchTerm ||
		i.name.toLowerCase().includes(searchTerm)
	);
	if (exactMatch) return exactMatch;

	// Finally, check fuzzy matches
	const fuzzyMatches = actor.items.filter(i => {
		const itemName = i.name.toLowerCase();
		// Check if any word in the search term matches part of the item name
		return searchTerm.split(' ').some(word => 
			itemName.includes(word) && word.length > 2 // Avoid matching very short words
		);
	});

	if (fuzzyMatches.length === 1) {
		return fuzzyMatches[0];
	} else if (fuzzyMatches.length > 1) {
		// If multiple matches, prefer potions for healing-related terms
		if (searchTerm.includes('cure') || searchTerm.includes('heal')) {
			const potionMatch = fuzzyMatches.find(i => i.name.toLowerCase().includes('potion'));
			if (potionMatch) return potionMatch;
		}
	}

	return null;
}

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

	// Handle skill queries and modifications with /s
	const reSkills = new RegExp(/^(\/s\s)\s*([^]*)/, "i");
	match = message.match(reSkills);
	if (match) {
		const question = match[2].trim();
		echoChatMessage(chatData, question);

		respondToSkills(question, []);

		return false;
	}

	// Handle inventory modifications with /i add or /i set
	const reInventoryMod = new RegExp(/^(\/i\s)(add|set)\s+(\d+)\s+(.+)/, "i");
	match = message.match(reInventoryMod);
	if (match) {
		const [_, __, action, amountStr, itemName] = match;
		const amount = parseInt(amountStr);
		modifyInventory(action.toLowerCase(), amount, itemName.trim());
		return false;
	}

	// Handle inventory queries with /i
	const reInventory = new RegExp(/^(\/i\s)\s*([^]*)/, "i");
	match = message.match(reInventory);
	if (match) {
		const question = match[2].trim();
		echoChatMessage(chatData, question);

		respondToInventory(question, []);

		return false;
	}

	// Handle general queries with /?
	const rePublic = new RegExp(/^(\/\?\s)\s*([^]*)/, "i");
	match = message.match(rePublic);
	if (match) {
		const question = match[2].trim();
		echoChatMessage(chatData, question);

		respondTo(question, []);

		return false;
	}

	return true;
});

async function modifyInventory(action, amount, itemName) {
	try {
		const actor = getActiveActor();
		if (!actor) {
			throw new Error("No active character found. Select a token or assign a character to your user.");
		}

		// Find the best matching item
		const item = findBestItemMatch(actor, itemName);
		if (!item) {
			if (action === 'add') {
				// Create new item if it doesn't exist
				await actor.createEmbeddedDocuments('Item', [{
					name: itemName,
					type: 'loot',
					system: {
						quantity: amount
					}
				}]);
				ui.notifications.info(`Created ${amount} ${itemName}`);
			} else {
				throw new Error(`Couldn't find a matching item for "${itemName}". Please be more specific.`);
			}
			return;
		}

		const currentQty = item.system.quantity || 0;
		const newQty = action === 'add' ? currentQty + amount : amount;

		if (newQty < 0) {
			throw new Error(`Cannot reduce ${item.name} below 0.`);
		}

		await item.update({
			'system.quantity': newQty
		});

		ui.notifications.info(`${action === 'add' ? 'Added' : 'Set'} ${item.name} to ${newQty}`);

	} catch (e) {
		console.error(`${moduleName} | Failed to modify inventory:`, e);
		ui.notifications.error(e.message, {permanent: true, console: false});
	}
}

async function respondTo(question, users) {
	console.debug(`${moduleName} | respondTo(question = "${question}", users =`, users, ')');
	try {
		// Get the current game system ID
		const currentSystem = game.system.id;
		const genericPrompt = "I would like you to help me with running the game by coming up with ideas, answering questions, and improvising. Keep responses as short as possible. Stick to the rules as much as possible.";
		const formatPrompt = "Always format each answer as HTML code without CSS, including lists and tables. Never use Markdown.";
		
		// Use system-specific prompt if available, otherwise use generic
		let systemPrompt;
		if (currentSystem === 'dnd5e') {
			systemPrompt = `You are a dungeon master for a Dungeons & Dragons 5th Edition game. ${genericPrompt} Properly format spells, monsters, conditions, and so on. ${formatPrompt}`;
		} else if (currentSystem === 'pf1') {
			systemPrompt = `You are a game master for a Pathfinder 1st Edition game. ${genericPrompt} Properly format spells, feats, class features, combat maneuvers, and conditions. Use proper Pathfinder 1E terminology and rules. ${formatPrompt}`;
		} else if (currentSystem === 'pf2e') {
			systemPrompt = `You are a game master for a Pathfinder 2nd Edition game. ${genericPrompt} Properly format spells, monsters, conditions, and so on. ${formatPrompt}`;
		} else if (currentSystem === 'foundry-ironsworn') {
			systemPrompt = `You are a game master for an Ironsworn game. ${genericPrompt} Properly format moves, oracle tables, and so on. ${formatPrompt}`;
		} else {
			systemPrompt = `You are a game master for a tabletop roleplaying game. ${genericPrompt} ${formatPrompt}`;
		}

		const reply = await getGptReplyAsHtml(question, systemPrompt);

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

async function respondToInventory(question, users) {
	console.debug(`${moduleName} | respondToInventory(question = "${question}", users =`, users, ')');
	try {
		const actor = getActiveActor();
		if (!actor) {
			throw new Error("No active character found. Select a token or assign a character to your user.");
		}

		// Check for inventory modification commands in natural language
		const addMatch = question.match(/(?:add|give|put|place)\s+(\d+)\s+(.+?)(?:\s+to\s+inventory|\s*$)/i);
		const removeMatch = question.match(/(?:remove|take|subtract)\s+(\d+)\s+(.+?)(?:\s+from\s+inventory|\s*$)/i);
		const setMatch = question.match(/(?:set|make)\s+(.+?)\s+(?:to|equal|be)\s+(\d+)/i);
		const equipMatch = question.match(/(?:equip|wear|wield|hold)\s+(.+)/i);
		const unequipMatch = question.match(/(?:unequip|remove|take\s+off|unwield)\s+(.+)/i);
		const giftMatch = question.match(/(?:give|transfer|gift)\s+(\d+)\s+(.+?)\s+to\s+(.+)/i);

		if (addMatch) {
			await modifyInventory('add', parseInt(addMatch[1]), addMatch[2].trim());
			return;
		} else if (removeMatch) {
			await modifyInventory('add', -parseInt(removeMatch[1]), removeMatch[2].trim());
			return;
		} else if (setMatch) {
			await modifyInventory('set', parseInt(setMatch[2]), setMatch[1].trim());
			return;
		} else if (equipMatch) {
			const itemName = equipMatch[1].trim();
			const item = findBestItemMatch(actor, itemName);
			if (!item) {
				throw new Error(`Couldn't find item "${itemName}" in inventory.`);
			}
			await item.update({'system.equipped': true});
			ui.notifications.info(`Equipped ${item.name}`);
			return;
		} else if (unequipMatch) {
			const itemName = unequipMatch[1].trim();
			const item = findBestItemMatch(actor, itemName);
			if (!item) {
				throw new Error(`Couldn't find item "${itemName}" in inventory.`);
			}
			await item.update({'system.equipped': false});
			ui.notifications.info(`Unequipped ${item.name}`);
			return;
		} else if (giftMatch) {
			const amount = parseInt(giftMatch[1]);
			const itemName = giftMatch[2].trim();
			const targetName = giftMatch[3].trim();
			
			// Find target actor
			const targetActor = game.actors.find(a => 
				a.name.toLowerCase().includes(targetName.toLowerCase()) ||
				a.name.toLowerCase() === targetName.toLowerCase()
			);
			
			if (!targetActor) {
				throw new Error(`Couldn't find character "${targetName}".`);
			}

			// Find and remove item from source
			const sourceItem = findBestItemMatch(actor, itemName);
			if (!sourceItem) {
				throw new Error(`Couldn't find item "${itemName}" in your inventory.`);
			}

			const currentQty = sourceItem.system.quantity || 0;
			if (currentQty < amount) {
				throw new Error(`You only have ${currentQty} ${itemName}.`);
			}

			// Remove from source
			await modifyInventory('add', -amount, itemName);

			// Add to target
			const itemData = sourceItem.toObject();
			itemData.system.quantity = amount;
			await targetActor.createEmbeddedDocuments('Item', [itemData]);
			
			ui.notifications.info(`Transferred ${amount} ${itemName} to ${targetActor.name}`);
			return;
		}

		// If no action was taken, treat it as a query
		const searchTerms = question.toLowerCase().split(' ');
		const items = searchActorItems(actor, searchTerms.join(' '));
		
		// Update recent items context
		updateRecentItems(items);
		
		const summary = summarizeItems(items);

		// Create a focused prompt for inventory questions
		const inventoryPrompt = `You are a helpful game assistant. Answer questions about the character's inventory based on this information: ${summary}`;
		const reply = await getGptReplyAsHtml(question, inventoryPrompt);

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
		console.error(`${moduleName} | Failed to provide inventory response.`, e);
		ui.notifications.error(e.message, {permanent: true, console: false});
	}
}

async function respondToSkills(question, users) {
	console.debug(`${moduleName} | respondToSkills(question = "${question}", users =`, users, ')');
	try {
		const actor = getActiveActor();
		if (!actor) {
			throw new Error("No active character found. Select a token or assign a character to your user.");
		}

		// Mapping of common skill names to their abbreviations for PF1
		const skillAbbreviations = {
			'perception': 'per',
			'stealth': 'ste',
			'acrobatics': 'acr',
			'appraise': 'apr',
			'bluff': 'blf',
			'climb': 'clm',
			'diplomacy': 'dip',
			'disable device': 'dev',
			'disguise': 'dis',
			'escape artist': 'esc',
			'fly': 'fly',
			'handle animal': 'han',
			'heal': 'hea',
			'intimidate': 'int',
			'knowledge arcana': 'kar',
			'knowledge dungeoneering': 'kdu',
			'knowledge engineering': 'ken',
			'knowledge geography': 'kge',
			'knowledge history': 'khi',
			'knowledge local': 'klo',
			'knowledge nature': 'kna',
			'knowledge nobility': 'kno',
			'knowledge planes': 'kpl',
			'knowledge religion': 'kre',
			'linguistics': 'lin',
			'perform': 'prf',
			'profession': 'pro',
			'ride': 'rid',
			'sense motive': 'sen',
			'sleight of hand': 'slt',
			'spellcraft': 'spl',
			'survival': 'sur',
			'swim': 'swm',
			'use magic device': 'umd'
		};

		// Get all skills data
		const skills = actor.system.skills;
		const skillSummary = Object.entries(skills).map(([key, skill]) => {
			const total = skill.mod || 0;
			const ranks = skill.rank || 0;
			const ability = skill.ability || '';
			const abilityMod = actor.system.abilities[ability]?.mod || 0;
			const misc = total - ranks - abilityMod;
			
			// Get a more readable name for the skill
			const readableName = Object.entries(skillAbbreviations).find(([_, abbr]) => abbr === key)?.[0] || key;
			
			return {
				name: readableName,
				key: key,
				total: total,
				ranks: ranks,
				ability: ability,
				abilityMod: abilityMod,
				misc: misc
			};
		});

		// Check for skill modification commands
		const increaseMatch = question.match(/(?:increase|add|raise)\s+(?:my\s+)?(.+?)\s+(?:ranks?|level|training)\s+(?:by\s+)?(\d+)/i);
		const decreaseMatch = question.match(/(?:decrease|subtract|lower)\s+(?:my\s+)?(.+?)\s+(?:ranks?|level|training)\s+(?:by\s+)?(\d+)/i);
		const setMatch = question.match(/(?:set|make)\s+(?:my\s+)?(.+?)\s+(?:ranks?|level|training)\s+(?:to|equal|be)\s+(\d+)/i);

		if (increaseMatch || decreaseMatch || setMatch) {
			const match = increaseMatch || decreaseMatch || setMatch;
			const skillName = match[1].trim().toLowerCase();
			const amount = parseInt(match[2]);

			// Try to find the skill by abbreviation or full name
			const skillKey = skillAbbreviations[skillName] || 
				Object.entries(skillAbbreviations).find(([name, _]) => 
					name.includes(skillName) || skillName.includes(name)
				)?.[1];

			if (!skillKey || !skills[skillKey]) {
				throw new Error(`Couldn't find skill "${skillName}". Please use the full skill name.`);
			}

			// Calculate new rank value
			let newRanks;
			if (increaseMatch) {
				newRanks = (skills[skillKey].rank || 0) + amount;
			} else if (decreaseMatch) {
				newRanks = Math.max(0, (skills[skillKey].rank || 0) - amount);
			} else {
				newRanks = amount;
			}

			// Update the skill ranks using PF1's data structure
			const updateData = {};
			updateData[`data.skills.${skillKey}.rank`] = newRanks;
			
			try {
				await actor.update(updateData);
				// Double-check if the update worked
				if (actor.system.skills[skillKey].rank !== newRanks) {
					// Try alternative update paths
					const altUpdateData = {};
					altUpdateData[`system.skills.${skillKey}.rank`] = newRanks;
					await actor.update(altUpdateData);
				}
			} catch (error) {
				console.error("Failed to update skill rank:", error);
				throw new Error(`Failed to update ${skillName} ranks. Please try again or update manually.`);
			}

			ui.notifications.info(`Updated ${skillName} ranks to ${newRanks}`);
			return;
		}

		// For queries, create a focused summary of relevant skills
		const relevantSkills = skillSummary.filter(skill => 
			question.toLowerCase().includes(skill.name) || 
			skill.ranks > 0
		);

		// Create a concise summary for GPT
		const summary = relevantSkills.map(skill => 
			`${skill.name}: total ${skill.total} (${skill.ranks} ranks, ${skill.ability} ${skill.abilityMod >= 0 ? '+' : ''}${skill.abilityMod}, misc ${skill.misc >= 0 ? '+' : ''}${skill.misc})`
		).join('\n');

		// Create a focused prompt for skill questions
		const skillPrompt = `You are a helpful game assistant. Answer questions about the character's skills based on this information:\n${summary}\n\nKeep responses concise and format them in HTML. When breaking down skill bonuses, use tables for clarity.`;
		const reply = await getGptReplyAsHtml(question, skillPrompt);

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
		console.error(`${moduleName} | Failed to provide skills response.`, e);
		ui.notifications.error(e.message, {permanent: true, console: false});
	}
}
