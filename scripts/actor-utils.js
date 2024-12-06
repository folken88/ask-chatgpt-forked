import { moduleName } from './settings.js';

export function getActiveActor() {
    console.debug(`${moduleName} | Getting active actor...`);
    
    // Get the active token's actor, or the user's character
    const token = canvas.tokens.controlled[0];
    
    if (token?.actor) {
        console.debug(`${moduleName} | Found token actor:`, token.actor.name);
        // Check if user has permission to see this actor
        if (!token.actor.testUserPermission(game.user, "LIMITED")) {
            console.debug(`${moduleName} | User lacks permission to view actor:`, token.actor.name);
            return null;
        }
        return token.actor;
    }
    
    // Fall back to user's assigned character
    const character = game.user.character;
    if (character && character.testUserPermission(game.user, "LIMITED")) {
        console.debug(`${moduleName} | Using user's assigned character:`, character.name);
        return character;
    }
    
    console.debug(`${moduleName} | No accessible actor found for user:`, game.user.name);
    return null;
}

export function getActorByName(name) {
    // First check if it's the user's character
    const character = game.user.character;
    if (character?.name.toLowerCase() === name.toLowerCase() && 
        character.testUserPermission(game.user, "LIMITED")) {
        return character;
    }
    
    // Then check visible tokens
    const token = canvas.tokens.placeables.find(t => 
        t.name.toLowerCase() === name.toLowerCase() && 
        t.actor?.testUserPermission(game.user, "LIMITED")
    );
    
    if (token?.actor) {
        return token.actor;
    }
    
    console.debug(`${moduleName} | Actor not found or not accessible:`, name);
    return null;
}

export function getActorHP(actor) {
    if (!actor) return { current: 0, max: 0 };
    
    if (game.system.id === 'pf1') {
        return {
            current: actor.system.attributes.hp.value,
            max: actor.system.attributes.hp.max,
            temp: actor.system.attributes.hp.temp || 0,
            wounds: actor.system.attributes.wounds || 0,
            vigor: actor.system.attributes.vigor || 0
        };
    }
    
    if (game.system.id === 'dnd5e') {
        return {
            current: actor.system.attributes.hp.value,
            max: actor.system.attributes.hp.max,
            temp: actor.system.attributes.hp.temp || 0
        };
    }
    
    return { current: 0, max: 0 };
}

export function getActorAC(actor) {
    if (!actor) return { normal: 0, touch: 0, flatFooted: 0 };
    
    if (game.system.id === 'pf1') {
        return {
            normal: actor.system.attributes.ac.normal.total,
            touch: actor.system.attributes.ac.touch.total,
            flatFooted: actor.system.attributes.ac.flatFooted.total
        };
    }
    
    if (game.system.id === 'dnd5e') {
        return {
            normal: actor.system.attributes.ac.value,
            touch: null,
            flatFooted: null
        };
    }
    
    return { normal: 0, touch: 0, flatFooted: 0 };
}

export function getActorSaves(actor) {
    if (!actor) return { fort: 0, ref: 0, will: 0 };
    
    if (game.system.id === 'pf1') {
        return {
            fort: actor.system.attributes.savingThrows.fort.total,
            ref: actor.system.attributes.savingThrows.ref.total,
            will: actor.system.attributes.savingThrows.will.total
        };
    }
    
    return { fort: 0, ref: 0, will: 0 };
}

export function getActorBAB(actor) {
    if (!actor) return 0;
    
    if (game.system.id === 'pf1') {
        return actor.system.attributes.bab.total;
    }
    
    return 0;
}

export function getActorCMB(actor) {
    if (!actor) return { cmb: 0, cmd: 0 };
    
    if (game.system.id === 'pf1') {
        return {
            cmb: actor.system.attributes.cmb.total,
            cmd: actor.system.attributes.cmd.total
        };
    }
    
    return { cmb: 0, cmd: 0 };
}

