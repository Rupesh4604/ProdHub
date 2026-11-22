import React from 'react';
import { render } from '@testing-library/react';
import SimpleMarkdown from './SimpleMarkdown';

const SAMPLE = `### Morning
1. **Finish week 3** at 9:00 AM
2. Standup <img src=x onerror=alert(1)> at 10:00 AM

- Take a *short* break
- Review \`PR\` notes`;

test('renders headings, lists and inline formatting', () => {
  const { container } = render(<SimpleMarkdown text={SAMPLE} />);
  expect(container.querySelector('h3').textContent).toBe('Morning');
  expect(container.querySelectorAll('ol li')).toHaveLength(2);
  expect(container.querySelectorAll('ul li')).toHaveLength(2);
  expect(container.querySelector('strong').textContent).toBe('Finish week 3');
  expect(container.querySelector('em').textContent).toBe('short');
  expect(container.querySelector('code').textContent).toBe('PR');
});

test('treats HTML in model output or event titles as plain text', () => {
  const { container } = render(<SimpleMarkdown text={SAMPLE} />);
  expect(container.querySelector('img')).toBeNull();
  expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
});
