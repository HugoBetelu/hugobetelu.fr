/**
 * Couche de données WordPress (headless).
 * Récupère articles et pages via l'API REST de WordPress.
 */
const WP_API = import.meta.env.PUBLIC_WP_API ?? "http://hugobetelufr.local/wp-json";

export interface WPImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Post {
  id: number;
  slug: string;
  /** HTML rendu (contient entités/accents) — à afficher avec set:html */
  title: string;
  /** Titre en texte brut (entités décodées) — pour <title>, aria, etc. */
  titleText: string;
  excerpt: string;
  content: string;
  date: string;
  image: WPImage | null;
}

/** Décode les entités HTML et retire les balises (pour titres en texte brut). */
function decodeEntities(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
}

function featuredImage(node: any): WPImage | null {
  const media = node?._embedded?.["wp:featuredmedia"]?.[0];
  if (!media?.source_url) return null;
  return {
    src: media.source_url,
    alt: media.alt_text ?? "",
    width: media.media_details?.width,
    height: media.media_details?.height,
  };
}

function mapPost(p: any): Post {
  const title = p.title?.rendered ?? "";
  return {
    id: p.id,
    slug: p.slug,
    title,
    titleText: decodeEntities(title),
    excerpt: p.excerpt?.rendered ?? "",
    content: p.content?.rendered ?? "",
    date: p.date,
    image: featuredImage(p),
  };
}

async function wpFetch(path: string) {
  const res = await fetch(`${WP_API}${path}`);
  if (!res.ok) {
    throw new Error(`WordPress API ${res.status} sur ${path}`);
  }
  return res.json();
}

/** Les N derniers articles (avec image à la une). */
export async function getPosts(perPage = 12): Promise<Post[]> {
  const data = await wpFetch(
    `/wp/v2/posts?per_page=${perPage}&_embed=wp:featuredmedia`,
  );
  return data.map(mapPost);
}

/** Tous les articles (pour les listes et la génération des pages). */
export async function getAllPosts(): Promise<Post[]> {
  const data = await wpFetch(`/wp/v2/posts?per_page=100&_embed=wp:featuredmedia`);
  return data.map(mapPost);
}

/** Un article par son slug. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const data = await wpFetch(
    `/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia`,
  );
  return data.length ? mapPost(data[0]) : null;
}

/** Une page par son slug. */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const data = await wpFetch(`/wp/v2/pages?slug=${encodeURIComponent(slug)}`);
  if (!data.length) return null;
  const p = data[0];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title?.rendered ?? "",
    content: p.content?.rendered ?? "",
  };
}
