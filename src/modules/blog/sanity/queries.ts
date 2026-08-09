/** Shared projection for collection and detail queries. */
export const blogPostProjection = `{
  _id,
  title,
  "slug": slug.current,
  locale,
  excerpt,
  coverUrl,
  cover{
    asset->{
      _id,
      url,
      metadata{ dimensions }
    },
    alt,
    caption,
    hotspot,
    crop
  },
  author->{
    name,
    role,
    image{
      asset->{
        _id,
        url,
        metadata{ dimensions }
      },
      alt,
      caption,
      hotspot,
      crop
    }
  },
  category->{
    "categoryId": categoryId.current,
    label
  },
  publishedAt,
  updatedAt,
  featured,
  seo,
  body[]{
    ...,
    _type == "image" => {
      ...,
      asset->{
        _id,
        url,
        metadata{ dimensions }
      }
    },
    _type == "blogImageBlock" => {
      ...,
      image{
        asset->{
          _id,
          url,
          metadata{ dimensions }
        },
        alt,
        caption,
        hotspot,
        crop
      }
    },
    _type == "twoColumn" => {
      ...,
      left[]{ ... },
      right[]{ ... }
    }
  },
  bodyFormat,
  bodyHtml,
  relatedServiceId,
  "relatedPosts": relatedPosts[]->{
    "slug": slug.current
  },
  readingTimeMinutes
}`;

export const publishedPostsQuery = `*[
  _type == "blogPost"
  && locale == "ar"
  && defined(slug.current)
  && !(_id in path("drafts.**"))
  && defined(publishedAt)
  && publishedAt <= now()
] | order(featured desc, publishedAt desc) ${blogPostProjection}`;

export const publishedPostBySlugQuery = `*[
  _type == "blogPost"
  && locale == "ar"
  && slug.current == $slug
  && !(_id in path("drafts.**"))
  && defined(publishedAt)
  && publishedAt <= now()
][0] ${blogPostProjection}`;
