import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const BUCKET_NAME = 'make-938109ab-puzzle-images';

// Initialize storage bucket
async function initBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
    console.log(`Created bucket: ${BUCKET_NAME}`);
  }
}
initBucket();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-938109ab/health", (c) => {
  return c.json({ status: "ok" });
});

// Create a new session
app.post("/make-server-938109ab/sessions", async (c) => {
  try {
    const { sessionId, name } = await c.req.json();

    if (!sessionId || !name) {
      return c.json({ error: 'sessionId and name are required' }, 400);
    }

    const session = {
      id: sessionId,
      name,
      createdAt: Date.now(),
    };

    await kv.set(`session:${sessionId}`, session);
    await kv.set(`pieces:${sessionId}`, []);

    console.log(`Created session: ${sessionId}`);
    return c.json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    return c.json({ error: 'Failed to create session', details: String(error) }, 500);
  }
});

// Get session by ID
app.get("/make-server-938109ab/sessions/:id", async (c) => {
  try {
    const sessionId = c.req.param('id');
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({ session });
  } catch (error) {
    console.error('Error getting session:', error);
    return c.json({ error: 'Failed to get session', details: String(error) }, 500);
  }
});

// Get all pieces for a session
app.get("/make-server-938109ab/sessions/:id/pieces", async (c) => {
  try {
    const sessionId = c.req.param('id');
    const pieces = await kv.get(`pieces:${sessionId}`);

    return c.json({ pieces: pieces || [] });
  } catch (error) {
    console.error('Error getting pieces:', error);
    return c.json({ error: 'Failed to get pieces', details: String(error) }, 500);
  }
});

// Add a piece to a session
app.post("/make-server-938109ab/sessions/:id/pieces", async (c) => {
  try {
    const sessionId = c.req.param('id');
    const { userId, imageUrl, x, y, rotation } = await c.req.json();

    if (!userId || !imageUrl) {
      return c.json({ error: 'userId and imageUrl are required' }, 400);
    }

    // Check cooldown (30 seconds)
    const lastTime = await kv.get(`usertime:${sessionId}:${userId}`);
    const now = Date.now();
    const cooldown = 30000; // 30 seconds

    if (lastTime && (now - lastTime) < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastTime)) / 1000);
      return c.json({
        error: 'Cooldown active',
        remainingSeconds: remaining
      }, 429);
    }

    // Add the piece
    const pieces = await kv.get(`pieces:${sessionId}`) || [];
    const newPiece = {
      id: `${userId}-${now}`,
      userId,
      imageUrl,
      x: x || 0,
      y: y || 0,
      rotation: rotation || 0,
      addedAt: now,
    };

    pieces.push(newPiece);
    await kv.set(`pieces:${sessionId}`, pieces);
    await kv.set(`usertime:${sessionId}:${userId}`, now);

    console.log(`Added piece to session ${sessionId}`);
    return c.json({ piece: newPiece });
  } catch (error) {
    console.error('Error adding piece:', error);
    return c.json({ error: 'Failed to add piece', details: String(error) }, 500);
  }
});

// Check user cooldown
app.get("/make-server-938109ab/sessions/:id/cooldown/:userId", async (c) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.req.param('userId');

    const lastTime = await kv.get(`usertime:${sessionId}:${userId}`);
    const now = Date.now();
    const cooldown = 30000;

    if (!lastTime) {
      return c.json({ canAdd: true, remainingSeconds: 0 });
    }

    const elapsed = now - lastTime;
    const canAdd = elapsed >= cooldown;
    const remainingSeconds = canAdd ? 0 : Math.ceil((cooldown - elapsed) / 1000);

    return c.json({ canAdd, remainingSeconds });
  } catch (error) {
    console.error('Error checking cooldown:', error);
    return c.json({ error: 'Failed to check cooldown', details: String(error) }, 500);
  }
});

// Upload image
app.post("/make-server-938109ab/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const bytes = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: 'Upload failed', details: error.message }, 500);
    }

    // Generate signed URL (valid for 7 days)
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 604800);

    if (!urlData?.signedUrl) {
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }

    console.log(`Uploaded image: ${fileName}`);
    return c.json({ url: urlData.signedUrl, fileName });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ error: 'Failed to upload image', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);