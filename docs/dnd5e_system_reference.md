# D&D 5E System Reference for Foundry VTT

## Actor Data Structure
### Abilities
```javascript
// Access ability scores
actor.system.abilities.str.value  // Base strength score
actor.system.abilities.str.mod    // Ability modifier
actor.system.abilities.str.save   // Save modifier

// Other abilities follow same pattern:
// str, dex, con, int, wis, cha
```

### Health & Combat Stats
```javascript
actor.system.attributes.hp.value    // Current HP
actor.system.attributes.hp.max      // Maximum HP
actor.system.attributes.hp.temp     // Temporary HP
actor.system.attributes.ac.value    // Armor Class
actor.system.attributes.prof        // Proficiency bonus
```

### Skills
```javascript
actor.system.skills.acr.value    // Acrobatics proficiency level (0, 0.5, 1, 2)
actor.system.skills.acr.total    // Total modifier including ability and proficiency
actor.system.skills.acr.passive  // Passive skill value (10 + total)

// Common skills: acr (Acrobatics), ani (Animal Handling), arc (Arcana), etc.
```

### Items & Inventory
```javascript
actor.items  // Collection of all actor's items
// Each item has:
item.type        // weapon, equipment, consumable, tool, backpack, spell, feat
item.name        // Item name
item.system.quantity     // Item quantity
item.system.equipped     // Is item equipped (boolean)
item.system.attunement  // Attunement status (0-2)
```

### Spellcasting
```javascript
actor.system.spells    // Spell slot data per level
actor.items.filter(i => i.type === 'spell')  // All spells
spell.system.preparation.prepared  // Is spell prepared
spell.system.level     // Spell level (0-9)
```

## Implementation Notes

### Search Functions
When searching for items, consider:
- Equipment state (equipped/attuned)
- Item type variations (weapon vs weapons)
- Common synonyms (healing vs cure)

### Known Issues & Solutions
1. Spell Slots
   - Problem: Pact magic vs traditional slots
   - Solution: Check `actor.system.spells.pact` separately

2. Proficiency
   - Problem: Skills can have expertise (2x prof)
   - Solution: Use `total` property for final values

## Evolution Log

### 2024-01-24
- Initial documentation of 5E system structure
- Added notes about item searching
- Documented spell slot handling

### TODO
- [ ] Add support for class features
- [ ] Document conditions and effects
- [ ] Add support for multiclassing 