/**
 * 이름 첫 글자를 넣은 SVG 아바타.
 *
 * 아바타를 저장하는 곳이 아직 없어서 쓰는 대체물이다. 외부 요청 없이 data URI로 만든다.
 */
export function initialAvatar(name: string): string {
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#0f172a"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="64" fill="#e2e8f0">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
