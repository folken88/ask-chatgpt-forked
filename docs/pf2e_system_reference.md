# Pathfinder 2E System Reference for Foundry VTT

## Actor Data Structure
### Abilities
```javascript
// Access ability scores
actor.system.abilities.str.value  // Base strength score
actor.system.abilities.str.mod    // Ability modifier
actor.system.abilities.str.dc     // Ability DC

// Other abilities follow same pattern:
// str, dex, con, int, wis, cha
```

### Health & Combat Stats
```javascript
actor.system.attributes.hp.value    // Current HP
actor.system.attributes.hp.max      // Maximum HP
actor.system.attributes.hp.temp     // Temporary HP
actor.system.attributes.ac.value    // Armor Class
actor.system.attributes.perception  // Perception modifier
```

### Skills
```javascript
actor.system.skills    // All skills object
// Each skill has:
skill.rank      // Training rank (0-4)
skill.value     // Total modifier
skill.ability   // Key ability for the skill
skill.prof      // Proficiency bonus component

// Proficiency ranks: 0 (untrained), 1 (trained), 2 (expert), 3 (master), 4 (legendary)
```

### Items & Inventory
```javascript
actor.items  // Collection of all actor's items
// Each item has:
item.type        // weapon, equipment, consumable, treasure, backpack, spell, feat
item.name        // Item name
item.system.quantity     // Item quantity
item.system.equipped     // Is item equipped
item.system.level.value  // Item level
```

### Spellcasting
```javascript
// Spellcasting entries
actor.system.spellcasting  // Array of spellcasting entries
entry.tradition   // arcane, divine, occult, primal
entry.spelldc     // Spell DC
entry.spellattack // Spell attack modifier

// Spells
spell.system.location.value  // Spell slot level
spell.system.prepared       // Preparation state for prepared casters
spell.system.components     // Spell components (verbal, somatic, material)
```

## Implementation Notes

### Search Functions
When searching for items, consider:
- Item level requirements
- Bulk and encumbrance
- Rarity (common, uncommon, rare, unique)

### Known Issues & Solutions
1. Proficiency
   - Problem: Complex proficiency calculation
   - Solution: Use `value` property for final total

2. Multiple Spell Lists
   - Problem: Characters can have multiple casting traditions
   - Solution: Check all spellcasting entries

## Evolution Log

### 2024-01-24
- Initial documentation of PF2E system structure
- Added notes about proficiency system
- Documented spellcasting entries

### TODO
- [ ] Add support for conditions and effects
- [ ] Document hero point system
- [ ] Add support for focus spells 