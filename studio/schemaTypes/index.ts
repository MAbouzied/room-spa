import { blogAuthor } from './blogAuthor';
import { blogCategory } from './blogCategory';
import { blogImage } from './blogImage';
import { blogImageBlock } from './blogImageBlock';
import { blogPost } from './blogPost';
import { blogSeo } from './blogSeo';
import { embedPlaceholder } from './embedPlaceholder';
import { twoColumn } from './twoColumn';
import { staffAccess } from './staffAccess';

export const contentSchemaTypes = [
  blogPost,
  blogAuthor,
  blogCategory,
  blogImage,
  blogSeo,
  blogImageBlock,
  twoColumn,
  embedPlaceholder,
];

export const staffAccessSchemaTypes = [staffAccess];

// Kept for existing content-only imports.
export const schemaTypes = contentSchemaTypes;
