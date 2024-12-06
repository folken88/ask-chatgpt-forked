# Pathfinder 1E System Reference for Foundry VTT

## Actor Data Structure
### Abilities
```javascript
// Access ability scores
actor.system.abilities.str.value  // Base strength score
actor.system.abilities.str.mod    // Strength modifier
actor.system.abilities.str.total  // Total strength score with modifiers

// Other abilities follow same pattern:
// str, dex, con, int, wis, cha
```

### Combat Stats
```javascript
// Armor Class
actor.system.attributes.ac.normal.total    // Total AC
actor.system.attributes.ac.touch.total     // Touch AC
actor.system.attributes.ac.flatFooted.total // Flat-footed AC

// Base Attack Bonus
actor.system.attributes.bab.total          // Total BAB

// Combat Maneuver
actor.system.attributes.cmb.total          // CMB total
actor.system.attributes.cmd.total          // CMD total

// Saving Throws
actor.system.attributes.savingThrows.fort.total  // Fortitude save
actor.system.attributes.savingThrows.ref.total   // Reflex save
actor.system.attributes.savingThrows.will.total  // Will save

// Initiative
actor.system.attributes.init.total         // Initiative modifier
```

### Health & Resources
```javascript
actor.system.attributes.hp.value    // Current HP
actor.system.attributes.hp.max      // Maximum HP
actor.system.attributes.hp.temp     // Temporary HP
actor.system.attributes.wounds      // Wound Points
actor.system.attributes.vigor      // Vigor Points
```

### Items & Inventory
```javascript
actor.items  // Collection of all actor's items
// Each item has:
item.name        // Item name
item.type        // Item type (weapon, equipment, consumable, etc.)
item.system.quantity  // Item quantity
item.system.equipped  // Is item equipped
item.system.carried   // Is item carried
```

### Skills
```javascript
// Access skills
actor.system.skills    // All skills object
// Each skill has:
skill.mod             // Total skill bonus
skill.ranks           // Ranks invested
skill.ability         // Key ability (str, dex, etc.)
skill.abilityMod      // Ability modifier value
skill.cs              // Class skill (boolean)
skill.rt              // Requires training (boolean)
skill.acp             // Affected by armor check penalty (boolean)
skill.notes           // Skill notes/breakdown
skill.subSkills       // Sub-skills if any

// Common skills:
actor.system.skills.per     // Perception
actor.system.skills.acr     // Acrobatics
actor.system.skills.blf     // Bluff
actor.system.skills.clm     // Climb
actor.system.skills.dip     // Diplomacy
actor.system.skills.dis     // Disable Device
actor.system.skills.esc     // Escape Artist
actor.system.skills.fly     // Fly
actor.system.skills.han     // Handle Animal
actor.system.skills.hea     // Heal
actor.system.skills.int     // Intimidate
actor.system.skills.kar     // Knowledge (Arcana)
actor.system.skills.kdu     // Knowledge (Dungeoneering)
actor.system.skills.ken     // Knowledge (Engineering)
actor.system.skills.kge     // Knowledge (Geography)
actor.system.skills.khi     // Knowledge (History)
actor.system.skills.klo     // Knowledge (Local)
actor.system.skills.kna     // Knowledge (Nature)
actor.system.skills.kno     // Knowledge (Nobility)
actor.system.skills.kpl     // Knowledge (Planes)
actor.system.skills.kre     // Knowledge (Religion)
actor.system.skills.lin     // Linguistics
actor.system.skills.prf     // Perform
actor.system.skills.pro     // Profession
actor.system.skills.rid     // Ride
actor.system.skills.sen     // Sense Motive
actor.system.skills.slt     // Sleight of Hand
actor.system.skills.spl     // Spellcraft
actor.system.skills.ste     // Stealth
actor.system.skills.sur     // Survival
actor.system.skills.swm     // Swim
actor.system.skills.umd     // Use Magic Device

// Get skill modifiers
skill.mod            // Total modifier
skill.abilityMod     // Ability score modifier
skill.ranks          // Ranks in skill
actor.system.attributes.acp.total  // Armor check penalty (if applicable)
```

### Feats & Features
```javascript
// Access feats
actor.items.filter(i => i.type === 'feat')  // All feats
// Each feat has:
feat.name           // Feat name
feat.system.description.value  // Description
feat.system.featType    // Feat type (combat, general, etc.)
feat.system.associations.classes  // Associated classes
feat.system.changes     // Changes/bonuses from feat

// Access features
actor.items.filter(i => i.type === 'feature')  // Class/racial features
// Similar structure to feats
```

### Changes & Bonuses
```javascript
// Access all changes (bonuses/penalties)
actor.system.changes   // Array of all changes
// Each change has:
change.formula      // Bonus/penalty value
change.operator    // How it's applied (+, -, =, etc.)
change.subTarget   // What it affects (skill, save, etc.)
change.modifier    // Modifier type (circumstance, enhancement, etc.)
change.source      // Where it comes from (feat, item, etc.)
```

