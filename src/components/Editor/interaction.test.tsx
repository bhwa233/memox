import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AutosizeTextarea } from '../ui/AutosizeTextarea';
import { Shimmer } from '../ai-elements/shimmer';

jest.mock('@/api/dbActions', () => ({}));

const TagSuggestions = require('./TagSuggestions').default;
const useCountStore = require('@/store/count').default;

afterEach(() => cleanup());

// Recreating the Motion component used to replace the DOM node on every render.
test('updating shimmer text preserves the animated element', () => {
  const { container, rerender } = render(<Shimmer as="span">First</Shimmer>);
  const original = container.firstElementChild;
  rerender(<Shimmer as="span">Updated</Shimmer>);
  expect(container.firstElementChild).toBe(original);
});

test('controlled textarea updates resize without replacing the focused input', () => {
  const { getByRole, rerender } = render(<AutosizeTextarea value="short" onChange={() => {}} />);
  const textarea = getByRole('textbox') as HTMLTextAreaElement;
  Object.defineProperty(textarea, 'scrollHeight', { configurable: true, get: () => textarea.value.length * 10 });
  textarea.focus();
  rerender(<AutosizeTextarea value="a longer controlled value" onChange={() => {}} />);
  expect(document.activeElement).toBe(textarea);
  expect(textarea.style.height).toBe(`${textarea.scrollHeight}px`);
});

test('tag confirmation uses the selection from the latest keyboard event', () => {
  useCountStore.setState({ tags: [{ name: 'apple' }, { name: 'apricot' }] });
  const editor = document.createElement('textarea');
  editor.style.cssText = 'font-size:16px;line-height:20px;border:0;padding:0';
  editor.value = '#a';
  document.body.appendChild(editor);
  editor.setSelectionRange(2, 2);
  const replaceText = jest.fn();
  const { unmount } = render(<TagSuggestions editorRef={editor} replaceText={replaceText} />);
  fireEvent.input(editor);
  expect(screen.getByText('apple')).toBeTruthy();
  fireEvent.keyDown(editor, { key: 'ArrowDown', keyCode: 40 });
  fireEvent.keyDown(editor, { key: 'Enter', keyCode: 13 });
  expect(replaceText).toHaveBeenCalledWith('#apricot', 0, 2, 1);
  unmount();
  editor.remove();
});
