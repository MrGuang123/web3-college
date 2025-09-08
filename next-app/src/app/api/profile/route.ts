import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Define the path to the db.json file
const dbPath = path.resolve(
  process.cwd(),
  "next-app/db.json"
);

// Helper function to read the database
async function readDb() {
  try {
    const data = await fs.readFile(dbPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, return a default structure
    return { users: {} };
  }
}

// Helper function to write to the database
async function writeDb(data: any) {
  await fs.writeFile(
    dbPath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// --- API Handlers ---

/**
 * GET /api/profile
 * Fetches the nickname for the currently authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.address) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const db = await readDb();
  const user = db.users[session.address] || {};

  return NextResponse.json({
    nickname: user.nickname || "",
  });
}

/**
 * POST /api/profile
 * Updates the nickname for the currently authenticated user.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.address) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { nickname } = await req.json();
  if (typeof nickname !== "string" || nickname.length < 3) {
    return NextResponse.json(
      { error: "Invalid nickname" },
      { status: 400 }
    );
  }

  const db = await readDb();
  if (!db.users[session.address]) {
    db.users[session.address] = {};
  }
  db.users[session.address].nickname = nickname;

  await writeDb(db);

  return NextResponse.json({ success: true, nickname });
}