### Actor Modification
```javascript
// Modify skill ranks
actor.update({
    "system.skills.per.ranks": currentRanks + 1  // Add 1 rank to perception
});

// Add items to inventory
actor.createEmbeddedDocuments("Item", [{
    name: "Arrow",
    type: "loot",
    system: {
        quantity: 20,
        weight: 0.15,
        price: 0.05,
        identified: true
    }
}]);

// Modify item quantities
const arrows = actor.items.find(i => i.name === "Arrow");
if (arrows) {
    arrows.update({
        "system.quantity": arrows.system.quantity + 20
    });
}

// Remove items
actor.deleteEmbeddedDocuments("Item", [itemId]);

// Check available skill points
actor.system.details.level.value  // Character level
actor.system.details.skillPoints  // Available skill points
```

### Safety Checks
When modifying actors, always verify:
1. User has permission to modify actor
2. Changes are within game rules
   - Skill ranks don't exceed level
   - Character has enough skill points
   - Item quantities are reasonable
3. Changes are logged for GM review

### Command Recognition
Common modification patterns:
```javascript
// Skill modifications
/add \d+ (?:rank|ranks) (?:to|in) (.+)/i
/remove \d+ (?:rank|ranks) (?:from|in) (.+)/i

// Inventory modifications
/add \d+ (.+) to (?:inventory|backpack)/i
/remove \d+ (.+) from (?:inventory|backpack)/i
```

## Implementation Notes

### Search Functions
When searching for items, consider:
- Item state (equipped/carried)
- Magic item types (wondrous items, rings, etc.)
- Consumable types (potions, scrolls, wands)

### Skill Queries
When handling skill queries, consider:
- Basic query: Just show total bonus (e.g., "Perception +10")
- Detailed query: Show full breakdown with each component
- Look for keywords:
  - Basic: "what is", "how much", "tell me"
  - Detailed: "explain", "why", "how", "breakdown"

### GPT Context Optimization
IMPORTANT: Only send GPT the data it needs for each query type!
1. Basic skill query:
   ```javascript
   actorContext = `${skillName}: ${skill.mod}`;
   ```

2. Skill breakdown:
   ```javascript
   actorContext = `Skill Details:
   Skill: ${skillName}
   Total Bonus: ${skill.mod}
   Ability (${skill.ability}): ${abilityMod}
   Ranks: ${skill.rank}
   Class Skill: ${skill.cs ? "Yes (+3)" : "No"}`;
   ```

3. Inventory search:
   ```javascript
   actorContext = `Inventory Search Results: ${itemSearchResults}`;
   ```

### Known Issues & Solutions
1. Skill Access
   - Problem: Skills use abbreviated keys (per, ste, etc.)
   - Solution: Maintain a mapping of full names to keys
   ```javascript
   const skillMap = {
       'perception': 'per',
       'stealth': 'ste',
       'acrobatics': 'acr'
   };
   ```

2. Skill Modifiers
   - Problem: Need to account for all bonus sources
   - Solution: Check in this order:
     1. Base ability modifier
     2. Ranks (if any)
     3. Class skill bonus (+3 if has ranks)
     4. Armor check penalty (if applicable)
     5. Misc modifiers

3. Response Format
   - Problem: Responses need to be screen-reader friendly
   - Solution: Keep responses extremely concise
   - Basic queries: Just the number
   - Breakdowns: One line per component

### Actor Modifications
IMPORTANT: Handle modifications carefully!
1. Basic modification flow:
   ```javascript
   // 1. Parse command
   const match = query.match(/add (\d+) ranks? to (.+)/i);
   const [_, amount, skillName] = match;
   
   // 2. Validate request
   if (!hasPermission || !enoughSkillPoints) {
     return "Cannot modify: [reason]";
   }
   
   // 3. Make change
   await actor.update({...});
   
   // 4. Confirm change
   return "Added 1 rank to Perception (new total: +11)";
   ```

2. Inventory changes:
   - Check if item exists first
   - Create new or update quantity
   - Handle weight calculations
   - Consider container limits

3. Response Format:
   - Confirm the change
   - Show new total/value
   - Indicate if partially successful

## Evolution Log

### 2024-01-24
- Initial implementation of item search
- Added support for potion searching
- Improved error handling

### 2024-01-25
- Added skill system documentation
- Fixed skill access and breakdowns
- Optimized GPT context for different query types
- Learned: Only send GPT the minimum data needed
- Learned: Keep responses concise for screen readers
- Learned: Use proper PF1E skill keys and modifiers
- Added actor modification capabilities
- Learned: Always validate before modifying
- Learned: Confirm changes in response
- Learned: Check permissions and game rules

### TODO
- [ ] Add support for conditional modifiers
- [ ] Implement spell searching
- [ ] Add support for feat queries
- [ ] Add more skill name mappings
- [ ] Consider adding common skill aliases
- [ ] Add skill point tracking
- [ ] Implement inventory management
- [ ] Add weight/encumbrance checks
- [ ] Add GM notification system
- [ ] Implement undo/redo for changes