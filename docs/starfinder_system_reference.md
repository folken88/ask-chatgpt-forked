# Starfinder System Reference for Foundry VTT

## Actor Data Structure
### Abilities
```javascript
// Access ability scores
actor.system.abilities.str.value  // Base strength score
actor.system.abilities.str.mod    // Ability modifier
actor.system.abilities.str.base   // Base value before modifications

// Other abilities follow same pattern:
// str, dex, con, int, wis, cha
```

### Health & Combat Stats
```javascript
actor.system.attributes.hp.value     // Current HP
actor.system.attributes.hp.max       // Maximum HP
actor.system.attributes.hp.temp      // Temporary HP
actor.system.attributes.sp.value     // Current Stamina Points
actor.system.attributes.sp.max       // Maximum Stamina Points
actor.system.attributes.eac.value    // Energy Armor Class
actor.system.attributes.kac.value    // Kinetic Armor Class
```

### Skills
```javascript
actor.system.skills    // All skills object
// Each skill has:
skill.value           // Total modifier
skill.ranks           // Number of ranks
skill.ability        // Key ability
skill.mod            // Ability modifier
skill.isTrainedOnly  // Requires training to use

// Common skills: acr (Acrobatics), ath (Athletics), blu (Bluff), com (Computers), etc.
```

### Items & Inventory
```javascript
actor.items  // Collection of all actor's items
// Each item has:
item.type        // weapon, equipment, consumable, goods, container, technological, magic, hybrid
item.name        // Item name
item.system.quantity     // Item quantity
item.system.equipped     // Is item equipped
item.system.level       // Item level
item.system.bulk        // Item bulk value
```

### Weapons & Combat
```javascript
// Weapon data
weapon.system.weaponType     // Energy, Kinetic, etc.
weapon.system.damage        // Weapon damage formula
weapon.system.critical     // Critical hit effects
weapon.system.range        // Weapon range
weapon.system.capacity     // Ammunition capacity
weapon.system.usage        // Power usage

// Attack bonuses
actor.system.attributes.bab  // Base Attack Bonus
```

## Implementation Notes

### Search Functions
When searching for items, consider:
- Technology level
- Power requirements
- Bulk calculations
- Weapon categories (small arms, long arms, heavy weapons)

### Known Issues & Solutions
1. Hybrid Items
   - Problem: Items can be both technological and magical
   - Solution: Check item.system.hybrid property

2. Ammunition Tracking
   - Problem: Different weapon types use different ammunition systems
   - Solution: Check weapon.system.ammunitionType

## Evolution Log

### 2024-01-24
- Initial documentation of Starfinder system structure
- Added notes about hybrid items
- Documented weapon systems

### TODO
- [ ] Add support for starship combat
- [ ] Document drone companions
- [ ] Add support for augmentations