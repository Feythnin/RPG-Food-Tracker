import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shopItems = [
  // Consumables
  { name: 'Health Potion', description: 'Restores 1 health point', category: 'consumable', cost: 50, effect: '{"type":"heal","amount":1}', rarity: 'common', spriteColor: '#e74c3c' },
  { name: 'Greater Health Potion', description: 'Restores 3 health points', category: 'consumable', cost: 120, effect: '{"type":"heal","amount":3}', rarity: 'uncommon', spriteColor: '#c0392b' },
  { name: 'XP Scroll', description: 'Grants 50 bonus XP', category: 'consumable', cost: 75, effect: '{"type":"xp","amount":50}', rarity: 'common', spriteColor: '#f5c542' },
  { name: 'Greater XP Scroll', description: 'Grants 150 bonus XP', category: 'consumable', cost: 180, effect: '{"type":"xp","amount":150}', rarity: 'uncommon', spriteColor: '#d4a017' },
  { name: 'Shield Charm', description: 'Prevents 1 health loss for the day', category: 'consumable', cost: 100, effect: '{"type":"shield","duration":"day"}', rarity: 'uncommon', spriteColor: '#3498db' },
  { name: 'Lucky Coin', description: 'Double coins earned today', category: 'consumable', cost: 150, effect: '{"type":"double_coins","duration":"day"}', rarity: 'rare', spriteColor: '#f5c542' },

  // Cosmetics
  { name: 'Red Cape', description: 'A bold crimson cape', category: 'cosmetic', cost: 200, effect: '{"type":"cosmetic","slot":"cape","color":"#e74c3c"}', rarity: 'common', spriteColor: '#e74c3c' },
  { name: 'Blue Cape', description: 'A royal blue cape', category: 'cosmetic', cost: 200, effect: '{"type":"cosmetic","slot":"cape","color":"#3498db"}', rarity: 'common', spriteColor: '#3498db' },
  { name: 'Purple Cape', description: 'A mystical purple cape', category: 'cosmetic', cost: 200, effect: '{"type":"cosmetic","slot":"cape","color":"#9b59b6"}', rarity: 'common', spriteColor: '#9b59b6' },
  { name: 'Golden Crown', description: 'A crown fit for a champion', category: 'cosmetic', cost: 500, effect: '{"type":"cosmetic","slot":"hat","color":"#f5c542"}', rarity: 'rare', spriteColor: '#f5c542' },
  { name: 'Shadow Helm', description: 'A dark helm of mystery', category: 'cosmetic', cost: 400, effect: '{"type":"cosmetic","slot":"hat","color":"#2c3e50"}', rarity: 'uncommon', spriteColor: '#2c3e50' },
  { name: 'Flame Aura', description: 'Burning aura surrounds you', category: 'cosmetic', cost: 750, effect: '{"type":"cosmetic","slot":"aura","color":"#e67e22"}', rarity: 'rare', spriteColor: '#e67e22' },
  { name: 'Frost Aura', description: 'Icy aura chills the air', category: 'cosmetic', cost: 750, effect: '{"type":"cosmetic","slot":"aura","color":"#00bcd4"}', rarity: 'rare', spriteColor: '#00bcd4' },

  // Mystery Boxes
  { name: 'Bronze Mystery Box', description: 'Contains a random common or uncommon item', category: 'mystery_box', cost: 100, effect: '{"type":"mystery","pool":["common","uncommon"],"weights":[70,30]}', rarity: 'common', spriteColor: '#cd7f32' },
  { name: 'Silver Mystery Box', description: 'Contains a random uncommon or rare item', category: 'mystery_box', cost: 250, effect: '{"type":"mystery","pool":["uncommon","rare"],"weights":[60,40]}', rarity: 'uncommon', spriteColor: '#c0c0c0' },
  { name: 'Gold Mystery Box', description: 'Contains a random rare or legendary item', category: 'mystery_box', cost: 500, effect: '{"type":"mystery","pool":["rare","legendary"],"weights":[70,30]}', rarity: 'rare', spriteColor: '#ffd700' },
];

async function main() {
  console.log('Seeding shop items...');

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { id: shopItems.indexOf(item) + 1 },
      update: item,
      create: item,
    });
  }

  console.log(`Seeded ${shopItems.length} shop items.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
