function escapeInvalidHtmlTags(content) {
  const validTagPattern =
    /<\/?(?:font|br|b|i|u|o|sub|sup|s|table|tr|td|hr|vr|img)\b[^>]*\/?>/gi;

  const validTags = [];
  let match;
  while ((match = validTagPattern.exec(content)) !== null) {
    validTags.push({
      start: match.index,
      end: match.index + match[0].length,
      tag: match[0],
    });
  }

  console.log('Valid tags found:', validTags);

  let result = '';
  let lastEnd = 0;

  for (const tag of validTags) {
    const before = content.slice(lastEnd, tag.start);
    result += before.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    result += content.slice(tag.start, tag.end);
    lastEnd = tag.end;
  }

  const remaining = content.slice(lastEnd);
  result += remaining.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return result;
}

const input = '<br /><font point-size="34">Test</font>';
console.log('Input:', input);
console.log('Output:', escapeInvalidHtmlTags(input));

const input2 = '<slot name="header"/>';
console.log('\nInput2:', input2);
console.log('Output2:', escapeInvalidHtmlTags(input2));

const input3 = '<slot name="header"<br />/>';
console.log('\nInput3:', input3);
console.log('Output3:', escapeInvalidHtmlTags(input3));
