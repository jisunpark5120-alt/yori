// @ts-nocheck
import { kv } from '@vercel/kv';

export const maxDuration = 60;
export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const recipes = await kv.get('yori_recipes');
      return res.status(200).json({ recipes: recipes || [] });
    } catch (error) {
      return res.status(500).json({ error: error.toString() });
    }
  } else if (req.method === 'POST') {
    try {
      const { recipes } = req.body;
      await kv.set('yori_recipes', recipes);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.toString() });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
