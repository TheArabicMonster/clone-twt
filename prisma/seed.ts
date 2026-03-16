import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();
const PLAIN_PASSWORD = "Test1234";

// ---------------------------------------------------------------------------
// Seed data — 10 realistic French-speaking test users
// ---------------------------------------------------------------------------

const USERS = [
  {
    email: "alice@test.com",
    username: "alice_martin",
    pseudo: "Alice Martin",
    bio: "Développeuse web passionnée par le code open source.",
  },
  {
    email: "bruno@test.com",
    username: "bruno_dupont",
    pseudo: "Bruno Dupont",
    bio: "Fan de café et de code. Je tweete sur le dev backend.",
  },
  {
    email: "camille@test.com",
    username: "camille_leroy",
    pseudo: "Camille Leroy",
    bio: "Designer UX/UI, créatrice de belles interfaces numériques.",
  },
  {
    email: "david@test.com",
    username: "david_moreau",
    pseudo: "David Moreau",
    bio: "Ingénieur DevOps. L'infra, c'est ma passion.",
  },
  {
    email: "emma@test.com",
    username: "emma_petit",
    pseudo: "Emma Petit",
    bio: "Blogueuse tech & maman geek. Linux > Windows, toujours.",
  },
  {
    email: "francois@test.com",
    username: "francois_simon",
    pseudo: "François Simon",
    bio: "Entrepreneur en série. Je construis des startups qui durent.",
  },
  {
    email: "gabrielle@test.com",
    username: "gabrielle_roux",
    pseudo: "Gabrielle Roux",
    bio: "Data scientist — je transforme les données en insights.",
  },
  {
    email: "hugo@test.com",
    username: "hugo_bernard",
    pseudo: "Hugo Bernard",
    bio: "Étudiant en informatique. React et TypeScript addict.",
  },
  {
    email: "isabelle@test.com",
    username: "isabelle_blanc",
    pseudo: "Isabelle Blanc",
    bio: "Community manager & créatrice de contenu digital.",
  },
  {
    email: "julien@test.com",
    username: "julien_girard",
    pseudo: "Julien Girard",
    bio: "Freelance fullstack — JS de jour, Rustacean la nuit.",
  },
] as const;

// ---------------------------------------------------------------------------
// Unicode box-drawing table renderer
// ---------------------------------------------------------------------------

interface Col {
  header: string;
  width: number; // visible character width of cell content (without border spaces)
}

interface TableRow {
  pseudo: string;
  username: string;
  email: string;
  password: string;
}

const COLS: Col[] = [
  { header: "Pseudo",    width: 22 },
  { header: "@username", width: 17 },
  { header: "Email",     width: 26 },
  { header: "Password",  width: 8  },
];

/** Pad a string to exactly `length` characters (ASCII-safe). */
function pad(str: string, length: number): string {
  return str.length >= length ? str.slice(0, length) : str + " ".repeat(length - str.length);
}

/**
 * Build a horizontal border line, e.g.
 *   ╔════════════════════════╦═══════════════════╗
 */
function hBorder(left: string, sep: string, right: string, fill: string): string {
  return left + COLS.map((c) => fill.repeat(c.width + 2)).join(sep) + right;
}

/** Build a data row. */
function dataRow(cells: string[]): string {
  return "║ " + cells.map((cell, i) => pad(cell, COLS[i].width)).join(" ║ ") + " ║";
}

function printTable(rows: TableRow[]): void {
  console.log(hBorder("╔", "╦", "╗", "═"));
  console.log(dataRow(COLS.map((c) => c.header)));
  console.log(hBorder("╠", "╬", "╣", "═"));
  for (const r of rows) {
    console.log(dataRow([r.pseudo, "@" + r.username, r.email, r.password]));
  }
  console.log(hBorder("╚", "╩", "╝", "═"));
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\nSeeding database...\n");

  // Hash once — all seed users share the same password
  const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, 10);

  const tableRows: TableRow[] = [];

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username:       user.username,
        pseudo:         user.pseudo,
        bio:            user.bio,
        hashedPassword: hashedPassword,
      },
      create: {
        email:          user.email,
        username:       user.username,
        pseudo:         user.pseudo,
        bio:            user.bio,
        hashedPassword: hashedPassword,
      },
    });

    tableRows.push({
      pseudo:   user.pseudo,
      username: user.username,
      email:    user.email,
      password: PLAIN_PASSWORD,
    });

    console.log(`  [OK] ${pad(user.pseudo, 16)} — ${user.email}`);
  }

  console.log(`\n${USERS.length} users seeded successfully.\n`);
  printTable(tableRows);
  console.log("");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
