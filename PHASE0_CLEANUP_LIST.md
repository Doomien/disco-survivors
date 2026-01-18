# Phase 0 Cleanup List

This file contains a list of duplicate files that can be safely removed after Phase 1 is complete and tested.

## Status
- **Created**: Phase 0
- **To be executed**: After Phase 1 testing is complete
- **DO NOT DELETE** these files until the game works with new paths

## Files to Remove After Phase 1 Testing

### Old Asset Directories (entire directories)
```bash
# Remove old character directories
rm -rf assets/characters/

# Remove old items and environment (if moved to new structure)
# Note: Only remove if Phase 1 successfully migrates all references
```

### Specific Files to Remove

#### Old Enemy Sprites (assets/characters/enemies/)
- All files in `assets/characters/enemies/`
  - skeleton-1.png (→ moved to assets/base/characters/enemies/)
  - skeleton-2.png (→ moved to assets/base/characters/enemies/)
  - 001_DangerDisc2.png (→ moved to assets/custom/characters/enemies/)
  - 001_DangerDiscb.png (→ moved to assets/custom/characters/enemies/)
  - 002_Trangle.png (→ moved to assets/custom/characters/enemies/)
  - 002_Trangle2.png (→ moved to assets/custom/characters/enemies/)
  - 003_Tomato.png (→ moved to assets/custom/characters/enemies/)
  - 003_Tomato2.png (→ moved to assets/custom/characters/enemies/)
  - 004_TheSharpSpiral.png (→ moved to assets/custom/characters/enemies/)
  - 004_TheSharpSpiral2.png (→ moved to assets/custom/characters/enemies/)
  - 005_13LeggedMonster.png (→ moved to assets/custom/characters/enemies/)
  - 005_13LeggedMonster1.png (→ moved to assets/custom/characters/enemies/)
  - 005_13LeggedMonster2.png (→ moved to assets/custom/characters/enemies/)
  - 005_13LeggedMonster3.png (→ moved to assets/custom/characters/enemies/)
  - 006_ElectrifiedSword.png (→ moved to assets/custom/characters/enemies/)
  - 006_ElectrifiedSword1.png (→ moved to assets/custom/characters/enemies/)
  - 006_ElectrifiedSword2.png (→ moved to assets/custom/characters/enemies/)
  - 006_ElectrifiedSword3.png (→ moved to assets/custom/characters/enemies/)
  - 007_TRainbowsaurusRex.png (→ moved to assets/custom/characters/enemies/)
  - 007_TRainbowsaurusRex1.png (→ moved to assets/custom/characters/enemies/)
  - 007_TRainbowsaurusRex2.png (→ moved to assets/custom/characters/enemies/)
  - 007_TRainbowsaurusRex3.png (→ moved to assets/custom/characters/enemies/)
  - 007_TRainbowsaurusRex4.png (→ moved to assets/custom/characters/enemies/)
  - 007_TRainbowsaurusRex5.png (→ moved to assets/custom/characters/enemies/)
  - RegularFlower-LRG.png (→ moved to assets/custom/characters/enemies/)
  - SkaryTeeth_Pixel.png (→ moved to assets/custom/characters/enemies/)

#### Old Player Sprites (assets/characters/player/)
- All files in `assets/characters/player/`
  - player-1.png (→ moved to assets/base/characters/player/)
  - player-2.png (→ moved to assets/base/characters/player/)
  - sean.png (→ moved to assets/custom/characters/player/)
  - Microwave Man_Pixel.png (→ moved to assets/custom/characters/player/)
  - Colink1.png (→ moved to assets/custom/characters/player/)
  - Colink2.png (→ moved to assets/custom/characters/player/)
  - Colink3.png (→ moved to assets/custom/characters/player/)
  - Colink4.png (→ moved to assets/custom/characters/player/)

#### Old Item Sprites (assets/items/)
- All files in `assets/items/`
  - ball-1.png (→ moved to assets/base/items/)
  - ball-2.png (→ moved to assets/base/items/)
  - candy.png (→ moved to assets/base/items/)
  - candy-dropped.png (→ moved to assets/base/items/)
  - mic.png (→ moved to assets/base/items/)
  - RegularFlower.png (→ moved to assets/custom/items/)

#### Old Environment Assets (assets/environment/)
- All files in `assets/environment/`
  - Zelda-Style-Test.png (→ moved to assets/base/environment/)
  - Zelda-Style-Test.png.bak2 (→ moved to assets/base/environment/)

## Cleanup Script

Once Phase 1 testing is complete and the game works with new paths, run:

```bash
# Navigate to project root
cd /home/user/disco-survivors

# Remove old character directories
rm -rf assets/characters/

# Remove old items directory
rm -rf assets/items/

# Remove old environment directory
rm -rf assets/environment/

# Verify cleanup
echo "Old asset directories removed. New structure:"
find assets/ -type d | sort
```

## Verification Checklist

Before running cleanup:
- [ ] Phase 1 complete - all code references updated to new paths
- [ ] Game tested and working with new asset paths
- [ ] Character editor tested with new paths
- [ ] API tested with new paths
- [ ] Docker tested with new volume mounts
- [ ] No errors in browser console related to missing assets
- [ ] Backup created (already exists: characters.json.backup, config/characters.json.phase0-backup)

## Notes

- The new directory structure separates base content from custom content
- Base content: minimal set for game to function (skeleton enemies, basic player, items, environment)
- Custom content: all additional characters and items (gitignored)
- After cleanup, old `assets/characters/`, `assets/items/`, and `assets/environment/` will be gone
- New structure: `assets/base/` and `assets/custom/`
