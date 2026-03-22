import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log("Seeding TownHelp database...");

const categories = [
  ["Maid / Cleaning", "maid", "House cleaning, sweeping, mopping, dusting", "spray-can", 1],
  ["Cook / Tiffin", "cook", "Daily cooking, tiffin service, meal prep", "chef-hat", 2],
  ["Electrician / Plumber", "electrician", "Electrical repairs, plumbing fixes, wiring", "wrench", 3],
  ["Dhobi / Laundry", "dhobi", "Clothes washing, ironing, dry cleaning", "shirt", 4],
  ["Tutoring", "tutor", "Academic tutoring, homework help, exam prep", "book-open", 5],
  ["Pickup / Drop", "pickup-drop", "School pickup/drop, grocery runs, errands", "car", 6],
];

for (const [name, slug, description, iconName, sortOrder] of categories) {
  await client.query(
    `INSERT INTO service_categories (id, name, slug, description, icon_name, sort_order, is_active, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW())
     ON CONFLICT (slug) DO UPDATE SET name = $1, description = $3, icon_name = $4, sort_order = $5`,
    [name, slug, description, iconName, sortOrder]
  );
  console.log("  done: " + name);
}

console.log("\nSeeding complete! 6 categories created.");
await client.end();
