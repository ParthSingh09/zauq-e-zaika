/**
 * Seeds the database with the admin account, categories, clearly-marked SAMPLE
 * recipes and DEMONSTRATION products, and editable page templates.
 *
 * Idempotent: existing records are never overwritten, so it is safe to re-run
 * after editing content in the admin dashboard.
 *
 * Run: npm run db:seed
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PAGES } from "./seed-pages";

const prisma = new PrismaClient();
const P = "/images/placeholders";

const SAMPLE_NOTE =
  "**Sample content:** this recipe is a placeholder written to demonstrate the website. Replace it with the authentic Zauq e Zaika family recipe from the admin dashboard.";

const RECIPE_CATEGORIES = [
  { slug: "breakfast", name: "Breakfast", description: "Wholesome starts — parathas, poha, upma and more.", image: `${P}/breakfast.svg` },
  { slug: "lunch", name: "Lunch", description: "Comforting midday meals from the family table.", image: `${P}/thali.svg` },
  { slug: "dinner", name: "Dinner", description: "Curries, dals and rice dishes for the evening meal.", image: `${P}/curry.svg` },
  { slug: "snacks", name: "Snacks", description: "Crisp, spiced bites for tea time.", image: `${P}/chai-snacks.svg` },
  { slug: "sweets-and-desserts", name: "Sweets & Desserts", description: "Mithai, kheer, halwa and festive treats.", image: `${P}/sweets.svg` },
  { slug: "street-food", name: "Street Food", description: "Chaat, samosa and the flavours of the bazaar.", image: `${P}/chai-snacks.svg` },
  { slug: "traditional-indian-food", name: "Traditional Indian Food", description: "Time-honoured recipes cooked the classic way.", image: `${P}/thali.svg` },
  { slug: "beverages", name: "Beverages", description: "Chai, sherbet, lassi and warming drinks.", image: `${P}/chai-snacks.svg` },
  { slug: "festival-specials", name: "Festival Specials", description: "Recipes for Eid, Diwali, Holi and every celebration.", image: `${P}/kheer-puri.svg` },
  { slug: "family-recipes", name: "Special Family Recipes", description: "The recipes that make a house feel like home.", image: `${P}/hero.svg` },
];

type SeedRecipe = Omit<Prisma.RecipeCreateInput, "category"> & { category: string };

const ing = (name: string, quantity: number | null, unit = "", note?: string, group?: string) => ({ name, quantity, unit, note, group });

const RECIPES: SeedRecipe[] = [
  {
    slug: "kheer-puri",
    title: "Kheer Puri",
    category: "festival-specials",
    excerpt: "Creamy, cardamom-scented rice kheer served with soft, golden puris — a festive pairing made with love.",
    intro: `${SAMPLE_NOTE}\n\nKheer Puri is the kind of meal that turns an ordinary day into a celebration. Slow-simmered milk and rice, fragrant with cardamom and saffron, paired with hot, puffed puris straight from the kadhai.`,
    image: `${P}/kheer-puri.svg`,
    imageAlt: "A brass bowl of creamy rice kheer garnished with almonds and pistachios beside golden puris",
    cuisine: "North Indian",
    diet: "VEG",
    difficulty: "MEDIUM",
    prepMinutes: 20,
    cookMinutes: 60,
    servings: 4,
    tags: ["kheer", "puri", "festival", "sweet", "eid", "diwali"],
    ingredients: [
      ing("full-cream milk", 1, "litre", undefined, "For the kheer"),
      ing("basmati or short-grain rice", 0.25, "cup", "washed and soaked for 30 minutes", "For the kheer"),
      ing("sugar", 0.33, "cup", "adjust to taste", "For the kheer"),
      ing("green cardamom", 4, "pods", "lightly crushed", "For the kheer"),
      ing("saffron strands", null, "a pinch", "soaked in 1 tbsp warm milk", "For the kheer"),
      ing("almonds and pistachios", 2, "tbsp", "slivered", "For the kheer"),
      ing("whole wheat flour (atta)", 2, "cups", undefined, "For the puris"),
      ing("semolina (sooji)", 1, "tbsp", "for crispness", "For the puris"),
      ing("salt", 0.5, "tsp", undefined, "For the puris"),
      ing("oil", 1, "tbsp", "plus more for deep frying", "For the puris"),
      ing("water", 0.67, "cup", "approximately", "For the puris"),
    ],
    steps: [
      { title: "Simmer the milk", text: "Bring the milk to a boil in a heavy-bottomed pan, stirring often so it does not catch at the bottom." },
      { title: "Cook the rice", text: "Add the drained rice and cardamom. Simmer on low heat for 40–45 minutes, stirring every few minutes and scraping the sides, until the rice is soft and the milk has thickened." },
      { title: "Sweeten and finish", text: "Stir in the sugar and saffron milk and cook for 5 more minutes. Add most of the nuts, saving some for garnish. The kheer will thicken further as it cools." },
      { title: "Make the puri dough", text: "Mix the flour, semolina, salt and oil. Add water gradually and knead into a firm, smooth dough. Cover and rest for 15 minutes." },
      { title: "Roll the puris", text: "Divide the dough into small balls and roll each into a 3–4 inch circle of even thickness." },
      { title: "Fry", text: "Heat oil until a small piece of dough rises immediately. Slide in a puri, gently press with a slotted spoon until it puffs, flip once and fry until golden. Drain on paper." },
      { title: "Serve", text: "Garnish the kheer with the remaining nuts and serve warm or chilled with hot puris." },
    ],
    tips: [
      "Use a heavy-bottomed pan and keep the heat low — patience gives kheer its creamy texture.",
      "A firm puri dough absorbs less oil and puffs better.",
    ],
    substitutions: [
      "Replace sugar with jaggery: stir it in after turning off the heat so the milk does not curdle.",
      "For a quicker version, use a pressure cooker for the rice and milk, then simmer to thicken.",
    ],
    isSample: true,
    published: true,
    featured: true,
  },
  {
    slug: "aloo-paratha",
    title: "Aloo Paratha",
    category: "breakfast",
    excerpt: "Whole wheat flatbread stuffed with spiced potatoes, cooked on a tawa with ghee.",
    intro: `${SAMPLE_NOTE}\n\nA weekend breakfast favourite — crisp outside, soft inside, served with butter, curd and pickle.`,
    image: `${P}/breakfast.svg`,
    imageAlt: "A golden aloo paratha on a plate with curd and pickle",
    cuisine: "Punjabi",
    diet: "VEG",
    difficulty: "MEDIUM",
    prepMinutes: 25,
    cookMinutes: 20,
    servings: 4,
    tags: ["paratha", "potato", "breakfast"],
    ingredients: [
      ing("whole wheat flour", 2, "cups", undefined, "Dough"),
      ing("water", 0.75, "cup", "approximately", "Dough"),
      ing("potatoes", 4, "medium", "boiled and mashed", "Filling"),
      ing("green chillies", 2, "", "finely chopped", "Filling"),
      ing("fresh coriander", 2, "tbsp", "chopped", "Filling"),
      ing("cumin seeds", 1, "tsp", "roasted", "Filling"),
      ing("salt", 1, "tsp", "to taste", "Filling"),
      ing("ghee", 3, "tbsp", "for cooking"),
    ],
    steps: [
      { text: "Knead the flour and water into a soft dough and rest for 20 minutes." },
      { text: "Mix the mashed potatoes with chillies, coriander, cumin and salt." },
      { text: "Stuff a ball of dough with the filling, seal and roll gently into a circle." },
      { text: "Cook on a hot tawa, brushing with ghee, until golden spots appear on both sides." },
    ],
    tips: ["Make sure the potatoes are completely dry so the paratha does not tear."],
    substitutions: ["Use paneer or grated cauliflower in place of potatoes."],
    isSample: true,
    published: true,
    featured: true,
  },
  {
    slug: "masala-chai",
    title: "Masala Chai",
    category: "beverages",
    excerpt: "Strong, milky tea brewed with ginger and warming whole spices.",
    intro: `${SAMPLE_NOTE}\n\nThe heart of every Indian home — a cup of chai to welcome guests and warm the evening.`,
    image: `${P}/chai-snacks.svg`,
    imageAlt: "Glasses of masala chai with samosas on a plate",
    cuisine: "Indian",
    diet: "VEG",
    difficulty: "EASY",
    prepMinutes: 2,
    cookMinutes: 8,
    servings: 2,
    tags: ["chai", "tea", "beverage"],
    ingredients: [
      ing("water", 1, "cup"),
      ing("milk", 1, "cup"),
      ing("loose black tea", 2, "tsp"),
      ing("sugar", 2, "tsp", "to taste"),
      ing("fresh ginger", 1, "inch", "crushed"),
      ing("green cardamom", 2, "pods", "crushed"),
    ],
    steps: [
      { text: "Boil the water with ginger and cardamom for 2 minutes." },
      { text: "Add the tea leaves and simmer for 1 minute." },
      { text: "Add milk and sugar, bring to a rolling boil twice, then strain and serve." },
    ],
    tips: ["Let the chai rise and fall a couple of times for a richer colour and flavour."],
    substitutions: ["Use oat milk for a dairy-free version."],
    isSample: true,
    published: true,
  },
  {
    slug: "besan-ladoo",
    title: "Besan Ladoo",
    category: "sweets-and-desserts",
    excerpt: "Melt-in-the-mouth sweets of slow-roasted gram flour, ghee and cardamom.",
    intro: `${SAMPLE_NOTE}\n\nA classic mithai for festivals and celebrations — the secret is roasting the besan slowly until it smells nutty.`,
    image: `${P}/sweets.svg`,
    imageAlt: "Golden besan ladoos on a brass plate",
    cuisine: "North Indian",
    diet: "VEG",
    difficulty: "MEDIUM",
    prepMinutes: 10,
    cookMinutes: 30,
    servings: 12,
    tags: ["ladoo", "mithai", "sweet", "diwali"],
    ingredients: [
      ing("gram flour (besan)", 2, "cups"),
      ing("ghee", 0.5, "cup", "melted"),
      ing("powdered sugar", 0.75, "cup"),
      ing("cardamom powder", 0.5, "tsp"),
      ing("chopped nuts", 2, "tbsp"),
    ],
    steps: [
      { text: "Roast the besan in ghee on low heat, stirring constantly, for 20–25 minutes until golden and aromatic." },
      { text: "Cool until just warm, then mix in the sugar, cardamom and nuts." },
      { text: "Shape into round ladoos with your palms." },
    ],
    tips: ["Never add sugar while the mixture is hot or it will melt and turn runny."],
    substitutions: [],
    isSample: true,
    published: true,
  },
  {
    slug: "dal-tadka",
    title: "Dal Tadka",
    category: "dinner",
    excerpt: "Comforting yellow lentils finished with a sizzling tempering of ghee, cumin and garlic.",
    intro: `${SAMPLE_NOTE}\n\nEveryday comfort food — simple dal transformed by a fragrant tadka.`,
    image: `${P}/curry.svg`,
    imageAlt: "A bowl of yellow dal tadka garnished with coriander",
    cuisine: "North Indian",
    diet: "VEG",
    difficulty: "EASY",
    prepMinutes: 10,
    cookMinutes: 25,
    servings: 4,
    tags: ["dal", "lentils", "dinner"],
    ingredients: [
      ing("toor dal", 1, "cup", "washed"),
      ing("water", 3, "cups"),
      ing("turmeric", 0.5, "tsp"),
      ing("salt", 1, "tsp", "to taste"),
      ing("ghee", 2, "tbsp", undefined, "Tadka"),
      ing("cumin seeds", 1, "tsp", undefined, "Tadka"),
      ing("garlic", 4, "cloves", "sliced", "Tadka"),
      ing("dried red chillies", 2, "", undefined, "Tadka"),
    ],
    steps: [
      { text: "Pressure cook the dal with water, turmeric and salt for 3–4 whistles until soft." },
      { text: "Whisk the cooked dal and simmer, adding water to reach your preferred consistency." },
      { text: "Heat ghee, add cumin, garlic and red chillies, and pour the sizzling tadka over the dal." },
    ],
    tips: ["Add the tadka just before serving for the best aroma."],
    substitutions: ["Mix in masoor or moong dal for a different texture."],
    isSample: true,
    published: true,
  },
  {
    slug: "chicken-curry",
    title: "Home-Style Chicken Curry",
    category: "family-recipes",
    excerpt: "A rustic, onion-tomato chicken curry — the Sunday lunch kind.",
    intro: `${SAMPLE_NOTE}\n\nA simple, deeply flavourful curry made the way it is at home.`,
    image: `${P}/curry.svg`,
    imageAlt: "A brass pot of chicken curry",
    cuisine: "North Indian",
    diet: "NON_VEG",
    difficulty: "MEDIUM",
    prepMinutes: 20,
    cookMinutes: 45,
    servings: 4,
    tags: ["chicken", "curry", "non-veg"],
    ingredients: [
      ing("chicken", 750, "g", "curry cut"),
      ing("onions", 3, "medium", "finely sliced"),
      ing("tomatoes", 2, "", "pureed"),
      ing("ginger-garlic paste", 1, "tbsp"),
      ing("yogurt", 0.5, "cup", "whisked"),
      ing("garam masala", 1, "tsp"),
      ing("oil", 3, "tbsp"),
    ],
    steps: [
      { text: "Fry the onions in oil until deep golden." },
      { text: "Add ginger-garlic paste and tomatoes; cook until the oil separates." },
      { text: "Add chicken and yogurt, cover and cook until tender. Finish with garam masala." },
    ],
    tips: ["Patiently browned onions give the curry its colour and depth."],
    substitutions: [],
    isSample: true,
    published: true,
  },
];

const PRODUCT_CATEGORIES = [
  { slug: "homemade-meals", name: "Homemade Meals" },
  { slug: "sweets-and-desserts", name: "Sweets & Desserts" },
  { slug: "snacks-and-namkeen", name: "Snacks & Namkeen" },
  { slug: "pickles-chutneys-masalas", name: "Pickles, Chutneys & Masalas" },
  { slug: "ready-to-cook", name: "Ready to Cook" },
];

const DEMO =
  "Demonstration product — shown to preview the shop. It is not for sale. Replace or remove it in the admin dashboard.";

const PRODUCTS = [
  { slug: "demo-festive-sweets-box", name: "Festive Sweets Box (Demo)", category: "sweets-and-desserts", image: `${P}/sweets.svg`, short: "A preview of how a sweets product will appear in the shop." },
  { slug: "demo-homemade-pickle", name: "Homemade Pickle (Demo)", category: "pickles-chutneys-masalas", image: `${P}/pickles-masalas.svg`, short: "A preview of a pickle listing with size options.", variants: ["250 g", "500 g"] },
  { slug: "demo-tea-time-namkeen", name: "Tea-Time Namkeen (Demo)", category: "snacks-and-namkeen", image: `${P}/chai-snacks.svg`, short: "A preview of a snacks listing." },
  { slug: "demo-family-thali", name: "Family Thali (Demo)", category: "homemade-meals", image: `${P}/thali.svg`, short: "A preview of a homemade meal listing." },
];

async function main() {
  // Admin account
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: { email, name: process.env.ADMIN_NAME || "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
      });
      console.log(`✓ Admin account created: ${email}`);
    } else if (existing.role !== "ADMIN") {
      await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
      console.log(`✓ Existing user promoted to admin: ${email}`);
    } else console.log(`• Admin account already exists: ${email}`);
  } else {
    console.warn("! ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account creation.");
  }

  for (const [i, c] of RECIPE_CATEGORIES.entries()) {
    await prisma.recipeCategory.upsert({ where: { slug: c.slug }, create: { ...c, sortOrder: i }, update: {} });
  }
  const cats = Object.fromEntries((await prisma.recipeCategory.findMany()).map((c) => [c.slug, c.id]));

  for (const [i, { category, ...r }] of RECIPES.entries()) {
    await prisma.recipe.upsert({
      where: { slug: r.slug },
      create: { ...r, categoryId: cats[category], publishedAt: new Date(Date.now() - i * 86400000) },
      update: {},
    });
  }
  console.log(`✓ ${RECIPES.length} sample recipes`);

  for (const [i, c] of PRODUCT_CATEGORIES.entries()) {
    await prisma.productCategory.upsert({ where: { slug: c.slug }, create: { ...c, sortOrder: i }, update: {} });
  }
  const pcats = Object.fromEntries((await prisma.productCategory.findMany()).map((c) => [c.slug, c.id]));
  for (const [i, p] of PRODUCTS.entries()) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        shortDescription: p.short,
        description: DEMO,
        images: [p.image],
        pricePaise: 0,
        status: "ACTIVE",
        isSample: true,
        featured: i < 4,
        categoryId: pcats[p.category],
        ingredientsText: "[To be provided]",
        shelfLife: "[To be provided]",
        variants: p.variants ? { create: p.variants.map((name, j) => ({ name, pricePaise: 0, sortOrder: j })) } : undefined,
      },
    });
  }
  console.log(`✓ ${PRODUCTS.length} demonstration products`);

  for (const page of PAGES) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      create: { ...page, needsReview: true },
      update: {},
    });
  }
  console.log(`✓ ${PAGES.length} editable pages`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
