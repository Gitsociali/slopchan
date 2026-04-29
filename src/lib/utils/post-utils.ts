export function hashStringToColor(str: string): string {
  if (!str) {
    return '';
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = (hash >> 24) & 0xff;
  const g = (hash >> 16) & 0xff;
  const b = (hash >> 8) & 0xff;

  return `rgb(${r}, ${g}, ${b})`;
}

export function getTextColorForBackground(rgb: string): string {
  const [r, g, b] = rgb.match(/\d+/g)?.map(Number) || [0, 0, 0];
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  return brightness > 125 ? 'black' : 'white';
}

export interface RemoveMarkdownOptions {
  preserveEmphasisMarkers?: boolean;
  preserveGreentextMarkers?: boolean;
}

export const CATALOG_PREVIEW_MARKDOWN_OPTIONS: RemoveMarkdownOptions = {
  preserveEmphasisMarkers: true,
  preserveGreentextMarkers: true,
};

export function removeMarkdown(md: string, options: RemoveMarkdownOptions = {}): string {
  let withoutMarkdown = md
    .replace(/\[spoiler\](.*?)\[\/spoiler\]/gis, '$1') // spoiler tags - keep inner text
    .replace(/\[([^\]]*?)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/&nbsp;/g, ' '); // &nbsp; -> space

  if (!options.preserveGreentextMarkers) {
    withoutMarkdown = withoutMarkdown.replace(/^>\s*/gm, ''); // greentext at line start
  }

  if (!options.preserveEmphasisMarkers) {
    withoutMarkdown = withoutMarkdown.replace(/[*_]/g, ''); // bold/italic markers
  }

  return withoutMarkdown
    .replace(/```[\s\S]*?```/g, (m) => m.slice(3, -3)) // code blocks - keep content
    .replace(/`([^`]*)`/g, '$1') // inline code - keep content
    .trim();
}