export function getActorAttributes(actor) {
    if (!actor) return {};
    
    if (game.system.id === 'pf1') {
        const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        return abilities.reduce((acc, ability) => {
            const abilityData = actor.system.abilities[ability];
            acc[ability] = {
                value: abilityData.value,
                mod: abilityData.mod,
                total: abilityData.total
            };
            return acc;
        }, {});
    }
    
    if (game.system.id === 'dnd5e') {
        const attrs = actor.system.abilities;
        return Object.entries(attrs).reduce((acc, [key, value]) => {
            acc[key] = {
                value: value.value,
                mod: value.mod,
                save: value.save
            };
            return acc;
        }, {});
    }
    
    return {};
}

export function getActorItems(actor) {
    if (!actor) return [];
    return actor.items.map(item => ({
        name: item.name,
        type: item.type,
        quantity: item.system.quantity || 1,
        equipped: item.system.equipped || false,
        carried: item.system.carried || false
    }));
}

export function getActorBuffs(actor) {
    if (!actor) return [];
    
    if (game.system.id === 'pf1') {
        return actor.effects.map(effect => effect.label);
    }
    return [];
}

export function searchActorItems(actor, searchTerm) {
    console.debug(`${moduleName} | Searching items for term:`, searchTerm);
    
    if (!actor) {
        console.debug(`${moduleName} | No actor provided for item search`);
        return [];
    }
    
    const search = searchTerm.toLowerCase();
    const searchTerms = [search];
    
    // Add common variations for items
    if (search.includes('arrow')) {
        searchTerms.push('arrow', 'arrows');
    } else if (search.includes('potion')) {
        searchTerms.push('potion', 'potions', 'cure', 'healing');
    }
    
    console.debug(`${moduleName} | Search terms:`, searchTerms);
    
    // Get all items first
    const allItems = actor.items.toObject();
    console.debug(`${moduleName} | All actor items:`, allItems);
    
    // Search through items
    const items = allItems
        .filter(item => {
            const itemName = item.name.toLowerCase();
            const matches = searchTerms.some(term => itemName.includes(term));
            console.debug(`${moduleName} | Item check:`, {
                item: item.name,
                quantity: item.system.quantity,
                matches: matches
            });
            return matches;
        })
        .map(item => {
            const quantity = Number(item.system.quantity) || 0;
            console.debug(`${moduleName} | Mapped item:`, {
                name: item.name,
                quantity: quantity,
                type: item.type
            });
            return {
                name: item.name,
                quantity: quantity
            };
        });
    
    console.debug(`${moduleName} | Found items:`, items);
    return items;
}

export function summarizeItems(items) {
    console.debug(`${moduleName} | Summarizing items:`, items);
    
    if (!items || items.length === 0) {
        return "No matching items found.";
    }
    
    const itemCounts = items.reduce((acc, item) => {
        const key = item.name;
        const qty = Number(item.quantity) || 0;
        acc[key] = (acc[key] || 0) + qty;
        console.debug(`${moduleName} | Counting item:`, {
            name: key,
            quantity: qty,
            runningTotal: acc[key]
        });
        return acc;
    }, {});
    
    console.debug(`${moduleName} | Item counts:`, itemCounts);
    
    const summaries = Object.entries(itemCounts)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => count > 1 ? `${count}x ${name}` : name);
    
    const summary = summaries.join(", ");
    console.debug(`${moduleName} | Final summary:`, summary);
    
    return summary;
}

export function getActorSkills(actor) {
    if (!actor) return {};
    
    if (game.system.id === 'pf1') {
        // Debug log the raw skills data
        console.debug('Raw skills data:', actor.system.skills);
        
        return Object.entries(actor.system.skills).reduce((acc, [key, skill]) => {
            if (typeof skill === 'object' && skill !== null) {
                // Debug log each skill as we process it
                console.debug(`Processing skill ${key}:`, skill);
                
                acc[key] = {
                    total: skill.mod || 0,  // Changed from value to mod
                    rank: skill.ranks || 0,  // Changed from rank to ranks
                    ability: skill.ability,
                    abilityMod: skill.abilityMod || 0,  // Changed from abilityModifier
                    misc: skill.mod || 0,
                    isTrained: skill.rt || false,
                    isClassSkill: skill.cs || false,
                    subSkills: skill.subSkills || {},
                    breakdown: skill.notes || []  // Changed from breakdown to notes
                };
            }
            return acc;
        }, {});
    }
    
    return {};
}

