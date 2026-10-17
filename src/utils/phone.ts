// Приводит ввод к виду +7 (771) 142 30 51
export function formatPhone(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1); // 8 771... превращаем в 7 771...
  else if (d.startsWith('78')) d = '7' + d.slice(2); // после +7 набрали 8
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);

  const p = d.slice(1);
  let out = '+7';
  if (p.length > 0) out += ' (' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += ' ' + p.slice(6, 8);
  if (p.length > 8) out += ' ' + p.slice(8, 10);
  return out;
}

export function isValidPhone(formatted: string): boolean {
  return formatted.replace(/\D/g, '').length === 11;
}