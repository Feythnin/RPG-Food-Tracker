# Quest Fuel - RPG Meal Tracker

A full-stack web app that gamifies meal and nutrition tracking with dungeon-crawler RPG mechanics. Log your food, drink your water, and slay monsters.

## Features

### Nutrition Tracking
- **Food logging** with four meal categories (Breakfast, Lunch, Dinner, Snacks)
- **Recipe search** via CalorieNinjas - natural language queries like "eggs benedict" or "pad thai"
- **USDA database search** for raw ingredients and packaged foods
- **Barcode scanning** via Open Food Facts (camera-based)
- **Serving multiplier** - pick a food, adjust servings, all macros scale automatically
- **Favorites and recent foods** for quick re-logging
- **Water tracking** with glass-based logging and hydration meter

### RPG Game Engine
- **Daily quests** auto-generated based on your dungeon tier (log meals, hit calorie/protein targets, eat fruits/veggies, drink water)
- **Enemy combat** - completing quests deals damage to dungeon enemies
- **XP and leveling** system (Level N requires N x 100 XP)
- **30-level dungeon map** across 3 tiers (Dark Forest, Crystal Caves, Dragon's Lair)
- **Boss fights** every 5 levels
- **Health system** - 7 HP per week, lose 1 for each failed day
- **Thirst meter** - stay hydrated or face penalties
- **Weekly reset** with consequences for low health

### Shop and Inventory
- **Consumables** (health potions, XP scrolls)
- **Cosmetics** (equippable items)
- **Mystery boxes** with weighted rarity drops

### Analytics
- **Calorie trend charts** (daily/weekly/monthly)
- **Macro breakdown** pie chart
- **Progress bars** for calories, protein, fiber, water
- **Weight history** with Saturday weigh-in system

### UI
- Dark RPG-themed interface with gold accents
- Responsive layout: sidebar on desktop, bottom tabs on mobile
- Animations for level-ups, XP gains, mystery box reveals

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS v4, TypeScript |
| State | Zustand (client), React Query (server) |
| Charts | Recharts |
| Backend | Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (httpOnly cookies), bcrypt |
| APIs | USDA FoodData Central, CalorieNinjas, Open Food Facts |

## Prerequisites

- Node.js 18+
- PostgreSQL running locally
- API keys (free tiers):
  - [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup) (ingredient search)
  - [CalorieNinjas](https://calorieninjas.com/api) (recipe/prepared food search)

## Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/Feythnin/RPG-Food-Tracker.git
   cd RPG-Food-Tracker
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your values:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/weighttracker?schema=public"
   JWT_SECRET="<generate with: openssl rand -base64 48>"
   USDA_API_KEY="<your key>"
   CALORIENINJAS_API_KEY="<your key>"
   PORT=3001
   CLIENT_URL="http://localhost:5173"
   ```

3. **Create database and run migrations**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the shop items**
   ```bash
   npm run seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```
   This starts both the Express server (port 3001) and Vite dev server (port 5173).

6. **Open** http://localhost:5173, register an account, and complete the setup wizard.

## Project Structure

```
.
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # Layout, animations, barcode scanner
│       ├── hooks/           # React Query hooks (food, water, game, shop, etc.)
│       ├── pages/           # All page components
│       ├── stores/          # Zustand stores (auth, game state)
│       ├── lib/             # Axios API client
│       └── index.css        # Tailwind theme + RPG animations
├── server/                  # Express backend
│   └── src/
│       ├── routes/          # API routes (auth, food, water, game, shop, etc.)
│       ├── middleware/       # Auth middleware, error handler
│       └── lib/             # Prisma client, validation schemas, calorie calc, game engine
├── prisma/
│   └── schema.prisma        # Database schema (10 models)
└── package.json             # Workspace root with npm workspaces
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| POST | `/api/profile/setup` | Complete setup wizard |
| GET/PUT | `/api/profile` | Get/update profile |
| POST | `/api/profile/weigh-in` | Saturday weigh-in |
| POST | `/api/food/log` | Log food |
| GET | `/api/food/logs` | Get food logs by date |
| GET | `/api/food/search/usda` | Search USDA database |
| GET | `/api/food/search/recipe` | Search CalorieNinjas |
| GET | `/api/food/search/barcode/:code` | Barcode lookup |
| POST | `/api/water/log` | Log water glasses |
| GET | `/api/water/logs` | Get water logs by date |
| GET | `/api/game/state` | Get full game state |
| POST | `/api/game/evaluate` | Evaluate daily tasks |
| GET | `/api/shop/items` | List shop items |
| POST | `/api/shop/buy/:id` | Purchase item |
| GET | `/api/nutrition/summary` | Nutrition analytics |
| GET | `/api/nutrition/export` | Export all data as JSON |

## Security

- Helmet security headers
- Global rate limiting (100 req/min) + login-specific limits (5/15min)
- CSRF protection via Origin header validation
- Input validation on all endpoints (Zod schemas)
- Barcode format validation to prevent SSRF
- Date format validation
- Body size limits
- httpOnly + SameSite strict cookies
- No secrets in client bundle

## License

MIT
