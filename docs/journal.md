# Development Journal

## Changes and Improvements

### Command System
- Added `/? ` command for general game system-specific GPT queries
- Added `/i` command for inventory management
- Added `/s` command for skill management and queries

### Game System Integration
- Implemented system-specific prompts for different game systems (D&D 5E, PF1, PF2E, Ironsworn)
- Added detection of current game system for appropriate prompt selection
- Maintained system-specific terminology and rules in GPT responses

### Inventory Management (`/i` command)
- Implemented natural language parsing for inventory actions
- Added support for:
  - Adding/removing items
  - Setting item quantities
  - Equipping/unequipping items
  - Transferring items between characters
- Improved item name matching with fuzzy search

### Skills System (`/s` command)
- Added skill query and modification capabilities
- Implemented PF1 skill abbreviation mapping (e.g., "per" for Perception)
- Added support for:
  - Querying skill ranks and totals
  - Breaking down skill bonuses
  - Modifying skill ranks

### Optimization
- Reduced data sent to GPT by filtering relevant skills
- Improved error messages for better user feedback
- Added proper skill name resolution from abbreviations

## Known Issues

### Skill Modification
- Currently investigating issues with updating skill ranks in PF1 system
- Need to determine correct data structure for skill updates
- Attempted both `data.skills` and `system.skills` paths

### Future Improvements Needed
1. Verify and fix skill rank modification
2. Add validation for skill rank limits
3. Consider adding support for class skills and other PF1-specific skill features
4. Improve error handling for failed updates

## Technical Notes
- PF1 system uses abbreviated skill names (e.g., "per" for Perception)
- Skills data structure includes: rank, ability, mod, rt (requires training), acp (armor check penalty)
- Need to investigate proper method for updating character sheet data in PF1 system 