export function getSkillBreakdown(actor, skillKey) {
    if (!actor || !skillKey) return null;
    
    if (game.system.id === 'pf1') {
        const skill = actor.system.skills[skillKey];
        if (!skill) {
            console.debug(`Skill ${skillKey} not found. Available skills:`, Object.keys(actor.system.skills));
            return null;
        }
        
        // Debug log the raw skill data
        console.debug(`Raw skill data for ${skillKey}:`, skill);
        
        const breakdown = {
            total: skill.mod || 0,  // Changed from value to mod
            components: [
                {
                    name: `${skill.ability} modifier`,
                    value: skill.abilityMod || 0  // Changed from abilityModifier
                },
                {
                    name: "Ranks",
                    value: skill.ranks || 0  // Changed from rank to ranks
                }
            ]
        };
        
        // Add class skill bonus if applicable
        if (skill.cs && skill.ranks > 0) {
            breakdown.components.push({
                name: "Class skill",
                value: 3
            });
        }
        
        // Add armor check penalty if applicable
        if (skill.acp && actor.system.attributes.acp.total) {
            breakdown.components.push({
                name: "Armor check penalty",
                value: actor.system.attributes.acp.total
            });
        }
        
        // Add misc modifiers
        if (skill.mod) {
            breakdown.components.push({
                name: "Misc modifiers",
                value: skill.mod
            });
        }
        
        // Add bonuses from changes/effects if they exist
        const changes = actor.system.changes?.filter(c => 
            c.subTarget === skillKey || 
            c.subTarget === `skill.${skillKey}` ||
            c.subTarget === 'skills'
        );
        
        if (changes?.length > 0) {
            changes.forEach(change => {
                breakdown.components.push({
                    name: `${change.modifier} bonus`,
                    value: Number(change.formula) || 0
                });
            });
        }
        
        return breakdown;
    }
    
    return null;
}

export function getActorSummary(actor) {
    if (!actor) return {
        name: "No actor selected",
        health: "0/0",
        ac: { normal: 0, touch: 0, flatFooted: 0 },
        attributes: {},
        saves: { fort: 0, ref: 0, will: 0 },
        bab: 0,
        cmb: { cmb: 0, cmd: 0 },
        skills: {}
    };
    
    if (game.system.id === 'pf1') {
        const hp = getActorHP(actor);
        const ac = getActorAC(actor);
        const attrs = getActorAttributes(actor);
        const saves = getActorSaves(actor);
        const bab = getActorBAB(actor);
        const cmb = getActorCMB(actor);
        const skills = getActorSkills(actor);
        
        return {
            name: actor.name || "Unknown",
            health: `${hp.current}/${hp.max}${hp.temp ? ` (+${hp.temp})` : ''}`,
            ac: ac,
            attributes: attrs || {},
            saves: saves,
            bab: bab,
            cmb: cmb,
            skills: skills
        };
    }
    
    return {
        name: actor.name || "Unknown",
        health: "0/0",
        ac: { normal: 0, touch: 0, flatFooted: 0 },
        attributes: {},
        saves: { fort: 0, ref: 0, will: 0 },
        bab: 0,
        cmb: { cmb: 0, cmd: 0 },
        skills: {}
    };
}

