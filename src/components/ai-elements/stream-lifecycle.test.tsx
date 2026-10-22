import { afterEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

jest.mock('streamdown', () => ({ Streamdown: () => null }), { virtual: true });
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'attachment') }), { virtual: true });

const { Reasoning, useReasoning } = require('./reasoning');
const { PromptInputProvider, PromptInput, usePromptInputAttachments, PromptInputSpeechButton } = require('./prompt-input');

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function Duration() {
  return <output data-testid="duration">{useReasoning().duration}</output>;
}

test('stream duration is measured separately for successive streaming sessions', () => {
  jest.useFakeTimers();
  const { rerender } = render(<Reasoning isStreaming><Duration /></Reasoning>);
  act(() => { jest.advanceTimersByTime(2400); });
  rerender(<Reasoning isStreaming={false}><Duration /></Reasoning>);
  expect(screen.getByTestId('duration').textContent).toBe('3');
  rerender(<Reasoning isStreaming><Duration /></Reasoning>);
  act(() => { jest.advanceTimersByTime(600); });
  rerender(<Reasoning isStreaming={false}><Duration /></Reasoning>);
  expect(screen.getByTestId('duration').textContent).toBe('1');
});

function AddAttachment() {
  const { add } = usePromptInputAttachments();
  return <button type="button" onClick={() => add([new File(['note'], 'note.txt')])}>Attach</button>;
}

// Provider-owned and local attachments have independent cleanup effects.
test.each(['provider', 'local'])('%s attachment cleanup releases files added after mount', (owner) => {
  const create = jest.fn(() => 'blob:note');
  const revoke = jest.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
  const { unmount } = render(owner === 'provider'
    ? <PromptInputProvider><PromptInput onSubmit={() => {}}><AddAttachment /></PromptInput></PromptInputProvider>
    : <PromptInput onSubmit={() => {}}><AddAttachment /></PromptInput>);
  fireEvent.click(screen.getByText('Attach'));
  expect(revoke).not.toHaveBeenCalled();
  unmount();
  expect(revoke).toHaveBeenCalledWith('blob:note');
});

test('speech recognition replacement stops the old session and can start again', () => {
  const instances: FakeRecognition[] = [];
  class FakeRecognition {
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onresult = null;
    onerror = null;
    start = jest.fn(() => this.onstart?.());
    stop = jest.fn(() => this.onend?.());
    constructor() { instances.push(this); }
  }
  const previous = window.SpeechRecognition;
  Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FakeRecognition });
  try {
    const { getByRole, rerender } = render(<PromptInputSpeechButton onTranscriptionChange={() => {}} />);
    fireEvent.click(getByRole('button'));
    expect(instances[0].start).toHaveBeenCalled();
    rerender(<PromptInputSpeechButton onTranscriptionChange={() => {}} />);
    expect(instances[0].stop).toHaveBeenCalled();
    fireEvent.click(getByRole('button'));
    expect(instances[1].start).toHaveBeenCalled();
  } finally {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: previous });
  }
});
