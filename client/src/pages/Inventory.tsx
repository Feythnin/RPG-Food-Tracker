import { useInventory, useUseItem, useEquipItem } from '../hooks/useShop';
import { useGameState } from '../hooks/useGame';

interface ShopItem {
  id: number;
  name: string;
  description: string;
  category: string;
  cost: number;
  effect: string | null;
  rarity: string;
  spriteColor: string;
}

interface InventoryItem {
  id: number;
  userId: number;
  shopItemId: number;
  quantity: number;
  equipped: boolean;
  createdAt: string;
  shopItem: ShopItem;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#888',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f5c542',
};

export default function Inventory() {
  useGameState();
  const { data: items, isLoading } = useInventory();
  const useMutation = useUseItem();
  const equipMutation = useEquipItem();

  const allItems: InventoryItem[] = items ?? [];
  const consumables = allItems.filter(
    (item) => item.shopItem.category === 'consumable'
  );
  const cosmetics = allItems.filter(
    (item) => item.shopItem.category === 'cosmetic'
  );

  const handleUse = (inventoryId: number) => {
    useMutation.mutate(inventoryId);
  };

  const handleEquip = (inventoryId: number) => {
    equipMutation.mutate(inventoryId);
  };

  if (isLoading) {
    return (
      <div className="min-h-full">
        <h1 className="text-2xl font-bold text-accent-gold mb-6">Inventory</h1>
        <div className="text-center py-12 text-text-muted">
          Loading inventory...
        </div>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="min-h-full">
        <h1 className="text-2xl font-bold text-accent-gold mb-6">Inventory</h1>
        <div className="rpg-card p-8 text-center">
          <p className="text-text-muted text-lg mb-2">
            Your inventory is empty
          </p>
          <p className="text-text-muted text-sm">
            Visit the Shop to purchase items and gear for your adventure.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-2xl font-bold text-accent-gold mb-6">Inventory</h1>

      {/* Consumables section */}
      {consumables.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span className="text-accent-green">&#9670;</span>
            Consumables
            <span className="text-text-muted text-sm font-normal">
              ({consumables.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {consumables.map((item) => {
              const rarityColor =
                RARITY_COLORS[item.shopItem.rarity] ?? '#888';

              return (
                <div
                  key={item.id}
                  className="rpg-card p-4 flex flex-col gap-3 hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Sprite placeholder */}
                    <div
                      className="w-12 h-12 rounded-lg shrink-0"
                      style={{
                        backgroundColor: item.shopItem.spriteColor,
                        boxShadow: `0 0 10px ${item.shopItem.spriteColor}40`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-text-primary font-semibold truncate">
                          {item.shopItem.name}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize"
                          style={{
                            backgroundColor: `${rarityColor}20`,
                            color: rarityColor,
                            border: `1px solid ${rarityColor}40`,
                          }}
                        >
                          {item.shopItem.rarity}
                        </span>
                      </div>
                      <p className="text-text-muted text-sm">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleUse(item.id)}
                      disabled={useMutation.isPending || item.quantity <= 0}
                      className="w-full px-4 py-1.5 rounded-md text-sm font-medium bg-accent-green/20 text-accent-green border border-accent-green/40 hover:bg-accent-green/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {useMutation.isPending ? 'Using...' : 'Use'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cosmetics section */}
      {cosmetics.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span className="text-accent-purple">&#9670;</span>
            Cosmetics
            <span className="text-text-muted text-sm font-normal">
              ({cosmetics.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cosmetics.map((item) => {
              const rarityColor =
                RARITY_COLORS[item.shopItem.rarity] ?? '#888';

              return (
                <div
                  key={item.id}
                  className={`rpg-card p-4 flex flex-col gap-3 hover:bg-bg-hover transition-all ${
                    item.equipped ? 'equipped-glow' : ''
                  }`}
                  style={
                    item.equipped
                      ? {
                          border: '1px solid rgba(245, 197, 66, 0.6)',
                          boxShadow:
                            '0 0 12px rgba(245, 197, 66, 0.2), inset 0 0 8px rgba(245, 197, 66, 0.05)',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-3">
                    {/* Sprite placeholder */}
                    <div className="relative shrink-0">
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{
                          backgroundColor: item.shopItem.spriteColor,
                          boxShadow: `0 0 10px ${item.shopItem.spriteColor}40`,
                        }}
                      />
                      {item.equipped && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-gold rounded-full flex items-center justify-center text-xs text-bg-primary font-bold">
                          E
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-text-primary font-semibold truncate">
                          {item.shopItem.name}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize"
                          style={{
                            backgroundColor: `${rarityColor}20`,
                            color: rarityColor,
                            border: `1px solid ${rarityColor}40`,
                          }}
                        >
                          {item.shopItem.rarity}
                        </span>
                      </div>
                      <p className="text-text-muted text-sm">
                        {item.shopItem.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleEquip(item.id)}
                      disabled={equipMutation.isPending}
                      className={`w-full px-4 py-1.5 rounded-md text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                        item.equipped
                          ? 'bg-accent-red/20 text-accent-red border border-accent-red/40 hover:bg-accent-red/30'
                          : 'bg-accent-purple/20 text-accent-purple border border-accent-purple/40 hover:bg-accent-purple/30'
                      }`}
                    >
                      {equipMutation.isPending
                        ? '...'
                        : item.equipped
                        ? 'Unequip'
                        : 'Equip'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
