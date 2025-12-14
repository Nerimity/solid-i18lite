const tempElement = document.createElement('textarea');
export function decodeHtmlEntities(encodedText: string) {
  tempElement.innerHTML = encodedText || '';

  return tempElement.value;
}