export async function modifySkillRanks(actor, skillName, amount) {
    if (!actor || !skillName) return { success: false, message: "Invalid request" };
    
    // Check permissions
    if (!actor.isOwner) {
        return { success: false, message: "You don't have permission to modify this character" };
    }
    
    // Map skill name to key
    const skillMap = {
        'perception': 'per',
        'stealth': 'ste',
        'acrobatics': 'acr',
        // Add more mappings as needed
    };
    const skillKey = skillMap[skillName.toLowerCase()] || skillName.toLowerCase();
    
    // Get the skill
    const skill = actor.system.skills[skillKey];
    if (!skill) {
        return { success: false, message: `Skill '${skillName}' not found` };
    }
    
    // Validate skill points and ranks
    const currentRanks = skill.ranks || 0;
    const maxRanks = actor.system.details.level.value;
    const newRanks = currentRanks + amount;
    
    if (newRanks < 0) {
        return { success: false, message: "Cannot reduce ranks below 0" };
    }
    if (newRanks > maxRanks) {
        return { success: false, message: `Cannot exceed maximum ranks (${maxRanks}) for your level` };
    }
    
    // Make the change
    try {
        await actor.update({
            [`system.skills.${skillKey}.ranks`]: newRanks
        });
        
        // Get new total for confirmation
        const updatedSkill = actor.system.skills[skillKey];
        return {
            success: true,
            message: `Added ${amount} rank${amount !== 1 ? 's' : ''} to ${skillName} (new total: ${updatedSkill.mod})`
        };
    } catch (error) {
        console.error("Error modifying skill ranks:", error);
        return { success: false, message: "Error modifying skill ranks" };
    }
}

export async function modifyInventory(actor, itemName, amount) {
    if (!actor || !itemName) return { success: false, message: "Invalid request" };
    
    // Check permissions
    if (!actor.isOwner) {
        return { success: false, message: "You don't have permission to modify this character" };
    }
    
    try {
        console.debug(`${moduleName} | Modifying inventory:`, { itemName, amount });
        
        // Find existing item
        const existingItem = actor.items.find(i => 
            i.name.toLowerCase() === itemName.toLowerCase() ||
            i.name.toLowerCase().includes(itemName.toLowerCase())
        );
        
        console.debug(`${moduleName} | Found item:`, existingItem);
        
        if (existingItem) {
            // Update quantity
            const currentQty = existingItem.system.quantity || 0;
            const newQty = currentQty + amount;
            
            console.debug(`${moduleName} | Quantities:`, { current: currentQty, new: newQty });
            
            if (newQty < 0) {
                return { success: false, message: `Not enough ${itemName} (have ${currentQty})` };
            }
            
            if (newQty === 0) {
                // Delete item if quantity reaches 0
                await actor.deleteEmbeddedDocuments("Item", [existingItem.id]);
                return { success: true, message: `Removed all ${itemName}` };
            }
            
            // Update the item
            await existingItem.update({
                "system.quantity": newQty
            });
            
            // Verify the change
            const updatedItem = actor.items.get(existingItem.id);
            const verifiedQty = updatedItem?.system.quantity || 0;
            
            console.debug(`${moduleName} | Verified quantity:`, verifiedQty);
            
            if (verifiedQty !== newQty) {
                console.error(`${moduleName} | Quantity mismatch:`, { expected: newQty, actual: verifiedQty });
                return { success: false, message: "Failed to update quantity correctly" };
            }
            
            return {
                success: true,
                message: `Updated ${itemName} quantity from ${currentQty} to ${verifiedQty}`
            };
        } else if (amount > 0) {
            // Create new item
            const newItem = await actor.createEmbeddedDocuments("Item", [{
                name: itemName,
                type: "loot",
                system: {
                    quantity: amount,
                    weight: 0,  // Default weight
                    price: 0,   // Default price
                    identified: true
                }
            }]);
            
            console.debug(`${moduleName} | Created new item:`, newItem);
            
            return {
                success: true,
                message: `Added ${amount} ${itemName} to inventory`
            };
        } else {
            return { success: false, message: `${itemName} not found in inventory` };
        }
    } catch (error) {
        console.error("Error modifying inventory:", error);
        return { success: false, message: "Error modifying inventory" };
    }
} 